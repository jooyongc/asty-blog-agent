---
description: Full weekly pipeline — curate 3 topics, draft each, translate, package. Runs once per week.
---

Run the complete weekly pipeline. Target total cost: ≤ $2.00.

## Step 1: Curate (inline, no subagent)

Read topics/manual-queue.md. Select 3 uncompleted topics by FIFO + priority:high first.
Assign dates: Mon / Wed / Fri next week at 09:00 KST.
Write selection to topics/this-week.md.

**Do NOT invoke a curator subagent.** Do it in the main conversation to save a call.

## Step 2: Draft each topic

For each of the 3 selected topics:

1. Invoke `writer` subagent with the topic.
   - Uses Haiku 4.5
   - ≤ 3 web searches
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

5. Run image fetch script:
   ```
   npx tsx scripts/fetch-image.ts <slug>
   ```

## Step 3: Report

Summarize all 3 drafts:
- Slug + title + word count + searches used
- Scheduled publish date
- Any hedged claims to review
- Total estimated API spend (sum from agent usage output if available)

## Step 4: STOP

Do NOT publish automatically. Human reviews drafts, then runs `/publish <slug>` for each.

## Hard rules

- One `writer` call per article. No retries.
- One `packager` call per article. No retries.
- If any script fails, skip that article and continue with the next.
- Report all failures at the end.
- TOTAL subagent calls this entire run: 6 (3 writer + 3 packager). NO MORE.
