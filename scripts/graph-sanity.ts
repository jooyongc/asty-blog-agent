/**
 * scripts/graph-sanity.ts
 *
 * Usage: npx tsx scripts/graph-sanity.ts [--site <id>]
 *
 * Diagnostic-only. Hits the site's graph/export API with a well-known entity
 * name (ASTY Cabin) and prints a summary. Useful to verify the graph pipeline
 * end-to-end after an `extract-entities.ts` run.
 */

import { loadSiteConfig, resolveSiteId } from './_lib/config.js'

const SITE_ID = resolveSiteId(process.argv.slice(2))
const cfg = loadSiteConfig(SITE_ID)

const key = process.env[cfg.env.api_key]
if (!key) { console.error(`${cfg.env.api_key} missing`); process.exit(1) }

const TEST_ENTITIES = [
  { name: 'ASTY Cabin', type: 'Organization' },
  { name: 'Songpa', type: 'Place' },
  { name: 'Gangnam', type: 'Place' },
  { name: 'Samsung Seoul Hospital', type: 'Organization' },
  { name: 'K-beauty', type: 'Concept' },
  { name: 'medical tourism', type: 'Concept' },
]

async function queryGraph(entity: string, type?: string) {
  const q = new URLSearchParams({ entity, hops: '2' })
  if (type) q.set('type', type)
  const url = `${cfg.site_url}/api/admin/graph/export?${q.toString()}&_t=${Date.now()}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{
    center: null | { canonical_name: string; mention_count: number }
    entities: Array<unknown>
    relationships: Array<unknown>
    stats?: { entity_count: number; relationship_count: number }
    warning?: string
  }>
}

;(async () => {
  console.log(`[sanity] site=${cfg.site_id} site_url=${cfg.site_url}`)
  console.log(`[sanity] probing graph with ${TEST_ENTITIES.length} known entities`)
  console.log('')

  let found = 0
  for (const e of TEST_ENTITIES) {
    try {
      const r = await queryGraph(e.name, e.type)
      if (r.center) {
        found++
        console.log(`✓ ${e.type}:${e.name} — ${r.stats?.entity_count ?? 0} nodes, ${r.stats?.relationship_count ?? 0} edges (mentioned ${r.center.mention_count}×)`)
      } else {
        console.log(`· ${e.type}:${e.name} — not in graph yet`)
      }
    } catch (err) {
      console.error(`✗ ${e.type}:${e.name} — ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log('')
  console.log(`[sanity] ${found}/${TEST_ENTITIES.length} probed entities exist in the graph`)
  if (found === 0) {
    console.log('[sanity] Empty graph. Run extract-entities.ts against published posts first:')
    console.log('         npx tsx scripts/extract-entities.ts <slug> --force')
  }
})().catch(e => { console.error(e.message); process.exit(1) })
