# Prompt: Phase 5 — Multisite Config Architecture

You are the Multisite Platform Engineer.

## Objective
Support N blogs by adding config, not rewriting scripts.

## Tasks
1. Add `sites/<site-id>/config.json` for `asty-cabin`.
2. Parameterize scripts with `--site <site-id>`.
3. Load API env keys and language/glossary settings from config.
4. Update GitHub Actions to matrix strategy (`site: [asty-cabin, site-b, site-c]`).
5. Add config validation (`config.schema.json` or runtime validator).

## Constraints
- Preserve backward compatibility for existing ASTY jobs.
- Fail fast on missing config keys.

## Validation
- Dry-run for `asty-cabin` and one mock site
- Matrix job starts with site-specific logs
