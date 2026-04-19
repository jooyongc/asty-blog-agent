# Graph RAG — Architecture & Operation

> Status: **Phase 8 foundation** (infrastructure + extraction + read API).
> Active use-cases (internal linking, agent retrieval) arrive in Phase 10.

## Why

Over 30+ published articles, the same entities (clinics, places, concepts,
claims) recur. Without a shared memory, every new article re-researches the
same facts and risks contradicting earlier articles. Graph RAG solves this
by persisting extracted entities and their relationships into Supabase, so
future agents can retrieve consistent context.

Concretely, Graph RAG enables (in Phase 10+):

1. **Consistent facts across articles** — Writer queries the graph before
   asserting "Samsung Seoul Hospital has English-speaking staff"; if a past
   article said otherwise, the Verifier catches the contradiction.
2. **Automatic internal linking** — when a draft mentions an entity that
   already exists, Internal Linker adds a contextual link to the past article
   that scored highest on traffic.
3. **Topic deduplication** — Portfolio Strategist checks which entities are
   already "claimed" by site A so site B can pick a different angle.
4. **Institutional memory** — site_learnings + graph let newer agents
   benefit from patterns that worked on older posts.

## Schema (Supabase)

Two tables created by migration `011_graph.sql`:

### `graph_entities`

| column          | type         | purpose                                         |
|-----------------|--------------|-------------------------------------------------|
| `id`            | uuid (pk)    | internal id                                     |
| `site_id`       | text, nullable | NULL = global; `<id>` = site-local            |
| `type`          | text         | `Person \| Organization \| Place \| Concept \| Claim \| Source \| Metric` |
| `canonical_name`| text         | normalized name, e.g. `Samsung Seoul Hospital`  |
| `aliases`       | text[]       | other surface forms from extraction             |
| `embedding`     | vector(512)  | reserved for Phase 10 semantic search           |
| `first_seen_post` | uuid       | back-pointer to the earliest blog_post          |
| `mention_count` | int          | incremented on each ingest                      |
| `metadata`      | jsonb        | free-form attributes                            |

Unique: `(site_id, type, canonical_name)` — same entity across ingests
merges via `mention_count += 1` and alias union.

### `graph_relationships`

| column       | type    | purpose                                      |
|--------------|---------|----------------------------------------------|
| `id`         | uuid    | —                                            |
| `src`, `dst` | uuid    | FK to `graph_entities`                       |
| `type`       | text    | `MENTIONS \| CITES \| CONTRADICTS \| SUPERSEDES \| CO_OCCURS \| VERIFIED_BY` |
| `post_id`    | uuid    | provenance — which post produced this edge   |
| `confidence` | decimal | 0.0–1.0, Haiku's self-rated confidence       |

Unique: `(src, dst, type, post_id)` — same evidence from same post can't
double-count; same edge from a different post is a separate row (stronger
signal of repeated observation).

## Relationship semantics

- **MENTIONS** — article references entity. Dense, cheap. Used by internal linker.
- **CITES** — claim is supported by a source URL. Populated by Verifier.
- **CO_OCCURS** — two entities appear in the same paragraph. Basis for "related
  topics" suggestions.
- **CONTRADICTS** — explicit disagreement. Used by Verifier to block publish.
- **SUPERSEDES** — entity v2 replaces v1 (e.g. "Formerly X, now Y"). Versioning.
- **VERIFIED_BY** — claim-to-source chain from Verifier. Trust score.

## Pipeline

```
publish
  └─ (post-publish hook, non-fatal)
     └─ scripts/extract-entities.ts
        ├─ loads content/drafts|published/<slug>/en.md
        ├─ loads verification.json (if present)
        ├─ Haiku 4.5 — structured extraction to JSON
        └─ POST /api/admin/graph/ingest
           └─ upserts entities + relationships
```

Read path (Phase 10 will wire this into Writer/Verifier):

```
agent asks for context about "Gangnam"
  └─ GET /api/admin/graph/export?entity=Gangnam&hops=2
     └─ returns center + 2-hop subgraph as JSON
```

## Budget profiles

Set `budget.profile` in `sites/<id>/config.json`:

| Profile    | Extraction cadence       | Monthly cost impact |
|------------|--------------------------|---------------------|
| `lean`     | Every **other** publish  | ≈ $0.9 / site       |
| `standard` | Every publish            | ≈ $1.8 / site       |
| `full`     | Every publish + embeds   | ≈ $2.3 / site       |

`extract-entities.ts` reads `budget.profile` and skips accordingly.
Use `--force` to bypass the biweekly gate for a specific slug.

## Activation checklist (when Phase 10 lands)

- [ ] pgvector embeddings provider chosen (Voyage AI recommended)
- [ ] Writer prompt updated to consume `graph-context.json` per draft
- [ ] Internal Linker script in place
- [ ] Verifier cross-checks against `CONTRADICTS` edges
- [ ] Dashboard graph explorer (Phase 11) ready

## Operator commands

```bash
# Force extraction on a specific published post
npx tsx scripts/extract-entities.ts <slug> --site <id> --force

# Verify the pipeline end-to-end
npx tsx scripts/graph-sanity.ts --site <id>

# Apply migration (once, via Supabase Management API)
# See drizzle/migrations/011_graph.sql in the site repo
```

## Troubleshooting

- **"ingest 401"** — check `cfg.env.api_key` env var is set on the machine
  running extract-entities and that it matches `AGENT_API_KEY` on the site.
- **Empty graph after several publishes** — confirm budget.profile isn't
  skipping every run. Check `content/.extract-entities-counter.json`.
- **"endpoint not found" warnings on ingest** — Haiku named an entity
  inconsistently between the `entities` array and `relationships`. Harmless
  in practice; the next extraction usually catches it.
