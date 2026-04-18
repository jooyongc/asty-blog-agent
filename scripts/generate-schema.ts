/**
 * scripts/generate-schema.ts
 *
 * Usage: npx tsx scripts/generate-schema.ts <slug>
 *
 * Reads content/drafts/<slug>/en.md + meta.json,
 * generates JSON-LD schema objects (Article, BreadcrumbList, FAQPage),
 * and writes them into meta.json under the `schema` key.
 *
 * No API calls — pure text processing.
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const SLUG = process.argv[2];
if (!SLUG) {
  console.error('Usage: tsx scripts/generate-schema.ts <slug>');
  process.exit(1);
}

const SITE_URL = process.env.ASTY_SITE_URL || 'https://asty-cabin-check.vercel.app';
const DRAFT_DIR = path.join('content', 'drafts', SLUG);
const EN_PATH = path.join(DRAFT_DIR, 'en.md');
const META_PATH = path.join(DRAFT_DIR, 'meta.json');

if (!fs.existsSync(EN_PATH)) {
  console.error(`Not found: ${EN_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(META_PATH)) {
  console.error(`Not found: ${META_PATH}`);
  process.exit(1);
}

// ---- Parse FAQ section from markdown body ----
type FaqItem = { question: string; answer: string };

function parseFaq(body: string): FaqItem[] {
  const faqMatch = body.match(/##\s+Frequently Asked Questions([\s\S]*?)(?=\n##\s|\s*$)/i);
  if (!faqMatch) return [];

  const section = faqMatch[1];
  const items: FaqItem[] = [];
  // Match **Q: ...** \n A: ...
  const pairs = section.matchAll(/\*\*Q:\s*(.+?)\*\*\s*\nA:\s*(.+?)(?=\n\n|\n\*\*Q:|\s*$)/gs);
  for (const match of pairs) {
    items.push({
      question: match[1].trim(),
      answer: match[2].trim(),
    });
  }
  return items;
}

// ---- Build schema objects ----

function buildArticleSchema(fm: Record<string, unknown>, meta: Record<string, unknown>): object {
  const translations = meta.translations as Record<string, { title: string; meta_description: string }>;
  const featuredImage = meta.featured_image as { url?: string; alt?: string } | undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: translations?.en?.title ?? fm.title,
    description: translations?.en?.meta_description ?? fm.meta_description,
    author: {
      '@type': 'Organization',
      name: 'ASTY Cabin Editorial',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ASTY Cabin',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/logo.png`,
      },
    },
    datePublished: (meta.publish_at as string | null) ?? new Date().toISOString(),
    dateModified: (meta.publish_at as string | null) ?? new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/en/blog/${SLUG}`,
    },
    ...(featuredImage?.url ? {
      image: {
        '@type': 'ImageObject',
        url: featuredImage.url,
        description: featuredImage.alt ?? '',
      },
    } : {}),
  };
}

function buildBreadcrumbSchema(meta: Record<string, unknown>): object {
  const translations = meta.translations as Record<string, { title: string }>;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/en`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${SITE_URL}/en/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: translations?.en?.title ?? SLUG,
        item: `${SITE_URL}/en/blog/${SLUG}`,
      },
    ],
  };
}

function buildFaqSchema(faqs: FaqItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

// ---- Main ----

const source = fs.readFileSync(EN_PATH, 'utf8');
const { data: fm, content: body } = matter(source);
const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8')) as Record<string, unknown>;

const faqs = parseFaq(body);
const schemas: object[] = [
  buildArticleSchema(fm, meta),
  buildBreadcrumbSchema(meta),
];
if (faqs.length > 0) {
  schemas.push(buildFaqSchema(faqs));
  console.log(`  + FAQPage schema (${faqs.length} Q&A pairs)`);
}

meta.schema = schemas;
fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));

console.log(`✓ Schema generated for ${SLUG}`);
console.log(`  Article + BreadcrumbList${faqs.length > 0 ? ' + FAQPage' : ''}`);
console.log(`  Updated: ${META_PATH}`);
