/**
 * scripts/translate.ts
 *
 * Usage: npx tsx scripts/translate.ts <slug>
 *
 * Cost guards (prevents runaway DeepL usage):
 *   1. Pre-flight char count. Aborts if single run > MAX_CHARS_PER_RUN.
 *   2. Local monthly tally in content/.deepl-usage.json. Aborts if over cap.
 *   3. DeepL API authoritative check — if account already exhausted, aborts.
 *   4. No retries — failures bubble up rather than silently re-billing.
 *
 * Required env:
 *   DEEPL_API_KEY
 *
 * Optional:
 *   DEEPL_GLOSSARY_JA_ID, DEEPL_GLOSSARY_ZH_ID
 *   DEEPL_MAX_CHARS_PER_RUN   default 60000
 *   DEEPL_MAX_CHARS_MONTHLY   default 450000   (safely under 500k free cap)
 */

import * as deepl from 'deepl-node';
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
  console.error('Usage: tsx scripts/translate.ts <slug> [--site <id>]');
  process.exit(1);
}

const MAX_PER_RUN = cfg.budget?.deepl_chars_per_run
  ?? Number(process.env.DEEPL_MAX_CHARS_PER_RUN ?? 60000);
const MAX_MONTHLY = cfg.budget?.deepl_chars_monthly
  ?? Number(process.env.DEEPL_MAX_CHARS_MONTHLY ?? 450000);
const USAGE_FILE = path.join(path.dirname(cfg.paths.drafts), '.deepl-usage.json');

const DRAFT_DIR = path.join(cfg.paths.drafts, SLUG);
const EN_PATH = path.join(DRAFT_DIR, 'en.md');
if (!fs.existsSync(EN_PATH)) {
  console.error(`Source not found: ${EN_PATH}`);
  process.exit(1);
}

if (!process.env.DEEPL_API_KEY) {
  console.error('DEEPL_API_KEY missing');
  process.exit(1);
}
const translator = new deepl.Translator(process.env.DEEPL_API_KEY);

// ---- Monthly usage tracking ----
type UsageLog = { month: string; chars: number; runs: number };

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
function loadUsage(): UsageLog {
  try {
    const raw = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8')) as UsageLog;
    if (raw.month === currentMonth()) return raw;
  } catch { /* fall through */ }
  return { month: currentMonth(), chars: 0, runs: 0 };
}
function saveUsage(u: UsageLog) {
  fs.mkdirSync(path.dirname(USAGE_FILE), { recursive: true });
  fs.writeFileSync(USAGE_FILE, JSON.stringify(u, null, 2));
}

// ---- Markdown protection ----
type Protected = { placeholder: string; original: string };
function protectMarkdown(text: string): { protectedText: string; restore: Protected[] } {
  const restore: Protected[] = [];
  let i = 0;
  let out = text.replace(/```[\s\S]*?```/g, (m) => {
    const p = `XCODEBLOCKX${i++}X`;
    restore.push({ placeholder: p, original: m });
    return p;
  });
  out = out.replace(/`[^`\n]+`/g, (m) => {
    const p = `XINLINECODEX${i++}X`;
    restore.push({ placeholder: p, original: m });
    return p;
  });
  out = out.replace(/https?:\/\/\S+/g, (m) => {
    const p = `XURLX${i++}X`;
    restore.push({ placeholder: p, original: m });
    return p;
  });
  return { protectedText: out, restore };
}
function restoreMarkdown(text: string, restore: Protected[]): string {
  let out = text;
  for (const { placeholder, original } of restore) out = out.replaceAll(placeholder, original);
  return out;
}

type Target = {
  lang: deepl.TargetLanguageCode;
  outFile: string;
  formality: deepl.Formality;
  glossaryId?: string;
};

// Map site config language codes to DeepL language codes + output filenames.
// Source of truth: site config `languages` array (excludes canonical_lang).
const DEEPL_LANG_MAP: Record<string, { deepl: deepl.TargetLanguageCode; file: string }> = {
  ja: { deepl: 'ja', file: 'ja.md' },
  'zh-hans': { deepl: 'zh-Hans', file: 'zh.md' },
  'zh-hant': { deepl: 'zh-Hant', file: 'zh.md' },
  ko: { deepl: 'ko', file: 'ko.md' },
  fr: { deepl: 'fr', file: 'fr.md' },
  de: { deepl: 'de', file: 'de.md' },
  es: { deepl: 'es', file: 'es.md' },
  it: { deepl: 'it', file: 'it.md' },
};

const targets: Target[] = cfg.languages
  .filter(l => l !== cfg.canonical_lang)
  .map(l => {
    const map = DEEPL_LANG_MAP[l];
    if (!map) throw new Error(`[translate] Unsupported target language in config: ${l}`);
    const glossaryEnvName = cfg.deepl?.glossary_ids?.[l];
    const formalityRaw = cfg.deepl?.formality?.[l] ?? 'default';
    return {
      lang: map.deepl,
      outFile: map.file,
      formality: formalityRaw as deepl.Formality,
      glossaryId: glossaryEnvName ? process.env[glossaryEnvName] : undefined,
    };
  });

async function run() {
  const source = fs.readFileSync(EN_PATH, 'utf8');
  const parsed = matter(source);
  const { content, data: fm } = parsed;
  const titleEn = fm.title as string;
  const metaEn = fm.meta_description as string;

  // ---- Pre-flight ----
  const sourceLen = content.length + titleEn.length + metaEn.length;
  const totalChars = sourceLen * targets.length;
  console.log(`[budget] source=${sourceLen} chars, × ${targets.length} langs = ${totalChars}`);

  if (totalChars > MAX_PER_RUN) {
    console.error(`[budget] ABORT — ${totalChars} chars exceeds per-run cap ${MAX_PER_RUN}`);
    process.exit(2);
  }

  const usage = loadUsage();
  if (usage.chars + totalChars > MAX_MONTHLY) {
    console.error(`[budget] ABORT — monthly cap. Used=${usage.chars}, would add=${totalChars}, cap=${MAX_MONTHLY}`);
    process.exit(3);
  }

  try {
    const deeplUsage = await translator.getUsage();
    if (deeplUsage.character?.limitReached()) {
      console.error('[budget] ABORT — DeepL account limit reached');
      process.exit(4);
    }
    if (deeplUsage.character) {
      const pct = ((deeplUsage.character.count / deeplUsage.character.limit) * 100).toFixed(1);
      console.log(`[budget] DeepL account: ${deeplUsage.character.count}/${deeplUsage.character.limit} (${pct}%)`);
    }
  } catch {
    console.warn('[budget] Could not fetch DeepL account usage — proceeding with local count');
  }

  const { protectedText, restore } = protectMarkdown(content);

  for (const t of targets) {
    console.log(`\n→ Translating to ${t.lang}...`);
    const [bodyRes, titleRes, metaRes] = await Promise.all([
      translator.translateText(protectedText, 'en', t.lang, {
        tagHandling: 'html',
        preserveFormatting: true,
        formality: t.formality,
        glossary: t.glossaryId,
      }),
      translator.translateText(titleEn, 'en', t.lang, { glossary: t.glossaryId }),
      translator.translateText(metaEn, 'en', t.lang, { glossary: t.glossaryId }),
    ]);

    const translatedBody = restoreMarkdown(
      Array.isArray(bodyRes) ? bodyRes[0].text : bodyRes.text,
      restore
    );
    const translatedTitle = Array.isArray(titleRes) ? titleRes[0].text : titleRes.text;
    const translatedMeta = Array.isArray(metaRes) ? metaRes[0].text : metaRes.text;

    const outFm = {
      ...fm,
      lang: t.lang === 'zh-Hans' ? 'zh-hans' : 'ja',
      title: translatedTitle,
      meta_description: translatedMeta,
      translation_review: 'pending',
      translated_from: 'en',
      translator: 'deepl',
    };
    const outPath = path.join(DRAFT_DIR, t.outFile);
    fs.writeFileSync(outPath, matter.stringify(translatedBody, outFm));
    console.log(`  ✔ ${outPath}`);
  }

  usage.chars += totalChars;
  usage.runs += 1;
  saveUsage(usage);
  console.log(`\n[budget] Monthly: ${usage.chars}/${MAX_MONTHLY} chars, ${usage.runs} runs`);
  console.log('✓ Translation complete.');
}

run().catch((e) => {
  console.error('[translate] failed:', e.message ?? e);
  process.exit(1);
});
