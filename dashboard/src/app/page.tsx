import { listSites } from '@/lib/sites'
import { fetchPosts, fetchAffiliate } from '@/lib/api-client'
import Link from 'next/link'
import { KpiCard } from '@/components/kpi-card'

export const dynamic = 'force-dynamic'

type SiteSummary = {
  id: string
  url: string
  total: number
  published: number
  scheduled: number
  drafts: number
  monthlyViews: number
  affiliateLinks: number
  providers: number
  error?: string
}

async function collectSummaries(): Promise<SiteSummary[]> {
  const sites = listSites()
  const summaries = await Promise.all(sites.map(async (s): Promise<SiteSummary> => {
    const [postsData, affData] = await Promise.all([
      fetchPosts(s, 28),
      fetchAffiliate(s),
    ])
    if (!postsData) {
      return {
        id: s.site_id, url: s.site_url,
        total: 0, published: 0, scheduled: 0, drafts: 0,
        monthlyViews: 0, affiliateLinks: 0, providers: 0,
        error: `Failed to reach ${s.site_url} — check ${s.env.api_key}`,
      }
    }
    const published = postsData.posts.filter(p => p.status === 'published').length
    const scheduled = postsData.posts.filter(p => p.status === 'scheduled').length
    const drafts = postsData.posts.filter(p => p.status === 'draft').length
    const monthlyViews = postsData.metrics.reduce((n, m) => n + m.pageViews, 0)
    const affiliateLinks = affData ? Object.values(affData.categories).reduce((n, arr) => n + arr.length, 0) : 0
    const providers = affData ? Object.keys(affData.providers).length : 0
    return {
      id: s.site_id, url: s.site_url,
      total: postsData.posts.length, published, scheduled, drafts,
      monthlyViews, affiliateLinks, providers,
    }
  }))
  return summaries
}

export default async function SitesOverview() {
  const summaries = await collectSummaries()

  const totals = summaries.reduce((acc, s) => ({
    sites: acc.sites + 1,
    posts: acc.posts + s.total,
    published: acc.published + s.published,
    scheduled: acc.scheduled + s.scheduled,
    views: acc.views + s.monthlyViews,
  }), { sites: 0, posts: 0, published: 0, scheduled: 0, views: 0 })

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Sites</h1>
        <p className="text-sm text-gray-500 mt-1">Cross-site overview of the blog agent network.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <KpiCard label="Sites" value={totals.sites} />
        <KpiCard label="Total Posts" value={totals.posts} />
        <KpiCard label="Published" value={totals.published} tone="success" />
        <KpiCard label="Scheduled" value={totals.scheduled} />
        <KpiCard label="28d Views" value={totals.views.toLocaleString()} />
      </div>

      {summaries.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
          No sites configured. Add a <code className="bg-gray-100 px-1 rounded">sites/&lt;id&gt;/config.json</code> file.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map(s => (
          <Link
            key={s.id}
            href={`/sites/${s.id}`}
            className="bg-white border rounded-lg p-5 hover:border-gray-900 transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{s.id}</h3>
                <p className="text-xs text-gray-500 truncate max-w-[240px]">{s.url}</p>
              </div>
              {s.error ? (
                <span className="text-xs text-red-600">● offline</span>
              ) : (
                <span className="text-xs text-green-600">● online</span>
              )}
            </div>
            {s.error ? (
              <p className="text-xs text-gray-500">{s.error}</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-lg font-semibold">{s.published}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">Pub</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-700">{s.scheduled}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">Sched</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{s.monthlyViews.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">28d</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{s.affiliateLinks}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">Aff</div>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
