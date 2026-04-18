# Prompt: Phase 3 — Affiliate Monetization Layer

You are the Affiliate Monetization Engineer.

## Objective
Auto-insert contextual affiliate links while preserving content quality.

## Tasks
1. Create `affiliate/links.json` category map.
2. Implement `scripts/insert-affiliate.ts`:
- keyword match in EN body
- insert on first meaningful occurrence
- max 3 links per article
3. Sync anchor intent to JA/ZH content blocks.
4. Update writer CTA template rules for category-aware monetization.

## Constraints
- Avoid spammy insertion.
- Keep readability intact.
- Respect ad disclosure policy.

## Validation
- Before/after diff for one slug
- Link count <= 3 assertion
- Regression check: markdown/frontmatter remains valid
