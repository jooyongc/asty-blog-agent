#!/usr/bin/env node
/**
 * One-shot: seed asty-cabin as the first workspace in the dashboard_workspaces
 * control plane. Requires the 016 migration to be applied on asty-cabin
 * Supabase first. Safe to re-run (detects and reports duplicate).
 *
 * Usage:
 *   ASTY_AGENT_API_KEY=... DASHBOARD_MASTER_KEY=... node scripts/seed-workspace-asty.mjs
 *
 * If env vars are already in .env.local, just:
 *   set -a && . .env.local && set +a && node scripts/seed-workspace-asty.mjs
 */

import crypto from 'node:crypto'

const CONTROL_URL = process.env.CONTROL_SITE_URL || 'https://asty-cabin-check.vercel.app'
const AGENT_KEY = process.env.ASTY_AGENT_API_KEY
const MASTER = process.env.DASHBOARD_MASTER_KEY

if (!AGENT_KEY) { console.error('ASTY_AGENT_API_KEY missing'); process.exit(1) }
if (!MASTER || !/^[0-9a-f]{64}$/.test(MASTER)) {
  console.error('DASHBOARD_MASTER_KEY must be 64 hex characters')
  process.exit(1)
}

function encrypt(plaintext, aad) {
  const key = Buffer.from(MASTER, 'hex')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'))
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return ['v1', iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join(':')
}

const payload = {
  site_id: 'asty-cabin',
  name: 'ASTY Cabin',
  site_url: 'https://asty-cabin-check.vercel.app',
  encrypted_api_key: encrypt(AGENT_KEY, 'asty-cabin'),
  languages: ['en', 'ja', 'zh-hans'],
  canonical_lang: 'en',
  categories: ['medical', 'beauty', 'food', 'leisure', 'transport', 'family', 'corporate', 'culture'],
  profile: 'lean',
  active: true,
}

console.log('[seed] POST', CONTROL_URL + '/api/admin/dashboard/workspaces')
const res = await fetch(CONTROL_URL + '/api/admin/dashboard/workspaces', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AGENT_KEY}` },
  body: JSON.stringify(payload),
})
const text = await res.text()
console.log('  HTTP', res.status)
console.log('  body:', text.slice(0, 400))

if (res.ok) {
  console.log('\n✓ asty-cabin workspace seeded. Dashboard sidebar will show it on next refresh.')
  process.exit(0)
}
if (res.status === 409) {
  console.log('\nⓘ Already seeded. No action needed.')
  process.exit(0)
}
if (res.status === 500 && text.includes('relation') && text.includes('does not exist')) {
  console.error('\n✗ Table dashboard_workspaces not found. Apply migration 016_dashboard_workspaces.sql first.')
} else if (res.status === 500) {
  console.error('\n✗ Server error. Likely migration not applied — run 016_dashboard_workspaces.sql in Supabase SQL Editor.')
}
process.exit(1)
