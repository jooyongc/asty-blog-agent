import type { Post, Metric } from './api-client'

export type ScoreBucket = 'scale' | 'keep' | 'rewrite'
export type Scored = Post & { metric: Metric | null; score: number; bucket: ScoreBucket }

export function ageMonths(publishedAt: string | null): number {
  if (!publishedAt) return 0
  return (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
}

function median(nums: number[]): number {
  const s = nums.filter(n => n > 0).sort((a, b) => a - b)
  if (s.length === 0) return 0
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

export function scorePosts(posts: Post[], metrics: Metric[]): Scored[] {
  const mMap = new Map<string, Metric>()
  for (const m of metrics) mMap.set(m.slug, m)
  const medianViews = median(posts.map(p => mMap.get(p.slug)?.pageViews ?? 0))

  return posts.map(p => {
    const m = mMap.get(p.slug) ?? null
    let score = 30
    if (m && medianViews > 0) score += Math.min(40, (m.pageViews / medianViews) * 20)
    if (m) score += Math.min(30, (m.avgEngagementSec / 120) * 30)
    const age = ageMonths(p.publishedAt)
    if (age > 3) score -= (age - 3) * 10
    score = Math.max(0, Math.min(100, Math.round(score)))
    const bucket: ScoreBucket = score >= 70 ? 'scale' : score >= 40 ? 'keep' : 'rewrite'
    return { ...p, metric: m, score, bucket }
  }).sort((a, b) => b.score - a.score)
}
