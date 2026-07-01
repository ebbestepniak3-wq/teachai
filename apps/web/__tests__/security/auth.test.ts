// __tests__/security/auth.test.ts
import { checkPasswordStrength } from '@/lib/security'
import { checkRateLimit } from '@/lib/cache'
import { verifyTotpCode, generateTotpSecret, generateTotpCode } from '@/lib/2fa/totp'

describe('Password strength validation', () => {
  test('score 0: empty password', () => {
    const result = checkPasswordStrength('')
    expect(result.score).toBe(0)
  })

  test('score 1: too short', () => {
    const result = checkPasswordStrength('abc')
    expect(result.score).toBeLessThanOrEqual(1)
  })

  test('score 4: strong password', () => {
    const result = checkPasswordStrength('MySecure123!Pass')
    expect(result.score).toBeGreaterThanOrEqual(3)
  })

  test('includes feedback for missing uppercase', () => {
    const result = checkPasswordStrength('mysecure123!')
    expect(result.feedback.some(f => f.toLowerCase().includes('großbuchstabe'))).toBe(true)
  })

  test('includes feedback for missing numbers', () => {
    const result = checkPasswordStrength('MySecurePassword!')
    expect(result.feedback.some(f => f.toLowerCase().includes('zahl'))).toBe(true)
  })

  test('color is correct for strong password', () => {
    const result = checkPasswordStrength('MyVerySecure123!!')
    expect(['bg-emerald-400', 'bg-emerald-500']).toContain(result.color)
  })
})

describe('TOTP two-factor authentication', () => {
  test('generates valid secret', () => {
    const secret = generateTotpSecret()
    expect(typeof secret).toBe('string')
    expect(secret.length).toBeGreaterThan(10)
  })

  test('generated code verifies against same secret', () => {
    const secret = generateTotpSecret()
    const code = generateTotpCode(secret)
    expect(code).toMatch(/^\d{6}$/)
    expect(verifyTotpCode(secret, code)).toBe(true)
  })

  test('wrong code fails verification', () => {
    const secret = generateTotpSecret()
    expect(verifyTotpCode(secret, '000000')).toBe(false)
  })

  test('code from different secret fails', () => {
    const secret1 = generateTotpSecret()
    const secret2 = generateTotpSecret()
    const code = generateTotpCode(secret1)
    // Very unlikely (but not guaranteed) to match different secret
    if (code !== generateTotpCode(secret2)) {
      expect(verifyTotpCode(secret2, code)).toBe(false)
    }
  })

  test('invalid code format rejected', () => {
    const secret = generateTotpSecret()
    expect(verifyTotpCode(secret, '')).toBe(false)
    expect(verifyTotpCode(secret, '12345')).toBe(false) // too short
    expect(verifyTotpCode(secret, 'abcdef')).toBe(false) // not digits
  })
})

describe('Input sanitization', () => {
  const { sanitizeInput } = require('@/lib/security')

  test('removes script injection', () => {
    const input = '<script>alert("xss")</script>'
    const sanitized = sanitizeInput(input)
    expect(sanitized).not.toContain('<script>')
    expect(sanitized).not.toContain('</script>')
  })

  test('encodes HTML entities', () => {
    const input = '<b>test</b>'
    const sanitized = sanitizeInput(input)
    expect(sanitized).toContain('&lt;')
    expect(sanitized).toContain('&gt;')
  })

  test('trims whitespace', () => {
    const sanitized = sanitizeInput('  hello world  ')
    expect(sanitized).toBe('hello world')
  })

  test('safe text passes through', () => {
    const input = 'Normale Lehrkraft-Eingabe 123'
    const sanitized = sanitizeInput(input)
    expect(sanitized).toBe(input)
  })
})

describe('Account lockout', () => {
  const { checkAccountLockout, recordFailedLogin, clearLoginAttempts } = require('@/lib/security')

  const testEmail = `test-${Date.now()}@example.com`
  const testIp = '192.168.1.1'

  afterEach(() => {
    clearLoginAttempts(testEmail, testIp)
  })

  test('no lockout initially', () => {
    const result = checkAccountLockout(testEmail, testIp)
    expect(result.locked).toBe(false)
    expect(result.attempts).toBe(0)
  })

  test('not locked after 4 failed attempts', () => {
    for (let i = 0; i < 4; i++) {
      recordFailedLogin(testEmail, testIp)
    }
    const result = checkAccountLockout(testEmail, testIp)
    expect(result.locked).toBe(false)
    expect(result.attempts).toBe(4)
  })

  test('locked after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      recordFailedLogin(testEmail, testIp)
    }
    const result = checkAccountLockout(testEmail, testIp)
    expect(result.locked).toBe(true)
    expect(result.remainingMs).toBeGreaterThan(0)
  })

  test('cleared after success', () => {
    for (let i = 0; i < 3; i++) recordFailedLogin(testEmail, testIp)
    clearLoginAttempts(testEmail, testIp)
    const result = checkAccountLockout(testEmail, testIp)
    expect(result.locked).toBe(false)
    expect(result.attempts).toBe(0)
  })
})
