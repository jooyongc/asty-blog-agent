import { listSites } from '@/lib/sites'
import { fetchQueue } from '@/lib/queue-client'
import { fetchPortfolioMatrix } from '@/lib/portfolio-client'
import { Card, CardHead, Chip, ProgressBar } from '@/components/primitives'
import { Icons } from '@/components/icons'

export const dynamic = 'force-dynamic'

const PROFILE_CEILING: Record<string, number> = {
  lean: 5.0,
  standard: 5.5,
  full: 6.5,
}

type SiteStat = {
  site_id: string
  site_url: string
  profile: string
  ceiling: number
  spent: number
  calls: number
  awaiting: number
  approved: number
  published: number
  halt: boolean
}

export default async function PortfolioPage() {
  const sites = listSites()
  const stats: SiteStat[] = []

  for (const s of sites) {
    const q = await fetchQueue(s)
    const profile = (s.budget as { profile?: string } | undefined)?.profile ?? 'lean'
    const ceiling = PROFILE_CEILING[profile] ?? 5
    const spent = q?.budget.month_to_date_usd ?? 0
    const calls = q?.budget.calls_this_month ?? 0
    const awaiting = q?.publish_queue.filter((i) => i.status === 'awaiting_approval').length ?? 0
    const approved = q?.publish_queue.filter((i) => i.status === 'approved').length ?? 0
    const published = q?.publish_queue.filter((i) => i.status === 'published').length ?? 0
    stats.push({
      site_id: s.site_id,
      site_url: s.site_url,
      profile,
      ceiling,
      spent,
      calls,
      awaiting,
      approved,
      published,
      halt: spent >= ceiling,
    })
  }

  // Topic×Site matrix — real data from graph_entities rolled up by canonical_name.
  // Returns empty until extract-entities.ts has been run post-publish.
  const matrixData = sites.length > 0 ? await fetchPortfolioMatrix(sites[0], 12) : null
  const matrixSites = stats.map((s) => s.site_id)
  const matrixRows: Array<{ entity: string; type: string; counts: number[]; total: number }> =
    (matrixData?.entities ?? []).map((e) => ({
      entity: e.canonical_name,
      type: e.type,
      counts: matrixSites.map((sid) => e.per_site[sid] ?? 0),
      total: e.total,
    }))

  const totalSpent = stats.reduce((n, s) => n + s.spent, 0)
  const totalCeiling = stats.reduce((n, s) => n + s.ceiling, 0)

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">
            포트폴리오{' '}
            <Chip kind="ghost" className="ml-1.5 align-middle">
              Phase 12
            </Chip>
          </h1>
          <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
            사이트 {stats.length}개 · Strategist가 사이트 간 주제 충돌을 방지하고 고성과 패턴을 전파합니다.
          </p>
        </div>
      </header>

      {/* Site budget cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
        {stats.map((s) => (
          <Card key={s.site_id}>
            <div className="p-3.5">
              <div className="flex gap-2 items-center mb-2">
                <div
                  className="w-8 h-8 rounded-md font-semibold flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #2f6f4e, #b66f1c)' }}
                >
                  {s.site_id[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate">{s.site_id}</div>
                  <div className="font-mono text-[11px] text-[color:var(--color-text-3)] truncate">
                    {s.site_url.replace(/^https?:\/\//, '')}
                  </div>
                </div>
                <Chip kind={s.profile === 'lean' ? 'ok' : s.profile === 'standard' ? 'warn' : 'err'}>
                  {s.profile}
                </Chip>
              </div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-[color:var(--color-text-3)]">월 사용량</span>
                <span
                  className="font-mono font-medium tabular-nums"
                  style={{ color: s.halt ? 'var(--color-err)' : 'var(--color-text)' }}
                >
                  ${s.spent.toFixed(2)} / ${s.ceiling.toFixed(2)}
                </span>
              </div>
              <ProgressBar
                segments={[{ value: s.spent, color: s.halt ? 'var(--color-err)' : 'var(--color-accent)' }]}
                total={s.ceiling}
              />
              {s.halt && (
                <div
                  className="mt-2 px-2.5 py-1.5 rounded-md text-[11.5px] flex gap-1.5 items-center"
                  style={{ background: 'var(--color-err-soft)', color: 'var(--color-err)' }}
                >
                  <Icons.Warn size={11} /> budget-guard가 사이클을 중단함
                </div>
              )}
              <div
                className="flex gap-4 mt-3 pt-2.5 text-[12px]"
                style={{ borderTop: '1px solid var(--color-line)' }}
              >
                <div>
                  <div className="text-[10.5px] text-[color:var(--color-text-3)]">대기</div>
                  <div className="font-medium tabular-nums">{s.awaiting}</div>
                </div>
                <div>
                  <div className="text-[10.5px] text-[color:var(--color-text-3)]">승인</div>
                  <div className="font-medium tabular-nums">{s.approved}</div>
                </div>
                <div>
                  <div className="text-[10.5px] text-[color:var(--color-text-3)]">발행</div>
                  <div className="font-medium tabular-nums">{s.published}</div>
                </div>
                <div className="ml-auto">
                  <div className="text-[10.5px] text-[color:var(--color-text-3)]">LLM 호출</div>
                  <div className="font-mono tabular-nums">{s.calls}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Card className="mb-4">
        <CardHead>
          <div className="text-[13.5px] font-semibold">통합 예산</div>
          <div className="flex-1" />
          <Chip kind="ghost">월 누적</Chip>
        </CardHead>
        <div className="p-[18px] flex gap-6 items-center">
          <div className="text-[28px] font-semibold tabular-nums">${totalSpent.toFixed(2)}</div>
          <div className="text-[color:var(--color-text-3)] text-[12px]">
            / ${totalCeiling.toFixed(2)} 통합 상한
          </div>
          <div className="flex-1">
            <ProgressBar
              segments={[{ value: totalSpent, color: 'var(--color-accent)' }]}
              total={Math.max(0.01, totalCeiling)}
              height={8}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHead>
          <div className="text-[13.5px] font-semibold">주제 × 사이트 매트릭스</div>
          <Chip kind={matrixRows.length > 0 ? 'ok' : 'ghost'} dot>
            {matrixRows.length > 0 ? 'Live' : 'Empty'}
          </Chip>
          <div className="flex-1" />
          <span className="text-[11px] text-[color:var(--color-text-3)]">
            {matrixRows.length > 0
              ? `graph_entities 상위 ${matrixRows.length}개`
              : 'extract-entities.ts 실행 후 채워짐'}
          </span>
        </CardHead>
        {matrixRows.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-[color:var(--color-text-3)] text-[13px] mb-2">
              graph_entities에 데이터가 아직 없습니다.
            </div>
            <div className="text-[color:var(--color-text-4)] text-[11.5px] max-w-md mx-auto leading-relaxed">
              post-publish 훅인{' '}
              <code className="font-mono px-1 bg-[color:var(--color-bg-muted)] rounded">
                npx tsx scripts/extract-entities.ts &lt;slug&gt;
              </code>
              가 실행되면 엔티티가 쌓이고 이 표에 자동으로 반영됩니다. Lean 프로파일은 격주로 실행되므로 2주 후 의미있는 데이터.
            </div>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-[color:var(--color-bg-subtle)] text-[11.5px] uppercase tracking-wider text-[color:var(--color-text-3)]">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">엔티티 / 클러스터</th>
                <th className="text-left px-4 py-2.5 font-medium">유형</th>
                {stats.map((s) => (
                  <th key={s.site_id} className="text-center px-4 py-2.5 font-medium">
                    {s.site_id}
                  </th>
                ))}
                <th className="text-center px-4 py-2.5 font-medium">주담당</th>
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((r) => {
                const max = Math.max(...r.counts)
                const leadIdx = max > 0 ? r.counts.indexOf(max) : -1
                return (
                  <tr
                    key={`${r.type}-${r.entity}`}
                    className="border-t border-[color:var(--color-line)]"
                  >
                    <td className="px-4 py-3 font-medium">{r.entity}</td>
                    <td className="px-4 py-3 text-[11px] text-[color:var(--color-text-3)]">
                      {r.type}
                    </td>
                    {r.counts.map((v, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        <div
                          className="inline-flex items-center justify-center w-8 h-6 rounded-md font-mono font-medium text-[12px]"
                          style={{
                            background:
                              v === 0
                                ? 'transparent'
                                : `rgba(47, 111, 78, ${Math.min(1, 0.15 + v * 0.08)})`,
                            color:
                              v === 0 ? 'var(--color-text-4)' : 'var(--color-accent-ink)',
                          }}
                        >
                          {v}
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      {leadIdx >= 0 && stats[leadIdx] && (
                        <Chip kind="ok">{stats[leadIdx].site_id}</Chip>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
