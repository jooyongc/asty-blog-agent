'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardHead, Chip } from '@/components/primitives'
import { Icons } from '@/components/icons'
import type { Post, AffiliateExport } from '@/lib/api-client'

type Lang = 'en' | 'ja' | 'zh-hans'

type SitePosts = {
  site_id: string
  site_url: string
  posts: Post[]
  affiliate: AffiliateExport | null
}

type Props = { sites: SitePosts[] }

type Provider = { id: string; name: string }
const PROVIDER_PRESET: Provider[] = [
  { id: 'klook', name: 'Klook' },
  { id: 'kkday', name: 'KKday' },
  { id: 'viator', name: 'Viator' },
  { id: 'sesigan', name: '세시간전' },
]

type Entry = {
  uid: string
  provider: string
  keyword: string
  url: string
  anchor: string
  anchor_ja: string
  anchor_zh: string
}

type PostBatch = {
  uid: string
  slug: string
  entries: Entry[]
}

type SavedTemplate = {
  id: string
  provider: string
  keyword: string
  url: string
  anchor: string
  anchor_ja: string
  anchor_zh: string
  used_at: number
}

type LangResult = { lang: Lang; ok: boolean; message: string }
type EntryResult = { uid: string; results: LangResult[] }
type PostResult = { batchUid: string; slug: string; entries: EntryResult[] }

type ResultState =
  | { kind: 'idle' }
  | { kind: 'busy'; progress: { batchUid: string; entryUid: string } | null }
  | { kind: 'done'; posts: PostResult[] }
  | { kind: 'err'; message: string }

const STORAGE_KEY = 'affiliate-templates-v2'

function newUid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function emptyEntry(provider = PROVIDER_PRESET[0].id): Entry {
  return { uid: newUid('e'), provider, keyword: '', url: '', anchor: '', anchor_ja: '', anchor_zh: '' }
}

function emptyBatch(slug: string): PostBatch {
  return { uid: newUid('b'), slug, entries: [emptyEntry()] }
}

function loadTemplates(): SavedTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedTemplate[]
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.used_at - a.used_at) : []
  } catch {
    return []
  }
}

function saveTemplate(t: SavedTemplate) {
  if (typeof window === 'undefined') return
  const all = loadTemplates()
  const idx = all.findIndex((x) => x.url === t.url && x.keyword === t.keyword)
  if (idx >= 0) all[idx] = { ...all[idx], ...t, used_at: Date.now() }
  else all.unshift({ ...t, used_at: Date.now() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 30)))
}

function deleteTemplate(id: string) {
  if (typeof window === 'undefined') return
  const all = loadTemplates().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function AffiliateInsertForm({ sites }: Props) {
  const [siteId, setSiteId] = useState(sites[0]?.site_id ?? '')
  const [allLangs, setAllLangs] = useState(true)
  const [batches, setBatches] = useState<PostBatch[]>([emptyBatch(sites[0]?.posts[0]?.slug ?? '')])
  const [activeBatchUid, setActiveBatchUid] = useState<string>(batches[0]?.uid ?? '')
  const [result, setResult] = useState<ResultState>({ kind: 'idle' })
  const [templates, setTemplates] = useState<SavedTemplate[]>([])

  useEffect(() => { setTemplates(loadTemplates()) }, [])

  const currentSite = useMemo(() => sites.find((s) => s.site_id === siteId), [sites, siteId])
  const allPosts = currentSite?.posts ?? []

  function handleSiteChange(newSiteId: string) {
    setSiteId(newSiteId)
    const firstSlug = sites.find((x) => x.site_id === newSiteId)?.posts[0]?.slug ?? ''
    const fresh = emptyBatch(firstSlug)
    setBatches([fresh])
    setActiveBatchUid(fresh.uid)
    setResult({ kind: 'idle' })
  }

  function updateBatch(uid: string, patch: Partial<PostBatch>) {
    setBatches((prev) => prev.map((b) => (b.uid === uid ? { ...b, ...patch } : b)))
  }
  function addBatch() {
    // Pick a slug not yet used; otherwise the first one
    const usedSlugs = new Set(batches.map((b) => b.slug))
    const nextPost = allPosts.find((p) => !usedSlugs.has(p.slug)) ?? allPosts[0]
    const fresh = emptyBatch(nextPost?.slug ?? '')
    setBatches((prev) => [...prev, fresh])
    setActiveBatchUid(fresh.uid)
  }
  function removeBatch(uid: string) {
    setBatches((prev) => {
      if (prev.length === 1) return prev
      const next = prev.filter((b) => b.uid !== uid)
      if (uid === activeBatchUid) setActiveBatchUid(next[0]?.uid ?? '')
      return next
    })
  }
  function updateEntry(batchUid: string, entryUid: string, patch: Partial<Entry>) {
    setBatches((prev) =>
      prev.map((b) =>
        b.uid !== batchUid
          ? b
          : { ...b, entries: b.entries.map((e) => (e.uid === entryUid ? { ...e, ...patch } : e)) },
      ),
    )
  }
  function addEntry(batchUid: string) {
    setBatches((prev) =>
      prev.map((b) => (b.uid !== batchUid ? b : { ...b, entries: [...b.entries, emptyEntry()] })),
    )
    setActiveBatchUid(batchUid)
  }
  function removeEntry(batchUid: string, entryUid: string) {
    setBatches((prev) =>
      prev.map((b) =>
        b.uid !== batchUid
          ? b
          : { ...b, entries: b.entries.length === 1 ? b.entries : b.entries.filter((e) => e.uid !== entryUid) },
      ),
    )
  }

  function applyTemplate(t: SavedTemplate) {
    // Add to the active batch — into first empty entry, or append.
    const target = batches.find((b) => b.uid === activeBatchUid) ?? batches[batches.length - 1]
    if (!target) return
    const filled: Entry = {
      uid: newUid('e'),
      provider: t.provider,
      keyword: t.keyword,
      url: t.url,
      anchor: t.anchor,
      anchor_ja: t.anchor_ja,
      anchor_zh: t.anchor_zh,
    }
    setBatches((prev) =>
      prev.map((b) => {
        if (b.uid !== target.uid) return b
        const emptyIdx = b.entries.findIndex((e) => !e.keyword && !e.url)
        if (emptyIdx >= 0) {
          return { ...b, entries: b.entries.map((e, i) => (i === emptyIdx ? { ...filled, uid: e.uid } : e)) }
        }
        return { ...b, entries: [...b.entries, filled] }
      }),
    )
  }
  function handleDeleteTemplate(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    deleteTemplate(id)
    setTemplates(loadTemplates())
  }

  async function callOne(payload: Record<string, unknown>): Promise<{ ok: boolean; data: { error?: string; replaced?: number; note?: string; matched?: string } }> {
    try {
      const res = await fetch('/api/affiliate-insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      return { ok: res.ok, data }
    } catch (e) {
      return { ok: false, data: { error: (e as Error).message } }
    }
  }

  function validate(): string | null {
    if (!siteId) return '사이트를 선택하세요.'
    if (batches.length === 0) return '글이 1개 이상 필요합니다.'
    for (let bi = 0; bi < batches.length; bi++) {
      const b = batches[bi]
      if (!b.slug) return `${bi + 1}번 글이 선택되지 않았습니다.`
      if (b.entries.length === 0) return `${bi + 1}번 글의 링크가 비어 있습니다.`
      for (let ei = 0; ei < b.entries.length; ei++) {
        const e = b.entries[ei]
        if (!e.keyword || !e.url || !e.anchor) {
          return `[글 ${bi + 1} / 링크 ${ei + 1}] 키워드 / URL / EN 앵커는 필수입니다.`
        }
        try { new URL(e.url) } catch { return `[글 ${bi + 1} / 링크 ${ei + 1}] URL이 올바르지 않습니다.` }
      }
    }
    // Detect duplicate slugs across batches
    const slugCount = new Map<string, number>()
    for (const b of batches) slugCount.set(b.slug, (slugCount.get(b.slug) ?? 0) + 1)
    const dup = [...slugCount.entries()].find(([, c]) => c > 1)
    if (dup) return `같은 글(${dup[0]})이 여러 번 선택되어 있습니다. 하나의 글에는 한 그룹만 사용하세요.`
    return null
  }

  async function handleSubmit() {
    const err = validate()
    if (err) {
      setResult({ kind: 'err', message: err })
      return
    }
    setResult({ kind: 'busy', progress: null })

    const allPostResults: PostResult[] = []
    for (const batch of batches) {
      const entryResults: EntryResult[] = []
      for (const entry of batch.entries) {
        setResult({ kind: 'busy', progress: { batchUid: batch.uid, entryUid: entry.uid } })
        const langResults: LangResult[] = []

        const enRes = await callOne({
          site_id: siteId, slug: batch.slug, lang: 'en', mode: 'replace',
          keyword: entry.keyword, url: entry.url, anchor: entry.anchor,
        })
        langResults.push(buildLangResult('en', enRes))

        if (allLangs) {
          const jaRes = await callOne({
            site_id: siteId, slug: batch.slug, lang: 'ja', mode: 'append',
            url: entry.url, anchor: entry.anchor_ja || entry.anchor,
          })
          langResults.push(buildLangResult('ja', jaRes))

          const zhRes = await callOne({
            site_id: siteId, slug: batch.slug, lang: 'zh-hans', mode: 'append',
            url: entry.url, anchor: entry.anchor_zh || entry.anchor,
          })
          langResults.push(buildLangResult('zh-hans', zhRes))
        }

        entryResults.push({ uid: entry.uid, results: langResults })

        if (langResults[0]?.ok) {
          saveTemplate({
            id: `${entry.url}|${entry.keyword}`,
            provider: entry.provider,
            keyword: entry.keyword,
            url: entry.url,
            anchor: entry.anchor,
            anchor_ja: entry.anchor_ja,
            anchor_zh: entry.anchor_zh,
            used_at: Date.now(),
          })
        }
      }
      allPostResults.push({ batchUid: batch.uid, slug: batch.slug, entries: entryResults })
    }

    setTemplates(loadTemplates())
    setResult({ kind: 'done', posts: allPostResults })
  }

  const totalEntries = batches.reduce((sum, b) => sum + b.entries.length, 0)
  const totalCalls = totalEntries * (allLangs ? 3 : 1)

  return (
    <Card>
      <CardHead>
        <Icons.Edit size={14} />
        <div className="text-[13.5px] font-semibold">멀티 포스팅 × 멀티 어필리에이트</div>
      </CardHead>

      <div className="p-4 space-y-3">
        {templates.length > 0 && (
          <div className="mb-2 p-3 bg-[color:var(--color-bg-subtle)] rounded-md">
            <div className="text-[11.5px] text-[color:var(--color-text-3)] mb-2 uppercase tracking-wider">
              저장된 어필리에이트 ({templates.length}) — 클릭하면 활성 글 그룹의 빈 행에 채워짐
            </div>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => {
                const provName = PROVIDER_PRESET.find((p) => p.id === t.provider)?.name ?? t.provider
                return (
                  <div
                    key={t.id}
                    className="group inline-flex items-center gap-1 px-2.5 py-1 text-[12px] rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-bg-elev)] hover:border-[color:var(--color-accent)] cursor-pointer"
                    onClick={() => applyTemplate(t)}
                    title={`${t.url}\nkeyword: ${t.keyword}\nanchor: ${t.anchor}`}
                  >
                    <span className="font-medium">{provName}</span>
                    <span className="text-[10.5px] text-[color:var(--color-text-4)]">/{t.keyword.slice(0, 20)}</span>
                    <button
                      onClick={(e) => handleDeleteTemplate(t.id, e)}
                      className="ml-0.5 text-[color:var(--color-text-4)] hover:text-[color:var(--color-err)] opacity-0 group-hover:opacity-100"
                      aria-label="삭제"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <FieldRow label="사이트">
          <select
            value={siteId}
            onChange={(e) => handleSiteChange(e.target.value)}
            className="w-full px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
          >
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.site_id} ({s.posts.length} published)
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="다국어 적용">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={allLangs} onChange={(e) => setAllLangs(e.target.checked)} />
            <span className="text-[12.5px]">JA / ZH 본문 끝에도 어필리에이트 CTA 추가</span>
          </label>
        </FieldRow>

        <div className="border-t border-[color:var(--color-line)] my-3" />

        {/* Post batches */}
        <div className="space-y-3">
          {batches.map((batch, bi) => {
            const post = allPosts.find((p) => p.slug === batch.slug)
            const batchResult = result.kind === 'done' ? result.posts.find((p) => p.batchUid === batch.uid) : null
            const isActive = activeBatchUid === batch.uid
            return (
              <div
                key={batch.uid}
                onClick={() => setActiveBatchUid(batch.uid)}
                className={`p-3 rounded-lg space-y-2 cursor-default ${
                  isActive
                    ? 'border-2 border-[color:var(--color-accent)] bg-[color:var(--color-bg-subtle)]'
                    : 'border border-[color:var(--color-line)] bg-[color:var(--color-bg-elev)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Chip kind={isActive ? 'ok' : 'ghost'} dot={isActive}>글 {bi + 1}</Chip>
                  <select
                    value={batch.slug}
                    onChange={(e) => updateBatch(batch.uid, { slug: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-[12.5px] bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] rounded-md"
                  >
                    {allPosts.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        [{p.categoryId}] {p.title.slice(0, 70)}
                      </option>
                    ))}
                  </select>
                  {batches.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeBatch(batch.uid) }}
                      className="text-[11px] px-2 py-1 rounded-md text-[color:var(--color-err)] hover:bg-[color:var(--color-bg-subtle)]"
                    >
                      × 글 삭제
                    </button>
                  )}
                </div>

                {post && (
                  <div className="text-[10.5px] text-[color:var(--color-text-4)] font-mono pl-1">
                    {post.slug}
                  </div>
                )}

                {/* Entries inside this batch */}
                <div className="space-y-2 pt-1">
                  {batch.entries.map((entry, ei) => {
                    const entryResult = batchResult?.entries.find((r) => r.uid === entry.uid)
                    return (
                      <div
                        key={entry.uid}
                        className="p-2.5 border border-[color:var(--color-line)] rounded-md bg-[color:var(--color-bg-elev)] space-y-2"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-[color:var(--color-text-4)] font-mono">#{ei + 1}</span>
                          <select
                            value={entry.provider}
                            onChange={(e) => updateEntry(batch.uid, entry.uid, { provider: e.target.value })}
                            className="px-2 py-1 text-[11.5px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
                          >
                            {PROVIDER_PRESET.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const prov = PROVIDER_PRESET.find((p) => p.id === entry.provider)
                              if (prov) updateEntry(batch.uid, entry.uid, { anchor: prov.name })
                            }}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] hover:bg-[color:var(--color-line)]"
                            title="앵커 텍스트를 provider 이름으로 채움"
                          >
                            앵커=provider
                          </button>
                          <div className="flex-1" />
                          {batch.entries.length > 1 && (
                            <button
                              onClick={() => removeEntry(batch.uid, entry.uid)}
                              className="text-[11px] px-2 py-0.5 rounded-md text-[color:var(--color-err)] hover:bg-[color:var(--color-bg-subtle)]"
                            >
                              × 링크
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={entry.keyword}
                            onChange={(e) => updateEntry(batch.uid, entry.uid, { keyword: e.target.value })}
                            placeholder="EN 키워드 (본문 매칭)"
                            className="px-3 py-1.5 text-[12.5px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
                          />
                          <input
                            value={entry.url}
                            onChange={(e) => updateEntry(batch.uid, entry.uid, { url: e.target.value })}
                            placeholder="https://..."
                            className="px-3 py-1.5 text-[12.5px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md font-mono"
                          />
                        </div>
                        <input
                          value={entry.anchor}
                          onChange={(e) => updateEntry(batch.uid, entry.uid, { anchor: e.target.value })}
                          placeholder="EN 앵커 (필수)"
                          className="w-full px-3 py-1.5 text-[12.5px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
                        />
                        {allLangs && (
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={entry.anchor_ja}
                              onChange={(e) => updateEntry(batch.uid, entry.uid, { anchor_ja: e.target.value })}
                              placeholder="JA 앵커 (선택)"
                              className="px-3 py-1.5 text-[12px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
                            />
                            <input
                              value={entry.anchor_zh}
                              onChange={(e) => updateEntry(batch.uid, entry.uid, { anchor_zh: e.target.value })}
                              placeholder="ZH 앵커 (선택)"
                              className="px-3 py-1.5 text-[12px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
                            />
                          </div>
                        )}

                        {result.kind === 'busy' && result.progress?.entryUid === entry.uid && (
                          <Chip kind="warn" dot>처리 중…</Chip>
                        )}
                        {entryResult && (
                          <div className="pt-1.5 mt-1 border-t border-[color:var(--color-line)] space-y-1">
                            {entryResult.results.map((r) => (
                              <div key={r.lang} className="flex items-center gap-2 text-[11.5px]">
                                <span className="font-mono w-14 text-[color:var(--color-text-3)]">{r.lang}</span>
                                <Chip kind={r.ok ? 'ok' : 'err'} dot={r.ok}>{r.message}</Chip>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <button
                    onClick={(e) => { e.stopPropagation(); addEntry(batch.uid) }}
                    className="w-full py-1.5 text-[11.5px] rounded-md border border-dashed border-[color:var(--color-line)] text-[color:var(--color-text-3)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-text-1)]"
                  >
                    + 이 글에 링크 추가
                  </button>
                </div>
              </div>
            )
          })}

          <button
            onClick={addBatch}
            className="w-full py-2.5 text-[12.5px] rounded-md border border-dashed border-[color:var(--color-line)] text-[color:var(--color-text-3)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-text-1)]"
          >
            + 다른 글 추가
          </button>
        </div>

        <div className="pt-2 flex items-center gap-3 sticky bottom-0 bg-[color:var(--color-bg-elev)] -mx-4 px-4 py-3 border-t border-[color:var(--color-line)]">
          <Button variant="accent" onClick={handleSubmit} disabled={result.kind === 'busy'}>
            {result.kind === 'busy'
              ? '처리 중…'
              : `${batches.length}개 글 × ${totalEntries}개 링크 (${totalCalls} API 호출) 일괄 삽입`}
          </Button>
          {result.kind === 'err' && <Chip kind="err">실패: {result.message}</Chip>}
          {result.kind === 'done' && <Chip kind="ok" dot>완료 — 결과는 각 행 하단 참고</Chip>}
        </div>
      </div>
    </Card>
  )
}

function buildLangResult(lang: Lang, res: { ok: boolean; data: { error?: string; replaced?: number; note?: string; matched?: string } }): LangResult {
  if (!res.ok) return { lang, ok: false, message: res.data.error ?? '실패' }
  const replaced = res.data.replaced ?? 0
  if (replaced > 0) return { lang, ok: true, message: `삽입됨${res.data.matched ? ` (${res.data.matched})` : ''}` }
  return { lang, ok: true, message: res.data.note ?? '이미 존재' }
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
      <div className="text-[12px] text-[color:var(--color-text-3)] pt-2">{label}</div>
      <div>{children}</div>
    </div>
  )
}
