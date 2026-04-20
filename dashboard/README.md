# asty-blog-agent-dashboard

Private control panel for the multi-site blog automation agent.

This is a standalone Next.js app that lives inside the agent repo but
deploys separately. Workspaces (remote blog sites under this dashboard's
control) are persisted in the **asty-cabin Supabase** via the
`dashboard_workspaces` table. The dashboard encrypts each site's
`AGENT_API_KEY` with AES-256-GCM before storing — the control-plane DB
never sees plaintext credentials.

## Pages

- `/` — Multi-site overview: online/offline, post counts, views, API cost/budget
- `/direction` — Free-text direction + Director(Haiku) for the **active workspace**
- `/pipeline` — Workflow runs, DeepL usage, manual "지금 실행" button
- `/queue` — Publish queue approvals (all workspaces)
- `/sites/[id]` — Per-site detail: KPIs, posts table with scores
- `/graph` — Cross-site graph explorer
- `/gsc` — Search Console (striking-distance keywords)
- `/portfolio` — Budget cards + topic×site matrix
- `/workspaces` — Add/edit/deactivate registered sites
- `/reports` — Weekly performance reports

## Required environment variables

| Key | Used for | Scope |
|---|---|---|
| `DASHBOARD_PASSWORD` | login | Production, Preview, Development |
| `DASHBOARD_SESSION_SECRET` | cookie signing (`openssl rand -hex 32`) | same |
| `DASHBOARD_MASTER_KEY` | **AES-256-GCM key for workspace API keys**. Generate once with `openssl rand -hex 32`. LOSING THIS KEY BRICKS ALL WORKSPACES. Back it up. | same |
| `ASTY_AGENT_API_KEY` | bootstrap workspace bearer (asty-cabin) | same |
| `GITHUB_TOKEN` | fires GitHub Actions weekly pipeline dispatch | same |
| `GITHUB_REPO` | e.g. `jooyongc/asty-blog-agent` | same |
| `CONTROL_SITE_URL` | (optional) override control-plane URL. Default: `https://asty-cabin-check.vercel.app` | same |

## Local development

```bash
cd dashboard
npm install
cat > .env.local <<EOF
DASHBOARD_PASSWORD=<set a password>
DASHBOARD_SESSION_SECRET=$(openssl rand -hex 32)
DASHBOARD_MASTER_KEY=$(openssl rand -hex 32)
ASTY_AGENT_API_KEY=<from asty-cabin Vercel env>
EOF
npm run dev
# Visit http://localhost:3000, login with DASHBOARD_PASSWORD
```

## Deployment (Vercel)

1. Import the `asty-blog-agent` repo, set root directory to `dashboard/`
2. Add the env variables above to Production + Preview + Development
3. `vercel --prod` to deploy
4. Once `dashboard_workspaces` migration is applied (see below), add the
   bootstrap workspace via `/workspaces` UI.

## Adding a new blog site

> **Precondition**: The `dashboard_workspaces` migration (`asty-cabin/drizzle/migrations/016_dashboard_workspaces.sql`) must be applied to the asty-cabin Supabase.

Each workspace = one fully-provisioned, independent blog site. One dashboard
can manage many workspaces.

1. **Provision the blog site**  
   Spin up a new Vercel + Supabase deployment using the asty-cabin stack as
   template (clone the repo, new Supabase project, apply all migrations).

2. **Issue an `AGENT_API_KEY` for the new site**  
   Generate a random 32-byte token: `openssl rand -base64 32`  
   Set it as `AGENT_API_KEY` on the new site's Vercel project (all
   environments). Confirm via `curl -H "Authorization: Bearer <key>" <site>/api/admin/queue/export?site_id=...`.

3. **Register with the dashboard**  
   Open `/workspaces` → **"+ 사이트 추가"** → fill:
   - `site_id` — kebab-case, unique (e.g. `my-food-blog`)
   - `name` — human-readable label shown in switcher
   - `site_url` — `https://...` of the deployed site
   - `AGENT_API_KEY` — paste the plaintext value (encrypted at submit time)
   - `languages`, `canonical_lang`, `categories` — per site taxonomy
   - `profile` — `lean` ($5/mo), `standard` ($5.5/mo), or `full` ($6.5/mo)

4. **Activate and operate**  
   After creation, click "활성화" in the table OR use the sidebar switcher to
   make it the active workspace. `/direction` and Director calls will now
   route to this workspace's API.

### Constraints

- **One dashboard workspace = one deployed blog site**. No multi-tenant within
  a single deployment.
- **Master key rotation is not automated (v1)**. Plan to keep
  `DASHBOARD_MASTER_KEY` stable for the lifetime of all workspaces. If it
  leaks, create fresh workspaces with a new key (old ciphertext becomes
  unreadable). v1.1 will add `key_version` for graceful rotation.
- **Soft delete only**. Deactivating a workspace keeps the row; re-activate
  via the table's toggle.

## Auth

Password-gated session cookie. `DASHBOARD_PASSWORD` + `DASHBOARD_SESSION_SECRET`
govern login. For SSO (Google Workspace / GitHub) wire NextAuth later.

## Troubleshooting

**`DASHBOARD_MASTER_KEY is not set`** — missing env var. Set and redeploy.

**`DASHBOARD_MASTER_KEY must be 64 hex characters`** — regenerate with
`openssl rand -hex 32`.

**"workspace X has no encrypted_api_key"** — the row was created without a
key. Edit the workspace in `/workspaces` and paste the plaintext key.

**"decrypt failed for X"** — the `DASHBOARD_MASTER_KEY` changed after the
workspace was created. Either restore the old key or delete + recreate the
workspace.
