// lib/security.ts – Account lockout, login attempt tracking

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000

// In-memory store (use Redis in production)
const loginAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>()

export function getLoginAttemptKey(email: string, ip: string): string {
  return `login:${email}:${ip}`
}

export function checkAccountLockout(email: string, ip: string): {
  locked: boolean
  remainingMs?: number
  attempts: number
} {
  const key = getLoginAttemptKey(email, ip)
  const record = loginAttempts.get(key)

  if (!record) return { locked: false, attempts: 0 }

  const now = Date.now()

  // Check if lockout has expired
  if (record.lockedUntil && now > record.lockedUntil) {
    loginAttempts.delete(key)
    return { locked: false, attempts: 0 }
  }

  // Check if currently locked
  if (record.lockedUntil && now <= record.lockedUntil) {
    return { locked: true, remainingMs: record.lockedUntil - now, attempts: record.count }
  }

  // Check if attempt window expired
  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(key)
    return { locked: false, attempts: 0 }
  }

  return { locked: false, attempts: record.count }
}

export function recordFailedLogin(email: string, ip: string): { locked: boolean; attempts: number } {
  const key = getLoginAttemptKey(email, ip)
  const now = Date.now()
  const record = loginAttempts.get(key)

  if (!record) {
    loginAttempts.set(key, { count: 1, firstAttempt: now })
    return { locked: false, attempts: 1 }
  }

  record.count++

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS
    return { locked: true, attempts: record.count }
  }

  return { locked: false, attempts: record.count }
}

export function clearLoginAttempts(email: string, ip: string): void {
  loginAttempts.delete(getLoginAttemptKey(email, ip))
}

// CSRF token helpers (simple double-submit cookie pattern)
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(array)
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

// Password strength scoring
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  color: string
  feedback: string[]
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else feedback.push('Mindestens 8 Zeichen')

  if (password.length >= 12) score++
  else feedback.push('12+ Zeichen empfohlen')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Großbuchstaben hinzufügen')

  if (/[0-9]/.test(password)) score++
  else feedback.push('Zahlen hinzufügen')

  if (/[^A-Za-z0-9]/.test(password)) score++
  else feedback.push('Sonderzeichen hinzufügen')

  // Normalize to 0-4
  const normalizedScore = Math.min(4, score) as 0 | 1 | 2 | 3 | 4

  const labels = ['Sehr schwach', 'Schwach', 'Mittel', 'Stark', 'Sehr stark']
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-400', 'bg-emerald-500']

  return {
    score: normalizedScore,
    label: labels[normalizedScore],
    color: colors[normalizedScore],
    feedback,
  }
}

// Generate secure random token
export function generateSecureToken(byteLength = 32): string {
  const { randomBytes } = require('crypto')
  return randomBytes(byteLength).toString('hex')
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}
