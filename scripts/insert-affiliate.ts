/**
 * scripts/insert-affiliate.ts
 *
 * Usage: npx tsx scripts/insert-affiliate.ts <slug>
 *
 * Reads affiliate/links.json, matches category-specific keywords against en.md
 * body, and inserts affiliate links at the first natural occurrence.
 *
 * Rules:
 *   - Max 3 links per article (AFFILIATE_MAX_PER_POST)
 *   - First keyword match only (don't replace every occurrence)
 *   - Skip if link already present (idempotent — safe to re-run)
 *   - JA/ZH: if anchor_ja/anchor_zh provided, sync at same position
 *   - No links section → skip gracefully with a clear message
 *
 * Frontmatter impact:
 *   adds `affiliate_links: [{provider, keyword, url}]` for audit trail
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { loadSiteConfig, resolveSiteId, stripSiteArg } from './_lib/config.js';

const rawArgs = process.argv.slice(2);
const SITE_ID = resolveSiteId(rawArgs);
const cfg = loadSiteConfig(SITE_ID);
const positional = stripSiteArg(rawArgs);
const SLUG = positional[0];
if (!SLUG) {
  console.error('Usage: tsx scripts/insert-affiliate.ts <slug> [--site <id>]');
  process.exit(1);
}

const AFFILIATE_MAX_PER_POST = 3;
const LINKS_PATH = cfg.paths.affiliate_file ?? path.join('affiliate', 'links.json');
const DRAFT_DIR = path.join(cfg.paths.drafts, SLUG);
const EN_PATH = path.join(DRAFT_DIR, `${cfg.canonical_lang}.md`);
const JA_PATH = path.join(DRAFT_DIR, 'ja.md');
const ZH_PATH = path.join(DRAFT_DIR, 'zh.md');

if (!fs.existsSync(EN_PATH)) {
  console.error(`en.md not found: ${EN_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(LINKS_PATH)) {
  console.log('[affiliate] No links.json found — skipping');
  process.exit(0);
}

type LinkEntry = {
  provider: string;
  keyword: string;
  url: string;
  anchor: string;
  anchor_ja?: string;
  anchor_zh?: string;
};
type LinksDB = {
  version: number;
  providers: Record<string, { name: string; disclosure: string; default_rel: string }>;
  categories: Record<string, LinkEntry[]>;
};

const linksDb = JSON.parse(fs.readFileSync(LINKS_PATH, 'utf8')) as LinksDB;

// ---- Read en.md + determine category ----
const enRaw = fs.readFileSync(EN_PATH, 'utf8');
const enParsed = matter(enRaw);
const category = (enParsed.data.category as string) ?? 'culture';
const categoryLinks = linksDb.categories[category] ?? [];

if (categoryLinks.length === 0) {
  console.log(`[affiliate] No links configured for category "${category}" — skipping`);
  process.exit(0);
}

// ---- Escape regex special chars ----
function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---- Insert affiliate link at first match ----
// We replace `keyword` with `[anchor](url)` on first occurrence.
// Case-insensitive, whole-phrase match.
type Inserted = { provider: string; keyword: string; url: string; anchor: string; index: number };

function insertLink(body: string, entry: LinkEntry, providerRel: string): { body: string; inserted: Inserted | null } {
  // Don't double-insert if URL already in body
  if (body.includes(entry.url)) {
    return { body, inserted: null };
  }

  const re = new RegExp(`\\b${escRe(entry.keyword)}\\b`, 'i');
  const match = re.exec(body);
  if (!match) return { body, inserted: null };

  const matchedText = match[0];
  const replacement = `[${entry.anchor}](${entry.url})`;
  const newBody = body.substring(0, match.index) + replacement + body.substring(match.index + matchedText.length);

  return {
    body: newBody,
    inserted: {
      provider: entry.provider,
      keyword: entry.keyword,
      url: entry.url,
      anchor: entry.anchor,
      index: match.index,
    },
  };
}

// ---- Main EN insertion ----
let enBody = enParsed.content;
const inserted: Inserted[] = [];

for (const entry of categoryLinks) {
  if (inserted.length >= AFFILIATE_MAX_PER_POST) break;
  const providerCfg = linksDb.providers[entry.provider];
  if (!providerCfg) {
    console.warn(`  ⚠ Unknown provider "${entry.provider}" — skipping`);
    continue;
  }
  const result = insertLink(enBody, entry, providerCfg.default_rel);
  if (result.inserted) {
    enBody = result.body;
    inserted.push(result.inserted);
  }
}

if (inserted.length === 0) {
  console.log(`[affiliate] ${SLUG}: no keyword matches found in en.md for category "${category}"`);
  process.exit(0);
}

// ---- Save en.md with audit trail ----
const enFm = {
  ...enParsed.data,
  affiliate_links: inserted.map(({ provider, keyword, url }) => ({ provider, keyword, url })),
};
fs.writeFileSync(EN_PATH, matter.stringify(enBody, enFm));
console.log(`[affiliate] EN: inserted ${inserted.length} link(s)`);
for (const i of inserted) console.log(`  + ${i.provider} | ${i.keyword} → ${i.anchor}`);

// ---- Sync JA/ZH anchors ----
function syncAnchor(mdPath: string, langKey: 'anchor_ja' | 'anchor_zh', label: string) {
  if (!fs.existsSync(mdPath)) {
    console.log(`[affiliate] ${label}: file not found, skip sync`);
    return;
  }
  const raw = fs.readFileSync(mdPath, 'utf8');
  const parsed = matter(raw);
  let body = parsed.content;
  let synced = 0;

  for (const ins of inserted) {
    if (body.includes(ins.url)) continue; // already synced
    const entry = categoryLinks.find(e => e.url === ins.url);
    const translatedAnchor = entry?.[langKey];
    if (!translatedAnchor) continue; // no translation provided → leave as-is

    // For JA/ZH we don't try to match the English keyword — just append to CTA block.
    // Simpler and safer: add a "Booking" line near the end of the article.
    const insertion = `\n\n> 📌 [${translatedAnchor}](${ins.url})\n`;
    body = body.replace(/\n*$/, insertion);
    synced++;
  }

  if (synced > 0) {
    fs.writeFileSync(mdPath, matter.stringify(body, parsed.data));
    console.log(`[affiliate] ${label}: synced ${synced} anchor(s)`);
  } else {
    console.log(`[affiliate] ${label}: no translated anchors to sync (or already synced)`);
  }
}

syncAnchor(JA_PATH, 'anchor_ja', 'JA');
syncAnchor(ZH_PATH, 'anchor_zh', 'ZH');

console.log(`✓ Affiliate insertion complete for ${SLUG}`);
