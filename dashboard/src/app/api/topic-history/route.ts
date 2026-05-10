import { NextRequest, NextResponse } from 'next/server'
import { getSite, getSiteBearer } from '@/lib/sites'
import { isAuthed } from '@/lib/auth'

export const runtime = 'nodejs'

type RawTopic = {
  id: string
  title: string
  category: string | null
  rationale: string | null
  pillar?: string | null
  aeo_format?: string | null
  seo_score: number | null
  status: 'proposed' | 'approved' | 'in_progress' | 'published' | 'rejected'
  source_direction: string | null
  user_note: string | null
  created_at: string
}

type EnrichedTopic = RawTopic & {
  published_slug?: string
  published_url?: string
}

type DirectionGroup = {
  source_direction: string
  generated_at: string
  proposals: EnrichedTopic[]
}

/**
 * Dashboard proxy: returns the full topic_queue history for a site, enriched
 * with published-post URLs when the topic resulted in a live article.
 *
 * The topic queue stores `source_direction` for every proposal that came from
 * the director — we group by that text so the UI can show "this Monday's
 * direction → these 3 proposals → 2 approved → 1 published".
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

  const headers = { Authorization: `Bearer ${key}` }
  const cacheBust = `_t=${Date.now()}`

  try {
    const [topicsRes, postsRes] = await Promise.all([
      fetch(`${site.site_url}/api/admin/queue/topic?site_id=${encodeURIComponent(siteId)}&limit=100&${cacheBust}`, { headers, cache: 'no-store' }),
      fetch(`${site.site_url}/api/admin/posts/export?limit=100&${cacheBust}`, { headers, cache: 'no-store' }),
    ])

    if (!topicsRes.ok) {
      const t = await topicsRes.text()
      return NextResponse.json({ error: `Site queue API ${topicsRes.status}`, detail: t }, { status: 502 })
    }

    const topicsJson = (await topicsRes.json()) as { rows?: RawTopic[] }
    const postsJson = postsRes.ok ? (await postsRes.json()) as { posts?: Array<{ slug: string; status: string }> } : { posts: [] }
    const publishedSlugs = new Set(
      (postsJson.posts ?? []).filter((p) => p.status === 'published').map((p) => p.slug),
    )

    const topics: RawTopic[] = topicsJson.rows ?? []

    // Slug guess function (mirrors weekly-auto.mts)
    function slugify(title: string): string {
      return title.toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80)
    }

    const enriched: EnrichedTopic[] = topics.map((t) => {
      const guessed = slugify(t.title)
      const isPublished = publishedSlugs.has(guessed)
      if (!isPublished) return { ...t }
      return {
        ...t,
        published_slug: guessed,
        published_url: `${site.site_url}/en/blog/${guessed}`,
      }
    })

    // Group by source_direction (truncated key for floating-point/whitespace variance)
    function dirKey(s: string | null): string | null {
      if (!s) return null
      return s.trim().slice(0, 200)
    }

    const groupMap = new Map<string, EnrichedTopic[]>()
    const ungrouped: EnrichedTopic[] = []
    for (const e of enriched) {
      const k = dirKey(e.source_direction)
      if (!k) {
        ungrouped.push(e)
        continue
      }
      const arr = groupMap.get(k) ?? []
      arr.push(e)
      groupMap.set(k, arr)
    }

    const groups: DirectionGroup[] = []
    for (const [, arr] of groupMap) {
      arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      groups.push({
        source_direction: arr[0].source_direction ?? '',
        generated_at: arr[0].created_at,
        proposals: arr,
      })
    }
    // Most recent direction first
    groups.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())

    const stats = {
      total: enriched.length,
      proposed: enriched.filter((t) => t.status === 'proposed').length,
      approved: enriched.filter((t) => t.status === 'approved').length,
      in_progress: enriched.filter((t) => t.status === 'in_progress').length,
      published: enriched.filter((t) => t.status === 'published').length,
      rejected: enriched.filter((t) => t.status === 'rejected').length,
    }

    return NextResponse.json({ groups, ungrouped, stats })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
