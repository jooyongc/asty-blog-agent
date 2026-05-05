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

// Hardcoded provider preset — the master list the user is working with.
// Independent of asty-cabin's DB-stored providers (which may be stale).
type Provider = { id: string; name: string }
const PROVIDER_PRESET: Provider[] = [
  { id: 'klook', name: 'Klook' },
  { id: 'kkday', name: 'KKday' },
  { id: 'viator', name: 'Viator' },
  { id: 'sesigan', name: '세시간전' },
]

type Entry = {
  uid: string         // local id only
  provider: string    // provider id from PROVIDER_PRESET
  keyword: string     // EN body match (required)
  url: string
  anchor: string      // EN anchor (required)
  anchor_ja: string   // optional, '' = use anchor
  anchor_zh: string   // optional, '' = use anchor
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

type ResultState =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'done'; entries: EntryResult[] }
  | { kind: 'err'; message: string }

const STORAGE_KEY = 'affiliate-templates-v2'

function newUid(): string {
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function emptyEntry(provider = PROVIDER_PRESET[0].id): Entry {
  return { uid: newUid(), provider, keyword: '', url: '', anchor: '', anchor_ja: '', anchor_zh: '' }
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
  const [slug, setSlug] = useState(sites[0]?.posts[0]?.slug ?? '')
  const [allLangs, setAllLangs] = useState(true)
  const [entries, setEntries] = useState<Entry[]>([emptyEntry()])
  const [result, setResult] = useState<ResultState>({ kind: 'idle' })
  const [templates, setTemplates] = useState<SavedTemplate[]>([])

  useEffect(() => { setTemplates(loadTemplates()) }, [])

  const currentSite = useMemo(() => sites.find((s) => s.site_id === siteId), [sites, siteId])

  function updateEntry(uid: string, patch: Partial<Entry>) {
    setEntries((prev) => prev.map((e) => (e.uid === uid ? { ...e, ...patch } : e)))
  }
  function addEntry() {
    setEntries((prev) => [...prev, emptyEntry()])
  }
  function removeEntry(uid: string) {
    setEntries((prev) => (prev.length === 1 ? prev : prev.filter((e) => e.uid !== uid)))
  }
  function applyTemplate(t: SavedTemplate) {
    // Find first empty-keyword entry to fill, otherwise append a new one.
    const targetIdx = entries.findIndex((e) => !e.keyword && !e.url)
    const filled: Entry = {
      uid: targetIdx >= 0 ? entries[targetIdx].uid : newUid(),
      provider: t.provider,
      keyword: t.keyword,
      url: t.url,
      anchor: t.anchor,
      anchor_ja: t.anchor_ja,
      anchor_zh: t.anchor_zh,
    }
    if (targetIdx >= 0) {
      setEntries((prev) => prev.map((e, i) => (i === targetIdx ? filled : e)))
    } else {
      setEntries((prev) => [...prev, filled])
    }
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

  function validateEntries(): string | null {
    if (!siteId || !slug) return '사이트와 글을 선택하세요.'
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]
      if (!e.keyword || !e.url || !e.anchor) {
        return `${i + 1}번 링크: 키워드 / URL / EN 앵커는 필수입니다.`
      }
      try { new URL(e.url) } catch { return `${i + 1}번 링크: URL이 올바르지 않습니다.` }
    }
    return null
  }

  async function handleSubmit() {
    const err = validateEntries()
    if (err) {
      setResult({ kind: 'err', message: err })
      return
    }
    setResult({ kind: 'busy' })

    const allResults: EntryResult[] = []
    for (const entry of entries) {
      const langResults: LangResult[] = []

      // EN: inline replace
      const enRes = await callOne({
        site_id: siteId, slug, lang: 'en', mode: 'replace',
        keyword: entry.keyword, url: entry.url, anchor: entry.anchor,
      })
      langResults.push(buildLangResult('en', enRes))

      if (allLangs) {
        const jaRes = await callOne({
          site_id: siteId, slug, lang: 'ja', mode: 'append',
          url: entry.url, anchor: entry.anchor_ja || entry.anchor,
        })
        langResults.push(buildLangResult('ja', jaRes))

        const zhRes = await callOne({
          site_id: siteId, slug, lang: 'zh-hans', mode: 'append',
          url: entry.url, anchor: entry.anchor_zh || entry.anchor,
        })
        langResults.push(buildLangResult('zh-hans', zhRes))
      }

      allResults.push({ uid: entry.uid, results: langResults })

      // Save template if EN succeeded
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
    setTemplates(loadTemplates())
    setResult({ kind: 'done', entries: allResults })
  }

  return (
    <Card>
      <CardHead>
        <Icons.Edit size={14} />
        <div className="text-[13.5px] font-semibold">멀티 어필리에이트 삽입</div>
      </CardHead>

      <div className="p-4 space-y-3">
        {templates.length > 0 && (
          <div className="mb-2 p-3 bg-[color:var(--color-bg-subtle)] rounded-md">
            <div className="text-[11.5px] text-[color:var(--color-text-3)] mb-2 uppercase tracking-wider">
              저장된 어필리에이트 ({templates.length}) — 클릭하면 빈 행에 채워짐
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
            onChange={(e) => {
              const s = e.target.value
              setSiteId(s)
              const first = sites.find((x) => x.site_id === s)?.posts[0]?.slug ?? ''
              setSlug(first)
            }}
            className="w-full px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
          >
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.site_id} ({s.posts.length} published)
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="글 (slug)">
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
          >
            {currentSite?.posts.map((p) => (
              <option key={p.slug} value={p.slug}>
                [{p.categoryId}] {p.title.slice(0, 70)}
              </option>
            )) ?? null}
          </select>
        </FieldRow>

        <FieldRow label="다국어 적용">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={allLangs} onChange={(e) => setAllLangs(e.target.checked)} />
            <span className="text-[12.5px]">JA / ZH 본문 끝에도 어필리에이트 CTA 추가 (체크 해제 시 EN만)</span>
          </label>
        </FieldRow>

        <div className="border-t border-[color:var(--color-line)] my-3" />

        {/* Entry list */}
        <div className="space-y-3">
          {entries.map((entry, i) => {
            const entryResult = result.kind === 'done' ? result.entries.find((r) => r.uid === entry.uid) : null
            return (
              <div
                key={entry.uid}
                className="p-3 border border-[color:var(--color-line)] rounded-lg bg-[color:var(--color-bg-elev)] space-y-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Chip kind="ghost">{i + 1}</Chip>
                  <select
                    value={entry.provider}
                    onChange={(e) => updateEntry(entry.uid, { provider: e.target.value })}
                    className="px-2 py-1 text-[12px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
                  >
                    {PROVIDER_PRESET.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const prov = PROVIDER_PRESET.find((p) => p.id === entry.provider)
                      if (prov) updateEntry(entry.uid, { anchor: prov.name })
                    }}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] hover:bg-[color:var(--color-line)]"
                    title="앵커 텍스트를 provider 이름으로 채움"
                  >
                    앵커=provider
                  </button>
                  <div className="flex-1" />
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(entry.uid)}
                      className="text-[11px] px-2 py-0.5 rounded-md text-[color:var(--color-err)] hover:bg-[color:var(--color-bg-subtle)]"
                    >
                      × 삭제
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={entry.keyword}
                    onChange={(e) => updateEntry(entry.uid, { keyword: e.target.value })}
                    placeholder="EN 키워드 (본문 매칭)"
                    className="px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
                  />
                  <input
                    value={entry.url}
                    onChange={(e) => updateEntry(entry.uid, { url: e.target.value })}
                    placeholder="https://..."
                    className="px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md font-mono"
                  />
                </div>
                <input
                  value={entry.anchor}
                  onChange={(e) => updateEntry(entry.uid, { anchor: e.target.value })}
                  placeholder="EN 앵커 (필수)"
                  className="w-full px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
                />
                {allLangs && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={entry.anchor_ja}
                      onChange={(e) => updateEntry(entry.uid, { anchor_ja: e.target.value })}
                      placeholder="JA 앵커 (선택, 비우면 EN 사용)"
                      className="px-3 py-2 text-[12.5px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
                    />
                    <input
                      value={entry.anchor_zh}
                      onChange={(e) => updateEntry(entry.uid, { anchor_zh: e.target.value })}
                      placeholder="ZH 앵커 (선택, 비우면 EN 사용)"
                      className="px-3 py-2 text-[12.5px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
                    />
                  </div>
                )}

                {entryResult && (
                  <div className="pt-1.5 mt-1 border-t border-[color:var(--color-line)] space-y-1">
                    {entryResult.results.map((r) => (
                      <div key={r.lang} className="flex items-center gap-2 text-[11.5px]">
                        <span className="font-mono w-14 text-[color:var(--color-text-3)]">{r.lang}</span>
                        <Chip kind={r.ok ? 'ok' : 'err'} dot={r.ok}>
                          {r.message}
                        </Chip>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <button
            onClick={addEntry}
            className="w-full py-2 text-[12.5px] rounded-md border border-dashed border-[color:var(--color-line)] text-[color:var(--color-text-3)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-text-1)]"
          >
            + 링크 추가
          </button>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Button variant="accent" onClick={handleSubmit} disabled={result.kind === 'busy'}>
            {result.kind === 'busy' ? '처리 중…' : `${entries.length}개 링크 모두 삽입${allLangs ? ' (×3 lang)' : ''}`}
          </Button>
          {result.kind === 'err' && <Chip kind="err">실패: {result.message}</Chip>}
          {result.kind === 'done' && (
            <Chip kind="ok" dot>
              완료 — 결과는 각 링크 하단 참고
            </Chip>
          )}
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
