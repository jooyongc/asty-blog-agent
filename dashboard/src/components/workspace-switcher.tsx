'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Icons } from './icons'
import type { Workspace } from '@/lib/workspaces-client'

type Props = {
  workspaces: Workspace[]
  activeId: string | null
}

export function WorkspaceSwitcher({ workspaces, activeId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const active = workspaces.find((w) => w.site_id === activeId) ?? workspaces[0] ?? null

  async function switchTo(siteId: string) {
    if (siteId === activeId) { setOpen(false); return }
    setBusy(true)
    try {
      const res = await fetch('/api/workspaces/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: siteId }),
      })
      if (res.ok) {
        setOpen(false)
        router.refresh()
      } else {
        alert(`전환 실패: ${await res.text()}`)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border hover:bg-[color:var(--color-bg-hover)] transition text-left"
        style={{ borderColor: 'var(--color-line-2)' }}
      >
        <div
          className="w-7 h-7 rounded-md font-semibold flex items-center justify-center text-white text-[12.5px] shrink-0"
          style={{ background: 'linear-gradient(135deg, #2f6f4e, #b66f1c)' }}
        >
          {active?.site_id[0]?.toUpperCase() ?? '—'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold truncate">
            {active?.name ?? '워크스페이스 없음'}
          </div>
          <div className="text-[10.5px] text-[color:var(--color-text-3)] font-mono truncate">
            {active?.site_id ?? '—'}
          </div>
        </div>
        <Icons.ChevronD size={12} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1 z-30 rounded-lg border bg-[color:var(--color-bg-elev)] shadow-lg overflow-hidden"
          style={{ borderColor: 'var(--color-line-2)' }}
        >
          {workspaces.filter((w) => w.active).length === 0 ? (
            <div className="p-3 text-[11.5px] text-[color:var(--color-text-3)]">
              활성 워크스페이스 없음.
            </div>
          ) : (
            workspaces
              .filter((w) => w.active)
              .map((w) => (
                <button
                  key={w.id}
                  onClick={() => switchTo(w.site_id)}
                  disabled={busy}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[color:var(--color-bg-hover)] border-b border-[color:var(--color-line)] last:border-b-0"
                >
                  <div
                    className="w-6 h-6 rounded-md text-[11px] font-semibold flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #2f6f4e, #b66f1c)' }}
                  >
                    {w.site_id[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate">{w.name}</div>
                    <div className="text-[10.5px] text-[color:var(--color-text-4)] font-mono truncate">
                      {w.site_id}
                    </div>
                  </div>
                  {w.site_id === activeId && (
                    <span className="text-[color:var(--color-accent)]">
                      <Icons.Check size={11} />
                    </span>
                  )}
                </button>
              ))
          )}
          <Link
            href="/workspaces"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-[color:var(--color-text-2)] hover:bg-[color:var(--color-bg-hover)]"
            style={{ borderTop: '1px solid var(--color-line)' }}
          >
            <Icons.Plus size={11} /> 사이트 추가 / 관리
          </Link>
        </div>
      )}
    </div>
  )
}
