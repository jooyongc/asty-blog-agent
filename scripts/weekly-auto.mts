/**
 * scripts/weekly-auto.mts
 *
 * Full automation: reads topic_queue (status='approved') from site, runs the
 * pipeline for top N topics, publishes each, marks topic_queue row 'published'.
 *
 * Designed to run under GitHub Actions cron. Safe to re-invoke — already-
 * published slugs are skipped.
 *
 * Env required:
 *   ANTHROPIC_API_KEY
 *   ASTY_AGENT_API_KEY (or whatever cfg.env.api_key points to)
 *   DEEPL_API_KEY
 *   UNSPLASH_ACCESS_KEY
 *   ASTY_SITE_URL (optional, defaults to production)
 *
 * CLI:
 *   --site=asty-cabin    (default)
 *   --limit=3            (default)
 *   --dry-run            (don't publish; stop after schema)
 */

import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

function arg(name: string): string | null {
  const v = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))
  if (!v) return null
  if (v === `--${name}`) return '1'
  return v.slice(name.length + 3)
}

const SITE_ID = arg('site') ?? 'asty-cabin'
const LIMIT = Math.max(1, Math.min(5, Number(arg('limit') ?? 3)))
const DRY = arg('dry-run') === '1'
const SITE_URL = process.env.ASTY_SITE_URL || 'https://asty-cabin-check.vercel.app'
const KEY = process.env.ASTY_AGENT_API_KEY

if (!KEY) { console.error('ASTY_AGENT_API_KEY missing'); process.exit(1) }

function slugify(title: string): string {
  return title.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function run(cmd: string, args: string[]): { ok: boolean; code: number } {
  const r = spawnSync(cmd, args, { stdio: 'inherit', encoding: 'utf8' })
  return { ok: r.status === 0, code: r.status ?? -1 }
}

async function fetchTopics(): Promise<Array<{ id: string; title: string; category: string; seo_score: number | null }>> {
  const res = await fetch(`${SITE_URL}/api/admin/queue/topic?site_id=${SITE_ID}&status=approved&limit=20`, {
    headers: { Authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) throw new Error(`fetchTopics ${res.status}`)
  const j = (await res.json()) as { rows: Array<{ id: string; title: string; category: string | null; seo_score: number | null }> }
  return j.rows
    .filter((r) => r.title && r.category)
    .map((r) => ({ id: r.id, title: r.title, category: r.category!, seo_score: r.seo_score }))
    .sort((a, b) => (b.seo_score ?? 0) - (a.seo_score ?? 0))
}

async function fetchPublishedSlugs(): Promise<Set<string>> {
  const res = await fetch(`${SITE_URL}/api/admin/posts/export?limit=50`, {
    headers: { Authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) return new Set()
  const j = (await res.json()) as { posts: Array<{ slug: string }> }
  return new Set(j.posts.map((p) => p.slug))
}

async function patchTopicStatus(id: string, status: string): Promise<void> {
  try {
    await fetch(`${SITE_URL}/api/admin/queue/topic/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ status }),
    })
  } catch { /* non-fatal */ }
}

async function main(): Promise<void> {
  console.log(`[weekly-auto] site=${SITE_ID} limit=${LIMIT} dry=${DRY}`)
  const topics = await fetchTopics()
  const published = await fetchPublishedSlugs()
  console.log(`[weekly-auto] ${topics.length} approved topics in queue, ${published.size} posts already published`)

  const candidates = topics.filter((t) => !published.has(slugify(t.title))).slice(0, LIMIT)
  if (candidates.length === 0) {
    console.log('[weekly-auto] nothing to do — all approved topics already published')
    return
  }

  const results: Array<{ slug: string; title: string; status: 'success' | 'skipped' | 'failed'; detail?: string }> = []

  for (const t of candidates) {
    const slug = slugify(t.title)
    console.log(`\n========== ${slug} ==========`)
    console.log(`  title: ${t.title}`)
    console.log(`  category: ${t.category}`)

    await patchTopicStatus(t.id, 'in_progress')

    try {
      // Stage 1: SEO + Writer + Verifier via pipeline-run.mts
      const r1 = run('npx', [
        'tsx', 'scripts/pipeline-run.mts',
        `--slug=${slug}`,
        `--title=${t.title}`,
        `--category=${t.category}`,
      ])
      if (!r1.ok) throw new Error(`pipeline-run exit ${r1.code}`)

      if (DRY) {
        results.push({ slug, title: t.title, status: 'success', detail: 'stopped at writer (dry-run)' })
        continue
      }

      // Stage 2: translate → glossary → packager → image → schema → enqueue → publish
      const r2 = run('npx', ['tsx', 'scripts/pipeline-chain.mts', slug])
      if (!r2.ok) throw new Error(`pipeline-chain exit ${r2.code}`)

      await patchTopicStatus(t.id, 'published')
      results.push({ slug, title: t.title, status: 'success' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[weekly-auto] ${slug} failed: ${msg}`)
      await patchTopicStatus(t.id, 'approved') // revert so next run retries
      results.push({ slug, title: t.title, status: 'failed', detail: msg })
    }
  }

  console.log('\n========== REPORT ==========')
  for (const r of results) console.log(`  ${r.status.padEnd(8)} ${r.slug}${r.detail ? ` — ${r.detail}` : ''}`)

  // Exit non-zero only if EVERYTHING failed. One failure doesn't fail the cron.
  const allFailed = results.length > 0 && results.every((r) => r.status === 'failed')
  process.exit(allFailed ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
