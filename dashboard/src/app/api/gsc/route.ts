import { NextRequest, NextResponse } from 'next/server'
import { getSite } from '@/lib/sites'
import { isAuthed } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * Dashboard proxy for site /api/admin/gsc/export.
 * GET /api/gsc?site_id=asty-cabin&mode=striking|top&window_days=28&limit=50
 */
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const siteId = searchParams.get('site_id') ?? 'asty-cabin'
  const site = getSite(siteId)
  if (!site) return NextResponse.json({ error: 'Unknown site' }, { status: 404 })

  const key = process.env[site.env.api_key]
  if (!key) return NextResponse.json({ error: `${site.env.api_key} not set` }, { status: 500 })

  const qs = new URLSearchParams({
    site_id: siteId,
    mode: searchParams.get('mode') ?? 'striking',
    window_days: searchParams.get('window_days') ?? '28',
    limit: searchParams.get('limit') ?? '50',
  })
  try {
    const res = await fetch(`${site.site_url}/api/admin/gsc/export?${qs}`, {
      headers: { Authorization: `Bearer ${key}` },
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
