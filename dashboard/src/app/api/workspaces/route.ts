import { NextRequest, NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { encrypt, isCiphertextFormat } from '@/lib/crypto'
import { createWorkspace, listWorkspaces } from '@/lib/workspaces-client'

export const runtime = 'nodejs'

/**
 * Dashboard-side proxy to asty-cabin's /api/admin/dashboard/workspaces.
 * Session-authed (dashboard cookie).
 *
 * - GET: list workspaces (ciphertext kept as opaque)
 * - POST: encrypts `agent_api_key` plaintext client-supplied here into
 *   `encrypted_api_key` before forwarding to the control plane.
 */

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const workspaces = await listWorkspaces()
  return NextResponse.json({ workspaces })
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as {
    site_id?: string
    name?: string
    site_url?: string
    agent_api_key?: string
    languages?: string[]
    canonical_lang?: string
    categories?: string[]
    profile?: 'lean' | 'standard' | 'full'
    active?: boolean
  } | null

  if (!body?.site_id || !body.name || !body.site_url || !body.agent_api_key) {
    return NextResponse.json(
      { error: 'site_id, name, site_url, agent_api_key are required' },
      { status: 400 },
    )
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(body.site_id)) {
    return NextResponse.json(
      { error: 'site_id must be lowercase kebab-case (a-z, 0-9, -)' },
      { status: 400 },
    )
  }

  let encrypted: string
  try {
    encrypted = encrypt(body.agent_api_key, body.site_id)
  } catch (e) {
    return NextResponse.json(
      { error: `encryption failed: ${(e as Error).message}` },
      { status: 500 },
    )
  }
  if (!isCiphertextFormat(encrypted)) {
    return NextResponse.json(
      { error: 'encryption produced invalid format' },
      { status: 500 },
    )
  }

  const result = await createWorkspace({
    site_id: body.site_id,
    name: body.name,
    site_url: body.site_url,
    encrypted_api_key: encrypted,
    languages: body.languages ?? [],
    canonical_lang: body.canonical_lang ?? 'en',
    categories: body.categories ?? [],
    profile: body.profile ?? 'lean',
    active: body.active ?? true,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }
  return NextResponse.json({ ok: true, workspace: result }, { status: 201 })
}
