/**
 * scripts/publish.ts
 *
 * Usage: npx tsx scripts/publish.ts <slug>
 *
 * Reads content/drafts/<slug>/{en,ja,zh}.md + meta.json,
 * POSTs to the ASTY Cabin site's /api/admin/posts/multilang endpoint,
 * then moves the draft folder to content/published/.
 *
 * Env required:
 *   ASTY_SITE_URL        e.g. https://asty-cabin-check.vercel.app
 *   ASTY_AGENT_API_KEY   bearer token issued by the site
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
  console.error('Usage: tsx scripts/publish.ts <slug> [--site <id>]');
  process.exit(1);
}

const SITE = cfg.site_url;
const KEY = process.env[cfg.env.api_key];
if (!KEY) {
  console.error(`${cfg.env.api_key} missing`);
  process.exit(1);
}

const DRAFT_DIR = path.join(cfg.paths.drafts, SLUG);
const PUBLISHED_DIR = path.join(cfg.paths.published, SLUG);

function readLang(file: string) {
  const raw = fs.readFileSync(path.join(DRAFT_DIR, file), 'utf8');
  const { data, content } = matter(raw);
  return { frontmatter: data, body: content };
}

async function run() {
  const meta = JSON.parse(fs.readFileSync(path.join(DRAFT_DIR, 'meta.json'), 'utf8'));
  const en = readLang('en.md');
  const ja = readLang('ja.md');
  const zh = readLang('zh.md');

  // Preflight
  const ALLOWED_FACTCHECK = ['passed', 'auto-passed', 'pending'];
  if (en.frontmatter.factcheck !== undefined &&
      !ALLOWED_FACTCHECK.includes(en.frontmatter.factcheck)) {
    throw new Error(`factcheck must be one of: ${ALLOWED_FACTCHECK.join(', ')}`);
  }
  if (ja.frontmatter.translation_review !== 'passed' ||
      zh.frontmatter.translation_review !== 'passed') {
    throw new Error('translation_review not passed on ja.md or zh.md');
  }
  // EN: word count by whitespace. JA/ZH: character count (no spaces between words).
  const enWords = en.body.split(/\s+/).filter(Boolean).length;
  if (enWords < 500) throw new Error(`en body <500 words (got ${enWords})`);
  const jaChars = ja.body.replace(/\s/g, '').length;
  if (jaChars < 800) throw new Error(`ja body <800 chars (got ${jaChars})`);
  const zhChars = zh.body.replace(/\s/g, '').length;
  if (zhChars < 800) throw new Error(`zh body <800 chars (got ${zhChars})`);

  const payload = {
    slug: meta.slug,
    category: meta.category,
    publish_at: meta.publish_at,            // ISO string, KST
    status: 'scheduled',
    canonical_lang: meta.canonical_lang ?? 'en',
    featured_image: meta.featured_image,
    translations: {
      en: {
        title: meta.translations.en.title,
        meta_description: meta.translations.en.meta_description,
        tags: meta.translations.en.tags,
        content_md: en.body,
      },
      ja: {
        title: meta.translations.ja.title,
        meta_description: meta.translations.ja.meta_description,
        tags: meta.translations.ja.tags,
        content_md: ja.body,
      },
      'zh-hans': {
        title: meta.translations['zh-hans'].title,
        meta_description: meta.translations['zh-hans'].meta_description,
        tags: meta.translations['zh-hans'].tags,
        content_md: zh.body,
      },
    },
  };

  console.log(`→ POST ${SITE}/api/admin/posts/multilang  (slug: ${meta.slug})`);

  const res = await fetch(`${SITE}/api/admin/posts/multilang`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Publish failed ${res.status}: ${text}`);
  }

  const result = await res.json();
  console.log('✓ Published:');
  console.log(`  EN: ${SITE}/en/blog/${meta.slug}`);
  console.log(`  JA: ${SITE}/ja/blog/${meta.slug}`);
  console.log(`  ZH: ${SITE}/zh-hans/blog/${meta.slug}`);
  console.log(`  Scheduled for: ${meta.publish_at}`);

  // Move draft → published
  fs.mkdirSync(path.dirname(PUBLISHED_DIR), { recursive: true });
  fs.renameSync(DRAFT_DIR, PUBLISHED_DIR);
  console.log(`  Archived: ${PUBLISHED_DIR}`);
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
