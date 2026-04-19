/**
 * End-to-end pipeline orchestrator for one topic. Credit-tracked.
 * Runs seo-researcher → writer → verifier → packager via direct Anthropic SDK
 * (no Claude Code subagents), then chains deterministic scripts.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'

const TOPIC = 'Weekend Leisure Activities Within 5km of ASTY Cabin'
const CATEGORY = 'leisure'
const SLUG = 'weekend-leisure-activities-near-asty-cabin'
const DRAFT_DIR = path.join('content', 'drafts', SLUG)

// ensure draft dir
fs.mkdirSync(DRAFT_DIR, { recursive: true })

const client = new Anthropic()

type Usage = { in: number; out: number }
const totals: Record<string, Usage> = {}

async function callHaiku(
  label: string,
  system: string,
  user: string,
  max = 4000,
): Promise<{ text: string; usage: Usage }> {
  const t0 = Date.now()
  const r = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: max,
    system,
    messages: [{ role: 'user', content: user }],
  })
  const block = r.content[0]
  if (block.type !== 'text') throw new Error(`${label}: non-text block`)
  const usage: Usage = { in: r.usage.input_tokens, out: r.usage.output_tokens }
  totals[label] = usage
  const cost = (usage.in * 1 + usage.out * 5) / 1_000_000
  console.log(`  ${label}: ${usage.in}in/${usage.out}out = $${cost.toFixed(4)}  (${Date.now() - t0}ms)`)
  return { text: block.text, usage }
}

function extractJson<T>(raw: string): T {
  let s = raw.trim()
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = s.indexOf('{')
  if (start === -1) throw new Error('No JSON object in response')
  let depth = 0, end = -1, inStr = false, esc = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (esc) { esc = false; continue }
    if (c === '\\') { esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === '{') depth++
    else if (c === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  if (end === -1) throw new Error('Unbalanced JSON')
  return JSON.parse(s.slice(start, end + 1)) as T
}

function extractMarkdown(raw: string): string {
  let s = raw.trim()
  if (s.startsWith('```')) s = s.replace(/^```(?:markdown|md)?/i, '').replace(/```\s*$/, '').trim()
  // Find first `---\n` — that's the start of YAML frontmatter
  const fmStart = s.search(/(^|\n)---\s*\n/)
  if (fmStart >= 0) s = s.slice(fmStart).replace(/^\n/, '')
  return s
}

// Read agent prompts from .claude/agents/*.md
function loadPrompt(name: string): string {
  const p = path.join('.claude', 'agents', `${name}.md`)
  const raw = fs.readFileSync(p, 'utf8')
  // strip YAML frontmatter
  return raw.replace(/^---[\s\S]*?---\s*/, '').trim()
}

console.log('========== PIPELINE START ==========')
console.log(`Topic: ${TOPIC}`)
console.log(`Slug:  ${SLUG}`)
console.log(`Category: ${CATEGORY}`)
console.log()

// --- Step 1: SEO researcher ---
console.log('Step 1: SEO researcher')
const seoSystem = loadPrompt('seo-researcher')
const seoInput = JSON.stringify({
  topic: TOPIC,
  category: CATEGORY,
  target_audience: 'foreign visitors to Seoul staying at ASTY Cabin',
  gsc_striking: [],
  existing_titles: [
    'gangnam-k-beauty-clinics',
    'late-night-food-near-asty-cabin',
    'medical-tourist-first-48h-seoul',
  ],
})
const seoRes = await callHaiku('seo', seoSystem, seoInput, 1000)
const seoJson = extractJson<{
  primary_keyword: string
  secondary_keywords: string[]
  search_intent: string
  estimated_difficulty: string
  rationale: string
}>(seoRes.text)
console.log('  primary:', seoJson.primary_keyword)
console.log('  secondary:', seoJson.secondary_keywords.join(', '))
fs.writeFileSync(path.join(DRAFT_DIR, 'research.json'), JSON.stringify(seoJson, null, 2))

// --- Step 2: Writer ---
console.log('\nStep 2: Writer')
const writerSystem = loadPrompt('writer') +
  '\n\nCRITICAL: Do not call Read/Write tools — you have no file-system access. ' +
  'Return the COMPLETE article markdown (including YAML frontmatter) as your reply. ' +
  'Do not include any prose outside the markdown. ' +
  'Skip web_search; use hedged phrasing for unverified claims.'
const claudeMd = fs.readFileSync('CLAUDE.md', 'utf8')
const writerInput = JSON.stringify({
  topic: TOPIC,
  primary_keyword: seoJson.primary_keyword,
  secondary_keywords: seoJson.secondary_keywords,
  slug: SLUG,
  category: CATEGORY,
  site_voice_guide: claudeMd,
})
const writerRes = await callHaiku('writer', writerSystem, writerInput, 8000)
const enMd = extractMarkdown(writerRes.text)
if (!enMd.startsWith('---')) {
  fs.writeFileSync(path.join(DRAFT_DIR, 'writer-raw.txt'), writerRes.text)
  throw new Error('Writer output missing frontmatter — raw saved to writer-raw.txt')
}
fs.writeFileSync(path.join(DRAFT_DIR, 'en.md'), enMd)
const enWords = enMd.replace(/---[\s\S]*?---/, '').split(/\s+/).filter(Boolean).length
console.log(`  saved en.md — ${enWords} words`)

// --- Step 3: Verifier ---
console.log('\nStep 3: Verifier')
const verifierSystem = loadPrompt('verifier') +
  '\n\nCRITICAL: No WebFetch available. Skip fetches (fetches_used=0). ' +
  'Classify each claim as verified (if backed by research brief), unsupported, or contradicted. ' +
  'Return ONLY the JSON report as your reply.'
const verifierInput = JSON.stringify({
  slug: SLUG,
  draft_markdown: enMd,
  research_brief: seoJson,
})
const verifierRes = await callHaiku('verifier', verifierSystem, verifierInput, 3000)
const verifierJson = extractJson<{
  slug: string
  claims_total: number
  summary: { verified: number; unsupported: number; contradicted: number }
  overall_status: string
  fetches_used: number
  claims: Array<Record<string, unknown>>
}>(verifierRes.text)
fs.writeFileSync(path.join(DRAFT_DIR, 'verification.json'), JSON.stringify(verifierJson, null, 2))
console.log(`  ${verifierJson.overall_status}: ${verifierJson.summary.verified} verified / ${verifierJson.summary.unsupported} unsupported / ${verifierJson.summary.contradicted} contradicted`)

// --- Summary ---
console.log('\n========== LLM CALLS DONE ==========')
let totalIn = 0, totalOut = 0
for (const [k, v] of Object.entries(totals)) {
  totalIn += v.in; totalOut += v.out
}
const totalCost = (totalIn * 1 + totalOut * 5) / 1_000_000
console.log(`Total: ${totalIn} in / ${totalOut} out = $${totalCost.toFixed(4)}`)
console.log(`\nDraft at: ${DRAFT_DIR}`)
console.log('Next: translate.ts, packager, fetch-image.ts, generate-schema.ts')

// Write summary for caller
fs.writeFileSync(path.join(DRAFT_DIR, '.pipeline-stage1.json'), JSON.stringify({
  stage: 'writer+verifier done',
  cost_usd: Number(totalCost.toFixed(4)),
  slug: SLUG,
  en_words: enWords,
  verification: verifierJson.overall_status,
}, null, 2))
