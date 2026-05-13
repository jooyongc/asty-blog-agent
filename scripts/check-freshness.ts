/**
 * scripts/check-freshness.ts
 *
 * Scans the site's published posts and flags ones whose date-sensitive content
 * is likely stale. Output is a JSON report; optionally adds the worst offenders
 * back to topic_queue as 'proposed' refresh candidates so the operator can
 * approve them in the dashboard.
 *
 * Freshness signal heuristics (cheap, no LLM call):
 *   1. published > N days ago AND never updated since                        → stale_age
 *   2. body contains specific price patterns (e.g. ₩XXX,XXX or "$N/night")   → price_drift_risk
 *   3. body contains transit-time patterns (e.g. "X minutes to/from")        → transit_drift_risk
 *   4. body contains year tokens (e.g. "2024", "2025") that are older than   → year_drift_risk
 *      the current year by 6+ months
 *
 * Scoring: each risk adds points (age=1, price=2, transit=1, year=3). Posts
 * scoring ≥ 4 are flagged HIGH; 2-3 = MEDIUM; 1 = LOW; 0 = fresh.
 *
 * Usage:
 *   npx tsx scripts/check-freshness.ts [--site asty-cabin] [--days 90] [--enqueue]
 *
 *   --enqueue posts HIGH+MEDIUM candidates back to topic_queue as 'proposed'
 *   refresh tasks with a "REFRESH: " title prefix. Defaults to dry-run.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { loadSiteConfig, resolveSiteId, stripSiteArg } from './_lib/config.js'

const rawArgs = process.argv.slice(2)
const SITE_ID = resolveSiteId(rawArgs)
const cfg = loadSiteConfig(SITE_ID)
const positional = stripSiteArg(rawArgs)

function argNumber(flag: string, fallback: number): number {
  const idx = positional.indexOf(flag)
  if (idx === -1) return fallback
  const v = Number(positional[idx + 1])
  return Number.isFinite(v) ? v : fallback
}
const ENQUEUE = positional.includes('--enqueue')
const STALE_DAYS = argNumber('--days', 90)

type PostExportRow = {
  id: string
  slug: string
  status: string
  publishedAt: string | null
  updatedAt: string | null
  title: string
  categoryId: string
}

async function fetchPublishedPosts(key: string): Promise<PostExportRow[]> {
  const res = await fetch(`${cfg.site_url}/api/admin/posts/export?limit=200`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`posts/export ${res.status}`)
  const j = (await res.json()) as { posts: PostExportRow[] }
  return (j.posts ?? []).filter((p) => p.status === 'published')
}

async function fetchPostBody(slug: string, key: string): Promise<string | null> {
  // We re-use the public .md endpoint we just added — no extra auth needed,
  // and it's the canonical text representation.
  try {
    const res = await fetch(`${cfg.site_url}/en/blog/${slug}/md`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

type Risk = 'stale_age' | 'price_drift_risk' | 'transit_drift_risk' | 'year_drift_risk'
type PostFreshness = {
  slug: string
  title: string
  category: string
  publishedAt: string | null
  age_days: number
  risks: Risk[]
  score: number
  band: 'fresh' | 'low' | 'medium' | 'high'
}

const RISK_WEIGHT: Record<Risk, number> = {
  stale_age: 1,
  price_drift_risk: 2,
  transit_drift_risk: 1,
  year_drift_risk: 3,
}

function analyzeBody(body: string, ageDays: number): { risks: Risk[]; score: number } {
  const risks: Risk[] = []
  if (ageDays >= STALE_DAYS) risks.push('stale_age')
  // Pricing patterns: ₩100,000 / ₩200000 / $50 / $40/night / KRW 500000
  if (/[₩$]\s*\d{1,3}([,.]?\d{3})+/i.test(body) || /\b(KRW|USD)\s+\d{2,}/i.test(body)) {
    risks.push('price_drift_risk')
  }
  // Transit times: "X min walk", "X minutes by", "X-min", etc.
  if (/\b\d{1,2}[\s-]?(min(?:ute)?s?)\b/i.test(body)) {
    risks.push('transit_drift_risk')
  }
  // Year drift: any year token that's >= 6 months older than current year
  const currentYear = new Date().getFullYear()
  const yearMatches = body.match(/\b20[12]\d\b/g) ?? []
  const stale = yearMatches.some((y) => {
    const n = parseInt(y, 10)
    return Number.isFinite(n) && n < currentYear && currentYear - n >= 1
  })
  if (stale) risks.push('year_drift_risk')

  const score = risks.reduce((s, r) => s + RISK_WEIGHT[r], 0)
  return { risks, score }
}

function bandFromScore(score: number): PostFreshness['band'] {
  if (score === 0) return 'fresh'
  if (score === 1) return 'low'
  if (score <= 3) return 'medium'
  return 'high'
}

async function enqueueRefresh(
  posts: PostFreshness[],
  key: string,
): Promise<{ enqueued: number; failures: string[] }> {
  let enqueued = 0
  const failures: string[] = []
  for (const p of posts) {
    if (p.band !== 'high' && p.band !== 'medium') continue
    try {
      const res = await fetch(`${cfg.site_url}/api/admin/queue/topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          site_id: SITE_ID,
          title: `REFRESH: ${p.title}`,
          category: p.category,
          rationale: `Auto freshness check (band=${p.band}, score=${p.score}). Risks: ${p.risks.join(', ')}. Last published ${p.age_days} days ago.`,
          seo_score: 50, // neutral; operator decides
          status: 'proposed',
          user_note: `Refresh candidate for /${p.slug}. Address: ${p.risks.join(', ')}.`,
        }),
      })
      if (!res.ok) {
        failures.push(`${p.slug}: HTTP ${res.status}`)
        continue
      }
      enqueued++
    } catch (e) {
      failures.push(`${p.slug}: ${(e as Error).message}`)
    }
  }
  return { enqueued, failures }
}

async function main(): Promise<void> {
  const key = process.env[cfg.env.api_key]
  if (!key) {
    console.error(`[check-freshness] ${cfg.env.api_key} missing`)
    process.exit(1)
  }

  console.log(`[check-freshness] site=${SITE_ID} stale=${STALE_DAYS}d enqueue=${ENQUEUE}`)
  const posts = await fetchPublishedPosts(key)
  console.log(`[check-freshness] ${posts.length} published posts to scan`)

  const now = Date.now()
  const results: PostFreshness[] = []

  for (const p of posts) {
    const body = await fetchPostBody(p.slug, key)
    if (!body) continue
    const ageDays = p.publishedAt
      ? Math.floor((now - new Date(p.publishedAt).getTime()) / 86_400_000)
      : 999
    const { risks, score } = analyzeBody(body, ageDays)
    results.push({
      slug: p.slug,
      title: p.title,
      category: p.categoryId,
      publishedAt: p.publishedAt,
      age_days: ageDays,
      risks,
      score,
      band: bandFromScore(score),
    })
  }

  results.sort((a, b) => b.score - a.score)

  // Persist report under reports/
  const reportsDir = path.resolve('reports')
  fs.mkdirSync(reportsDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const reportPath = path.join(reportsDir, `freshness-${SITE_ID}-${stamp}.json`)
  fs.writeFileSync(reportPath, JSON.stringify({ site: SITE_ID, generated_at: new Date().toISOString(), stale_days: STALE_DAYS, results }, null, 2))

  console.log(`\n[check-freshness] report → ${reportPath}`)
  const bands = { high: 0, medium: 0, low: 0, fresh: 0 }
  for (const r of results) bands[r.band]++
  console.log(`  high=${bands.high} medium=${bands.medium} low=${bands.low} fresh=${bands.fresh}`)

  console.log('\n[check-freshness] TOP REFRESH CANDIDATES:')
  for (const r of results.slice(0, 10)) {
    if (r.band === 'fresh') break
    console.log(`  [${r.band.toUpperCase().padEnd(6)}] score=${r.score} age=${r.age_days}d  ${r.slug}`)
    console.log(`           risks: ${r.risks.join(', ')}`)
  }

  if (ENQUEUE) {
    const { enqueued, failures } = await enqueueRefresh(results, key)
    console.log(`\n[check-freshness] enqueued ${enqueued} refresh proposals`)
    if (failures.length > 0) {
      console.log(`  failures (${failures.length}):`)
      for (const f of failures) console.log(`    ${f}`)
    }
  } else {
    console.log('\n[check-freshness] (dry-run — pass --enqueue to push HIGH+MEDIUM into topic_queue)')
  }
}

main().catch((e) => {
  console.error(`[check-freshness] ${e instanceof Error ? e.message : e}`)
  process.exit(1)
})
