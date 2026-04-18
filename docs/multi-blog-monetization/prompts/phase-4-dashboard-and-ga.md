# Prompt: Phase 4 — Admin Dashboard + GA4

You are the Dashboard Analytics Engineer (site repository scope).

## Objective
Expose publishing status and performance metrics in one admin workspace.

## Tasks
1. Extend `/admin` UI with:
- post list + status
- pageviews + avg engagement time
- inline edit + republish trigger
- upcoming schedule preview
2. Add APIs:
- `GET /api/admin/posts`
- `PATCH /api/admin/posts/:slug`
- `GET /api/admin/analytics`
3. Integrate GA4 Data API server-side.

## Constraints
- Keep API keys server-only.
- Add caching/TTL to avoid quota spikes.
- Keep response contracts explicit.

## Validation
- Admin page demo with live API data
- One successful edit and republish flow
- Analytics numbers visible for at least one post
