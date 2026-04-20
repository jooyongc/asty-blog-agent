import { listSites } from '@/lib/sites'
import { fetchQueue, type QueueItem } from '@/lib/queue-client'
import { AgentAvatar, Card, CardHead, Chip, Metric } from '@/components/primitives'
import { Icons } from '@/components/icons'
import { QueueActions } from './queue-actions'

export const dynamic = 'force-dynamic'

type AggregatedQueue = {
  site_id: string
  items: QueueItem[]
}

const VERIFICATION_CHIP: Record<string, 'ok' | 'warn' | 'err' | 'ghost'> = {
  verified: 'ok',
  partial: 'warn',
  blocked: 'err',
  skipped: 'ghost',
}

const STATUS_CHIP: Record<string, 'ok' | 'warn' | 'err' | 'ghost'> = {
  awaiting_approval: 'warn',
  approved: 'ok',
  rejected: 'err',
  published: 'ok',
  expired: 'ghost',
}

const PIPELINE_STAGES: Array<'writer' | 'verifier' | 'translate' | 'packager' | 'linker'> = [
  'writer',
  'verifier',
  'translate',
  'packager',
  'linker',
]

export default async function QueuePage() {
  const sites = await listSites()
  const byCount: Record<string, number> = {}
  const queues: AggregatedQueue[] = []
  let totalAwaiting = 0
  let totalApproved = 0
  let totalBlocked = 0
  let totalBudget = 0
  let totalSpent = 0

  for (const s of sites) {
    const q = await fetchQueue(s)
    if (!q) continue
    queues.push({ site_id: s.site_id, items: q.publish_queue })
    for (const it of q.publish_queue) {
      byCount[it.status] = (byCount[it.status] ?? 0) + 1
      if (it.status === 'awaiting_approval') totalAwaiting++
      if (it.status === 'approved') totalApproved++
      if (it.verification_status === 'blocked') totalBlocked++
    }
    totalSpent += q.budget.month_to_date_usd
    totalBudget += 5 // Lean profile ceiling — surfaced via config in a later pass
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">
            승인 대기열{' '}
            <Chip kind="ok" dot className="ml-1.5 align-middle">
              원클릭 승인
            </Chip>
          </h1>
          <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
            Writer → Verifier → Translate → Packager → Linker 까지 완료된 항목. 승인 1회로 3개 언어 발행 + 그래프 추출이 트리거됩니다.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-4">
        <Metric label="승인 대기" value={totalAwaiting} deltaKind={totalAwaiting > 0 ? 'warn' : undefined} />
        <Metric label="차단 (Verifier)" value={totalBlocked} delta="모순 주장 검출" deltaKind={totalBlocked > 0 ? 'warn' : undefined} />
        <Metric label="승인 완료" value={totalApproved} deltaKind="ok" />
        <Metric
          label="월 누적 비용"
          value={`$${totalSpent.toFixed(2)}`}
          unit={`/ $${totalBudget.toFixed(0)}`}
          bar={totalBudget > 0 ? totalSpent / totalBudget : 0}
          delta="Lean 프로파일"
        />
      </section>

      {queues.length === 0 && (
        <Card>
          <div className="p-10 text-center text-[13px] text-[color:var(--color-text-3)]">
            큐 데이터를 불러올 수 없습니다. 사이트 API 키와 마이그레이션을 확인하세요.
          </div>
        </Card>
      )}

      {queues.map((q) => (
        <section key={q.site_id} className="mb-8">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="text-[13px] font-semibold">{q.site_id}</div>
            <Chip kind="ghost">{q.items.length}건</Chip>
          </div>
          {q.items.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-[12.5px] text-[color:var(--color-text-3)]">
                대기 중인 항목이 없습니다. 다음 주간 사이클 실행 시 생성됩니다.
              </div>
            </Card>
          ) : (
            q.items.map((it) => {
              const vkind = VERIFICATION_CHIP[it.verification_status ?? 'skipped'] ?? 'ghost'
              const skind = STATUS_CHIP[it.status] ?? 'ghost'
              const isBlocked = it.verification_status === 'blocked'
              const isPending = it.status === 'awaiting_approval'
              const report = (it.verification_report ?? {}) as { unsupported?: number; contradicted?: number }
              const links = (it.translations_preview as unknown as { internal_links?: number } | null)?.internal_links ?? 0

              return (
                <Card
                  key={it.id}
                  className="mb-3"
                  {...(isBlocked
                    ? { style: { borderColor: 'var(--color-err)' } }
                    : it.status === 'approved'
                    ? { style: { borderColor: 'var(--color-ok)' } }
                    : {})}
                >
                  <div className="grid grid-cols-[1fr_auto] gap-0">
                    <div className="p-4 min-w-0">
                      <div className="flex gap-1.5 items-center mb-1.5 flex-wrap">
                        <Chip kind={vkind} dot>
                          {it.verification_status ?? 'skipped'}
                        </Chip>
                        {it.quality_score !== null && (
                          <Chip kind="ghost">품질 {it.quality_score}/100</Chip>
                        )}
                        {links > 0 && <Chip kind="ghost">내부링크 {links}개</Chip>}
                        {report.unsupported ? <Chip kind="warn">미검증 {report.unsupported}</Chip> : null}
                        {report.contradicted ? <Chip kind="err">모순 {report.contradicted}</Chip> : null}
                        <Chip kind={skind}>{it.status}</Chip>
                      </div>
                      <div className="text-[14.5px] font-semibold mb-1 truncate">{it.slug}</div>
                      <div className="text-[12px] text-[color:var(--color-text-3)]">
                        {it.category && <span className="mr-3">카테고리: {it.category}</span>}
                        {it.scheduled_at && (
                          <span>
                            예약 {new Date(it.scheduled_at).toLocaleString('ko', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      {isBlocked && (
                        <div
                          className="mt-2 px-2.5 py-1.5 rounded-md text-[12px] flex items-center gap-1.5"
                          style={{
                            background: 'var(--color-err-soft)',
                            color: 'var(--color-err)',
                          }}
                        >
                          <Icons.Warn size={12} /> 모순 주장 검출 — 사람 검토 필요
                        </div>
                      )}
                      {it.rejection_reason && (
                        <div
                          className="mt-2 px-2.5 py-1.5 rounded-md text-[12px]"
                          style={{
                            background: 'var(--color-bg-muted)',
                            color: 'var(--color-text-2)',
                          }}
                        >
                          반려 사유: {it.rejection_reason}
                        </div>
                      )}
                      <div className="flex gap-1.5 mt-2.5 items-center text-[11px] text-[color:var(--color-text-3)]">
                        {PIPELINE_STAGES.map((a, i) => {
                          const blockedAt = isBlocked && a === 'verifier'
                          return (
                            <div key={a} className="flex items-center gap-1">
                              <div className="flex items-center gap-0.5">
                                <AgentAvatar agent={a} size={16} />
                                <Icons.Check
                                  size={11}
                                  style={{
                                    color: blockedAt ? 'var(--color-err)' : 'var(--color-ok)',
                                  }}
                                />
                              </div>
                              {i < PIPELINE_STAGES.length - 1 && (
                                <span className="text-[color:var(--color-line-3)]">→</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div
                      className="p-3 flex flex-col gap-1.5 min-w-[180px] justify-center"
                      style={{ borderLeft: '1px solid var(--color-line)' }}
                    >
                      <QueueActions
                        siteId={q.site_id}
                        slug={it.slug}
                        isPending={isPending}
                        isBlocked={isBlocked}
                        status={it.status}
                      />
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </section>
      ))}
    </div>
  )
}
