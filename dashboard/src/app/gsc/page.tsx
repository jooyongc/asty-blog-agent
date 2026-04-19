'use client'

import { useState } from 'react'
import { Card, CardHead, Chip, Metric, Segmented, Button } from '@/components/primitives'
import { Icons } from '@/components/icons'

// Phase 10 — Google Search Console integration.
// This view renders against mock data until the site-repo's /api/admin/gsc/export
// endpoint is wired (Phase 10-1). Adding the endpoint later requires no changes here
// beyond swapping the data source.

type Row = {
  kw: string
  pos: number
  clicks: number
  impr: number
  ctr: number
  status: 'striking' | 'top' | 'opportunity'
}

const ROWS: Row[] = [
  { kw: 'seoul cabin retreat winter', pos: 12, clicks: 42, impr: 1240, ctr: 3.4, status: 'striking' },
  { kw: 'serviced residence songpa', pos: 8, clicks: 118, impr: 2310, ctr: 5.1, status: 'striking' },
  { kw: 'k-beauty clinic gangnam english', pos: 4, clicks: 204, impr: 1890, ctr: 10.8, status: 'top' },
  { kw: 'samsung seoul hospital international', pos: 18, clicks: 12, impr: 980, ctr: 1.2, status: 'striking' },
  { kw: 'medical tourism seoul 2 days', pos: 24, clicks: 3, impr: 410, ctr: 0.7, status: 'opportunity' },
  { kw: 'jamsil 24 hour food', pos: 9, clicks: 66, impr: 1620, ctr: 4.1, status: 'striking' },
]

type Filter = 'all' | 'striking' | 'top'

export default function GSCPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const rows = ROWS.filter((r) =>
    filter === 'all' ? true : filter === 'top' ? r.status === 'top' : r.status === 'striking'
  )

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">
          Search Console{' '}
          <Chip kind="ghost" className="ml-1.5 align-middle">
            Phase 10
          </Chip>
        </h1>
        <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
          순위 8–20의 striking-distance 키워드는 다음 사이클에서 seo-researcher에게 자동 전달됩니다.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-4">
        <Metric label="총 클릭 (28일)" value="1,284" delta="+18% 전월" deltaKind="ok" />
        <Metric label="노출" value="24.6k" delta="GSC 프록시" />
        <Metric label="평균 순위" value="14.2" delta="전주 대비 −2.1" deltaKind="ok" />
        <Metric label="Striking 키워드" value="38" delta="다음 작성에 반영" />
      </section>

      <Card>
        <CardHead>
          <div className="text-[13.5px] font-semibold">상위 기회</div>
          <div className="flex-1" />
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: '전체' },
              { value: 'striking', label: 'Striking' },
              { value: 'top', label: 'Top 10' },
            ]}
          />
        </CardHead>
        <table className="w-full text-[13px]">
          <thead className="bg-[color:var(--color-bg-subtle)] text-[11.5px] uppercase tracking-wider text-[color:var(--color-text-3)]">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">키워드</th>
              <th className="text-left px-4 py-2.5 font-medium">순위</th>
              <th className="text-left px-4 py-2.5 font-medium">클릭</th>
              <th className="text-left px-4 py-2.5 font-medium">노출</th>
              <th className="text-left px-4 py-2.5 font-medium">CTR</th>
              <th className="text-left px-4 py-2.5 font-medium">상태</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.kw}
                className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-bg-subtle)]"
              >
                <td className="px-4 py-3 font-mono text-[12.5px]">{r.kw}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{r.pos}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{r.clicks}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{r.impr.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{r.ctr}%</td>
                <td className="px-4 py-3">
                  <Chip kind={r.status === 'top' ? 'ok' : r.status === 'striking' ? 'warn' : 'ghost'} dot>
                    {r.status}
                  </Chip>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" disabled>
                    <Icons.Plus size={11} /> 큐에 추가
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div
        className="mt-4 px-3 py-2 rounded-md text-[11.5px]"
        style={{
          background: 'var(--color-warn-soft)',
          color: 'var(--color-warn)',
        }}
      >
        ⓘ Phase 10-1: GSC 서비스 계정 연동 후 실데이터로 전환됩니다. 현재는 목업.
      </div>
    </div>
  )
}
