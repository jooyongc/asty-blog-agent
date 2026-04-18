---
description: Optional Sonnet polish pass for a specific article (costs ~$0.30 extra)
argument-hint: <slug>
---

Polish: $ARGUMENTS using Sonnet 4.6.

Use this ONLY when:
- Article is for medical or corporate category (higher stakes content)
- Human flagged the draft as needing improvement
- Article will be promoted externally

Cost: ~$0.20-$0.30 per call. Uses ~10% of monthly budget per polish.

## Process

1. Read content/drafts/$ARGUMENTS/en.md
2. Use the Task tool with model: claude-sonnet-4-6 to improve:
   - Tighten sentences
   - Replace vague phrasing with concrete details
   - Check voice consistency
   - Verify Getting There section is actionable
3. Save improved version back to en.md

**After polish, re-run translation**:
```
npx tsx scripts/translate.ts $ARGUMENTS
npx tsx scripts/enforce-glossary.ts $ARGUMENTS
```

Metadata can stay — no repackaging needed unless title/category changed.

## Do NOT

- Do not polish multiple articles in one invocation
- Do not use Sonnet for anything other than this specific task
