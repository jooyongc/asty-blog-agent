# ASTY Blog Agent — Dashboard Design Handoff (Phase 7~12)

Baseline: Phase 1~6 pipeline complete. This dashboard prototypes the UX for Phase 7~12 as defined in `PHASE-7-12-UPGRADE-PLAN.md` v1.0 (2026-04-19 KST).

## Files

- `index.html` — root shell (routing, tweaks protocol, Google fonts)
- `styles.css` — design tokens, components, responsive breakpoints
- `data.js` — mock data: agents, pipeline stages, drafts, topic queue, glossary, runs
- `components/Icons.jsx` — 1-rem stroke icon set
- `components/Primitives.jsx` — AgentAvatar, Chip, Metric, Sparkline, ProgressBar, Segmented, Tabs, HeroPlaceholder, CostDonut, Toggle
- `components/Shell.jsx` — Sidebar + Topbar + NAV (source of truth for routes)
- `components/pages/Overview.jsx` — home dashboard
- `components/pages/AgentFlow.jsx` — live node graph + streaming logs
- `components/pages/WeeklyRun.jsx` — gantt timeline of weekly cycle
- `components/pages/Drafts.jsx` — draft list + EN/JA/ZH review pane
- `components/pages/Publish.jsx` — publish settings (pre-Phase-9)
- `components/pages/Misc.jsx` — Topics, Glossary, Analytics, Logs, Settings
- `components/pages/Phase7_12.jsx` — **new**: Direction, PublishQueue, GraphExplorer, Portfolio, GSC

## Route map (sidebar order)

| Route | Page | Phase | Key contract |
|---|---|---|---|
| `overview` | Overview | 1~6 | This-week progress, $10→$5 budget donut, agent health |
| `direction` | Direction | 9/11 | Free-text → Director returns 3 ranked proposals with 👍/👎 feedback (feeds `agent_feedback` table) |
| `agents` | Agent flow | 1~6 | Now includes **verifier** node in the DAG |
| `weekly` | Weekly run | 1~6 | Pipeline gantt shows Writer→Verifier→Translate→Packager→Linker |
| `drafts` | Drafts | 1~6 | EN/JA/ZH tabs, per-locale body |
| `queue` | **Publish queue** | 9 | 1-click Approve per card; shows verification status, quality score, unsupported/contradicted counts, internal link count. `blocked` cards require human review (contradicted≥1) |
| `publish` | Publish | 1~6 | Per-locale publish toggles |
| `topics` | Topic queue | 1~6 | — |
| `glossary` | Glossary | 1~6 | — |
| `graph` | **Graph Explorer** | 8/11 | 2-hop subgraph visualizer, entity type filter, 2-hop radius, export JSON |
| `gsc` | **Search Console** | 10 | Striking-distance kws (pos 8–20) table, auto-queue for seo-researcher |
| `portfolio` | **Portfolio** | 12 | Multi-site budget cards + topic×site collision matrix |
| `analytics` | Cost & tokens | — | |
| `logs` | Run history | — | |
| `settings` | Settings | — | |

## Agents (updated for Phase 7)

Colors live in CSS vars (`--agent-*`, `--agent-*-soft`). Pipeline order:

```
director → seo → writer → verifier → translate → packager → linker → publish
```

Verifier is new (Phase 7-3). Contract:
- Output: `verification.json` with `{status, claims[], unsupported, contradicted}`
- `unsupported ≥ 1` → writer auto-rewrites once with hedging
- `contradicted ≥ 1` → queue status `blocked`, human review required

## Design tokens

- Font: Inter (sans), Instrument Serif (article body when `tweaks.serifArticle`), JetBrains Mono, Noto Sans JP/SC
- Accent (default): `#b66f1c` (packager amber). Palette: `#2f6f4e`, `#1d4a34`, `#2f68c4`, `#6a4aa8`, `#b66f1c`, `#191918`
- Status: `--ok` green, `--warn` amber, `--err` red with `--*-soft` backgrounds
- Radii: 6/8/10px. Shadows: `--shadow-sm` for cards, `--shadow-md` for elevated panels

## Responsive breakpoints

- `≤ 1100px`: Drafts list collapses behind review pane toggle
- `≤ 880px`: Sidebar goes off-canvas (hamburger), grids stack to 1-col, topbar search hides

## Tweaks protocol

`index.html` registers `__edit_mode_available` listener. `TWEAK_DEFAULS` JSON block is the persistence target:
- `accent` — hex
- `density` — `comfortable` | `compact`
- `animatedEdges` — bool (Agent flow dashed-line flow animation)
- `serifArticle` — bool (draft body typography)

## Notes for Claude Code handoff

1. **Direction page** is mock-only — wire `POST /api/direction` (dashboard repo) to Director agent; persist thumbs to `agent_feedback` table (Phase 11-4).
2. **Publish queue** card buttons need: `POST /api/admin/queue/approve/:slug` and `/reject/:slug` (Phase 9-2). Reject reason should be captured for writer few-shot.
3. **Graph Explorer** visualizer is a positioned-div placeholder. Swap for a real force layout (e.g. `react-force-graph-2d` or `cosmos`) fed from `GET /api/admin/graph/export?entity=<name>&hops=2`.
4. **GSC page** needs `GET /api/admin/gsc/export` (Phase 10-1). `status: 'striking'` rows should POST to topic queue on "Queue" click.
5. **Portfolio** budget cards should pull from `agent_costs` (Phase 9-3); halt state driven by `budget-guard.ts` profile ceiling.
6. Agent colors and pipeline order are in `data.js` — keep as the single source of truth.
7. Verifier chip colors: `verified` = ok, `partial` = warn, `blocked` = err, `skipped` = ghost.

## Budget-guard UI contract

- Card shows `spent / budget` with progress bar
- Over 90% (`$4.5`): warn chip
- Over 100% (`$5.0`): err chip + "budget-guard halted cycle" banner
- Profile dropdown: Lean / Standard / Full (mirrors `sites/<id>/config.json`)
