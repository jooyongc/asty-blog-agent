import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isAuthed } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 20

const SYSTEM_PROMPT = `You are a workspace setup assistant for a multi-site blog automation dashboard.

Given a brief description of a new blog site (Korean or English), produce ONLY a JSON object matching this shape:

{
  "site_id": "<kebab-case, 4-30 chars, a-z 0-9 -, unique-looking>",
  "name": "<human-readable name, 3-40 chars>",
  "site_url_suggestion": "<placeholder https URL; the user will replace>",
  "languages": ["<BCP-47 codes, 1-5 items, lowercase>"],
  "canonical_lang": "<one of languages, usually the primary>",
  "categories": ["<3-10 short lowercase tags>"],
  "profile": "lean" | "standard" | "full",
  "rationale": "<1-2 sentence Korean summary of why these values>"
}

Profile guidance:
- lean    = default, tight budget ($5/mo cap). Pick for "small/tight/lean" blogs.
- standard= medium budget ($5.5/mo). Pick when multi-language or richer content is implied.
- full    = large budget ($6.5/mo). Pick for "rich/premium/multi-market".

Rules:
- site_id must be kebab-case: only [a-z0-9-], start with a letter, no trailing dash.
- Default canonical_lang to the first language if multi-language.
- If the description does not mention language, default to ["en"] canonical "en".
- Categories must be short (<20 chars), lowercase, no spaces.
- Output ONLY the JSON object. No markdown fences. No prose outside.`

type Suggestion = {
  site_id: string
  name: string
  site_url_suggestion: string
  languages: string[]
  canonical_lang: string
  categories: string[]
  profile: 'lean' | 'standard' | 'full'
  rationale: string
}

function extractJson(raw: string): Suggestion {
  let s = raw.trim()
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
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
  if (end === -1) throw new Error('Unbalanced JSON')
  return JSON.parse(s.slice(start, end + 1)) as Suggestion
}

/**
 * POST /api/workspaces/suggest
 * Body: { description: string, clone_from?: Suggestion }
 *
 * `clone_from` lets the UI pass an existing workspace's values as anchors —
 * useful for "clone + tweak" flows. The model will prefer to adjust those
 * rather than invent from scratch.
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as {
    description?: string
    clone_from?: Partial<Suggestion>
  } | null

  const description = (body?.description ?? '').toString().trim()
  if (!description || description.length < 5) {
    return NextResponse.json({ error: 'description (>=5 chars) required' }, { status: 400 })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured on dashboard' },
      { status: 500 },
    )
  }

  const userPayload = {
    description,
    clone_from: body?.clone_from ?? null,
  }

  const client = new Anthropic({ apiKey: anthropicKey })
  let msg
  try {
    msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(userPayload) }],
    })
  } catch (e) {
    const err = e as { status?: number; message?: string }
    return NextResponse.json(
      { error: `Anthropic API ${err.status ?? ''}: ${err.message ?? 'unknown'}` },
      { status: 502 },
    )
  }

  const block = msg.content[0]
  if (block.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response format' }, { status: 502 })
  }

  let parsed: Suggestion
  try {
    parsed = extractJson(block.text)
  } catch {
    return NextResponse.json(
      { error: 'Assistant did not return valid JSON', raw: block.text.slice(0, 400) },
      { status: 502 },
    )
  }

  const costUsd = (msg.usage.input_tokens + msg.usage.output_tokens * 5) / 1_000_000
  return NextResponse.json({
    suggestion: parsed,
    meta: {
      model: 'claude-haiku-4-5',
      input_tokens: msg.usage.input_tokens,
      output_tokens: msg.usage.output_tokens,
      cost_usd: Number(costUsd.toFixed(6)),
    },
  })
}
