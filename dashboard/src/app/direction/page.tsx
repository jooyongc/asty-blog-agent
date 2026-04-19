'use client'

import { useState } from 'react'
import { Card, CardHead, Chip, Button, AgentAvatar } from '@/components/primitives'
import { Icons } from '@/components/icons'

// Phase 9/11 — free-text direction → Director returns 3 ranked proposals.
// Currently UI-only because Director needs Anthropic credits to respond.
// The POST /api/direction endpoint is intentionally not wired yet — it will
// call the Director agent once billing is restored.

type Proposal = {
  id: number
  topic: string
  why: string
  score: number
  feedback: 'up' | 'down' | null
}

const INITIAL: Proposal[] = [
  {
    id: 1,
    topic: '겨울 양평 ASTY Cabin 주말: 첫 방문 JA 게스트용 안내',
    why: '“quiet winter” 키워드와 striking-distance(pos 12) 매칭. first-timer confidence 충족.',
    score: 92,
    feedback: null,
  },
  {
    id: 2,
    topic: '야간 도착 체크리스트: 마지막 ITX 타고 ASTY 가는 법',
    why: '예약 직전 망설임 해결. JA 게스트 FAQ에서 반복 등장.',
    score: 86,
    feedback: null,
  },
  {
    id: 3,
    topic: 'ZH 게스트가 자주 묻는 온천식 욕장/찜질방 비교',
    why: 'CO_OCCURS 그래프에서 jjimjilbang 클러스터와 강한 연결. 다문화 편의 이슈.',
    score: 81,
    feedback: null,
  },
]

export default function DirectionPage() {
  const [input, setInput] = useState(
    '이번 주는 조용한 겨울 체류(quiet winter stay) 중심으로 가고 싶어. 2박 일정으로 처음 방문하는 JA·ZH 게스트가 예약에 확신 가질 수 있도록.'
  )
  const [loading, setLoading] = useState(false)
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL)

  function vote(id: number, v: 'up' | 'down') {
    setProposals((p) => p.map((x) => (x.id === id ? { ...x, feedback: v } : x)))
  }

  async function regenerate() {
    setLoading(true)
    // No-op until Director endpoint is live; simulate delay so the UI reads correctly.
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
  }

  return (
    <div className="max-w-[1100px]">
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">
          디렉션{' '}
          <Chip kind="ok" dot className="ml-1.5 align-middle">
            Phase 9
          </Chip>
        </h1>
        <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
          이번 주 방향을 한 문장으로 작성하면, Director가 GSC·그래프 맥락에 맞춰 3개 주제를 제안합니다.
        </p>
      </header>

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
            <Button variant="accent" onClick={regenerate} disabled={loading}>
              <Icons.Sparkle size={13} /> {loading ? '제안 생성 중…' : '주제 제안 생성'}
            </Button>
            <Button size="sm" onClick={regenerate}>
              <Icons.Refresh size={12} /> 다시 섞기
            </Button>
            <div className="flex-1" />
            <Chip kind="ghost">최근 피드백 5개를 few-shot으로 반영</Chip>
          </div>
          <div
            className="mt-3 px-3 py-2 rounded-md text-[11.5px]"
            style={{
              background: 'var(--color-warn-soft)',
              color: 'var(--color-warn)',
            }}
          >
            ⓘ 현재 Anthropic 크레딧이 소진되어 실제 Director 호출은 수동 목업으로 표시됩니다. 크레딧 보충 시 자동 전환.
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2 mb-2.5 mt-4.5">
        <div className="text-[13px] font-semibold">제안</div>
        <Chip kind="ghost">{proposals.length}</Chip>
        <div className="flex-1" />
        <Button variant="accent" size="sm" disabled>
          <Icons.Play size={12} /> 1순위 실행
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {proposals.map((p, i) => (
          <Card key={p.id} className="flex flex-col">
            <div
              className="px-3.5 pt-3 pb-2"
              style={{ borderBottom: '1px solid var(--color-line)' }}
            >
              <div className="flex gap-1.5 items-center">
                <div
                  className="w-5 h-5 rounded-md text-[11px] font-semibold flex items-center justify-center tabular-nums font-mono"
                  style={{
                    background: i === 0 ? 'var(--color-accent)' : 'var(--color-bg-muted)',
                    color: i === 0 ? '#fff' : 'var(--color-text-3)',
                  }}
                >
                  {i + 1}
                </div>
                <Chip kind={p.score >= 90 ? 'ok' : p.score >= 85 ? 'warn' : 'ghost'} dot>
                  score {p.score}
                </Chip>
              </div>
              <div className="text-[14px] font-semibold mt-2 leading-snug">{p.topic}</div>
            </div>
            <div className="px-3.5 py-2.5 flex-1">
              <div className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-text-4)] mb-1">
                제안 이유
              </div>
              <div className="text-[12px] text-[color:var(--color-text-3)] leading-relaxed">
                {p.why}
              </div>
            </div>
            <div
              className="p-2.5 flex gap-1.5 items-center"
              style={{ borderTop: '1px solid var(--color-line)' }}
            >
              <Button
                size="sm"
                variant={p.feedback === 'up' ? 'accent' : 'default'}
                onClick={() => vote(p.id, 'up')}
              >
                👍 채택
              </Button>
              <Button
                size="sm"
                onClick={() => vote(p.id, 'down')}
                style={
                  p.feedback === 'down'
                    ? {
                        background: 'var(--color-err-soft)',
                        color: 'var(--color-err)',
                        borderColor: 'transparent',
                      }
                    : undefined
                }
              >
                👎 제외
              </Button>
              <div className="flex-1" />
              <Button size="sm">
                <Icons.Edit size={11} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
