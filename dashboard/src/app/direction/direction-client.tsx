'use client'

import { useMemo, useState } from 'react'
import { Card, CardHead, Chip, Button, AgentAvatar } from '@/components/primitives'
import { Icons } from '@/components/icons'
import {
  CATEGORY_LABEL,
  orderedTemplates,
  type DirectionCategory,
  type DirectionTemplate,
} from '@/lib/direction-templates'

type Proposal = {
  rank: number
  title: string
  category: string
  rationale: string
  primary_keyword_hint?: string
  seo_score: number
  striking_distance_hit: boolean
}

type DirectorResponse = {
  site_id: string
  direction_text: string
  generated_at: string
  proposals: Proposal[]
  meta: {
    model: string
    input_tokens: number
    output_tokens: number
    cost_usd: number
    context_used: {
      recent_titles: number
      gsc_striking: number
      recent_feedback: number
    }
  }
}

type VoteKind = 'up' | 'down' | 'saving' | 'saved' | 'error' | null
type VoteState = Record<number, VoteKind>

const CATEGORY_OPTIONS: Array<DirectionCategory | 'all'> = [
  'all',
  'seasonal',
  'food',
  'transport',
  'practical',
  'festival',
  'medical',
  'family',
  'corporate',
]

type DirectionClientProps = {
  siteId: string
  siteLabel: string
}

export default function DirectionClient({ siteId, siteLabel }: DirectionClientProps) {
  const [input, setInput] = useState(
    'ASTY Cabin에 장기 체류 중인 외국인 게스트를 대상으로, 이번 주는 동네에서 반복해서 갈 수 있는 식당 루틴을 중심으로 가자. 가격대별, 한식·아시안·서양식 믹스, 배달 가능 여부까지 정리.',
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<DirectorResponse | null>(null)
  const [votes, setVotes] = useState<VoteState>({})
  const [activeCat, setActiveCat] = useState<DirectionCategory | 'all'>('all')
  const [templatesOpen, setTemplatesOpen] = useState(true)
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)

  const templates = useMemo(() => orderedTemplates(), [])
  const filteredTemplates = useMemo(
    () => (activeCat === 'all' ? templates : templates.filter((t) => t.category === activeCat)),
    [templates, activeCat],
  )
  const currentMonth = new Date().getMonth() + 1

  function applyTemplate(t: DirectionTemplate) {
    setInput(t.text.slice(0, 500))
    setActiveTemplateId(t.id)
  }

  async function generate() {
    setLoading(true)
    setError(null)
    setResponse(null)
    setVotes({})
    try {
      const res = await fetch('/api/direction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: siteId, direction_text: input }),
      })
      const text = await res.text()
      if (!res.ok) {
        setError(`HTTP ${res.status}: ${text.slice(0, 300)}`)
        return
      }
      const json = JSON.parse(text) as DirectorResponse
      setResponse(json)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function vote(rank: number, v: 'up' | 'down') {
    if (!response) return
    const proposal = response.proposals.find((x) => x.rank === rank)
    if (!proposal) return

    setVotes((p) => ({ ...p, [rank]: 'saving' }))

    const feedbackBody = {
      site_id: siteId,
      agent: 'director',
      target_kind: 'topic_proposal',
      target_ref: `${response.generated_at}#${rank}`,
      rating: v === 'up' ? 1 : -1,
      reason: proposal.title,
      context: {
        rank: proposal.rank,
        seo_score: proposal.seo_score,
        category: proposal.category,
        rationale: proposal.rationale,
        striking_distance_hit: proposal.striking_distance_hit,
      },
    }

    const calls: Array<Promise<Response>> = [
      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackBody),
      }),
    ]

    // 채택(up) => also persist to topic_queue so the weekly pipeline sees it
    if (v === 'up') {
      calls.push(
        fetch('/api/topic-select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site_id: siteId,
            title: proposal.title,
            category: proposal.category,
            rationale: proposal.rationale,
            seo_score: proposal.seo_score,
            primary_keyword_hint: proposal.primary_keyword_hint,
            source_direction: response.direction_text,
            status: 'approved',
          }),
        }),
      )
    }

    try {
      const results = await Promise.all(calls)
      const allOk = results.every((r) => r.ok)
      setVotes((p) => ({ ...p, [rank]: allOk ? (v === 'up' ? 'saved' : 'down') : 'error' }))
      if (!allOk) {
        const firstFail = results.find((r) => !r.ok)
        if (firstFail) {
          const detail = await firstFail.text().catch(() => '')
          setError(`저장 실패 (HTTP ${firstFail.status}): ${detail.slice(0, 200)}`)
        }
      }
    } catch (e) {
      setVotes((p) => ({ ...p, [rank]: 'error' }))
      setError((e as Error).message)
    }
  }

  const proposals = response?.proposals ?? []

  return (
    <div className="max-w-[1100px]">
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">
          디렉션{' '}
          <Chip kind="ok" dot className="ml-1.5 align-middle">
            {siteLabel}
          </Chip>
        </h1>
        <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
          활성 워크스페이스 <span className="font-mono">{siteId}</span> 기준, Director(Haiku)가 GSC·피드백 맥락에 맞춰 3개 주제를 제안합니다.
        </p>
      </header>

      <Card className="mb-3.5">
        <CardHead>
          <Icons.Sparkle size={14} />
          <div className="text-[13.5px] font-semibold">방향 어시스턴트</div>
          <Chip kind="ghost">{templates.length}개 템플릿</Chip>
          <div className="flex-1" />
          <Button size="sm" onClick={() => setTemplatesOpen((v) => !v)}>
            {templatesOpen ? '접기' : '펼치기'}
          </Button>
        </CardHead>
        {templatesOpen && (
          <div className="p-3.5">
            <div className="flex gap-1.5 flex-wrap mb-3">
              {CATEGORY_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  className={`text-[11.5px] px-2.5 py-1 rounded-full border transition`}
                  style={{
                    background:
                      activeCat === c ? 'var(--color-accent)' : 'var(--color-bg-elev)',
                    color:
                      activeCat === c ? '#fff' : 'var(--color-text-2)',
                    borderColor:
                      activeCat === c ? 'transparent' : 'var(--color-line-2)',
                  }}
                >
                  {c === 'all' ? '전체' : CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredTemplates.map((t) => {
                const isActive = activeTemplateId === t.id
                const isSeasonal = t.seasonal_months?.includes(currentMonth)
                return (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="text-left p-3 rounded-lg border transition hover:bg-[color:var(--color-bg-subtle)]"
                    style={{
                      borderColor: isActive
                        ? 'var(--color-accent)'
                        : 'var(--color-line-2)',
                      background: isActive
                        ? 'var(--color-ok-soft)'
                        : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[16px] leading-none">{t.emoji}</span>
                      <span className="text-[12.5px] font-semibold truncate">
                        {t.title}
                      </span>
                      {isSeasonal && (
                        <Chip kind="ok" dot>
                          제철
                        </Chip>
                      )}
                      {isActive && <Chip kind="ok">선택됨</Chip>}
                      <div className="flex-1" />
                      <Chip kind="ghost">{CATEGORY_LABEL[t.category]}</Chip>
                    </div>
                    <div className="text-[11px] text-[color:var(--color-text-3)] leading-snug">
                      {t.hint}
                    </div>
                  </button>
                )
              })}
            </div>
            <div
              className="mt-3 px-3 py-2 rounded-md text-[11.5px]"
              style={{
                background: 'var(--color-bg-subtle)',
                color: 'var(--color-text-3)',
              }}
            >
              ⓘ 템플릿을 클릭하면 아래 입력칸에 한글 방향이 채워집니다. 그대로 쓰거나 원하는 부분만 수정 후 <b>주제 제안 생성</b> 누르면 Director가 3개 주제를 뽑습니다.
            </div>
          </div>
        )}
      </Card>

      <Card className="mb-3.5">
        <CardHead>
          <AgentAvatar agent="director" size={20} />
          <div className="text-[13.5px] font-semibold">이번 주의 방향</div>
          <div className="flex-1" />
          <span className="text-[11px] text-[color:var(--color-text-3)] tabular-nums">
            {input.length}/500
          </span>
        </CardHead>
        <div className="p-3.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            className="w-full min-h-[90px] border rounded-lg p-3 resize-y outline-none text-sm"
            style={{
              borderColor: 'var(--color-line-2)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <div className="flex gap-2 mt-2.5 flex-wrap items-center">
            <Button variant="accent" onClick={generate} disabled={loading}>
              <Icons.Sparkle size={13} /> {loading ? '제안 생성 중…' : '주제 제안 생성'}
            </Button>
            {response && (
              <Button size="sm" onClick={generate} disabled={loading}>
                <Icons.Refresh size={12} /> 다시 생성
              </Button>
            )}
            <div className="flex-1" />
            {response && (
              <span className="text-[11px] text-[color:var(--color-text-3)] tabular-nums">
                ${response.meta.cost_usd.toFixed(6)} · {response.meta.input_tokens}/
                {response.meta.output_tokens} tok · ctx: titles={response.meta.context_used.recent_titles}, gsc=
                {response.meta.context_used.gsc_striking}, fb=
                {response.meta.context_used.recent_feedback}
              </span>
            )}
          </div>
          {error && (
            <div
              className="mt-3 px-3 py-2 rounded-md text-[11.5px]"
              style={{ background: 'var(--color-err-soft)', color: 'var(--color-err)' }}
            >
              ⚠ {error}
            </div>
          )}
        </div>
      </Card>

      {proposals.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-2.5 mt-4.5">
            <div className="text-[13px] font-semibold">제안</div>
            <Chip kind="ghost">{proposals.length}</Chip>
            <div className="flex-1" />
            <span className="text-[11px] text-[color:var(--color-text-3)]">
              {new Date(response!.generated_at).toLocaleString('ko')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {proposals.map((p) => (
              <Card key={p.rank} className="flex flex-col">
                <div
                  className="px-3.5 pt-3 pb-2"
                  style={{ borderBottom: '1px solid var(--color-line)' }}
                >
                  <div className="flex gap-1.5 items-center">
                    <div
                      className="w-5 h-5 rounded-md text-[11px] font-semibold flex items-center justify-center tabular-nums font-mono"
                      style={{
                        background: p.rank === 1 ? 'var(--color-accent)' : 'var(--color-bg-muted)',
                        color: p.rank === 1 ? '#fff' : 'var(--color-text-3)',
                      }}
                    >
                      {p.rank}
                    </div>
                    <Chip
                      kind={p.seo_score >= 80 ? 'ok' : p.seo_score >= 60 ? 'warn' : 'ghost'}
                      dot
                    >
                      score {p.seo_score}
                    </Chip>
                    {p.striking_distance_hit && <Chip kind="ok">GSC hit</Chip>}
                    <Chip kind="ghost">{p.category}</Chip>
                  </div>
                  <div className="text-[14px] font-semibold mt-2 leading-snug">{p.title}</div>
                </div>
                <div className="px-3.5 py-2.5 flex-1">
                  <div className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-text-4)] mb-1">
                    제안 이유
                  </div>
                  <div className="text-[12px] text-[color:var(--color-text-3)] leading-relaxed">
                    {p.rationale}
                  </div>
                  {p.primary_keyword_hint && (
                    <div
                      className="mt-2 text-[11px] font-mono px-2 py-1 rounded"
                      style={{
                        background: 'var(--color-bg-muted)',
                        color: 'var(--color-text-2)',
                      }}
                    >
                      kw: {p.primary_keyword_hint}
                    </div>
                  )}
                </div>
                <div
                  className="p-2.5 flex gap-1.5 items-center"
                  style={{ borderTop: '1px solid var(--color-line)' }}
                >
                  {votes[p.rank] === 'saved' ? (
                    <>
                      <Chip kind="ok" dot>
                        ✓ topic_queue 저장됨
                      </Chip>
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        onClick={() => setVotes((v) => ({ ...v, [p.rank]: null }))}
                      >
                        되돌리기
                      </Button>
                    </>
                  ) : votes[p.rank] === 'saving' ? (
                    <Chip kind="ghost">저장 중…</Chip>
                  ) : votes[p.rank] === 'down' ? (
                    <>
                      <Chip kind="err" dot>
                        👎 제외 기록됨
                      </Chip>
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        onClick={() => setVotes((v) => ({ ...v, [p.rank]: null }))}
                      >
                        되돌리기
                      </Button>
                    </>
                  ) : votes[p.rank] === 'error' ? (
                    <>
                      <Chip kind="err">저장 실패 — 다시</Chip>
                      <Button size="sm" variant="accent" onClick={() => vote(p.rank, 'up')}>
                        재시도
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="accent" onClick={() => vote(p.rank, 'up')}>
                        👍 채택
                      </Button>
                      <Button size="sm" onClick={() => vote(p.rank, 'down')}>
                        👎 제외
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {!response && !loading && !error && (
        <Card>
          <div className="p-8 text-center">
            <div className="text-[color:var(--color-text-3)] text-[13px] mb-1">
              아직 제안이 없습니다.
            </div>
            <div className="text-[color:var(--color-text-4)] text-[11.5px]">
              위에 이번 주 방향을 쓰고 "주제 제안 생성"을 누르면 Director(Haiku)가 3개를 제안합니다. 호출당 약 $0.002.
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
