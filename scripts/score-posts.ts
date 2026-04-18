/**
 * scripts/score-posts.ts
 *
 * Usage: npx tsx scripts/score-posts.ts [--site <id>] [--days 28] [--out reports/weekly.md]
 *
 * Pulls published posts + GA4 metrics from the site admin API, scores each,
 * and classifies them into keep / scale / rewrite buckets. Writes a weekly
 * insight report that the growth analyst (human or /refresh command) can act on.
 *
 * Scoring rubric (0–100):
 *   - pageViews vs median: 40 pts
 *   - avgEngagementSec: 30 pts (>= 120s = full)
 *   - age decay penalty: -10 pts per month beyond 3 months
 *   - category baseline: 30 pts floor
 *
 * Buckets:
 *   scale   — score >= 70 → produce more of this topic/category
 *   keep    — score 40–69 → leave as-is
 *   rewrite — score < 40 → queue for refresh via /refresh <slug>
 *
 * Env required:
 *   <cfg.env.api_key>  (bearer for site admin API)
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadSiteConfig, resolveSiteId, stripSiteArg } from './_lib/config.js';

const rawArgs = process.argv.slice(2);
const SITE_ID = resolveSiteId(rawArgs);
const cfg = loadSiteConfig(SITE_ID);
const positional = stripSiteArg(rawArgs);

// Parse flags
const DAYS = Number(getFlag('--days') ?? 28);
const OUT = getFlag('--out') ?? `reports/${cfg.site_id}-${new Date().toISOString().slice(0, 10)}.md`;

function getFlag(name: string): string | null {
  const idx = positional.indexOf(name);
  if (idx >= 0 && positional[idx + 1]) return positional[idx + 1];
  const kv = positional.find(a => a.startsWith(`${name}=`));
  if (kv) return kv.slice(name.length + 1);
  return null;
}

const KEY = process.env[cfg.env.api_key];
if (!KEY) { console.error(`${cfg.env.api_key} missing`); process.exit(1); }

type Post = {
  id: string; slug: string; categoryId: string; status: string;
  publishAt: string | null; publishedAt: string | null; title: string;
};
type Metric = { slug: string; pageViews: number; sessions: number; avgEngagementSec: number };
type Scored = Post & { metric: Metric | null; score: number; bucket: 'scale' | 'keep' | 'rewrite' };

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${cfg.site_url}${path}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function ageMonths(publishedAt: string | null): number {
  if (!publishedAt) return 0;
  const diffMs = Date.now() - new Date(publishedAt).getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 30);
}

function scorePost(p: Post, m: Metric | null, medianViews: number): number {
  let score = 30; // category baseline

  // Views: up to 40 pts if >= 2× median
  if (m && medianViews > 0) {
    const ratio = m.pageViews / medianViews;
    score += Math.min(40, ratio * 20);
  }

  // Engagement: up to 30 pts (>=120s = full)
  if (m) {
    score += Math.min(30, (m.avgEngagementSec / 120) * 30);
  }

  // Age penalty: -10 per month past 3 months
  const age = ageMonths(p.publishedAt);
  if (age > 3) score -= (age - 3) * 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function bucket(score: number): Scored['bucket'] {
  if (score >= 70) return 'scale';
  if (score >= 40) return 'keep';
  return 'rewrite';
}

async function main() {
  console.log(`→ Fetching posts and GA4 metrics for ${cfg.site_id}...`);

  const exportData = await fetchJson<{
    days: number;
    posts: Post[];
    metrics: Metric[];
    warning?: string;
  }>(`/api/admin/posts/export?days=${DAYS}`);

  if (exportData.warning) console.warn(`  ⚠ ${exportData.warning}`);
  const published = exportData.posts.filter(p => p.status === 'published');
  if (published.length === 0) {
    console.log('No published posts to score.');
    return;
  }

  const metricBySlug = new Map<string, Metric>();
  for (const m of exportData.metrics) metricBySlug.set(m.slug, m);

  const views = published.map(p => metricBySlug.get(p.slug)?.pageViews ?? 0);
  const medianViews = median(views.filter(v => v > 0));

  const scored: Scored[] = published.map(p => {
    const m = metricBySlug.get(p.slug) ?? null;
    const score = scorePost(p, m, medianViews);
    return { ...p, metric: m, score, bucket: bucket(score) };
  }).sort((a, b) => b.score - a.score);

  const buckets = {
    scale: scored.filter(s => s.bucket === 'scale'),
    keep: scored.filter(s => s.bucket === 'keep'),
    rewrite: scored.filter(s => s.bucket === 'rewrite'),
  };

  // Generate report markdown
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push(`# Weekly Performance Report — ${cfg.site_id}`);
  lines.push('');
  lines.push(`- Date: ${today}`);
  lines.push(`- Window: last ${DAYS} days`);
  lines.push(`- Published posts analyzed: ${scored.length}`);
  if (exportData.warning) lines.push(`- ⚠️ ${exportData.warning}`);
  lines.push(`- Median page views: ${medianViews.toFixed(0)}`);
  lines.push('');

  for (const [name, posts] of Object.entries(buckets)) {
    if (posts.length === 0) continue;
    const icon = name === 'scale' ? '🚀' : name === 'keep' ? '✅' : '🔧';
    lines.push(`## ${icon} ${name.toUpperCase()} (${posts.length})`);
    lines.push('');
    if (name === 'scale') lines.push('*High performers — consider producing more in these topics/categories.*');
    if (name === 'keep') lines.push('*Healthy — leave as-is.*');
    if (name === 'rewrite') lines.push('*Underperforming — queue for `/refresh <slug>`.*');
    lines.push('');
    lines.push('| Slug | Category | Score | Views | Avg Engagement | Age (months) |');
    lines.push('|------|----------|-------|-------|----------------|--------------|');
    for (const p of posts) {
      const views = p.metric?.pageViews ?? 0;
      const eng = p.metric?.avgEngagementSec ? `${Math.round(p.metric.avgEngagementSec)}s` : '—';
      const age = ageMonths(p.publishedAt).toFixed(1);
      lines.push(`| \`${p.slug}\` | ${p.categoryId} | ${p.score} | ${views} | ${eng} | ${age} |`);
    }
    lines.push('');
  }

  if (buckets.rewrite.length > 0) {
    lines.push('## Suggested actions');
    lines.push('');
    for (const p of buckets.rewrite.slice(0, 5)) {
      lines.push(`- \`/refresh ${p.slug}\` — rewrite and re-translate`);
    }
    lines.push('');
  }

  const output = lines.join('\n');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, output);
  console.log(`✓ Report written to ${OUT}`);
  console.log(`  Scale: ${buckets.scale.length} | Keep: ${buckets.keep.length} | Rewrite: ${buckets.rewrite.length}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
