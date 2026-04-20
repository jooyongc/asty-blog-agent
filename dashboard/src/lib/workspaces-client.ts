/**
 * Client for asty-cabin's /api/admin/dashboard/workspaces endpoint.
 * This is the control plane: every workspace in the system is persisted on
 * asty-cabin's Supabase. The dashboard never talks to any other DB directly.
 *
 * Authentication uses `ASTY_AGENT_API_KEY` (the bootstrap site's bearer).
 * This file must only run on the server (Node runtime) because it reads env
 * secrets; importing it from a client component will fail.
 */

const CONTROL_SITE_URL =
  process.env.CONTROL_SITE_URL || 'https://asty-cabin-check.vercel.app'

export type Workspace = {
  id: string
  site_id: string
  name: string
  site_url: string
  languages: string[]
  canonical_lang: string
  categories: string[]
  profile: 'lean' | 'standard' | 'full'
  encrypted_api_key: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type WorkspaceCreateInput = {
  site_id: string
  name: string
  site_url: string
  encrypted_api_key: string
  languages?: string[]
  canonical_lang?: string
  categories?: string[]
  profile?: 'lean' | 'standard' | 'full'
  active?: boolean
}

export type WorkspacePatch = Partial<Omit<WorkspaceCreateInput, 'site_id'>>

function controlBearer(): string {
  const key = process.env.ASTY_AGENT_API_KEY
  if (!key) throw new Error('ASTY_AGENT_API_KEY missing — cannot call control plane API')
  return `Bearer ${key}`
}

async function controlFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${CONTROL_SITE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: controlBearer(),
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
}

/** Returns all workspaces, active first. Returns [] on API failure. */
export async function listWorkspaces(): Promise<Workspace[]> {
  try {
    const res = await controlFetch('/api/admin/dashboard/workspaces')
    if (!res.ok) return []
    const j = (await res.json()) as { workspaces: Workspace[] }
    return j.workspaces ?? []
  } catch {
    return []
  }
}

export async function createWorkspace(input: WorkspaceCreateInput): Promise<Workspace | { error: string }> {
  try {
    const res = await controlFetch('/api/admin/dashboard/workspaces', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    const text = await res.text()
    if (!res.ok) {
      return { error: `HTTP ${res.status}: ${text.slice(0, 300)}` }
    }
    const j = JSON.parse(text) as { workspace: Workspace }
    return j.workspace
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateWorkspace(
  id: string,
  patch: WorkspacePatch,
): Promise<Workspace | { error: string }> {
  try {
    const res = await controlFetch(`/api/admin/dashboard/workspaces/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    const text = await res.text()
    if (!res.ok) {
      return { error: `HTTP ${res.status}: ${text.slice(0, 300)}` }
    }
    const j = JSON.parse(text) as { workspace: Workspace }
    return j.workspace
  } catch (e) {
    return { error: (e as Error).message }
  }
}

/** Soft-delete (sets active=false). Re-activate via `updateWorkspace({active:true})`. */
export async function deleteWorkspace(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await controlFetch(`/api/admin/dashboard/workspaces/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${await res.text().catch(() => '')}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
