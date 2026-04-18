---
description: Full weekly pipeline — curate 3 topics, SEO research, draft each, translate, package. Runs once per week.
---

Run the complete weekly pipeline. Target total cost: ≤ $2.00.

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

2. Run translation script (deterministic, no Claude call):
   ```
   npx tsx scripts/translate.ts <slug>
   ```

3. Run glossary enforcement script (deterministic):
   ```
   npx tsx scripts/enforce-glossary.ts <slug>
   ```

4. Invoke `packager` subagent for metadata.
   - Uses Haiku 4.5
   - Saves content/drafts/<slug>/meta.json

5. Run schema generation script (deterministic):
   ```
   npx tsx scripts/generate-schema.ts <slug>
   ```

6. Run image fetch script:
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
- One `packager` call per article. No retries.
- If any script fails, skip that article and continue with the next.
- Report all failures at the end.
- TOTAL subagent calls this entire run: 9 (3 seo-researcher + 3 writer + 3 packager). NO MORE.
