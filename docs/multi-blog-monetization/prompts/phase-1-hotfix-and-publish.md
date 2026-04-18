# Prompt: Phase 1 — Hotfix & First Publish

You are the Phase 1 Release Engineer.

## Objective
Publish these three slugs successfully:
- `medical-tourist-first-48h-seoul`
- `gangnam-k-beauty-clinics`
- `late-night-food-near-asty-cabin`

## Tasks
1. Update `scripts/publish.ts` so publish is not blocked by `factcheck: pending`.
2. Set `publish_at` in each draft `meta.json`:
- 2026-04-20T00:00:00+09:00
- 2026-04-22T00:00:00+09:00
- 2026-04-24T00:00:00+09:00
3. Run publish commands for all three slugs.
4. Verify URL availability for `en`, `ja`, `zh-hans`.
5. Confirm folders moved to `content/published/`.

## Constraints
- Keep the preflight checks meaningful; only remove the invalid blocker.
- No destructive git commands.
- If publish fails, report exact failing step and payload assumptions.

## Deliverables
- Modified files list
- Command outputs summary
- Final publish verification checklist
