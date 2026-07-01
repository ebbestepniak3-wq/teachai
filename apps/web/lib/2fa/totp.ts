// lib/2fa/totp.ts – Time-based One-Time Password (RFC 6238)

import { createHmac, randomBytes } from 'crypto'

const TOTP_STEP = 30 // seconds
const TOTP_DIGITS = 6
const TOTP_WINDOW = 1 // ±1 step tolerance
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const BACKUP_CODE_COUNT = 10
const BACKUP_CODE_LENGTH = 8

// Generate a random Base32 secret for TOTP
export function generateTotpSecret(): string {
  const bytes = randomBytes(20)
  let result = ''
  let bits = 0
  let value = 0

  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      result += BASE32_CHARS[(value >> bits) & 31]
    }
  }

  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31]
  }

  // Format in groups of 4 for readability
  return result.match(/.{1,4}/g)?.join(' ') || result
}

// Decode Base32 to buffer
function base32Decode(input: string): Buffer {
  const clean = input.replace(/\s/g, '').toUpperCase()
  const bytes: number[] = []
  let bits = 0
  let value = 0

  for (const char of clean) {
    const idx = BASE32_CHARS.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((value >> bits) & 255)
    }
  }

  return Buffer.from(bytes)
}

// Generate TOTP code for a given counter
function generateHotp(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))

  const hmac = createHmac('sha1', key)
  hmac.update(buf)
  const hash = hmac.digest()

  const offset = hash[hash.length - 1] & 0xf
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)

  return (code % Math.pow(10, TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, '0')
}

// Get current TOTP counter
function getCurrentCounter(): number {
  return Math.floor(Date.now() / 1000 / TOTP_STEP)
}

// Generate current TOTP code
export function generateTotpCode(secret: string): string {
  return generateHotp(secret, getCurrentCounter())
}

// Verify a TOTP code (with time window tolerance)
export function verifyTotpCode(secret: string, code: string): boolean {
  if (!code || code.length !== TOTP_DIGITS) return false
  const counter = getCurrentCounter()

  for (let delta = -TOTP_WINDOW; delta <= TOTP_WINDOW; delta++) {
    if (generateHotp(secret, counter + delta) === code) {
      return true
    }
  }
  return false
}

// Generate TOTP URI for QR code
export function generateTotpUri(secret: string, email: string, issuer = 'TeacherAI'): string {
  const cleanSecret = secret.replace(/\s/g, '')
  const params = new URLSearchParams({
    secret: cleanSecret,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP),
  })
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?${params}`
}

// Generate backup codes
export function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () =>
    randomBytes(BACKUP_CODE_LENGTH / 2)
      .toString('hex')
      .toUpperCase()
      .match(/.{4}/g)!
      .join('-')
  )
}

// Hash backup codes for storage
export async function hashBackupCode(code: string): Promise<string> {
  const { createHash } = await import('crypto')
  return createHash('sha256').update(code.replace(/-/g, '').toUpperCase()).digest('hex')
}

// Verify a backup code against stored hashes
export async function verifyBackupCode(
  inputCode: string,
  storedHashes: string[]
): Promise<{ valid: boolean; index: number }> {
  const hash = await hashBackupCode(inputCode)
  const index = storedHashes.indexOf(hash)
  return { valid: index !== -1, index }
}
