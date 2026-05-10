'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardHead, Chip } from '@/components/primitives'
import { Icons } from '@/components/icons'

type Status = 'proposed' | 'approved' | 'in_progress' | 'published' | 'rejected'

type Topic = {
  id: string
  title: string
  category: string | null
  rationale: string | null
  pillar?: string | null
  aeo_format?: string | null
  seo_score: number | null
  status: Status
  source_direction: string | null
  user_note: string | null
  created_at: string
  published_slug?: string
  published_url?: string
}

type DirectionGroup = {
  source_direction: string
  generated_at: string
  proposals: Topic[]
}

type HistoryResponse = {
  groups: DirectionGroup[]
  ungrouped: Topic[]
  stats: {
    total: number
    proposed: number
    approved: number
    in_progress: number
    published: number
    rejected: number
  }
}

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; data: HistoryResponse; fetchedAt: number }
  | { kind: 'err'; message: string }

const STATUS_CHIP: Record<Status, 'ok' | 'warn' | 'err' | 'ghost'> = {
  proposed: 'warn',
  approved: 'ok',
  in_progress: 'warn',
  published: 'ok',
  rejected: 'err',
}

const STATUS_LABEL: Record<Status, string> = {
  proposed: '제안됨',
  approved: '승인',
  in_progress: '작성 중',
  published: '발행됨',
  rejected: '반려',
}

type StatusFilter = 'all' | Status

export function DirectionHistory({ siteId }: { siteId: string }) {
  const [load, setLoad] = useState<LoadState>({ kind: 'idle' })
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [open, setOpen] = useState(true)
  const [search, setSearch] = useState('')

  const refresh = useCallback(async () => {
    if (!siteId) return
    setLoad({ kind: 'loading' })
    try {
      const res = await fetch(`/api/topic-history?site_id=${encodeURIComponent(siteId)}`)
      const data = await res.json()
      if (!res.ok) {
        setLoad({ kind: 'err', message: data.error ?? `HTTP ${res.status}` })
        return
      }
      setLoad({ kind: 'ok', data, fetchedAt: Date.now() })
    } catch (e) {
      setLoad({ kind: 'err', message: (e as Error).message })
    }
  }, [siteId])

  useEffect(() => { void refresh() }, [refresh])

  const filteredGroups = useMemo(() => {
    if (load.kind !== 'ok') return []
    const q = search.trim().toLowerCase()
    return load.data.groups
      .map((g) => ({
        ...g,
        proposals: g.proposals.filter((p) => {
          if (filter !== 'all' && p.status !== filter) return false
          if (q && !(p.title.toLowerCase().includes(q) || g.source_direction.toLowerCase().includes(q))) return false
          return true
        }),
      }))
      .filter((g) => g.proposals.length > 0)
  }, [load, filter, search])

  const stats = load.kind === 'ok' ? load.data.stats : null

  return (
    <Card className="mb-3.5">
      <CardHead>
        <Icons.Clock size={14} />
        <div className="text-[13.5px] font-semibold">디렉션 히스토리</div>
        {stats && (
          <span className="text-[11px] text-[color:var(--color-text-3)] tabular-nums">
            (총 {stats.total} 제안)
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={refresh}
          disabled={load.kind === 'loading'}
          className="text-[11.5px] px-2.5 py-1 rounded-md border border-[color:var(--color-line-2)] hover:border-[color:var(--color-accent)] disabled:opacity-50"
        >
          {load.kind === 'loading' ? '불러오는 중…' : '↻ 새로고침'}
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-[11.5px] px-2.5 py-1 rounded-md border border-[color:var(--color-line-2)] hover:border-[color:var(--color-accent)]"
        >
          {open ? '접기' : '펼치기'}
        </button>
      </CardHead>

      {open && (
        <div className="p-3.5 space-y-3">
          {stats && (
            <div className="flex flex-wrap gap-1.5 text-[11.5px]">
              <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                전체 {stats.total}
              </FilterChip>
              <FilterChip active={filter === 'proposed'} onClick={() => setFilter('proposed')} kind="warn">
                제안 {stats.proposed}
              </FilterChip>
              <FilterChip active={filter === 'approved'} onClick={() => setFilter('approved')} kind="ok">
                승인 {stats.approved}
              </FilterChip>
              <FilterChip active={filter === 'in_progress'} onClick={() => setFilter('in_progress')} kind="warn">
                작성 중 {stats.in_progress}
              </FilterChip>
              <FilterChip active={filter === 'published'} onClick={() => setFilter('published')} kind="ok">
                발행 {stats.published}
              </FilterChip>
              <FilterChip active={filter === 'rejected'} onClick={() => setFilter('rejected')} kind="err">
                반려 {stats.rejected}
              </FilterChip>
            </div>
          )}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목 / 디렉션 텍스트 검색"
            className="w-full px-3 py-1.5 text-[12.5px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
          />

          {load.kind === 'loading' && (
            <div className="p-6 text-center text-[12.5px] text-[color:var(--color-text-3)]">
              불러오는 중…
            </div>
          )}
          {load.kind === 'err' && (
            <div className="p-3 text-[12.5px] text-[color:var(--color-err)]">
              에러: {load.message}
            </div>
          )}
          {load.kind === 'ok' && filteredGroups.length === 0 && (
            <div className="p-6 text-center text-[12.5px] text-[color:var(--color-text-3)]">
              조건에 맞는 디렉션이 없습니다.
            </div>
          )}
          {load.kind === 'ok' && filteredGroups.map((g, idx) => (
            <DirectionGroupCard key={`${g.generated_at}-${idx}`} group={g} />
          ))}
        </div>
      )}
    </Card>
  )
}

function DirectionGroupCard({ group }: { group: DirectionGroup }) {
  const [expanded, setExpanded] = useState(false)
  const dirText = group.source_direction
  const summary = dirText.length > 140 ? dirText.slice(0, 140) + '…' : dirText
  const statusCounts = group.proposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="border border-[color:var(--color-line-2)] rounded-lg overflow-hidden">
      <div
        className="px-3 py-2.5 bg-[color:var(--color-bg-subtle)] flex items-start gap-2 cursor-pointer hover:bg-[color:var(--color-bg-elev)]"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-[10.5px] text-[color:var(--color-text-4)] mt-0.5 select-none">
          {expanded ? '▼' : '▶'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] text-[color:var(--color-text-3)] mb-0.5 tabular-nums">
            {new Date(group.generated_at).toLocaleString('ko')} · {group.proposals.length}개 제안
          </div>
          <div className="text-[12.5px] line-clamp-2 leading-snug">{summary}</div>
        </div>
        <div className="flex flex-wrap gap-1 shrink-0">
          {Object.entries(statusCounts).map(([s, c]) => (
            <Chip key={s} kind={STATUS_CHIP[s as Status] ?? 'ghost'} dot={s === 'published'}>
              {STATUS_LABEL[s as Status] ?? s} {c}
            </Chip>
          ))}
        </div>
      </div>
      {expanded && (
        <div className="p-3 space-y-2">
          {group.proposals.map((p) => (
            <ProposalRow key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProposalRow({ proposal }: { proposal: Topic }) {
  return (
    <div className="p-2.5 border border-[color:var(--color-line)] rounded-md bg-[color:var(--color-bg-elev)]">
      <div className="flex items-start gap-2 flex-wrap mb-1">
        <Chip kind={STATUS_CHIP[proposal.status]} dot={proposal.status === 'published'}>
          {STATUS_LABEL[proposal.status]}
        </Chip>
        {proposal.category && <Chip kind="ghost">{proposal.category}</Chip>}
        {proposal.pillar && <Chip kind="ghost">{proposal.pillar}</Chip>}
        {proposal.aeo_format && <Chip kind="ghost">{proposal.aeo_format}</Chip>}
        {proposal.seo_score != null && (
          <Chip kind="ghost">SEO {proposal.seo_score}</Chip>
        )}
        <div className="flex-1" />
        {proposal.published_url && (
          <a
            href={proposal.published_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] px-2 py-0.5 rounded-md border border-[color:var(--color-accent)] text-[color:var(--color-accent)] hover:bg-[color:var(--color-bg-subtle)]"
          >
            글 보기 ↗
          </a>
        )}
      </div>
      <div className="text-[12.5px] font-medium leading-snug">{proposal.title}</div>
      {proposal.rationale && (
        <div className="text-[11px] text-[color:var(--color-text-3)] mt-1 leading-snug">
          {proposal.rationale}
        </div>
      )}
      <div className="text-[10.5px] text-[color:var(--color-text-4)] mt-1.5 tabular-nums">
        {new Date(proposal.created_at).toLocaleString('ko')}
        {proposal.published_slug && (
          <> · <span className="font-mono">{proposal.published_slug}</span></>
        )}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
  kind = 'ghost',
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  kind?: 'ok' | 'warn' | 'err' | 'ghost'
}) {
  const base = 'px-2 py-1 rounded-md border transition cursor-pointer'
  const palette: Record<string, string> = {
    ok: active ? 'bg-[color:var(--color-ok)] text-white border-transparent' : 'bg-[color:var(--color-ok-soft)] text-[color:var(--color-ok)] border-[color:var(--color-ok-soft)]',
    warn: active ? 'bg-[color:var(--color-warn)] text-white border-transparent' : 'bg-[color:var(--color-warn-soft)] text-[color:var(--color-warn)] border-[color:var(--color-warn-soft)]',
    err: active ? 'bg-[color:var(--color-err)] text-white border-transparent' : 'bg-[color:var(--color-err-soft)] text-[color:var(--color-err)] border-[color:var(--color-err-soft)]',
    ghost: active ? 'bg-[color:var(--color-text-2)] text-white border-transparent' : 'bg-[color:var(--color-bg-subtle)] text-[color:var(--color-text-2)] border-[color:var(--color-line-2)]',
  }
  return (
    <button onClick={onClick} className={`${base} ${palette[kind]}`}>
      {children}
    </button>
  )
}
