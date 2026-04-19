'use client'

import { useEffect, useState } from 'react'
import { Card, CardHead, Chip, Metric, Segmented } from '@/components/primitives'
import { Icons } from '@/components/icons'

type Row = {
  query: string
  page: string
  clicks: number
  impressions: number
  avg_position: number
  avg_ctr: number
}

type Resp = {
  site_id: string
  window_days: number
  mode: string
  rows: Row[]
  generated_at: string
}

type Mode = 'striking' | 'top'

const SITE_ID = 'asty-cabin'

export default function GSCPage() {
  const [mode, setMode] = useState<Mode>('striking')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Resp | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/gsc?site_id=${SITE_ID}&mode=${mode}&window_days=28&limit=50`)
      .then(async (r) => {
        const text = await r.text()
        if (cancelled) return
        if (!r.ok) {
          setError(`HTTP ${r.status}: ${text.slice(0, 200)}`)
          setData(null)
        } else {
          setData(JSON.parse(text) as Resp)
        }
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [mode])

  const rows = data?.rows ?? []
  const totalClicks = rows.reduce((n, r) => n + r.clicks, 0)
  const totalImpressions = rows.reduce((n, r) => n + r.impressions, 0)
  const avgPosition =
    rows.length > 0
      ? (rows.reduce((n, r) => n + r.avg_position, 0) / rows.length).toFixed(1)
      : '—'

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">
          Search Console{' '}
          <Chip kind={rows.length > 0 ? 'ok' : 'ghost'} dot className="ml-1.5 align-middle">
            {rows.length > 0 ? 'Live' : 'Empty'}
          </Chip>
        </h1>
        <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
          순위 8–20의 striking-distance 키워드는 다음 사이클에서 seo-researcher에게 자동 전달됩니다.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-4">
        <Metric
          label="총 클릭 (28일)"
          value={rows.length > 0 ? totalClicks.toLocaleString() : '—'}
          delta={rows.length > 0 ? `${mode} 상위 ${rows.length}개 합산` : 'GSC 데이터 없음'}
        />
        <Metric
          label="노출"
          value={rows.length > 0 ? totalImpressions.toLocaleString() : '—'}
        />
        <Metric label="평균 순위" value={avgPosition} />
        <Metric
          label="매칭 키워드"
          value={rows.length}
          delta={mode === 'striking' ? '순위 8–20' : '순위 1–7'}
        />
      </section>

      <Card>
        <CardHead>
          <div className="text-[13.5px] font-semibold">
            {mode === 'striking' ? 'Striking-distance' : 'Top 10'} 키워드
          </div>
          <div className="flex-1" />
          <Segmented<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { value: 'striking', label: 'Striking' },
              { value: 'top', label: 'Top 10' },
            ]}
          />
        </CardHead>
        {loading ? (
          <div className="p-8 text-center text-[13px] text-[color:var(--color-text-3)]">
            GSC 데이터 로딩 중…
          </div>
        ) : error ? (
          <div
            className="m-3 px-3 py-2.5 rounded-md text-[12px]"
            style={{ background: 'var(--color-err-soft)', color: 'var(--color-err)' }}
          >
            ⚠ {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-[color:var(--color-text-3)] text-[13px] mb-2">
              GSC 데이터가 아직 없습니다.
            </div>
            <div className="text-[color:var(--color-text-4)] text-[11.5px] max-w-md mx-auto leading-relaxed">
              <code className="font-mono px-1 bg-[color:var(--color-bg-muted)] rounded">
                GSC_SERVICE_ACCOUNT_JSON
              </code>{' '}
              +{' '}
              <code className="font-mono px-1 bg-[color:var(--color-bg-muted)] rounded">
                GSC_SITE_URL
              </code>
              을 사이트 Vercel env에 추가하고{' '}
              <code className="font-mono px-1 bg-[color:var(--color-bg-muted)] rounded">
                npx tsx scripts/pull-gsc.ts
              </code>
              로 첫 수집을 돌리면 이 표가 자동으로 채워집니다.
            </div>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-[color:var(--color-bg-subtle)] text-[11.5px] uppercase tracking-wider text-[color:var(--color-text-3)]">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">키워드</th>
                <th className="text-left px-4 py-2.5 font-medium">페이지</th>
                <th className="text-right px-4 py-2.5 font-medium">순위</th>
                <th className="text-right px-4 py-2.5 font-medium">클릭</th>
                <th className="text-right px-4 py-2.5 font-medium">노출</th>
                <th className="text-right px-4 py-2.5 font-medium">CTR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={`${r.query}-${r.page}`}
                  className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-bg-subtle)]"
                >
                  <td className="px-4 py-3 font-mono text-[12.5px]">{r.query}</td>
                  <td className="px-4 py-3 text-[11px] text-[color:var(--color-text-3)] truncate max-w-[240px]">
                    {r.page.replace(/^https?:\/\/[^/]+/, '')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {r.avg_position.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{r.clicks}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {r.impressions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {(r.avg_ctr * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {data && (
        <div className="text-[11px] text-[color:var(--color-text-3)] mt-3 text-right tabular-nums">
          생성: {new Date(data.generated_at).toLocaleString('ko')} · 윈도우 {data.window_days}일
        </div>
      )}

      <div className="mt-3.5">
        <Icons.Warn size={10} />{' '}
        <span className="text-[11px] text-[color:var(--color-text-3)]">
          Note: GSC는 집계 결과 반영에 2–3일 지연이 있습니다.
        </span>
      </div>
    </div>
  )
}
