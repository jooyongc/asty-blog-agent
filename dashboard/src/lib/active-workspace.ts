import { cookies } from 'next/headers'
import { listSites, type SiteConfig } from './sites'

/**
 * Active workspace = the site users are currently acting on (affects
 * /direction, /queue single-view, etc.). Pages that aggregate across all
 * workspaces (Overview, Portfolio) ignore this value.
 *
 * Stored in an HTTP-only cookie keyed by site_id. If the cookie points to a
 * workspace that no longer exists or is inactive, it auto-falls back to the
 * first active workspace.
 */

const COOKIE_NAME = 'active_workspace_id'
const COOKIE_MAX_AGE_DAYS = 365

/**
 * Resolve the currently-active workspace. Returns null only if the dashboard
 * has no workspaces configured at all (fresh install).
 */
export async function getActiveSite(): Promise<SiteConfig | null> {
  const all = await listSites() // active-only by default
  if (all.length === 0) return null

  const cookieStore = await cookies()
  const cookieVal = cookieStore.get(COOKIE_NAME)?.value
  if (cookieVal) {
    const hit = all.find((s) => s.site_id === cookieVal)
    if (hit) return hit
    // Cookie points to a workspace that was deleted / deactivated → fall
    // through to default (first active). The cookie will be overwritten the
    // next time the user picks from the switcher.
  }
  return all[0] ?? null
}

export async function getActiveSiteId(): Promise<string | null> {
  const s = await getActiveSite()
  return s?.site_id ?? null
}

/**
 * Mark a workspace active. Caller must verify the id exists before calling.
 * Only usable in route handlers / server actions (needs mutable cookies API).
 */
export async function setActiveWorkspaceId(siteId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, siteId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * COOKIE_MAX_AGE_DAYS,
  })
}

/**
 * Clear the active workspace cookie (e.g., when a workspace is deleted).
 */
export async function clearActiveWorkspace(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export const ACTIVE_WORKSPACE_COOKIE = COOKIE_NAME
