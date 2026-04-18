import type { SiteConfig } from './sites'

/**
 * Type-safe client that calls each site's bearer-authenticated export endpoints.
 * The api_key env var is read by name from the site config (env.api_key).
 */

export type Post = {
  id: string
  slug: string
  categoryId: string
  canonicalLang: string
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  publishAt: string | null
  publishedAt: string | null
  author: string
  createdAt: string
  updatedAt: string
  title: string
}

export type Metric = {
  slug: string
  pageViews: number
  sessions: number
  avgEngagementSec: number
}

export type PostsExport = {
  days: number
  posts: Post[]
  metrics: Metric[]
  warning?: string
}

export type AffiliateLink = {
  provider: string
  keyword: string
  url: string
  anchor: string
  anchor_ja?: string
  anchor_zh?: string
  note?: string
}
export type AffiliateExport = {
  version: number
  updated_at: string | null
  providers: Record<string, { name: string; disclosure: string; default_rel: string }>
  categories: Record<string, AffiliateLink[]>
}

async function bearer(site: SiteConfig, pathname: string): Promise<Response> {
  const key = process.env[site.env.api_key]
  if (!key) throw new Error(`env ${site.env.api_key} missing`)
  const url = `${site.site_url}${pathname}`
  // Cache-bust query since we observed Vercel edge caching the 401 state
  const sep = pathname.includes('?') ? '&' : '?'
  return fetch(`${url}${sep}_t=${Date.now()}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
}

export async function fetchPosts(site: SiteConfig, days = 28): Promise<PostsExport | null> {
  try {
    const res = await bearer(site, `/api/admin/posts/export?days=${days}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchAffiliate(site: SiteConfig): Promise<AffiliateExport | null> {
  try {
    const res = await bearer(site, '/api/admin/affiliate-links/export')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
