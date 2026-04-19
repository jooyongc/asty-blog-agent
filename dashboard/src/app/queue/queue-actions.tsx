'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Chip } from '@/components/primitives'
import { Icons } from '@/components/icons'

export function QueueActions({
  siteId,
  slug,
  isPending,
  isBlocked,
  status,
}: {
  siteId: string
  slug: string
  isPending: boolean
  isBlocked: boolean
  status: string
}) {
  const router = useRouter()
  const [busy, startTransition] = useTransition()
  const [err, setErr] = useState('')

  async function call(action: 'approve' | 'reject', extra: Record<string, unknown> = {}) {
    setErr('')
    const res = await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, site_id: siteId, slug, ...extra }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setErr(body.error ?? `HTTP ${res.status}`)
      return
    }
    startTransition(() => router.refresh())
  }

  function handleReject() {
    const reason = window.prompt('반려 사유 (작성자 피드백용):') ?? ''
    void call('reject', { reason: reason.trim() || undefined })
  }

  if (status === 'approved') {
    return (
      <Chip kind="ok" dot>
        승인 완료
      </Chip>
    )
  }

  if (status === 'rejected') {
    return (
      <Chip kind="err" dot>
        반려됨
      </Chip>
    )
  }

  if (isBlocked) {
    return (
      <>
        <Button size="sm" disabled={busy}>
          <Icons.Eye size={12} /> 주장 검토
        </Button>
        <Button size="sm" onClick={handleReject} disabled={busy}>
          반려
        </Button>
        {err && <div className="text-[11px] text-[color:var(--color-err)]">{err}</div>}
      </>
    )
  }

  if (isPending) {
    return (
      <>
        <Button variant="accent" onClick={() => call('approve')} disabled={busy}>
          <Icons.Check size={13} /> {busy ? '승인 중…' : '승인'}
        </Button>
        <Button size="sm" disabled={busy}>
          <Icons.Eye size={12} /> 미리보기
        </Button>
        <Button size="sm" onClick={handleReject} disabled={busy}>
          반려
        </Button>
        {err && <div className="text-[11px] text-[color:var(--color-err)]">{err}</div>}
      </>
    )
  }

  return (
    <Chip kind="ghost" dot>
      {status}
    </Chip>
  )
}
