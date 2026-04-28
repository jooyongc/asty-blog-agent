import { NextRequest, NextResponse } from 'next/server'
import { getSite, getSiteBearer } from '@/lib/sites'
import { isAuthed } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * Dashboard proxy: insert an affiliate link into a published post.
 * Session-authed. Forwards to <site>/api/admin/posts/[slug]/affiliate.
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as {
    site_id?: string
    slug?: string
    lang?: 'en' | 'ja' | 'zh-hans'
    keyword?: string
    url?: string
    anchor?: string
  } | null
  if (!body?.site_id || !body.slug || !body.lang || !body.keyword || !body.url || !body.anchor) {
    return NextResponse.json({ error: 'site_id, slug, lang, keyword, url, anchor required' }, { status: 400 })
  }
  const site = await getSite(body.site_id)
  if (!site) return NextResponse.json({ error: 'Unknown site' }, { status: 404 })

  let key: string
  try {
    key = await getSiteBearer(site)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  try {
    const res = await fetch(`${site.site_url}/api/admin/posts/${encodeURIComponent(body.slug)}/affiliate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ lang: body.lang, keyword: body.keyword, url: body.url, anchor: body.anchor }),
    })
    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json({ error: `Site API ${res.status}`, detail: text }, { status: res.status === 422 ? 422 : 502 })
    }
    return NextResponse.json(JSON.parse(text))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
