import type { SiteConfig } from './sites'

export type QueueItem = {
  id: string
  slug: string
  category: string | null
  quality_score: number | null
  verification_status: 'verified' | 'partial' | 'skipped' | 'blocked' | null
  verification_report: Record<string, unknown> | null
  translations_preview: {
    en?: { title?: string; excerpt?: string }
    ja?: { title?: string; excerpt?: string }
    'zh-hans'?: { title?: string; excerpt?: string }
  } | null
  scheduled_at: string | null
  status: 'awaiting_approval' | 'approved' | 'rejected' | 'published' | 'expired'
  rejection_reason: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

export type TopicQueueItem = {
  id: string
  title: string
  category: string | null
  rationale: string | null
  seo_score: number | null
  status: 'proposed' | 'approved' | 'in_progress' | 'published' | 'rejected'
  user_note: string | null
  source_direction: string | null
  created_at: string
}

export type QueueExport = {
  site_id: string
  publish_queue: QueueItem[]
  topic_queue: TopicQueueItem[]
  budget: {
    month_to_date_usd: number
    calls_this_month: number
  }
}

async function bearer(site: SiteConfig, pathname: string, init?: RequestInit): Promise<Response> {
  const key = process.env[site.env.api_key]
  if (!key) throw new Error(`env ${site.env.api_key} missing`)
  const sep = pathname.includes('?') ? '&' : '?'
  return fetch(`${site.site_url}${pathname}${sep}_t=${Date.now()}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${key}`,
      'Content-Type': init?.body ? 'application/json' : 'application/json',
    },
    cache: 'no-store',
  })
}

export async function fetchQueue(site: SiteConfig): Promise<QueueExport | null> {
  try {
    const res = await bearer(
      site,
      `/api/admin/queue/export?site_id=${encodeURIComponent(site.site_id)}`
    )
    if (!res.ok) return null
    return (await res.json()) as QueueExport
  } catch {
    return null
  }
}

export async function approveQueueItem(site: SiteConfig, slug: string, approvedBy?: string): Promise<boolean> {
  try {
    const res = await bearer(
      site,
      `/api/admin/queue/approve/${encodeURIComponent(slug)}?site_id=${encodeURIComponent(site.site_id)}`,
      { method: 'POST', body: JSON.stringify({ approved_by: approvedBy ?? 'dashboard' }) }
    )
    return res.ok
  } catch {
    return false
  }
}

export async function rejectQueueItem(site: SiteConfig, slug: string, reason?: string): Promise<boolean> {
  try {
    const res = await bearer(
      site,
      `/api/admin/queue/reject/${encodeURIComponent(slug)}?site_id=${encodeURIComponent(site.site_id)}`,
      { method: 'POST', body: JSON.stringify({ reason: reason ?? null }) }
    )
    return res.ok
  } catch {
    return false
  }
}
