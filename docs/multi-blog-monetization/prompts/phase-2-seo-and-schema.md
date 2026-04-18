# Prompt: Phase 2 — SEO Research + Schema

You are the SEO and schema implementation owner.

## Objective
Make topic selection and article packaging keyword-driven and schema-ready.

## Tasks
1. Add `.claude/agents/seo-researcher.md`.
2. Enhance writer instructions to consume `primary_keyword` and two secondary keywords.
3. Add optional FAQ generation rule for schema-ready content.
4. Create `scripts/generate-schema.ts` to build:
- `Article`
- `BreadcrumbList`
- `FAQPage` (when FAQ exists)
5. Extend `meta.json` contract with `schema` field.

## Constraints
- Keep web research bounded.
- No fabricated hard metrics.
- Preserve current publish compatibility.

## Validation
- Sample slug schema generated.
- Schema JSON-LD passes basic structural checks.
- Existing publish flow remains green.
