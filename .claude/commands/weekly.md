---
description: Full weekly pipeline — curate 3 topics, SEO research, draft each, verify claims, translate, package. Runs once per week.
---

Run the complete weekly pipeline. Target total cost: ≤ $2.50 per site (Lean profile).

## Step 0: Pull latest affiliate links (deterministic)

```
npx tsx scripts/pull-affiliate-links.ts
```

Fetches the latest affiliate links from the site admin. If it fails (site unreachable),
continue with whatever is already in affiliate/links.json — this is non-fatal.

## Step 1: Curate (inline, no subagent)

Read topics/manual-queue.md. Select 3 uncompleted topics by FIFO + priority:high first.
Assign dates: Mon / Wed / Fri next week at 09:00 KST.
Write selection to topics/this-week.md.

**Do NOT invoke a curator subagent.** Do it in the main conversation to save a call.

## Step 2: SEO Research (1 subagent call per topic)

For each of the 3 selected topics:

Invoke `seo-researcher` subagent with the topic and category.
- Uses Haiku 4.5, ≤ 5 web searches
- Returns JSON with primary_keyword, secondary_keywords, difficulty
- Save the result to topics/this-week.md alongside the topic entry

## Step 3: Draft each topic

For each of the 3 selected topics:

1. Invoke `writer` subagent with:
   - topic
   - primary_keyword (from Step 2)
   - secondary_keywords (from Step 2)
   - Uses Haiku 4.5, ≤ 3 web searches
   - Saves content/drafts/<slug>/en.md
   - BEFORE returning, persist the researcher's brief at content/drafts/<slug>/research.json
     (structure: `{primary_keyword, secondary_keywords, search_intent, estimated_difficulty, rationale, claims_seeded_in_draft: [...]}`)

2. Invoke `verifier` subagent with:
   - Path to content/drafts/<slug>/en.md
   - Path to content/drafts/<slug>/research.json (may not exist — tolerate)
   - Path to write verification.json: content/drafts/<slug>/verification.json
   - Uses Haiku 4.5, ≤ 3 WebFetch calls
   - Emits verification.json with per-claim status

3. Run verification finisher script (deterministic, updates frontmatter):
   ```
   npx tsx scripts/verify-draft.ts <slug>
   ```
   - Exit code 3 = `blocked` → skip remaining steps for this slug, report at end
   - Exit code 0 = verified / partial / skipped → continue

4. Run translation script (deterministic, no Claude call):
   ```
   npx tsx scripts/translate.ts <slug>
   ```

5. Run glossary enforcement script (deterministic):
   ```
   npx tsx scripts/enforce-glossary.ts <slug>
   ```

6. Invoke `packager` subagent for metadata.
   - Uses Haiku 4.5
   - Saves content/drafts/<slug>/meta.json

7. Run affiliate link insertion (deterministic, skips if no links configured):
   ```
   npx tsx scripts/insert-affiliate.ts <slug>
   ```

8. Run schema generation script (deterministic):
   ```
   npx tsx scripts/generate-schema.ts <slug>
   ```

9. Run image fetch script:
   ```
   npx tsx scripts/fetch-image.ts <slug>
   ```

## Step 4: Report

Summarize all 3 drafts:
- Slug + title + primary_keyword + word count + searches used
- Scheduled publish date
- Any hedged claims to review
- SEO difficulty estimates
- Total estimated API spend (sum from agent usage output if available)

## Step 5: STOP

Do NOT publish automatically. Human reviews drafts, then runs `/publish <slug>` for each.

## Hard rules

- One `seo-researcher` call per article. No retries.
- One `writer` call per article. No retries.
- One `verifier` call per article. No retries.
- One `packager` call per article. No retries.
- If `verify-draft.ts` exits 3 (blocked), skip packager/affiliate/schema/image for that slug and flag for human review.
- If any other script fails, skip that article and continue with the next.
- Report all failures at the end.
- TOTAL subagent calls this entire run: 12 (3 seo-researcher + 3 writer + 3 verifier + 3 packager). NO MORE.
