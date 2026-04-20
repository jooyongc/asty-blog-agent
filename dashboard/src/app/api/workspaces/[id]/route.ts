import { NextRequest, NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { encrypt } from '@/lib/crypto'
import { deleteWorkspace, updateWorkspace } from '@/lib/workspaces-client'
import { clearActiveWorkspace } from '@/lib/active-workspace'

export const runtime = 'nodejs'

type PatchBody = {
  name?: string
  site_url?: string
  agent_api_key?: string // plaintext — will be encrypted before forwarding
  languages?: string[]
  canonical_lang?: string
  categories?: string[]
  profile?: 'lean' | 'standard' | 'full'
  active?: boolean
  site_id?: string // only used as AAD for re-encryption
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = (await req.json().catch(() => null)) as PatchBody | null
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const forwardPatch: Record<string, unknown> = {}
  if (body.name != null) forwardPatch.name = body.name
  if (body.site_url != null) forwardPatch.site_url = body.site_url
  if (body.languages != null) forwardPatch.languages = body.languages
  if (body.canonical_lang != null) forwardPatch.canonical_lang = body.canonical_lang
  if (body.categories != null) forwardPatch.categories = body.categories
  if (body.profile != null) forwardPatch.profile = body.profile
  if (body.active != null) forwardPatch.active = body.active

  // If user supplied a new plaintext api key, re-encrypt with the site_id AAD.
  if (body.agent_api_key) {
    if (!body.site_id) {
      return NextResponse.json(
        { error: 'site_id is required to re-encrypt agent_api_key (AAD)' },
        { status: 400 },
      )
    }
    try {
      forwardPatch.encrypted_api_key = encrypt(body.agent_api_key, body.site_id)
    } catch (e) {
      return NextResponse.json(
        { error: `encryption failed: ${(e as Error).message}` },
        { status: 500 },
      )
    }
  }

  if (Object.keys(forwardPatch).length === 0) {
    return NextResponse.json({ error: 'no updates' }, { status: 400 })
  }

  const result = await updateWorkspace(id, forwardPatch)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }
  return NextResponse.json({ ok: true, workspace: result })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const result = await deleteWorkspace(id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'delete failed' }, { status: 502 })
  }
  // If the active workspace was just deactivated, the active-workspace helper
  // will auto-fall-through on next read, but we can clear proactively.
  await clearActiveWorkspace()
  return NextResponse.json({ ok: true })
}
