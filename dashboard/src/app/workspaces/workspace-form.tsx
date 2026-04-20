'use client'

import { useState } from 'react'
import { Button } from '@/components/primitives'
import { Icons } from '@/components/icons'
import type { Workspace } from '@/lib/workspaces-client'

type Props = {
  mode: 'create' | 'edit'
  initial: Workspace | null
  onClose: () => void
  onSaved: () => void
}

export function WorkspaceForm({ mode, initial, onClose, onSaved }: Props) {
  const [siteId, setSiteId] = useState(initial?.site_id ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [siteUrl, setSiteUrl] = useState(initial?.site_url ?? 'https://')
  const [apiKey, setApiKey] = useState('')
  const [languagesStr, setLanguagesStr] = useState((initial?.languages ?? ['en']).join(', '))
  const [canonicalLang, setCanonicalLang] = useState(initial?.canonical_lang ?? 'en')
  const [categoriesStr, setCategoriesStr] = useState(
    (initial?.categories ?? ['culture', 'food', 'leisure']).join(', '),
  )
  const [profile, setProfile] = useState<'lean' | 'standard' | 'full'>(initial?.profile ?? 'lean')
  const [active, setActive] = useState(initial?.active ?? true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)

    const body: Record<string, unknown> = {
      name: name.trim(),
      site_url: siteUrl.trim(),
      languages: languagesStr.split(',').map((s) => s.trim()).filter(Boolean),
      canonical_lang: canonicalLang.trim() || 'en',
      categories: categoriesStr.split(',').map((s) => s.trim()).filter(Boolean),
      profile,
      active,
    }
    if (apiKey.trim()) {
      body.agent_api_key = apiKey.trim()
      body.site_id = mode === 'create' ? siteId.trim() : initial?.site_id // AAD
    }
    if (mode === 'create') body.site_id = siteId.trim()

    const url = mode === 'create' ? '/api/workspaces' : `/api/workspaces/${initial!.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const text = await res.text()
      if (!res.ok) {
        setError(`HTTP ${res.status}: ${text.slice(0, 300)}`)
        setBusy(false)
        return
      }
      onSaved()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line-2)] rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-3.5 flex items-center gap-2"
          style={{ borderBottom: '1px solid var(--color-line)' }}
        >
          <Icons.Layers size={16} />
          <div className="text-[14.5px] font-semibold">
            {mode === 'create' ? '사이트 추가' : `${initial?.site_id} 편집`}
          </div>
          <div className="flex-1" />
          <Button size="sm" onClick={onClose}><Icons.X size={12} /></Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
          <Field label="site_id" hint="소문자 케밥케이스 (a-z, 0-9, -). 변경 불가.">
            <input
              type="text"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value.toLowerCase())}
              required
              disabled={mode === 'edit'}
              placeholder="my-blog-site"
              pattern="[a-z0-9][a-z0-9-]*"
              className="w-full border rounded px-2.5 py-1.5 text-[13px] font-mono disabled:opacity-60"
              style={{ borderColor: 'var(--color-line-2)' }}
            />
          </Field>

          <Field label="이름" hint="사람이 읽는 이름. 사이드바에 표시됨.">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="My Blog Site"
              className="w-full border rounded px-2.5 py-1.5 text-[13px]"
              style={{ borderColor: 'var(--color-line-2)' }}
            />
          </Field>

          <Field label="사이트 URL" hint="https:// 포함. 배포된 블로그 URL.">
            <input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              required
              placeholder="https://example.com"
              className="w-full border rounded px-2.5 py-1.5 text-[13px] font-mono"
              style={{ borderColor: 'var(--color-line-2)' }}
            />
          </Field>

          <Field
            label="AGENT_API_KEY"
            hint={
              mode === 'create'
                ? '사이트 배포의 Vercel env에서 복사한 값. 저장 시 AES-256-GCM으로 암호화됨.'
                : '비워두면 기존 키 유지. 교체하려면 새 키 입력.'
            }
          >
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required={mode === 'create'}
              placeholder={mode === 'create' ? '키 붙여넣기' : '(변경 시에만 입력)'}
              autoComplete="new-password"
              className="w-full border rounded px-2.5 py-1.5 text-[13px] font-mono"
              style={{ borderColor: 'var(--color-line-2)' }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="언어" hint="쉼표 구분. 예: en, ja, zh-hans">
              <input
                type="text"
                value={languagesStr}
                onChange={(e) => setLanguagesStr(e.target.value)}
                className="w-full border rounded px-2.5 py-1.5 text-[13px] font-mono"
                style={{ borderColor: 'var(--color-line-2)' }}
              />
            </Field>
            <Field label="기본 언어" hint="canonical_lang">
              <input
                type="text"
                value={canonicalLang}
                onChange={(e) => setCanonicalLang(e.target.value)}
                className="w-full border rounded px-2.5 py-1.5 text-[13px] font-mono"
                style={{ borderColor: 'var(--color-line-2)' }}
              />
            </Field>
          </div>

          <Field label="카테고리" hint="쉼표 구분">
            <input
              type="text"
              value={categoriesStr}
              onChange={(e) => setCategoriesStr(e.target.value)}
              className="w-full border rounded px-2.5 py-1.5 text-[13px] font-mono"
              style={{ borderColor: 'var(--color-line-2)' }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3 items-end">
            <Field label="예산 프로파일" hint="lean $5, standard $5.5, full $6.5 /월">
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value as 'lean' | 'standard' | 'full')}
                className="w-full border rounded px-2.5 py-1.5 text-[13px]"
                style={{ borderColor: 'var(--color-line-2)' }}
              >
                <option value="lean">lean</option>
                <option value="standard">standard</option>
                <option value="full">full</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-[12.5px] pb-1.5">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              활성 (비활성화 시 목록·집계에서 제외)
            </label>
          </div>

          {error && (
            <div
              className="px-3 py-2 rounded text-[12px]"
              style={{ background: 'var(--color-err-soft)', color: 'var(--color-err)' }}
            >
              ⚠ {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2" style={{ borderTop: '1px solid var(--color-line)' }}>
            <Button size="sm" onClick={onClose} type="button">취소</Button>
            <Button type="submit" variant="accent" disabled={busy}>
              {busy ? '저장 중…' : (mode === 'create' ? '생성' : '저장')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[11.5px] font-semibold">{label}</span>
        {hint && (
          <span className="text-[10.5px] text-[color:var(--color-text-4)]">{hint}</span>
        )}
      </div>
      {children}
    </div>
  )
}

