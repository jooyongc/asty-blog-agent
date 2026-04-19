import { NextRequest, NextResponse } from 'next/server'
import { getSite } from '@/lib/sites'
import { approveQueueItem, rejectQueueItem } from '@/lib/queue-client'
import { isAuthed } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * Dashboard proxy for queue approve/reject.
 * Expected body: { action: 'approve' | 'reject', site_id, slug, reason?, approved_by? }
 * Session-authed (dashboard cookie).
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as {
    action?: 'approve' | 'reject'
    site_id?: string
    slug?: string
    reason?: string
    approved_by?: string
  } | null
  if (!body || !body.action || !body.site_id || !body.slug) {
    return NextResponse.json({ error: 'site_id, slug, action required' }, { status: 400 })
  }
  const site = getSite(body.site_id)
  if (!site) return NextResponse.json({ error: 'Unknown site' }, { status: 404 })

  const ok =
    body.action === 'approve'
      ? await approveQueueItem(site, body.slug, body.approved_by)
      : await rejectQueueItem(site, body.slug, body.reason)
  if (!ok) return NextResponse.json({ error: 'Site API call failed' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
