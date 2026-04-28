'use client'

import { useMemo, useState } from 'react'
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
  | { kind: 'ok'; preview: string; matched: string; replaced: number }
  | { kind: 'err'; message: string }

export function AffiliateInsertForm({ sites }: Props) {
  const [siteId, setSiteId] = useState(sites[0]?.site_id ?? '')
  const [slug, setSlug] = useState(sites[0]?.posts[0]?.slug ?? '')
  const [lang, setLang] = useState<Lang>('en')
  const [keyword, setKeyword] = useState('')
  const [url, setUrl] = useState('')
  const [anchor, setAnchor] = useState('')
  const [result, setResult] = useState<ResultState>({ kind: 'idle' })

  const currentSite = useMemo(() => sites.find((s) => s.site_id === siteId), [sites, siteId])
  const providers = currentSite?.affiliate?.providers ?? {}

  function applyProvider(providerId: string) {
    const p = providers[providerId]
    if (!p) return
    setAnchor(p.name)
  }

  async function handleSubmit() {
    if (!siteId || !slug || !keyword || !url || !anchor) {
      setResult({ kind: 'err', message: '모든 필드를 입력하세요.' })
      return
    }
    setResult({ kind: 'busy' })
    try {
      const res = await fetch('/api/affiliate-insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: siteId, slug, lang, keyword, url, anchor }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ kind: 'err', message: data.error ?? `HTTP ${res.status}` })
        return
      }
      setResult({
        kind: 'ok',
        preview: data.preview ?? '',
        matched: data.matched ?? '',
        replaced: data.replaced ?? 0,
      })
    } catch (e) {
      setResult({ kind: 'err', message: (e as Error).message })
    }
  }

  return (
    <Card>
      <CardHead>
        <Icons.Edit size={14} />
        <div className="text-[13.5px] font-semibold">새 링크 삽입</div>
      </CardHead>

      <div className="p-4 space-y-3">
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

        <FieldRow label="언어">
          <div className="flex gap-1.5">
            {(['en', 'ja', 'zh-hans'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 text-[12.5px] rounded-md border ${
                  lang === l
                    ? 'bg-[color:var(--color-accent)] text-white border-transparent'
                    : 'bg-[color:var(--color-bg-subtle)] border-[color:var(--color-line)]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </FieldRow>

        <FieldRow label="키워드 (본문 매칭)">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: book activities, late-night food, hotel booking"
            className="w-full px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md"
          />
        </FieldRow>

        <FieldRow label="앵커 텍스트">
          <input
            value={anchor}
            onChange={(e) => setAnchor(e.target.value)}
            placeholder="링크에 표시될 텍스트"
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

        <FieldRow label="어필리에이트 URL">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 text-[13px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-line)] rounded-md font-mono"
          />
        </FieldRow>

        <div className="pt-2 flex items-center gap-3">
          <Button variant="accent" onClick={handleSubmit} disabled={result.kind === 'busy'}>
            {result.kind === 'busy' ? '처리 중…' : '링크 삽입'}
          </Button>
          {result.kind === 'ok' && result.replaced > 0 && (
            <Chip kind="ok" dot>
              완료: "{result.matched}" 치환됨
            </Chip>
          )}
          {result.kind === 'ok' && result.replaced === 0 && (
            <Chip kind="ghost">이미 동일 URL 존재 (변경 없음)</Chip>
          )}
          {result.kind === 'err' && <Chip kind="err">실패: {result.message}</Chip>}
        </div>

        {result.kind === 'ok' && result.preview && (
          <div className="mt-2 p-3 bg-[color:var(--color-bg-subtle)] rounded-md text-[12px] font-mono text-[color:var(--color-text-2)] whitespace-pre-wrap break-all">
            …{result.preview}…
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
