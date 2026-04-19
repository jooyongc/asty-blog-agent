import { NextRequest, NextResponse } from 'next/server'
import { getSite } from '@/lib/sites'
import { isAuthed } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * Dashboard proxy for /api/admin/feedback.
 * Session-authed (dashboard cookie) — forwards using the site's bearer key.
 *
 * Body: { site_id, agent, target_kind, target_ref?, rating, reason?, context? }
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as {
    site_id?: string
    agent?: string
    target_kind?: string
    target_ref?: string
    rating?: number
    reason?: string
    context?: Record<string, unknown>
    created_by?: string
  } | null
  if (!body?.site_id || !body.agent || !body.target_kind || !body.rating) {
    return NextResponse.json(
      { error: 'site_id, agent, target_kind, rating required' },
      { status: 400 },
    )
  }
  const site = getSite(body.site_id)
  if (!site) return NextResponse.json({ error: 'Unknown site' }, { status: 404 })

  const key = process.env[site.env.api_key]
  if (!key) return NextResponse.json({ error: `${site.env.api_key} not set` }, { status: 500 })

  try {
    const res = await fetch(`${site.site_url}/api/admin/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json({ error: `Site API ${res.status}`, detail: text }, { status: 502 })
    }
    return NextResponse.json(JSON.parse(text))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
