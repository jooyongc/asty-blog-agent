---
description: Publish a completed draft to the site
argument-hint: <slug>
---

Publish: $ARGUMENTS

## Preflight

1. Check content/drafts/$ARGUMENTS/ exists
2. Check en.md, ja.md, zh.md all exist
3. Check each has ≥ 500 words (simple wc -w check)
4. Check meta.json exists and is valid JSON

If any fail, STOP and list what's missing.

## Publish

Run: `npx tsx scripts/publish.ts $ARGUMENTS`

This is a deterministic script — no Claude call here.

On success:
- Moves content/drafts/$ARGUMENTS/ to content/published/$ARGUMENTS/
- Reports live URLs for en/ja/zh
- Run post-publish entity extraction (non-fatal, biweekly mode by default):
  ```
  npx tsx scripts/extract-entities.ts $ARGUMENTS
  ```
  Failure here does NOT fail the publish — the graph is eventually consistent.

On failure:
- Show error verbatim
- Do NOT retry
- Do NOT move files (so manual retry is possible)
