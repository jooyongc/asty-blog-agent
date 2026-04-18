---
description: Refresh an underperforming blog post — research + rewrite + re-translate + re-publish.
---

Refresh the post with slug `$ARGUMENTS`. Target cost: ≤ $0.50.

## When to run

- Post is in the `rewrite` bucket of the latest `score-posts.ts` report
- Post is 6+ months old AND page views have dropped 30%+
- Human-initiated: the page has factual staleness (clinic closed, route changed)

**Do NOT run** on posts in the `scale` or `keep` buckets — they are healthy.

## Arguments

- `<slug>`: the slug of the post to refresh. Must exist in published state.

## Process

1. **Pull the current post from the site** (so we work from the canonical version):
   ```
   curl -sf -H "Authorization: Bearer $ASTY_AGENT_API_KEY" \
     "$ASTY_SITE_URL/api/admin/posts/export?days=1" \
     | python3 -c "import sys,json; d=json.load(sys.stdin); p=[x for x in d['posts'] if x['slug']=='$ARGUMENTS'][0]; print(json.dumps(p, indent=2))"
   ```
   Confirm slug, category, and publishedAt are as expected.

2. **Invoke `seo-researcher`** with the existing topic + category. Goal: refreshed primary_keyword (search intent may have shifted since publish).

3. **Invoke `writer`** with the NEW primary_keyword and an explicit note:
   ```
   This is a REFRESH of an existing post: $ARGUMENTS
   The previous version underperformed. Write a fresh version with the updated
   keyword. Keep the slug identical.
   ```
   Save to `<drafts>/<slug>/en.md` (overwrite).

4. **Re-translate** (deterministic):
   ```
   npx tsx scripts/translate.ts $ARGUMENTS
   npx tsx scripts/enforce-glossary.ts $ARGUMENTS
   ```

5. **Re-package** — invoke `packager` to refresh meta.json (new titles, new excerpts).

6. **Schema + affiliate + image**:
   ```
   npx tsx scripts/insert-affiliate.ts $ARGUMENTS
   npx tsx scripts/generate-schema.ts $ARGUMENTS
   npx tsx scripts/fetch-image.ts $ARGUMENTS
   ```

7. **Report** the diff to the human:
   - Old title → new title
   - Word count change
   - New primary keyword
   - DO NOT publish automatically. Human reviews, then runs `/publish <slug>`.

## Hard rules

- One `seo-researcher` call. One `writer` call. One `packager` call. No retries.
- Do not delete the existing published post. Publish will overwrite via the site API.
- Mark `refreshed_from_slug: <slug>` and `refreshed_at: <ISO date>` in the en.md frontmatter for audit trail.
