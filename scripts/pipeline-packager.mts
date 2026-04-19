import * as fs from 'node:fs'
import * as path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'

const SLUG = process.argv[2]
if (!SLUG) { console.error('Usage: tsx scripts/pipeline-packager.mts <slug>'); process.exit(1) }
const DRAFT_DIR = path.join('content', 'drafts', SLUG)

function loadPrompt(name: string): string {
  const raw = fs.readFileSync(path.join('.claude', 'agents', `${name}.md`), 'utf8')
  return raw.replace(/^---[\s\S]*?---\s*/, '').trim()
}

function extractJson<T>(raw: string): T {
  let s = raw.trim()
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = s.indexOf('{')
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
  return JSON.parse(s.slice(start, end + 1)) as T
}

const enMd = fs.readFileSync(path.join(DRAFT_DIR, 'en.md'), 'utf8')
const jaMd = fs.readFileSync(path.join(DRAFT_DIR, 'ja.md'), 'utf8')
const zhMd = fs.readFileSync(path.join(DRAFT_DIR, 'zh.md'), 'utf8')

const system = loadPrompt('packager') +
  '\n\nCRITICAL: Return ONLY the meta.json content as your reply. No markdown fences, no prose.'
const input = JSON.stringify({ slug: SLUG, en_md: enMd, ja_md: jaMd, zh_md: zhMd })

const client = new Anthropic()
const t0 = Date.now()
const r = await client.messages.create({
  model: 'claude-haiku-4-5',
  max_tokens: 2000,
  system,
  messages: [{ role: 'user', content: input }],
})
const block = r.content[0]
if (block.type !== 'text') throw new Error('non-text')
const meta = extractJson<Record<string, unknown>>(block.text)
// compute publish date: 2 days ahead at 09:00 KST
const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(0, 0, 0, 0)
d.setUTCHours(0) // 09:00 KST = 00:00 UTC
meta.publish_at = d.toISOString()
fs.writeFileSync(path.join(DRAFT_DIR, 'meta.json'), JSON.stringify(meta, null, 2))
const cost = (r.usage.input_tokens * 1 + r.usage.output_tokens * 5) / 1_000_000
console.log(`✓ meta.json saved — ${r.usage.input_tokens}in/${r.usage.output_tokens}out = $${cost.toFixed(4)} (${Date.now() - t0}ms)`)
console.log(`  publish_at: ${meta.publish_at}`)
