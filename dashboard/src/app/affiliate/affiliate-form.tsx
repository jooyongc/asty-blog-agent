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

type ResultState =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'multi'; results: LangResult[] }
  | { kind: 'err'; message: string }

type SavedTemplate = {
  id: string
  label: string
  keyword: string
  url: string
  anchor: string
  anchor_ja?: string
  anchor_zh?: string
  lang: Lang
  used_at: number
}

type LangResult = { lang: Lang; ok: boolean; message: string }

const STORAGE_KEY = 'affiliate-templates-v1'

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
  // Dedupe by url+keyword+lang — bump used_at if exists
  const idx = all.findIndex((x) => x.url === t.url && x.keyword === t.keyword && x.lang === t.lang)
  if (idx >= 0) all[idx] = { ...all[idx], ...t, used_at: Date.now() }
  else all.unshift({ ...t, used_at: Date.now() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 20)))
}

function deleteTemplate(id: string) {
  if (typeof window === 'undefined') return
  const all = loadTemplates().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function AffiliateInsertForm({ sites }: Props) {
  const [siteId, setSiteId] = useState(sites[0]?.site_id ?? '')
  const [slug, setSlug] = useState(sites[0]?.posts[0]?.slug ?? '')
  const [keyword, setKeyword] = useState('')
  const [url, setUrl] = useState('')
  const [anchor, setAnchor] = useState('')
  const [anchorJa, setAnchorJa] = useState('')
  const [anchorZh, setAnchorZh] = useState('')
  const [label, setLabel] = useState('')
  const [allLangs, setAllLangs] = useState(true)
  const [result, setResult] = useState<ResultState>({ kind: 'idle' })
  const [templates, setTemplates] = useState<SavedTemplate[]>([])

  useEffect(() => { setTemplates(loadTemplates()) }, [])

  const currentSite = useMemo(() => sites.find((s) => s.site_id === siteId), [sites, siteId])
  const providers = currentSite?.affiliate?.providers ?? {}

  function applyProvider(providerId: string) {
    const p = providers[providerId]
    if (!p) return
    setAnchor(p.name)
    if (!label) setLabel(p.name)
  }

  function applyTemplate(t: SavedTemplate) {
    setKeyword(t.keyword)
    setUrl(t.url)
    setAnchor(t.anchor)
    setAnchorJa(t.anchor_ja ?? '')
    setAnchorZh(t.anchor_zh ?? '')
    setLabel(t.label)
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

  async function handleSubmit() {
    if (!siteId || !slug || !url || !anchor) {
      setResult({ kind: 'err', message: '사이트/글/URL/EN 앵커는 필수입니다.' })
      return
    }
    if (!keyword) {
      setResult({ kind: 'err', message: 'EN 키워드는 필수입니다 (영문 본문 매칭용).' })
      return
    }
    setResult({ kind: 'busy' })

    const tasks: { lang: Lang; payload: Record<string, unknown> }[] = []
    // EN: inline replace by keyword (always)
    tasks.push({
      lang: 'en',
      payload: { site_id: siteId, slug, lang: 'en', mode: 'replace', keyword, url, anchor },
    })
    if (allLangs) {
      // JA: append CTA at end (uses anchor_ja or falls back to anchor)
      tasks.push({
        lang: 'ja',
        payload: { site_id: siteId, slug, lang: 'ja', mode: 'append', url, anchor: anchorJa || anchor },
      })
      // ZH: append CTA at end
      tasks.push({
        lang: 'zh-hans',
        payload: { site_id: siteId, slug, lang: 'zh-hans', mode: 'append', url, anchor: anchorZh || anchor },
      })
    }

    const results: LangResult[] = []
    for (const t of tasks) {
      const r = await callOne(t.payload)
      if (r.ok) {
        const replaced = r.data.replaced ?? 0
        results.push({
          lang: t.lang,
          ok: true,
          message: replaced > 0 ? `삽입됨 (${r.data.matched ?? ''})` : (r.data.note ?? '이미 존재'),
        })
      } else {
        results.push({ lang: t.lang, ok: false, message: r.data.error ?? '실패' })
      }
    }

    // Save template if EN succeeded
    const enOk = results[0]?.ok
    if (enOk) {
      saveTemplate({
        id: `${url}|${keyword}|en`,
        label: label || anchor,
        keyword,
        url,
        anchor,
        anchor_ja: anchorJa || undefined,
        anchor_zh: anchorZh || undefined,
        lang: 'en',
        used_at: Date.now(),
      })
      setTemplates(loadTemplates())
    }

    setResult({ kind: 'multi', results })
  }

  return (
    <Card>
      <CardHead>
        <Icons.Edit size={14} />
        <div className="text-[13.5px] font-semibold">새 링크 삽입</div>
      </CardHead>

      <div className="p-4 space-y-3">
        {templates.length > 0 && (
          <div className="mb-2 p-3 bg-[color:var(--color-bg-subtle)] rounded-md">
            <div className="text-[11.5px] text-[color:var(--color-text-3)] mb-2 uppercase tracking-wider">저장된 어필리에이트 (클릭하여 채우기)</div>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="group inline-flex items-center gap-1 px-2.5 py-1 text-[12px] rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-bg-elev)] hover:border-[color:var(--color-accent)] cursor-pointer"
                  onClick={() => applyTemplate(t)}
                  title={`${t.url}\nkeyword: ${t.keyword}\nanchor: ${t.anchor}`}
                >
                  <span className="font-medium">{t.label}</span>
                  <span className="text-[10.5px] text-[color:var(--color-text-4)]">/{t.lang}</span>
                  <button
                    onClick={(e) => handleDeleteTemplate(t.id, e)}
                    className="ml-0.5 text-[color:var(--color-text-4)] hover:text-[color:var(--color-err)] opacity-0 group-hover:opacity-100"
                    aria-label="삭제"
                  >
                    ×
                  </button>
                </div>
              ))}
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

        <FieldRow label="EN 키워드">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="영문 본문에서 매칭할 키워드 (예: book activities)"
            className="w-full px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
          />
          <div className="mt-1 text-[11px] text-[color:var(--color-text-4)]">
            EN은 본문 내 첫 등장 위치에 인라인 치환됩니다.
          </div>
        </FieldRow>

        <FieldRow label="EN 앵커">
          <input
            value={anchor}
            onChange={(e) => setAnchor(e.target.value)}
            placeholder="영문 링크에 표시될 텍스트"
            className="w-full px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
          />
          {Object.keys(providers).length > 0 && (
            <div className="mt-1.5 flex gap-1.5">
              <span className="text-[11px] text-[color:var(--color-text-4)] self-center">provider:</span>
              {Object.entries(providers).map(([id, p]) => (
                <button
                  key={id}
                  onClick={() => applyProvider(id)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] hover:bg-[color:var(--color-line)]"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </FieldRow>

        <FieldRow label="다국어 적용">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={allLangs} onChange={(e) => setAllLangs(e.target.checked)} />
            <span className="text-[12.5px]">JA / ZH 본문 끝에도 어필리에이트 CTA 추가</span>
          </label>
        </FieldRow>

        {allLangs && (
          <>
            <FieldRow label="JA 앵커 (선택)">
              <input
                value={anchorJa}
                onChange={(e) => setAnchorJa(e.target.value)}
                placeholder="日本語のアンカーテキスト (비워두면 EN 앵커 사용)"
                className="w-full px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
              />
            </FieldRow>

            <FieldRow label="ZH 앵커 (선택)">
              <input
                value={anchorZh}
                onChange={(e) => setAnchorZh(e.target.value)}
                placeholder="中文锚文本 (비워두면 EN 앵커 사용)"
                className="w-full px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
              />
            </FieldRow>
          </>
        )}

        <FieldRow label="어필리에이트 URL">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md font-mono"
          />
        </FieldRow>

        <div className="pt-2">
          <Button variant="accent" onClick={handleSubmit} disabled={result.kind === 'busy'}>
            {result.kind === 'busy' ? '처리 중…' : (allLangs ? '3개 언어 모두 삽입' : '링크 삽입')}
          </Button>
        </div>

        {result.kind === 'err' && (
          <div className="mt-2"><Chip kind="err">실패: {result.message}</Chip></div>
        )}

        {result.kind === 'multi' && (
          <div className="mt-2 space-y-1.5">
            {result.results.map((r) => (
              <div key={r.lang} className="flex items-center gap-2 text-[12px]">
                <span className="font-mono w-16 text-[color:var(--color-text-3)]">{r.lang}</span>
                <Chip kind={r.ok ? 'ok' : 'err'} dot={r.ok}>
                  {r.message}
                </Chip>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
      <div className="text-[12px] text-[color:var(--color-text-3)] pt-2">{label}</div>
      <div>{children}</div>
    </div>
  )
}
