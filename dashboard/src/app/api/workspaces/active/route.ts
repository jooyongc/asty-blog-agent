import { NextRequest, NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { setActiveWorkspaceId } from '@/lib/active-workspace'
import { listWorkspaces } from '@/lib/workspaces-client'

export const runtime = 'nodejs'

/**
 * POST /api/workspaces/active
 * Body: { site_id: string }
 * Sets the active workspace cookie after validating the site_id exists.
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as { site_id?: string } | null
  if (!body?.site_id) {
    return NextResponse.json({ error: 'site_id required' }, { status: 400 })
  }

  const workspaces = await listWorkspaces()
  const target = workspaces.find((w) => w.site_id === body.site_id && w.active)
  if (!target) {
    return NextResponse.json({ error: 'Unknown or inactive site_id' }, { status: 404 })
  }

  await setActiveWorkspaceId(target.site_id)
  return NextResponse.json({ ok: true, site_id: target.site_id })
}
