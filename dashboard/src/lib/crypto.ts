/**
 * AES-256-GCM encryption for workspace API keys.
 *
 * Ciphertext format: `v1:<iv_b64>:<tag_b64>:<cipher_b64>`
 * - iv:     12-byte random IV (96-bit, GCM standard)
 * - tag:    16-byte auth tag (128-bit)
 * - cipher: variable-length ciphertext
 *
 * Master key source: `process.env.DASHBOARD_MASTER_KEY` — 32-byte (256-bit)
 * value encoded as 64-char hex string. Generated once via:
 *   openssl rand -hex 32
 *
 * Optional AAD (additional authenticated data) binds ciphertext to a specific
 * site_id so cross-workspace key swapping breaks verification.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const VERSION = 'v1'
const ALG = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

function loadMasterKey(): Buffer {
  const hex = process.env.DASHBOARD_MASTER_KEY
  if (!hex) throw new Error('[crypto] DASHBOARD_MASTER_KEY is not set')
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('[crypto] DASHBOARD_MASTER_KEY must be 64 hex characters (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Encrypt a UTF-8 string with AES-256-GCM. Optional AAD binds ciphertext to a
 * domain value (e.g., site_id) — decryption must supply the same AAD.
 */
export function encrypt(plaintext: string, aad?: string): string {
  const key = loadMasterKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALG, key, iv)
  if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'))
  const cipherPart = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    VERSION,
    iv.toString('base64'),
    tag.toString('base64'),
    cipherPart.toString('base64'),
  ].join(':')
}

/**
 * Decrypt a string produced by `encrypt`. AAD must match what was supplied at
 * encrypt time. Throws on format errors, wrong key, or tampered ciphertext.
 */
export function decrypt(ciphertext: string, aad?: string): string {
  const key = loadMasterKey()
  const parts = ciphertext.split(':')
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('[crypto] ciphertext format mismatch (expected v1:iv:tag:cipher)')
  }
  const [, ivB64, tagB64, cipherB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const cipherPart = Buffer.from(cipherB64, 'base64')
  if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
    throw new Error('[crypto] iv/tag length mismatch')
  }
  const decipher = createDecipheriv(ALG, key, iv)
  if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'))
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(cipherPart), decipher.final()])
  return plaintext.toString('utf8')
}

/** Returns true if the string matches the v1 format. Does NOT attempt decryption. */
export function isCiphertextFormat(s: string): boolean {
  return /^v1:[A-Za-z0-9+/=]{16,}:[A-Za-z0-9+/=]{16,}:[A-Za-z0-9+/=]{4,}$/.test(s)
}
