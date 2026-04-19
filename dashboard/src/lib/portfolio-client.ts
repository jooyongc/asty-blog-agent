import type { SiteConfig } from './sites'

export type MatrixEntity = {
  canonical_name: string
  type: string
  total: number
  per_site: Record<string, number>
}

export type MatrixResponse = {
  sites: string[]
  entities: MatrixEntity[]
  total_rows_considered: number
}

/**
 * Fetch the topic × site matrix from any one site's admin API. Every site's
 * graph API sees the same Supabase table, so it doesn't matter which site we
 * ask — pick the first configured one.
 */
export async function fetchPortfolioMatrix(
  site: SiteConfig,
  limit = 12,
): Promise<MatrixResponse | null> {
  const key = process.env[site.env.api_key]
  if (!key) return null
  try {
    const res = await fetch(`${site.site_url}/api/admin/graph/matrix?limit=${limit}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as MatrixResponse
  } catch {
    return null
  }
}
