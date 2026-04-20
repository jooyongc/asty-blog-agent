'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Chip } from '@/components/primitives'
import { Icons } from '@/components/icons'
import { WorkspaceForm } from './workspace-form'
import type { Workspace } from '@/lib/workspaces-client'

type Props = {
  workspaces: Workspace[]
  activeId: string | null
}

type DialogState =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'edit'; workspace: Workspace }

export function WorkspaceTable({ workspaces, activeId }: Props) {
  const router = useRouter()
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' })
  const [busy, setBusy] = useState<string | null>(null)

  async function handleDelete(w: Workspace) {
    if (!confirm(`${w.site_id} 워크스페이스를 비활성화할까요? (소프트 삭제, 재활성화 가능)`)) return
    setBusy(w.id)
    try {
      const res = await fetch(`/api/workspaces/${w.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const t = await res.text()
        alert(`삭제 실패: ${t.slice(0, 200)}`)
        return
      }
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function handleActivate(w: Workspace) {
    setBusy(w.id)
    try {
      const res = await fetch('/api/workspaces/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: w.site_id }),
      })
      if (!res.ok) {
        alert(`활성화 실패: ${await res.text()}`)
        return
      }
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="p-3.5 flex justify-end">
        <Button variant="accent" onClick={() => setDialog({ kind: 'create' })}>
          <Icons.Plus size={12} /> 사이트 추가
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-[13px] text-[color:var(--color-text-3)] mb-2">
            아직 등록된 워크스페이스가 없습니다.
          </div>
          <div className="text-[11.5px] text-[color:var(--color-text-4)]">
            위의 <strong>&quot;사이트 추가&quot;</strong> 버튼으로 첫 사이트를 등록하세요.
            등록 전까지는 폴백 설정(asty-cabin 단일 사이트)으로 동작합니다.
          </div>
        </div>
      ) : (
        <table className="w-full text-[13px]">
          <thead className="bg-[color:var(--color-bg-subtle)] text-[11.5px] uppercase tracking-wider text-[color:var(--color-text-3)]">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">site_id</th>
              <th className="text-left px-4 py-2.5 font-medium">이름</th>
              <th className="text-left px-4 py-2.5 font-medium">URL</th>
              <th className="text-left px-4 py-2.5 font-medium">프로파일</th>
              <th className="text-left px-4 py-2.5 font-medium">상태</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {workspaces.map((w) => {
              const isActive = activeId === w.site_id
              return (
                <tr
                  key={w.id}
                  className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-bg-subtle)]"
                >
                  <td className="px-4 py-3 font-mono text-[12.5px]">
                    {w.site_id}
                    {isActive && <Chip kind="ok" dot className="ml-1.5">활성</Chip>}
                  </td>
                  <td className="px-4 py-3">{w.name}</td>
                  <td className="px-4 py-3 text-[11.5px] text-[color:var(--color-blue)]">
                    <a href={w.site_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {w.site_url.replace(/^https?:\/\//, '')}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <Chip kind={w.profile === 'lean' ? 'ok' : w.profile === 'standard' ? 'warn' : 'err'}>
                      {w.profile}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    {w.active ? (
                      <Chip kind="ok" dot>active</Chip>
                    ) : (
                      <Chip kind="ghost">inactive</Chip>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1.5">
                      {!isActive && w.active && (
                        <Button size="sm" onClick={() => handleActivate(w)} disabled={busy === w.id}>
                          활성화
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setDialog({ kind: 'edit', workspace: w })}>
                        <Icons.Edit size={11} /> 편집
                      </Button>
                      {w.active && (
                        <Button
                          size="sm"
                          onClick={() => handleDelete(w)}
                          disabled={busy === w.id}
                          style={{ color: 'var(--color-err)' }}
                        >
                          비활성화
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {dialog.kind !== 'none' && (
        <WorkspaceForm
          mode={dialog.kind}
          initial={dialog.kind === 'edit' ? dialog.workspace : null}
          allWorkspaces={workspaces.filter((w) => w.active)}
          onClose={() => setDialog({ kind: 'none' })}
          onSaved={() => {
            setDialog({ kind: 'none' })
            router.refresh()
          }}
        />
      )}
    </>
  )
}
