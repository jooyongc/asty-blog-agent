import type { SiteConfig } from './sites'

export type AgentBreakdown = {
  agent: string
  calls: number
  input_tokens: number
  output_tokens: number
  cost_usd: number
}

export type CostSummary = {
  site_id: string
  window_days: number
  totals: {
    cost_usd: number
    calls: number
    input_tokens: number
    output_tokens: number
  }
  by_agent: AgentBreakdown[]
  by_day: Array<{ date: string; calls: number; cost_usd: number }>
  generated_at: string
}

export async function fetchCostSummary(
  site: SiteConfig,
  days = 30,
): Promise<CostSummary | null> {
  const key = process.env[site.env.api_key]
  if (!key) return null
  try {
    const res = await fetch(
      `${site.site_url}/api/admin/costs/summary?site_id=${encodeURIComponent(site.site_id)}&days=${days}`,
      { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' },
    )
    if (!res.ok) return null
    return (await res.json()) as CostSummary
  } catch {
    return null
  }
}

/**
 * Per-profile monthly ceiling (USD). Matches agent-side budget-guard logic.
 */
export const PROFILE_CEILING: Record<string, number> = {
  lean: 5.0,
  standard: 5.5,
  full: 6.5,
}

export function ceilingFor(site: SiteConfig): number {
  const profile = (site.budget as { profile?: string } | undefined)?.profile ?? 'lean'
  return PROFILE_CEILING[profile] ?? 5
}
