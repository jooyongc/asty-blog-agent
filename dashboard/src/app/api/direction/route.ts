import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isAuthed } from '@/lib/auth'
import { getSite, type SiteConfig } from '@/lib/sites'
import { DIRECTOR_SYSTEM_PROMPT } from '@/lib/director-prompt'

export const runtime = 'nodejs'
export const maxDuration = 30

type Proposal = {
  rank: number
  title: string
  category: string
  rationale: string
  primary_keyword_hint?: string
  seo_score: number
  striking_distance_hit: boolean
}

type DirectorOutput = {
  site_id: string
  direction_text: string
  generated_at: string
  proposals: Proposal[]
}

async function fetchWithAuth<T>(url: string, key: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function gatherContext(site: SiteConfig): Promise<{
  recent_titles: Array<{ slug: string; title: string }>
  gsc_striking: Array<{ query: string; avg_position: number; impressions: number }>
  recent_feedback: Array<{ rating: number; reason: string | null }>
}> {
  const key = process.env[site.env.api_key]
  if (!key) {
    return { recent_titles: [], gsc_striking: [], recent_feedback: [] }
  }

  const [posts, gsc, feedback] = await Promise.all([
    fetchWithAuth<{ posts: Array<{ slug: string; title: string }> }>(
      `${site.site_url}/api/admin/posts/export?limit=10`,
      key,
    ),
    fetchWithAuth<{ rows: Array<{ query: string; avg_position: number; impressions: number }> }>(
      `${site.site_url}/api/admin/gsc/export?site_id=${site.site_id}&mode=striking&limit=10`,
      key,
    ),
    fetchWithAuth<{ rows: Array<{ rating: number; reason: string | null }> }>(
      `${site.site_url}/api/admin/feedback?site_id=${site.site_id}&agent=director&limit=5`,
      key,
    ),
  ])

  const recentTitles = (posts?.posts ?? []).slice(0, 10).map((p) => ({
    slug: p.slug,
    title: p.title ?? p.slug,
  }))

  return {
    recent_titles: recentTitles,
    gsc_striking: gsc?.rows ?? [],
    recent_feedback: feedback?.rows ?? [],
  }
}

function parseJsonBlock(raw: string): DirectorOutput | null {
  // Director should return strict JSON, but tolerate ```json fences just in case.
  let s = raw.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  }
  try {
    const parsed = JSON.parse(s) as DirectorOutput
    if (!Array.isArray(parsed.proposals) || parsed.proposals.length !== 3) return null
    return parsed
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as {
    site_id?: string
    direction_text?: string
  } | null
  if (!body?.site_id || !body.direction_text?.trim()) {
    return NextResponse.json({ error: 'site_id and direction_text required' }, { status: 400 })
  }
  const site = getSite(body.site_id)
  if (!site) return NextResponse.json({ error: 'Unknown site' }, { status: 404 })

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured on dashboard' },
      { status: 500 },
    )
  }

  const context = await gatherContext(site)
  const userPayload = {
    site_id: site.site_id,
    direction_text: body.direction_text.trim(),
    categories: site.categories,
    recent_titles: context.recent_titles,
    recent_feedback: context.recent_feedback,
    gsc_striking: context.gsc_striking,
  }

  const client = new Anthropic({ apiKey: anthropicKey })
  let msg
  try {
    msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      system: DIRECTOR_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(userPayload, null, 2) }],
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

  const parsed = parseJsonBlock(block.text)
  if (!parsed) {
    return NextResponse.json(
      { error: 'Director did not return valid JSON', raw: block.text.slice(0, 600) },
      { status: 502 },
    )
  }

  const costUsd =
    (msg.usage.input_tokens * 1) / 1_000_000 + (msg.usage.output_tokens * 5) / 1_000_000

  // Fire-and-forget cost logging to the site. Non-blocking.
  const agentKey = process.env[site.env.api_key]
  if (agentKey) {
    fetch(`${site.site_url}/api/admin/costs/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agentKey}` },
      body: JSON.stringify({
        site_id: site.site_id,
        agent: 'director',
        phase: 'direction',
        model: 'claude-haiku-4-5',
        input_tokens: msg.usage.input_tokens,
        output_tokens: msg.usage.output_tokens,
        cost_usd: costUsd,
      }),
    }).catch(() => undefined)
  }

  return NextResponse.json({
    ...parsed,
    meta: {
      model: 'claude-haiku-4-5',
      input_tokens: msg.usage.input_tokens,
      output_tokens: msg.usage.output_tokens,
      cost_usd: Number(costUsd.toFixed(6)),
      context_used: {
        recent_titles: context.recent_titles.length,
        gsc_striking: context.gsc_striking.length,
        recent_feedback: context.recent_feedback.length,
      },
    },
  })
}
