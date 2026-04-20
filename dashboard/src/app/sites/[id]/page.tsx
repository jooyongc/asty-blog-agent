import { getSite } from '@/lib/sites'
import { fetchPosts, fetchAffiliate } from '@/lib/api-client'
import { scorePosts } from '@/lib/scoring'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHead, Chip, Metric } from '@/components/primitives'
import { Icons } from '@/components/icons'

export const dynamic = 'force-dynamic'

const STATUS_CHIP: Record<string, 'ok' | 'warn' | 'err' | 'ghost'> = {
  published: 'ok',
  scheduled: 'warn',
  draft: 'ghost',
  archived: 'err',
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s).toLocaleString('ko', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default async function SiteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const site = await getSite(id)
  if (!site) notFound()

  const [postsData, affData] = await Promise.all([fetchPosts(site, 28), fetchAffiliate(site)])

  if (!postsData) {
    return (
      <div>
        <Link
          href="/"
          className="text-sm text-[color:var(--color-text-3)] hover:text-[color:var(--color-text)]"
        >
          ← 전체 사이트로
        </Link>
        <h1 className="text-[22px] font-semibold mt-3">{site.site_id}</h1>
        <Card className="mt-6 border-[color:var(--color-err)]">
          <div className="p-5 text-[color:var(--color-err)] text-sm">
            Could not reach <code>{site.site_url}</code>. Check that env var{' '}
            <code className="mx-1 bg-[color:var(--color-bg-muted)] px-1 rounded">
              {site.env.api_key}
            </code>{' '}
            is set on this dashboard deployment.
          </div>
        </Card>
      </div>
    )
  }

  const scored = scorePosts(
    postsData.posts.filter((p) => p.status === 'published'),
    postsData.metrics
  )
  const buckets = {
    scale: scored.filter((s) => s.bucket === 'scale'),
    keep: scored.filter((s) => s.bucket === 'keep'),
    rewrite: scored.filter((s) => s.bucket === 'rewrite'),
  }
  const publishedCount = scored.length
  const scheduledCount = postsData.posts.filter((p) => p.status === 'scheduled').length
  const draftCount = postsData.posts.filter((p) => p.status === 'draft').length
  const totalViews = postsData.metrics.reduce((n, m) => n + m.pageViews, 0)

  const byCategory: Record<string, number> = {}
  for (const p of postsData.posts) byCategory[p.categoryId] = (byCategory[p.categoryId] ?? 0) + 1

  const affByCategory: Record<string, number> = {}
  if (affData) {
    for (const [cat, arr] of Object.entries(affData.categories)) affByCategory[cat] = arr.length
  }

  const sortedPosts = [...postsData.posts].sort((a, b) => {
    const ta = a.publishAt ? new Date(a.publishAt).getTime() : 0
    const tb = b.publishAt ? new Date(b.publishAt).getTime() : 0
    return tb - ta
  })

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/"
          className="text-[12.5px] text-[color:var(--color-text-3)] hover:text-[color:var(--color-text)]"
        >
          ← 전체 사이트
        </Link>
      </div>
      <header className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">{site.site_id}</h1>
          <a
            href={site.site_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11.5px] text-[color:var(--color-text-3)] hover:text-[color:var(--color-text)] hover:underline"
          >
            {site.site_url} ↗
          </a>
        </div>
        <div className="flex gap-2 text-[12px]">
          <a
            href={`${site.site_url}/admin/blog`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 border border-[color:var(--color-line-2)] rounded-[7px] px-2.5 py-1 text-[color:var(--color-text-2)] hover:bg-[color:var(--color-bg-hover)]"
          >
            Site admin <Icons.External size={11} />
          </a>
          <a
            href={`${site.site_url}/admin/affiliate`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 border border-[color:var(--color-line-2)] rounded-[7px] px-2.5 py-1 text-[color:var(--color-text-2)] hover:bg-[color:var(--color-bg-hover)]"
          >
            Affiliate <Icons.External size={11} />
          </a>
        </div>
      </header>

      {postsData.warning && (
        <div className="mb-3.5 bg-[color:var(--color-warn-soft)] text-[color:var(--color-warn)] border border-[color:var(--color-line)] rounded-[10px] px-4 py-2 text-[13px] flex items-center gap-2">
          <Icons.Warn size={14} /> {postsData.warning}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-6 gap-3.5 mb-4">
        <Metric label="발행" value={publishedCount} deltaKind="ok" />
        <Metric label="예약" value={scheduledCount} />
        <Metric label="초안" value={draftCount} />
        <Metric label="28일 조회" value={totalViews.toLocaleString()} />
        <Metric
          label={<span>Scale 🚀</span>}
          value={buckets.scale.length}
          deltaKind="ok"
        />
        <Metric
          label={<span>Rewrite 🔧</span>}
          value={buckets.rewrite.length}
          deltaKind={buckets.rewrite.length > 0 ? 'warn' : undefined}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
        <Card>
          <CardHead>
            <div className="text-[13.5px] font-semibold">성과 버킷</div>
          </CardHead>
          <div className="p-5 text-sm space-y-2">
            <div className="flex justify-between">
              <span>🚀 Scale</span>
              <span className="font-mono tabular-nums">{buckets.scale.length}</span>
            </div>
            <div className="flex justify-between">
              <span>✅ Keep</span>
              <span className="font-mono tabular-nums">{buckets.keep.length}</span>
            </div>
            <div className="flex justify-between">
              <span>🔧 Rewrite</span>
              <span className="font-mono tabular-nums">{buckets.rewrite.length}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead>
            <div className="text-[13.5px] font-semibold">카테고리별 글 수</div>
          </CardHead>
          <div className="p-5 text-sm space-y-1.5">
            {Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, n]) => (
                <div key={cat} className="flex justify-between">
                  <span className="text-[color:var(--color-text-2)]">{cat}</span>
                  <span className="font-mono tabular-nums">{n}</span>
                </div>
              ))}
            {Object.keys(byCategory).length === 0 && (
              <div className="text-[color:var(--color-text-3)] text-xs">발행된 글 없음</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHead>
            <div className="text-[13.5px] font-semibold">어필리에이트 준비도</div>
          </CardHead>
          <div className="p-5 text-sm space-y-1.5">
            {site.categories.map((cat) => {
              const n = affByCategory[cat] ?? 0
              return (
                <div key={cat} className="flex justify-between items-center">
                  <span className={n === 0 ? 'text-[color:var(--color-text-3)]' : ''}>{cat}</span>
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      n === 0
                        ? 'text-[color:var(--color-err)]'
                        : 'text-[color:var(--color-ok)]'
                    }`}
                  >
                    {n === 0 ? 'empty' : `${n} link${n > 1 ? 's' : ''}`}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </section>

      <Card>
        <CardHead>
          <div className="text-[13.5px] font-semibold">모든 글</div>
          <div className="flex-1" />
          <span className="text-[11.5px] text-[color:var(--color-text-3)]">
            {postsData.posts.length}건
          </span>
        </CardHead>
        <table className="w-full text-[13px]">
          <thead className="bg-[color:var(--color-bg-subtle)] text-[11.5px] uppercase tracking-wider text-[color:var(--color-text-3)]">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">제목</th>
              <th className="text-left px-4 py-2.5 font-medium">카테고리</th>
              <th className="text-left px-4 py-2.5 font-medium">상태</th>
              <th className="text-left px-4 py-2.5 font-medium">발행일</th>
              <th className="text-right px-4 py-2.5 font-medium">조회</th>
              <th className="text-right px-4 py-2.5 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map((p) => {
              const s = scored.find((x) => x.slug === p.slug)
              return (
                <tr
                  key={p.id}
                  className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-bg-subtle)]"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium line-clamp-1 max-w-[320px]">{p.title}</div>
                    <div className="text-[11.5px] text-[color:var(--color-text-3)] font-mono">
                      {p.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-[color:var(--color-text-3)]">
                    {p.categoryId}
                  </td>
                  <td className="px-4 py-3">
                    <Chip kind={STATUS_CHIP[p.status] ?? 'ghost'}>{p.status}</Chip>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-[color:var(--color-text-3)] tabular-nums">
                    {fmtDate(p.publishAt)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[11.5px] tabular-nums">
                    {s?.metric?.pageViews ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s ? (
                      <Chip
                        kind={
                          s.bucket === 'scale'
                            ? 'ok'
                            : s.bucket === 'rewrite'
                            ? 'err'
                            : 'ghost'
                        }
                      >
                        {s.score}
                      </Chip>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
