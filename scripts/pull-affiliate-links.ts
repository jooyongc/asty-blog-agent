/**
 * scripts/pull-affiliate-links.ts
 *
 * Usage: npx tsx scripts/pull-affiliate-links.ts
 *
 * Fetches the latest affiliate links from the ASTY site admin API and
 * writes them to affiliate/links.json locally. Run this before weekly
 * pipeline so insert-affiliate.ts picks up new links added via /admin/affiliate.
 *
 * Env required:
 *   ASTY_SITE_URL
 *   ASTY_AGENT_API_KEY
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadSiteConfig, resolveSiteId } from './_lib/config.js';

const SITE_ID = resolveSiteId(process.argv.slice(2));
const cfg = loadSiteConfig(SITE_ID);

const SITE = cfg.site_url;
const KEY = process.env[cfg.env.api_key];
if (!SITE) { console.error('site_url missing in config'); process.exit(1); }
if (!KEY) { console.error(`${cfg.env.api_key} missing`); process.exit(1); }

const OUT = cfg.paths.affiliate_file ?? path.join('affiliate', 'links.json');

async function main() {
  const url = `${SITE}/api/admin/affiliate-links/export`;
  console.log(`→ GET ${url}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pull failed ${res.status}: ${text}`);
  }
  const data = await res.json() as {
    version: number;
    updated_at: string;
    providers: Record<string, unknown>;
    categories: Record<string, unknown[]>;
  };

  // Preserve local $schema reference if it exists
  let existingSchema: string | undefined;
  if (fs.existsSync(OUT)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));
      existingSchema = existing.$schema;
    } catch { /* ignore */ }
  }

  const output = {
    ...(existingSchema ? { $schema: existingSchema } : { $schema: './links.schema.json' }),
    ...data,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2) + '\n');

  const totalLinks = Object.values(data.categories).reduce((n, arr) => n + arr.length, 0);
  const providerCount = Object.keys(data.providers).length;
  console.log(`✓ Pulled affiliate links → ${OUT}`);
  console.log(`  providers: ${providerCount}, total links: ${totalLinks}`);
  for (const [cat, arr] of Object.entries(data.categories)) {
    if (arr.length > 0) console.log(`  ${cat}: ${arr.length}`);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
