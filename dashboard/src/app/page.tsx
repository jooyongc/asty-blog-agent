import { listSites, readDeeplUsage } from '@/lib/sites'
import { fetchPosts, fetchAffiliate } from '@/lib/api-client'
import { fetchCostSummary, ceilingFor, type CostSummary } from '@/lib/cost-client'
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
  const sites = listSites()
  const [summaries, costs] = await Promise.all([
    collectSummaries(),
    Promise.all(sites.map((s) => fetchCostSummary(s, 30))),
  ])
  const deepl = readDeeplUsage()
  const thisMonth = new Date().toISOString().slice(0, 7)

  const siteCostMap = new Map<string, CostSummary | null>()
  sites.forEach((s, i) => siteCostMap.set(s.site_id, costs[i]))

  const costTotals = costs.reduce(
    (acc, c) => {
      if (!c) return acc
      return {
        usd: acc.usd + c.totals.cost_usd,
        calls: acc.calls + c.totals.calls,
        in: acc.in + c.totals.input_tokens,
        out: acc.out + c.totals.output_tokens,
      }
    },
    { usd: 0, calls: 0, in: 0, out: 0 },
  )
  const ceilingTotal = sites.reduce((n, s) => n + ceilingFor(s), 0)
  const ceilingRemaining = Math.max(0, ceilingTotal - costTotals.usd)
  const overrun = Math.max(0, costTotals.usd - ceilingTotal)
  const usagePct = ceilingTotal > 0 ? (costTotals.usd / ceilingTotal) * 100 : 0

  // Aggregate by-agent breakdown across all sites
  const agentAgg = new Map<string, { calls: number; usd: number }>()
  for (const c of costs) {
    if (!c) continue
    for (const a of c.by_agent) {
      const prev = agentAgg.get(a.agent) ?? { calls: 0, usd: 0 }
      agentAgg.set(a.agent, {
        calls: prev.calls + a.calls,
        usd: prev.usd + a.cost_usd,
      })
    }
  }
  const agentRows = Array.from(agentAgg.entries())
    .map(([agent, v]) => ({ agent, ...v }))
    .sort((a, b) => b.usd - a.usd)

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

      {/* API cost / budget section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-3.5">
        <Metric
          label={
            <span className="flex items-center gap-1.5">
              <Icons.Dollar size={13} />
              API 비용 (30일)
            </span>
          }
          value={`$${costTotals.usd.toFixed(2)}`}
          delta={`${costTotals.calls.toLocaleString()} 호출 · ${costTotals.in.toLocaleString()} / ${costTotals.out.toLocaleString()} tok`}
          deltaKind={overrun > 0 ? 'err' : usagePct >= 80 ? 'warn' : 'ok'}
        />
        <Metric
          label={
            <span className="flex items-center gap-1.5">
              <Icons.Sparkle size={13} />
              예산 상한 (월)
            </span>
          }
          value={`$${ceilingTotal.toFixed(2)}`}
          delta={`${sites.length}개 사이트 합산 (Lean $5 + …)`}
          bar={Math.min(1, usagePct / 100)}
        />
        <Metric
          label={
            <span className="flex items-center gap-1.5">
              <Icons.Check size={13} />
              남은 예산
            </span>
          }
          value={`$${ceilingRemaining.toFixed(2)}`}
          delta={overrun > 0 ? `초과 $${overrun.toFixed(2)}` : `${(100 - usagePct).toFixed(0)}% 남음`}
          deltaKind={overrun > 0 ? 'err' : 'ok'}
        />
        <Metric
          label={
            <span className="flex items-center gap-1.5">
              <Icons.Warn size={13} />
              Anthropic 잔액
            </span>
          }
          value="—"
          delta="콘솔에서 확인 ↗"
        />
      </section>

      {/* Per-agent spending breakdown */}
      {agentRows.length > 0 && (
        <Card className="mb-3.5">
          <CardHead>
            <div className="text-[13.5px] font-semibold">에이전트별 비용 (30일)</div>
            <Chip kind="ghost">{agentRows.length}개 에이전트</Chip>
            <div className="flex-1" />
            <a
              href="https://console.anthropic.com/settings/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11.5px] text-[color:var(--color-blue)] hover:underline"
            >
              Anthropic 콘솔 ↗
            </a>
          </CardHead>
          <div className="p-3.5">
            <div className="flex flex-col gap-2">
              {agentRows.map((row) => {
                const pct = costTotals.usd > 0 ? (row.usd / costTotals.usd) * 100 : 0
                return (
                  <div key={row.agent} className="flex items-center gap-3 text-[12.5px]">
                    <div className="w-24 font-medium truncate">{row.agent}</div>
                    <div className="flex-1">
                      <ProgressBar
                        segments={[{ value: row.usd, color: 'var(--color-accent)' }]}
                        total={Math.max(0.0001, costTotals.usd)}
                        height={8}
                      />
                    </div>
                    <div className="w-20 text-right font-mono tabular-nums">
                      ${row.usd.toFixed(4)}
                    </div>
                    <div className="w-16 text-right text-[11.5px] text-[color:var(--color-text-3)] tabular-nums">
                      {row.calls} 호출
                    </div>
                    <div className="w-12 text-right text-[11.5px] text-[color:var(--color-text-4)] tabular-nums">
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Per-site budget cards */}
      {sites.length > 0 && (
        <Card className="mb-3.5">
          <CardHead>
            <div className="text-[13.5px] font-semibold">사이트별 예산 현황</div>
            <div className="flex-1" />
            <Link
              href="/portfolio"
              className="text-[11.5px] text-[color:var(--color-text-3)] hover:text-[color:var(--color-text)]"
            >
              포트폴리오 →
            </Link>
          </CardHead>
          <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {sites.map((s) => {
              const c = siteCostMap.get(s.site_id)
              const ceiling = ceilingFor(s)
              const spent = c?.totals.cost_usd ?? 0
              const pct = ceiling > 0 ? (spent / ceiling) * 100 : 0
              const halt = spent >= ceiling
              return (
                <div
                  key={s.site_id}
                  className="p-2.5 rounded-lg border"
                  style={{ borderColor: halt ? 'var(--color-err)' : 'var(--color-line)' }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[12.5px] font-semibold truncate">{s.site_id}</span>
                    <Chip kind={halt ? 'err' : pct >= 80 ? 'warn' : 'ok'}>
                      {halt ? 'halt' : `${pct.toFixed(0)}%`}
                    </Chip>
                  </div>
                  <div className="flex justify-between text-[11.5px] mb-1 tabular-nums font-mono">
                    <span>${spent.toFixed(4)}</span>
                    <span className="text-[color:var(--color-text-3)]">/ ${ceiling.toFixed(2)}</span>
                  </div>
                  <ProgressBar
                    segments={[
                      {
                        value: spent,
                        color: halt ? 'var(--color-err)' : 'var(--color-accent)',
                      },
                    ]}
                    total={ceiling}
                  />
                  <div className="text-[10.5px] text-[color:var(--color-text-4)] mt-1.5">
                    {c?.totals.calls ?? 0} LLM 호출 · 프로파일 {(s.budget as { profile?: string })?.profile ?? 'lean'}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

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
