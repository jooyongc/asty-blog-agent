'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, CardHead, Chip } from '@/components/primitives'
import { Icons } from '@/components/icons'
import { PostAffiliateCard } from './post-affiliate-card'
import { AffiliateInsertForm } from './affiliate-form'
import type { Post } from '@/lib/api-client'
import type { SiteSummary } from './page'

export type AffiliateLink = {
  url: string
  anchor: string
  source: 'html' | 'markdown'
  provider: string | null
}

export type Lang = 'en' | 'ja' | 'zh-hans'

export type PostStatus = {
  slug: string
  title: string
  category: string
  publishedAt: string | null
  links: Record<Lang, AffiliateLink[]>
  totalLinks: number
}

type Tab = 'list' | 'bulk'
type Filter = 'all' | 'with' | 'without'

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; posts: PostStatus[]; fetchedAt: number }
  | { kind: 'err'; message: string }

export function AffiliateClient({ sites }: { sites: SiteSummary[] }) {
  const [siteId, setSiteId] = useState(sites[0]?.site_id ?? '')
  const [tab, setTab] = useState<Tab>('list')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [load, setLoad] = useState<LoadState>({ kind: 'idle' })

  const refresh = useCallback(async () => {
    if (!siteId) return
    setLoad({ kind: 'loading' })
    try {
      const res = await fetch(`/api/affiliate-status?site_id=${encodeURIComponent(siteId)}`)
      const data = await res.json()
      if (!res.ok) {
        setLoad({ kind: 'err', message: data.error ?? `HTTP ${res.status}` })
        return
      }
      setLoad({ kind: 'ok', posts: data.posts ?? [], fetchedAt: Date.now() })
    } catch (e) {
      setLoad({ kind: 'err', message: (e as Error).message })
    }
  }, [siteId])

  useEffect(() => { void refresh() }, [refresh])

  const filtered = useMemo(() => {
    if (load.kind !== 'ok') return []
    const q = search.trim().toLowerCase()
    return load.posts.filter((p) => {
      if (filter === 'with' && p.totalLinks === 0) return false
      if (filter === 'without' && p.totalLinks > 0) return false
      if (q && !(p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))) return false
      return true
    })
  }, [load, filter, search])

  const stats = useMemo(() => {
    if (load.kind !== 'ok') return null
    const total = load.posts.length
    const withLinks = load.posts.filter((p) => p.totalLinks > 0).length
    const totalLinks = load.posts.reduce((s, p) => s + p.totalLinks, 0)
    return { total, withLinks, withoutLinks: total - withLinks, totalLinks }
  }, [load])

  return (
    <Card>
      <CardHead>
        <Icons.Layers size={14} />
        <div className="text-[13.5px] font-semibold">현황</div>
        <div className="flex-1" />
        <select
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          className="px-2 py-1 text-[12px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
        >
          {sites.map((s) => (
            <option key={s.site_id} value={s.site_id}>
              {s.site_id}
            </option>
          ))}
        </select>
        <button
          onClick={refresh}
          disabled={load.kind === 'loading'}
          className="text-[11.5px] px-2.5 py-1 rounded-md border border-[color:var(--color-line)] hover:border-[color:var(--color-accent)] disabled:opacity-50"
          title="새로 발행된 글이 있으면 목록에 반영됩니다"
        >
          {load.kind === 'loading' ? '불러오는 중…' : '↻ 새로고침'}
        </button>
      </CardHead>

      <div className="px-4 pt-3 pb-2 flex flex-wrap items-center gap-2 border-b border-[color:var(--color-line)]">
        <div className="inline-flex rounded-md border border-[color:var(--color-line)] overflow-hidden">
          <TabButton active={tab === 'list'} onClick={() => setTab('list')}>리스트</TabButton>
          <TabButton active={tab === 'bulk'} onClick={() => setTab('bulk')}>일괄 추가</TabButton>
        </div>

        {stats && tab === 'list' && (
          <>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5 text-[11.5px]">
              <Chip kind="ghost">전체 {stats.total}</Chip>
              <Chip kind="ok" dot>링크 있음 {stats.withLinks}</Chip>
              <Chip kind="warn">없음 {stats.withoutLinks}</Chip>
              <Chip kind="ghost">총 {stats.totalLinks} 링크</Chip>
            </div>
          </>
        )}
      </div>

      {tab === 'list' && (
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목 / slug 검색"
              className="flex-1 min-w-[200px] px-3 py-1.5 text-[12.5px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
            />
            <div className="inline-flex rounded-md border border-[color:var(--color-line)] overflow-hidden">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>전체</FilterButton>
              <FilterButton active={filter === 'with'} onClick={() => setFilter('with')}>링크 있음</FilterButton>
              <FilterButton active={filter === 'without'} onClick={() => setFilter('without')}>없음</FilterButton>
            </div>
          </div>

          {load.kind === 'loading' && (
            <div className="p-8 text-center text-[12.5px] text-[color:var(--color-text-3)]">불러오는 중…</div>
          )}
          {load.kind === 'err' && (
            <div className="p-4 text-[12.5px] text-[color:var(--color-err)]">에러: {load.message}</div>
          )}
          {load.kind === 'ok' && filtered.length === 0 && (
            <div className="p-8 text-center text-[12.5px] text-[color:var(--color-text-3)]">조건에 맞는 글이 없습니다.</div>
          )}
          {load.kind === 'ok' && filtered.map((post) => (
            <PostAffiliateCard
              key={post.slug}
              siteId={siteId}
              post={post}
              onInserted={refresh}
            />
          ))}
        </div>
      )}

      {tab === 'bulk' && (
        <div className="p-4">
          <BulkLink siteId={siteId} onDone={refresh} />
        </div>
      )}
    </Card>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[12px] ${
        active
          ? 'bg-[color:var(--color-accent)] text-white'
          : 'bg-[color:var(--color-bg-subtle)] hover:bg-[color:var(--color-line)]'
      }`}
    >
      {children}
    </button>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11.5px] ${
        active
          ? 'bg-[color:var(--color-accent)] text-white'
          : 'bg-[color:var(--color-bg-subtle)] hover:bg-[color:var(--color-line)]'
      }`}
    >
      {children}
    </button>
  )
}

function BulkLink({ siteId, onDone }: { siteId: string; onDone: () => void }) {
  return (
    <div className="text-[12.5px] text-[color:var(--color-text-3)] space-y-2">
      <div>
        한 번에 여러 글 × 여러 어필리에이트를 일괄 처리하려면 아래로 이동하세요. 작업 후 자동으로 현황이 갱신됩니다.
      </div>
      <Button
        variant="default"
        onClick={() => {
          // The legacy bulk form is rendered directly below as a sibling element via DOM scroll
          const el = document.getElementById('bulk-form-anchor')
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      >
        ↓ 일괄 추가 폼으로 이동
      </Button>
      <div id="bulk-form-anchor" className="pt-4">
        <BulkInsertWrapper siteId={siteId} onDone={onDone} />
      </div>
    </div>
  )
}

function BulkInsertWrapper({ siteId, onDone }: { siteId: string; onDone: () => void }) {
  // The bulk form needs `sites: SitePosts[]` from api-client. For simplicity here,
  // we fetch its required posts list inside the same status endpoint shape so the
  // bulk form keeps working unchanged.
  const [posts, setPosts] = useState<Post[]>([])
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch(`/api/affiliate-status?site_id=${encodeURIComponent(siteId)}`)
      if (!res.ok) return
      const data = await res.json() as { posts: PostStatus[] }
      if (cancelled) return
      // Map to the Post shape the bulk form expects (subset)
      const mapped: Post[] = (data.posts ?? []).map((p) => ({
        id: p.slug,
        slug: p.slug,
        categoryId: p.category,
        canonicalLang: 'en',
        status: 'published',
        publishAt: p.publishedAt,
        publishedAt: p.publishedAt,
        author: '',
        createdAt: p.publishedAt ?? new Date().toISOString(),
        updatedAt: p.publishedAt ?? new Date().toISOString(),
        title: p.title,
      }))
      setPosts(mapped)
    })()
    return () => { cancelled = true }
  }, [siteId])

  if (posts.length === 0) {
    return <div className="text-[12px] text-[color:var(--color-text-3)]">불러오는 중…</div>
  }
  return (
    <AffiliateInsertForm
      sites={[{
        site_id: siteId,
        site_url: '',
        posts,
        affiliate: null,
      }]}
      onSubmitted={onDone}
    />
  )
}
