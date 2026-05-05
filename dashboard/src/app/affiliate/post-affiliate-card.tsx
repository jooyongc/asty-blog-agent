'use client'

import { useState } from 'react'
import { Button, Chip } from '@/components/primitives'
import type { AffiliateLink, Lang, PostStatus } from './affiliate-client'

const PROVIDER_PRESET = [
  { id: 'klook', name: 'Klook' },
  { id: 'kkday', name: 'KKday' },
  { id: 'viator', name: 'Viator' },
  { id: 'sesigan', name: '세시간전' },
] as const

type Props = {
  siteId: string
  post: PostStatus
  onInserted: () => void
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'done'; results: { lang: Lang; ok: boolean; message: string }[] }
  | { kind: 'err'; message: string }

export function PostAffiliateCard({ siteId, post, onInserted }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [provider, setProvider] = useState<string>(PROVIDER_PRESET[0].id)
  const [keyword, setKeyword] = useState('')
  const [url, setUrl] = useState('')
  const [anchor, setAnchor] = useState('')
  const [anchorJa, setAnchorJa] = useState('')
  const [anchorZh, setAnchorZh] = useState('')
  const [allLangs, setAllLangs] = useState(true)
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' })

  function reset() {
    setKeyword(''); setUrl(''); setAnchor(''); setAnchorJa(''); setAnchorZh('')
    setSubmit({ kind: 'idle' })
  }

  async function callOne(payload: Record<string, unknown>) {
    const res = await fetch('/api/affiliate-insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    return { ok: res.ok, data: data as { error?: string; replaced?: number; note?: string; matched?: string } }
  }

  async function handleSubmit() {
    if (!keyword || !url || !anchor) {
      setSubmit({ kind: 'err', message: '키워드 / URL / EN 앵커는 필수입니다.' })
      return
    }
    try { new URL(url) } catch {
      setSubmit({ kind: 'err', message: 'URL 형식이 올바르지 않습니다.' })
      return
    }
    setSubmit({ kind: 'busy' })

    const results: { lang: Lang; ok: boolean; message: string }[] = []
    const enRes = await callOne({
      site_id: siteId, slug: post.slug, lang: 'en', mode: 'replace', keyword, url, anchor,
    })
    results.push(toResult('en', enRes))

    if (allLangs) {
      const jaRes = await callOne({
        site_id: siteId, slug: post.slug, lang: 'ja', mode: 'append', url, anchor: anchorJa || anchor,
      })
      results.push(toResult('ja', jaRes))
      const zhRes = await callOne({
        site_id: siteId, slug: post.slug, lang: 'zh-hans', mode: 'append', url, anchor: anchorZh || anchor,
      })
      results.push(toResult('zh-hans', zhRes))
    }

    setSubmit({ kind: 'done', results })
    if (results[0]?.ok) {
      onInserted()
      // Clear inputs but keep the form expanded so the user can see the success and add another
      setTimeout(reset, 1500)
    }
  }

  const totalChips = post.totalLinks
  const hasLinks = totalChips > 0

  return (
    <div className={`border rounded-lg overflow-hidden ${expanded ? 'border-[color:var(--color-accent)]' : 'border-[color:var(--color-line)]'}`}>
      <div
        onClick={() => setExpanded((v) => !v)}
        className="flex items-start gap-2.5 p-3 cursor-pointer hover:bg-[color:var(--color-bg-subtle)]"
      >
        <span className="text-[11px] text-[color:var(--color-text-4)] mt-0.5 select-none">
          {expanded ? '▼' : '▶'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-medium truncate">{post.title}</span>
            <Chip kind="ghost">{post.category}</Chip>
            <Chip kind={hasLinks ? 'ok' : 'warn'} dot={hasLinks}>
              {hasLinks ? `${totalChips}개 링크` : '링크 없음'}
            </Chip>
          </div>
          <div className="text-[10.5px] text-[color:var(--color-text-4)] font-mono mt-0.5 truncate">
            {post.slug}
          </div>
          {hasLinks && !expanded && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(['en', 'ja', 'zh-hans'] as Lang[]).flatMap((lang) =>
                post.links[lang].slice(0, 4).map((l, i) => (
                  <span
                    key={`${lang}-${i}`}
                    className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)]"
                    title={l.url}
                  >
                    <span className="text-[color:var(--color-text-4)]">{lang}:</span> {l.provider ?? '?'}
                  </span>
                )),
              )}
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[color:var(--color-line)] bg-[color:var(--color-bg-subtle)] p-3 space-y-3">
          {/* Existing links */}
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-text-3)]">현재 적용된 링크</div>
            {(['en', 'ja', 'zh-hans'] as Lang[]).map((lang) => (
              <ExistingLangLinks key={lang} lang={lang} links={post.links[lang]} />
            ))}
          </div>

          {/* Inline add form */}
          <div className="border-t border-[color:var(--color-line)] pt-3 space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-text-3)]">+ 어필리에이트 추가</div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="px-2 py-1 text-[12px] bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] rounded-md"
              >
                {PROVIDER_PRESET.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const prov = PROVIDER_PRESET.find((p) => p.id === provider)
                  if (prov) setAnchor(prov.name)
                }}
                className="text-[11px] px-2 py-0.5 rounded-md bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] hover:bg-[color:var(--color-line)]"
              >
                앵커=provider
              </button>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11.5px] ml-auto">
                <input type="checkbox" checked={allLangs} onChange={(e) => setAllLangs(e.target.checked)} />
                JA/ZH 본문 끝에도 추가
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="EN 키워드 (본문 매칭)"
                className="px-3 py-1.5 text-[12.5px] bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] rounded-md"
              />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="px-3 py-1.5 text-[12.5px] bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] rounded-md font-mono"
              />
            </div>
            <input
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
              placeholder="EN 앵커 (필수)"
              className="w-full px-3 py-1.5 text-[12.5px] bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] rounded-md"
            />
            {allLangs && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={anchorJa}
                  onChange={(e) => setAnchorJa(e.target.value)}
                  placeholder="JA 앵커 (선택)"
                  className="px-3 py-1.5 text-[12px] bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] rounded-md"
                />
                <input
                  value={anchorZh}
                  onChange={(e) => setAnchorZh(e.target.value)}
                  placeholder="ZH 앵커 (선택)"
                  className="px-3 py-1.5 text-[12px] bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] rounded-md"
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button variant="accent" onClick={handleSubmit} disabled={submit.kind === 'busy'}>
                {submit.kind === 'busy' ? '처리 중…' : '삽입'}
              </Button>
              {submit.kind === 'err' && <Chip kind="err">{submit.message}</Chip>}
            </div>

            {submit.kind === 'done' && (
              <div className="space-y-1 pt-1">
                {submit.results.map((r) => (
                  <div key={r.lang} className="flex items-center gap-2 text-[11.5px]">
                    <span className="font-mono w-14 text-[color:var(--color-text-3)]">{r.lang}</span>
                    <Chip kind={r.ok ? 'ok' : 'err'} dot={r.ok}>{r.message}</Chip>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ExistingLangLinks({ lang, links }: { lang: Lang; links: AffiliateLink[] }) {
  if (links.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[11.5px] text-[color:var(--color-text-4)]">
        <span className="font-mono w-14">{lang}</span>
        <span>없음</span>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2 text-[11.5px]">
      <span className="font-mono w-14 text-[color:var(--color-text-3)] shrink-0 pt-0.5">{lang}</span>
      <div className="flex-1 flex flex-wrap gap-1">
        {links.map((l, i) => {
          const provName = PROVIDER_PRESET.find((p) => p.id === l.provider)?.name ?? l.provider ?? '?'
          return (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-bg-elev)] hover:border-[color:var(--color-accent)]"
              title={l.url}
            >
              <span className="font-medium">{provName}</span>
              <span className="text-[10px] text-[color:var(--color-text-4)] truncate max-w-[160px]">
                {l.anchor}
              </span>
              {l.source === 'markdown' && (
                <span className="text-[9px] text-[color:var(--color-text-4)] uppercase">md</span>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}

function toResult(lang: Lang, res: { ok: boolean; data: { error?: string; replaced?: number; note?: string; matched?: string } }): { lang: Lang; ok: boolean; message: string } {
  if (!res.ok) return { lang, ok: false, message: res.data.error ?? '실패' }
  const replaced = res.data.replaced ?? 0
  if (replaced > 0) return { lang, ok: true, message: `삽입됨${res.data.matched ? ` (${res.data.matched})` : ''}` }
  return { lang, ok: true, message: res.data.note ?? '이미 존재' }
}
