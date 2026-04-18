/**
 * scripts/validate-configs.ts
 *
 * Usage: npx tsx scripts/validate-configs.ts
 *
 * Scans sites/*\/config.json and validates each against the schema contract.
 * Fails fast (non-zero exit) on any invalid config — suitable for CI.
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadSiteConfig } from './_lib/config.js';

const SITES_DIR = 'sites';

if (!fs.existsSync(SITES_DIR)) {
  console.log('[validate] No sites/ directory — nothing to validate');
  process.exit(0);
}

const entries = fs.readdirSync(SITES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

if (entries.length === 0) {
  console.log('[validate] sites/ is empty — nothing to validate');
  process.exit(0);
}

let failed = 0;
for (const siteId of entries) {
  const configPath = path.join(SITES_DIR, siteId, 'config.json');
  if (!fs.existsSync(configPath)) {
    console.log(`  skip  ${siteId}  (no config.json)`);
    continue;
  }
  try {
    const cfg = loadSiteConfig(siteId);
    console.log(`  ✓     ${siteId}  (${cfg.languages.length} langs, ${cfg.categories.length} categories)`);
  } catch (e) {
    console.log(`  ✗     ${siteId}  — ${e instanceof Error ? e.message : e}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n[validate] ${failed} invalid config(s)`);
  process.exit(1);
}

console.log(`\n[validate] All ${entries.length} site config(s) valid`);
