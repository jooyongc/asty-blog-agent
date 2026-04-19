'use client'

import { useEffect, useState } from 'react'
import { Button, Chip, Card, CardHead } from '@/components/primitives'
import { Icons } from '@/components/icons'

type Run = {
  id: number
  status: string
  conclusion: string | null
  event: string
  created_at: string
  updated_at: string
  html_url: string
  title: string
}

export function RunButton() {
  const [loading, setLoading] = useState(false)
  const [limit, setLimit] = useState(3)
  const [dryRun, setDryRun] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string; url?: string } | null>(null)
  const [runs, setRuns] = useState<Run[] | null>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)

  async function loadRuns() {
    const res = await fetch('/api/pipeline/trigger')
    const j = await res.json() as { runs?: Run[]; configured?: boolean; error?: string }
    setConfigured(j.configured ?? false)
    setRuns(j.runs ?? [])
  }

  useEffect(() => { void loadRuns() }, [])

  async function trigger() {
    setLoading(true); setMsg(null)
    try {
      const res = await fetch('/api/pipeline/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit, dry_run: dryRun }),
      })
      const j = await res.json() as { message?: string; runs_url?: string; error?: string; detail?: string }
      if (res.ok) {
        setMsg({ kind: 'ok', text: j.message ?? '요청 완료', url: j.runs_url })
        setTimeout(loadRuns, 3000)
      } else {
        setMsg({ kind: 'err', text: `${j.error ?? 'Failed'} ${j.detail ?? ''}`.slice(0, 200) })
      }
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHead>
        <Icons.Play size={14} />
        <div className="text-[13.5px] font-semibold">지금 실행</div>
        <div className="flex-1" />
        {configured === false && <Chip kind="warn">GITHUB_TOKEN 미설정</Chip>}
        {configured === true && <Chip kind="ok" dot>GitHub Actions 연결됨</Chip>}
      </CardHead>
      <div className="p-3.5 flex flex-col gap-3">
        <div className="flex gap-2 items-center flex-wrap">
          <label className="text-[12px] text-[color:var(--color-text-3)]">토픽 개수</label>
          <input
            type="number"
            min={1}
            max={5}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Math.min(5, Number(e.target.value))))}
            className="w-16 border rounded px-2 py-1 text-[12px] tabular-nums"
            style={{ borderColor: 'var(--color-line-2)' }}
          />
          <label className="text-[12px] flex items-center gap-1.5">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            <span>드라이런 (Writer까지만)</span>
          </label>
          <div className="flex-1" />
          <Button variant="accent" onClick={trigger} disabled={loading || configured === false}>
            <Icons.Play size={12} /> {loading ? '요청 중…' : 'Weekly 파이프라인 실행'}
          </Button>
          <Button size="sm" onClick={loadRuns}>
            <Icons.Refresh size={11} /> 상태 새로고침
          </Button>
        </div>
        {msg && (
          <div
            className="px-3 py-2 rounded text-[12px]"
            style={{
              background: msg.kind === 'ok' ? 'var(--color-ok-soft)' : 'var(--color-err-soft)',
              color: msg.kind === 'ok' ? 'var(--color-ok)' : 'var(--color-err)',
            }}
          >
            {msg.kind === 'ok' ? '✓ ' : '⚠ '}{msg.text}
            {msg.url && (
              <>
                {' '}
                <a href={msg.url} target="_blank" rel="noopener noreferrer" className="underline">
                  실행 상태 보기 ↗
                </a>
              </>
            )}
          </div>
        )}
        {runs && runs.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-text-4)] mb-1.5">
              최근 실행 (최대 5건)
            </div>
            <div className="flex flex-col gap-1">
              {runs.map((r) => (
                <a
                  key={r.id}
                  href={r.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-2 items-center p-2 rounded hover:bg-[color:var(--color-bg-subtle)] text-[12px]"
                >
                  <Chip
                    kind={
                      r.status === 'completed'
                        ? (r.conclusion === 'success' ? 'ok' : 'err')
                        : r.status === 'in_progress'
                        ? 'warn'
                        : 'ghost'
                    }
                    dot
                  >
                    {r.status}{r.conclusion ? ` · ${r.conclusion}` : ''}
                  </Chip>
                  <span className="text-[color:var(--color-text-3)] flex-1 truncate">{r.title}</span>
                  <span className="text-[11px] text-[color:var(--color-text-4)] tabular-nums">
                    {new Date(r.updated_at).toLocaleString('ko')}
                  </span>
                  <span className="text-[10.5px] text-[color:var(--color-text-4)]">
                    {r.event}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
        {configured === false && (
          <div
            className="px-3 py-2.5 rounded text-[11.5px]"
            style={{ background: 'var(--color-warn-soft)', color: 'var(--color-warn)' }}
          >
            ⓘ Vercel 대시보드 Settings → Environment Variables에 <code>GITHUB_TOKEN</code>(PAT with workflow scope)과 <code>GITHUB_REPO</code>(예: jooyongc/asty-blog-agent)를 추가하고 재배포하면 활성화됩니다.
          </div>
        )}
      </div>
    </Card>
  )
}
