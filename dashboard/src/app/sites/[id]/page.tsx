import { getSite } from '@/lib/sites'
import { fetchPosts, fetchAffiliate } from '@/lib/api-client'
import { scorePosts } from '@/lib/scoring'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { KpiCard, StatusBadge } from '@/components/kpi-card'

export const dynamic = 'force-dynamic'

function fmtDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default async function SiteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const site = getSite(id)
  if (!site) notFound()

  const [postsData, affData] = await Promise.all([
    fetchPosts(site, 28),
    fetchAffiliate(site),
  ])

  if (!postsData) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-gray-600 hover:underline">← Back</Link>
        <h1 className="text-xl font-semibold mt-3">{site.site_id}</h1>
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Could not reach <code>{site.site_url}</code>. Check that env var
          <code className="mx-1 bg-white px-1 rounded">{site.env.api_key}</code>
          is set on this dashboard deployment.
        </div>
      </div>
    )
  }

  const scored = scorePosts(postsData.posts.filter(p => p.status === 'published'), postsData.metrics)
  const buckets = {
    scale: scored.filter(s => s.bucket === 'scale'),
    keep: scored.filter(s => s.bucket === 'keep'),
    rewrite: scored.filter(s => s.bucket === 'rewrite'),
  }
  const publishedCount = scored.length
  const scheduledCount = postsData.posts.filter(p => p.status === 'scheduled').length
  const draftCount = postsData.posts.filter(p => p.status === 'draft').length
  const totalViews = postsData.metrics.reduce((n, m) => n + m.pageViews, 0)

  // Category coverage
  const byCategory: Record<string, number> = {}
  for (const p of postsData.posts) byCategory[p.categoryId] = (byCategory[p.categoryId] ?? 0) + 1

  // Affiliate readiness
  const affByCategory: Record<string, number> = {}
  if (affData) for (const [cat, arr] of Object.entries(affData.categories)) affByCategory[cat] = arr.length

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-2">
        <Link href="/" className="text-sm text-gray-600 hover:underline">← All sites</Link>
      </div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{site.site_id}</h1>
          <a href={site.site_url} target="_blank" rel="noopener" className="text-xs text-gray-500 hover:text-gray-900 hover:underline">
            {site.site_url} ↗
          </a>
        </div>
        <div className="flex gap-2 text-xs">
          <a href={`${site.site_url}/admin/blog`} target="_blank" rel="noopener" className="border rounded px-3 py-1.5 hover:bg-gray-50">
            Site admin ↗
          </a>
          <a href={`${site.site_url}/admin/affiliate`} target="_blank" rel="noopener" className="border rounded px-3 py-1.5 hover:bg-gray-50">
            Affiliate ↗
          </a>
        </div>
      </div>

      {postsData.warning && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded text-sm">
          ⚠️ {postsData.warning}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        <KpiCard label="Published" value={publishedCount} tone="success" />
        <KpiCard label="Scheduled" value={scheduledCount} />
        <KpiCard label="Drafts" value={draftCount} />
        <KpiCard label="28d Views" value={totalViews.toLocaleString()} />
        <KpiCard label="Scale 🚀" value={buckets.scale.length} tone="success" />
        <KpiCard label="Rewrite 🔧" value={buckets.rewrite.length} tone={buckets.rewrite.length > 0 ? 'warning' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Performance buckets */}
        <div className="bg-white border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-3">Performance Buckets</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>🚀 Scale</span><span className="font-mono">{buckets.scale.length}</span></div>
            <div className="flex justify-between"><span>✅ Keep</span><span className="font-mono">{buckets.keep.length}</span></div>
            <div className="flex justify-between"><span>🔧 Rewrite</span><span className="font-mono">{buckets.rewrite.length}</span></div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-3">Posts by Category</h2>
          <div className="space-y-1.5 text-sm">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, n]) => (
              <div key={cat} className="flex justify-between">
                <span className="text-gray-700">{cat}</span>
                <span className="font-mono">{n}</span>
              </div>
            ))}
            {Object.keys(byCategory).length === 0 && <div className="text-gray-400 text-xs">No posts yet</div>}
          </div>
        </div>

        {/* Affiliate readiness */}
        <div className="bg-white border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-3">Affiliate Readiness</h2>
          <div className="space-y-1.5 text-sm">
            {site.categories.map(cat => {
              const n = affByCategory[cat] ?? 0
              return (
                <div key={cat} className="flex justify-between items-center">
                  <span className={n === 0 ? 'text-gray-400' : 'text-gray-700'}>{cat}</span>
                  <span className={`font-mono text-xs ${n === 0 ? 'text-red-500' : 'text-green-700'}`}>
                    {n === 0 ? 'empty' : `${n} link${n > 1 ? 's' : ''}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Posts table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold">All Posts</h2>
          <span className="text-xs text-gray-500">{postsData.posts.length} total</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
            <tr>
              <th className="text-left px-5 py-2">Title</th>
              <th className="text-left px-5 py-2">Category</th>
              <th className="text-left px-5 py-2">Status</th>
              <th className="text-left px-5 py-2">Publish At</th>
              <th className="text-right px-5 py-2">Views</th>
              <th className="text-right px-5 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {[...postsData.posts].sort((a, b) => {
              const ta = a.publishAt ? new Date(a.publishAt).getTime() : 0
              const tb = b.publishAt ? new Date(b.publishAt).getTime() : 0
              return tb - ta
            }).map(p => {
              const s = scored.find(x => x.slug === p.slug)
              return (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-2.5">
                    <div className="font-medium line-clamp-1 max-w-[320px]">{p.title}</div>
                    <div className="text-xs text-gray-500 font-mono">{p.slug}</div>
                  </td>
                  <td className="px-5 py-2.5 text-xs text-gray-600">{p.categoryId}</td>
                  <td className="px-5 py-2.5"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-2.5 text-xs text-gray-600">{fmtDate(p.publishAt)}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-xs">{s?.metric?.pageViews ?? '—'}</td>
                  <td className="px-5 py-2.5 text-right">
                    {s ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${
                        s.bucket === 'scale' ? 'bg-green-100 text-green-800' :
                        s.bucket === 'rewrite' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {s.score}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
