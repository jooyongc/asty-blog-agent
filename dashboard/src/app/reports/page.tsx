import { listReports } from '@/lib/sites'
import Link from 'next/link'
import { Card, CardHead, Chip } from '@/components/primitives'
import { Icons } from '@/components/icons'

export const dynamic = 'force-dynamic'

type ReportKind = 'scoring' | 'freshness' | 'citation' | 'other'
function classify(name: string): ReportKind {
  if (name.startsWith('freshness-')) return 'freshness'
  if (name.startsWith('citation-') || name.startsWith('ai-citation-')) return 'citation'
  if (name.startsWith('scoring-') || name.startsWith('weekly-')) return 'scoring'
  return 'other'
}
const KIND_LABEL: Record<ReportKind, string> = {
  scoring: '성과 점수',
  freshness: '신선도 점검',
  citation: 'AI 인용 감사',
  other: '기타',
}
const KIND_CHIP: Record<ReportKind, 'ok' | 'warn' | 'err' | 'ghost'> = {
  scoring: 'ok',
  freshness: 'warn',
  citation: 'ok',
  other: 'ghost',
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString('ko', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ReportsPage() {
  const reports = listReports()
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">리포트</h1>
        <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
          주간 성과 / 신선도 / AI 인용 감사 리포트가 모두 여기 모입니다.
        </p>
        <div className="mt-3 text-[12px] text-[color:var(--color-text-3)] grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="p-2.5 rounded-md bg-[color:var(--color-bg-subtle)]">
            <div className="font-semibold text-[color:var(--color-text-2)] mb-0.5">성과 점수</div>
            <code className="font-mono text-[11px]">npx tsx scripts/score-posts.ts</code>
          </div>
          <div className="p-2.5 rounded-md bg-[color:var(--color-bg-subtle)]">
            <div className="font-semibold text-[color:var(--color-text-2)] mb-0.5">신선도 점검</div>
            <code className="font-mono text-[11px]">npx tsx scripts/check-freshness.ts</code>
          </div>
          <div className="p-2.5 rounded-md bg-[color:var(--color-bg-subtle)]">
            <div className="font-semibold text-[color:var(--color-text-2)] mb-0.5">AI 인용 감사</div>
            <span className="text-[10.5px] text-[color:var(--color-text-4)]">곧 추가 (수동 → 자동)</span>
          </div>
        </div>
      </header>

      {reports.length === 0 ? (
        <Card>
          <div className="p-10 text-center text-[13px] text-[color:var(--color-text-3)]">
            <Icons.Clock size={22} />
            <div className="mt-2">아직 리포트가 없습니다.</div>
            <div className="mt-1 text-[11.5px]">
              에이전트 레포에서{' '}
              <code className="font-mono bg-[color:var(--color-bg-muted)] px-1 rounded">
                npx tsx scripts/score-posts.ts
              </code>{' '}
              실행
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHead>
            <div className="text-[13.5px] font-semibold">생성된 리포트</div>
            <div className="flex-1" />
            <span className="text-[11.5px] text-[color:var(--color-text-3)]">
              {reports.length}건
            </span>
          </CardHead>
          <ul className="divide-y divide-[color:var(--color-line)]">
            {reports.map((r) => {
              const kind = classify(r.name)
              return (
                <li key={r.path}>
                  <Link
                    href={`/reports/${encodeURIComponent(r.name)}`}
                    className="flex items-center gap-2 px-5 py-3 hover:bg-[color:var(--color-bg-subtle)] transition"
                  >
                    <Chip kind={KIND_CHIP[kind]} dot={kind === 'freshness'}>
                      {KIND_LABEL[kind]}
                    </Chip>
                    <span className="font-mono text-[13px] truncate">{r.name}</span>
                    <div className="flex-1" />
                    <span className="text-[11.5px] text-[color:var(--color-text-3)]">
                      {fmtDate(r.mtime)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
