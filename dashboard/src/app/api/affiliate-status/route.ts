import { NextRequest, NextResponse } from 'next/server'
import { getSite, getSiteBearer } from '@/lib/sites'
import { isAuthed } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * Dashboard proxy: GET site_id → returns each published post and its current
 * affiliate link state (extracted from content_md).
 */
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const siteId = req.nextUrl.searchParams.get('site_id')
  if (!siteId) return NextResponse.json({ error: 'site_id required' }, { status: 400 })

  const site = await getSite(siteId)
  if (!site) return NextResponse.json({ error: 'Unknown site' }, { status: 404 })

  let key: string
  try {
    key = await getSiteBearer(site)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  try {
    const res = await fetch(`${site.site_url}/api/admin/posts/affiliate-status`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
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
