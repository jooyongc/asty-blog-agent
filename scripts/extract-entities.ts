/**
 * scripts/extract-entities.ts
 *
 * Usage: npx tsx scripts/extract-entities.ts <slug> [--site <id>] [--force]
 *
 * Post-publish hook: reads the published EN markdown + verification.json
 * and uses Haiku 4.5 to extract entities and relationships into the
 * graph_* tables via the site's Graph Write API.
 *
 * Lean profile policy:
 *   - Default: biweekly (runs only when biweekly-counter.json says so)
 *   - Pass --force to bypass the counter
 *   - Failures never block the publish flow (exits 0 on API/LLM errors,
 *     prints a warning instead)
 *
 * Env: ANTHROPIC_API_KEY + site bearer key (from cfg.env.api_key)
 */

import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'
import Anthropic from '@anthropic-ai/sdk'
import { loadSiteConfig, resolveSiteId, stripSiteArg } from './_lib/config.js'

const rawArgs = process.argv.slice(2)
const SITE_ID = resolveSiteId(rawArgs)
const cfg = loadSiteConfig(SITE_ID)
const positional = stripSiteArg(rawArgs)
const SLUG = positional[0]
const FORCE = rawArgs.includes('--force')

if (!SLUG) {
  console.error('Usage: tsx scripts/extract-entities.ts <slug> [--site <id>] [--force]')
  process.exit(1)
}

// --- Lean profile: biweekly gate ---
const COUNTER_FILE = path.join(path.dirname(cfg.paths.drafts), '.extract-entities-counter.json')
type Counter = { total_calls: number; last_run_slug: string | null; last_run_at: string | null }

function loadCounter(): Counter {
  if (!fs.existsSync(COUNTER_FILE)) return { total_calls: 0, last_run_slug: null, last_run_at: null }
  try {
    return JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')) as Counter
  } catch {
    return { total_calls: 0, last_run_slug: null, last_run_at: null }
  }
}

function saveCounter(c: Counter): void {
  fs.mkdirSync(path.dirname(COUNTER_FILE), { recursive: true })
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(c, null, 2))
}

const counter = loadCounter()
const profile = (cfg.budget as { profile?: string } | undefined)?.profile ?? 'lean'

if (profile === 'lean' && !FORCE) {
  // Skip every other call; only run on even-numbered invocations
  if (counter.total_calls % 2 !== 0) {
    counter.total_calls++
    saveCounter(counter)
    console.log(`[extract] skip (biweekly mode, call ${counter.total_calls} — next run on ${counter.total_calls + 1})`)
    process.exit(0)
  }
}

// --- Load draft + verification ---
const slugDir = path.join(cfg.paths.drafts, SLUG)
const pubDir = path.join(cfg.paths.published, SLUG)
const enPath = fs.existsSync(path.join(slugDir, `${cfg.canonical_lang}.md`))
  ? path.join(slugDir, `${cfg.canonical_lang}.md`)
  : path.join(pubDir, `${cfg.canonical_lang}.md`)

if (!fs.existsSync(enPath)) {
  console.error(`[extract] draft not found: ${enPath}`)
  process.exit(0) // non-fatal
}

const raw = fs.readFileSync(enPath, 'utf8')
const { content, data: fm } = matter(raw)
const verificationPath = fs.existsSync(path.join(slugDir, 'verification.json'))
  ? path.join(slugDir, 'verification.json')
  : path.join(pubDir, 'verification.json')
let verification: unknown = null
if (fs.existsSync(verificationPath)) {
  try { verification = JSON.parse(fs.readFileSync(verificationPath, 'utf8')) } catch { /* ignore */ }
}

// --- Extract via Haiku ---
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.warn('[extract] ANTHROPIC_API_KEY missing — skipping')
  process.exit(0)
}

const client = new Anthropic({ apiKey })

const EXTRACTION_PROMPT = `You extract a knowledge graph from a published blog article.

Return ONLY a JSON object matching this schema. No markdown, no prose.

{
  "entities": [
    {
      "type": "Person|Organization|Place|Concept|Claim|Source|Metric",
      "canonical_name": "<short normalized name>",
      "aliases": ["<other forms used in the text>"],
      "metadata": { "<any structured attributes>": "..." }
    }
  ],
  "relationships": [
    {
      "src_canonical": "<canonical_name of source entity>",
      "src_type": "<type of source>",
      "dst_canonical": "<canonical_name of target entity>",
      "dst_type": "<type of target>",
      "type": "MENTIONS|CITES|CONTRADICTS|SUPERSEDES|CO_OCCURS|VERIFIED_BY",
      "confidence": <0.0..1.0>
    }
  ]
}

Rules:
- Extract distinct entities only. Do NOT invent entities not mentioned.
- Prefer canonical names ("Samsung Seoul Hospital" not "the hospital").
- MENTIONS: article about topic X references entity Y
- CITES: claim X is supported by source Y
- CO_OCCURS: entities X and Y appear in the same paragraph
- CONTRADICTS: only when the text explicitly says so
- Cap total entities at 30, relationships at 60.
- Never output ANY text outside the JSON.`

async function extract() {
  const userContent = [
    `Blog slug: ${SLUG}`,
    `Site: ${cfg.site_id}`,
    `Category: ${fm.category ?? 'unknown'}`,
    verification ? `Verification report:\n${JSON.stringify(verification, null, 2)}` : '',
    `\nArticle markdown:\n\n${content.slice(0, 15000)}`, // cap input
  ].filter(Boolean).join('\n\n')

  const resp = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    system: EXTRACTION_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  })

  const textBlock = resp.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('no text block in response')
  }
  // Strip any accidental code fences
  const cleaned = textBlock.text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
  return JSON.parse(cleaned) as {
    entities: Array<{
      type: string
      canonical_name: string
      aliases: string[]
      metadata?: Record<string, unknown>
    }>
    relationships: Array<{
      src_canonical: string
      src_type: string
      dst_canonical: string
      dst_type: string
      type: string
      confidence: number
    }>
  }
}

// --- Write to site via a thin POST to graph ingest API ---
// We reuse the AGENT_API_KEY bearer pattern. The site exposes
// /api/admin/graph/ingest which upserts entities and relationships.
async function ingest(payload: unknown): Promise<{ ok: boolean; entities: number; relationships: number; warnings?: string[] }> {
  const key = process.env[cfg.env.api_key]
  if (!key) throw new Error(`${cfg.env.api_key} missing`)
  const res = await fetch(`${cfg.site_url}/api/admin/graph/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ site_id: cfg.site_id, slug: SLUG, ...payload as object }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`graph/ingest ${res.status}: ${text.slice(0, 300)}`)
  }
  return (await res.json()) as { ok: boolean; entities: number; relationships: number; warnings?: string[] }
}

(async () => {
  console.log(`[extract] ${SITE_ID}/${SLUG}: extracting entities from ${enPath}`)
  try {
    const g = await extract()
    console.log(`[extract] extracted ${g.entities.length} entities, ${g.relationships.length} relationships`)

    const result = await ingest(g)
    console.log(`[extract] ingested entities=${result.entities} rels=${result.relationships}`)
    if (result.warnings?.length) result.warnings.forEach(w => console.warn(`  ⚠ ${w}`))

    // Update counter only on success
    counter.total_calls++
    counter.last_run_slug = SLUG
    counter.last_run_at = new Date().toISOString()
    saveCounter(counter)
  } catch (e) {
    // Non-fatal: log and exit 0 so the publish flow isn't blocked
    console.warn(`[extract] failed (non-fatal): ${e instanceof Error ? e.message : e}`)
    process.exit(0)
  }
})()
