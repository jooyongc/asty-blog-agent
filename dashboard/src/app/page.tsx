import { listSites, readDeeplUsage } from '@/lib/sites'
import { fetchPosts, fetchAffiliate } from '@/lib/api-client'
import Link from 'next/link'
import { Card, CardHead, Chip, CostDonut, Metric, ProgressBar } from '@/components/primitives'
import { Icons } from '@/components/icons'

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
  const summaries = await Promise.all(
    sites.map(async (s): Promise<SiteSummary> => {
      const [postsData, affData] = await Promise.all([
        fetchPosts(s, 28),
        fetchAffiliate(s),
      ])
      if (!postsData) {
        return {
          id: s.site_id,
          url: s.site_url,
          total: 0,
          published: 0,
          scheduled: 0,
          drafts: 0,
          monthlyViews: 0,
          affiliateLinks: 0,
          providers: 0,
          error: `Failed to reach ${s.site_url} — check ${s.env.api_key}`,
        }
      }
      const published = postsData.posts.filter((p) => p.status === 'published').length
      const scheduled = postsData.posts.filter((p) => p.status === 'scheduled').length
      const drafts = postsData.posts.filter((p) => p.status === 'draft').length
      const monthlyViews = postsData.metrics.reduce((n, m) => n + m.pageViews, 0)
      const affiliateLinks = affData
        ? Object.values(affData.categories).reduce((n, arr) => n + arr.length, 0)
        : 0
      const providers = affData ? Object.keys(affData.providers).length : 0
      return {
        id: s.site_id,
        url: s.site_url,
        total: postsData.posts.length,
        published,
        scheduled,
        drafts,
        monthlyViews,
        affiliateLinks,
        providers,
      }
    })
  )
  return summaries
}

const DEEPL_MONTHLY_CAP = 500_000

export default async function Overview() {
  const summaries = await collectSummaries()
  const deepl = readDeeplUsage()
  const thisMonth = new Date().toISOString().slice(0, 7)

  const totals = summaries.reduce(
    (acc, s) => ({
      sites: acc.sites + 1,
      posts: acc.posts + s.total,
      published: acc.published + s.published,
      scheduled: acc.scheduled + s.scheduled,
      drafts: acc.drafts + s.drafts,
      views: acc.views + s.monthlyViews,
      online: acc.online + (s.error ? 0 : 1),
    }),
    { sites: 0, posts: 0, published: 0, scheduled: 0, drafts: 0, views: 0, online: 0 }
  )

  const deeplActive = deepl && deepl.month === thisMonth
  const deeplSpent = deeplActive ? deepl!.chars : 0
  const budgetTotal = DEEPL_MONTHLY_CAP

  return (
    <div>
      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">개요</h1>
          <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
            사이트 {totals.sites}개 · 발행 {totals.published}편 · 예약 {totals.scheduled}편
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Chip kind="ok" dot>
            {totals.online}/{totals.sites} 온라인
          </Chip>
        </div>
      </header>

      {/* Top metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-3.5">
        <Metric
          label={
            <span className="flex items-center gap-1.5">
              <Icons.Doc size={13} />
              사이트
            </span>
          }
          value={totals.sites}
          delta={`${totals.online}개 온라인`}
          deltaKind={totals.online === totals.sites ? 'ok' : 'warn'}
        />
        <Metric
          label={
            <span className="flex items-center gap-1.5">
              <Icons.Send size={13} />
              이번 달 발행
            </span>
          }
          value={totals.published}
          delta={`예약 ${totals.scheduled} · 초안 ${totals.drafts}`}
        />
        <Metric
          label={
            <span className="flex items-center gap-1.5">
              <Icons.Globe size={13} />
              28일 조회수
            </span>
          }
          value={totals.views.toLocaleString()}
          delta="GA4 연동 시 자동 수집"
        />
        <Metric
          label={
            <span className="flex items-center gap-1.5">
              <Icons.Bolt size={13} />
              DeepL 사용량
            </span>
          }
          value={deeplActive ? `${Math.round((deeplSpent / budgetTotal) * 100)}%` : '—'}
          delta={deeplActive ? `${deeplSpent.toLocaleString()} / 500k chars` : '사용량 파일 없음'}
          bar={deeplActive ? deeplSpent / budgetTotal : 0}
        />
      </section>

      {/* Main row: sites list (2fr) + budget donut (1fr) */}
      <section className="grid md:grid-cols-[2fr_1fr] grid-cols-1 gap-3.5 mb-3.5">
        <Card>
          <CardHead>
            <Chip kind="ok" dot>
              Live
            </Chip>
            <div className="text-[13.5px] font-semibold">운영 중인 사이트</div>
            <div className="flex-1" />
            <Link
              href="/pipeline"
              className="text-[12.5px] text-[color:var(--color-text-3)] hover:text-[color:var(--color-text)] flex items-center gap-0.5"
            >
              파이프라인 <Icons.Chevron size={12} />
            </Link>
          </CardHead>
          <div className="p-1.5">
            {summaries.length === 0 && (
              <div className="p-8 text-center text-sm text-[color:var(--color-text-3)]">
                사이트가 구성되지 않았습니다.{' '}
                <code className="font-mono bg-[color:var(--color-bg-muted)] px-1 rounded">
                  sites/&lt;id&gt;/config.json
                </code>{' '}
                추가 필요.
              </div>
            )}
            {summaries.map((s) => (
              <Link
                key={s.id}
                href={`/sites/${s.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[color:var(--color-bg-subtle)] transition"
              >
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-white text-[13px] font-semibold"
                  style={{
                    background: s.error
                      ? 'var(--color-line-3)'
                      : 'linear-gradient(135deg, #2f6f4e, #b66f1c)',
                  }}
                >
                  {s.id.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[13.5px] truncate">{s.id}</span>
                    {s.error ? (
                      <Chip kind="err" dot>offline</Chip>
                    ) : (
                      <Chip kind="ok" dot>online</Chip>
                    )}
                  </div>
                  {s.error ? (
                    <div className="text-[11.5px] text-[color:var(--color-err)] truncate">
                      {s.error}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3.5 text-[11.5px] text-[color:var(--color-text-3)] tabular-nums">
                      <span>발행 {s.published}</span>
                      <span>예약 {s.scheduled}</span>
                      <span>초안 {s.drafts}</span>
                      <span>28d {s.monthlyViews.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <Icons.Chevron size={14} />
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHead>
            <div className="text-[13.5px] font-semibold">DeepL 예산 (월)</div>
            <div className="flex-1" />
            <Chip kind="ghost">500k cap</Chip>
          </CardHead>
          <div className="p-[18px] flex flex-col items-center gap-3">
            <CostDonut
              spent={deeplActive ? deeplSpent / 1000 : 0}
              budget={DEEPL_MONTHLY_CAP / 1000}
            />
            <div className="flex gap-4 text-xs text-[color:var(--color-text-3)]">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-sm bg-[color:var(--color-accent)]"
                />
                사용됨 (×1000 chars)
              </div>
            </div>
            <div className="w-full border-t border-[color:var(--color-line)] pt-3 flex justify-between text-xs">
              <div>
                <div className="text-[11px] text-[color:var(--color-text-3)]">런 횟수</div>
                <div className="font-mono font-medium">{deeplActive ? deepl!.runs : 0}</div>
              </div>
              <div>
                <div className="text-[11px] text-[color:var(--color-text-3)]">이번 달</div>
                <div className="font-mono font-medium">{thisMonth}</div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Site cards grid — detailed */}
      <section>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="text-[13px] font-semibold">사이트 상세</div>
          <Chip kind="ghost">{summaries.length}</Chip>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {summaries.map((s) => (
            <Link
              key={s.id}
              href={`/sites/${s.id}`}
              className="block bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] rounded-[14px] p-5 hover:border-[color:var(--color-text)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[14px] truncate">{s.id}</h3>
                  <p className="text-[11.5px] text-[color:var(--color-text-3)] truncate max-w-[220px]">
                    {s.url.replace(/^https?:\/\//, '')}
                  </p>
                </div>
                {s.error ? (
                  <Chip kind="err" dot>offline</Chip>
                ) : (
                  <Chip kind="ok" dot>online</Chip>
                )}
              </div>
              {s.error ? (
                <p className="text-[11.5px] text-[color:var(--color-text-3)]">{s.error}</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-[18px] font-semibold tabular-nums">{s.published}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-text-3)]">
                      Pub
                    </div>
                  </div>
                  <div>
                    <div className="text-[18px] font-semibold text-[color:var(--color-blue)] tabular-nums">
                      {s.scheduled}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-text-3)]">
                      Sched
                    </div>
                  </div>
                  <div>
                    <div className="text-[18px] font-semibold tabular-nums">
                      {s.monthlyViews.toLocaleString()}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-text-3)]">
                      28d
                    </div>
                  </div>
                  <div>
                    <div className="text-[18px] font-semibold tabular-nums">{s.affiliateLinks}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-text-3)]">
                      Aff
                    </div>
                  </div>
                </div>
              )}
              {!s.error && s.total > 0 && (
                <div className="mt-3">
                  <ProgressBar
                    segments={[
                      { value: s.published, color: 'var(--color-accent)' },
                      { value: s.scheduled, color: 'var(--color-blue)' },
                      { value: s.drafts, color: 'var(--color-line-3)' },
                    ]}
                    total={s.total}
                    height={5}
                  />
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
