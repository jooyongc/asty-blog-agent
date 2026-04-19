import { NextRequest, NextResponse } from 'next/server'
import { getSite } from '@/lib/sites'
import { isAuthed } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * Dashboard proxy for site /api/admin/queue/topic.
 * Session-authed. Forwards using the site's bearer key.
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as {
    site_id?: string
    title?: string
    category?: string
    rationale?: string
    seo_score?: number
    primary_keyword_hint?: string
    source_direction?: string
    status?: 'proposed' | 'approved' | 'in_progress' | 'published' | 'rejected'
    user_note?: string
  } | null
  if (!body?.site_id || !body.title) {
    return NextResponse.json({ error: 'site_id and title required' }, { status: 400 })
  }
  const site = getSite(body.site_id)
  if (!site) return NextResponse.json({ error: 'Unknown site' }, { status: 404 })

  const key = process.env[site.env.api_key]
  if (!key) return NextResponse.json({ error: `${site.env.api_key} not set` }, { status: 500 })

  try {
    const res = await fetch(`${site.site_url}/api/admin/queue/topic`, {
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
