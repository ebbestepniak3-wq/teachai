// app/api/auth/login/route.ts – Phase 3: full login with lockout, 2FA, login history
import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { authRateLimit } from '@/lib/rate-limit'
import {
  checkAccountLockout,
  recordFailedLogin,
  clearLoginAttempts,
} from '@/lib/security'
import { sendEmail, loginAlertTemplate } from '@/lib/email/mailer'

export async function POST(request: NextRequest) {
  const rl = authRateLimit(request)
  if (!rl.success) {
    return apiError('Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten.', 429)
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    const contentType = request.headers.get('content-type') || ''
    let email: string, password: string, redirectPath: string, remember: boolean, twoFactorCode: string | undefined

    if (contentType.includes('application/json')) {
      const body = await request.json()
      email = body.email?.toLowerCase().trim()
      password = body.password
      redirectPath = body.redirect || '/dashboard'
      remember = body.remember ?? false
      twoFactorCode = body.twoFactorCode
    } else {
      const formData = await request.formData()
      email = (formData.get('email')?.toString() || '').toLowerCase().trim()
      password = formData.get('password')?.toString() || ''
      redirectPath = formData.get('redirect')?.toString() || '/dashboard'
      remember = formData.get('remember') === 'on'
      twoFactorCode = formData.get('twoFactorCode')?.toString()
    }

    if (!email || !password) {
      return contentType.includes('json')
        ? apiError('E-Mail und Passwort sind erforderlich', 400)
        : NextResponse.redirect(new URL('/login?error=invalid_credentials', request.url))
    }

    // Check account lockout
    const lockout = checkAccountLockout(email, ip)
    if (lockout.locked) {
      const remainingMin = Math.ceil((lockout.remainingMs || 0) / 60000)
      await logLoginAttempt(email, ip, userAgent, false, 'ACCOUNT_LOCKED')
      return contentType.includes('json')
        ? apiError(`Konto gesperrt. Bitte warten Sie ${remainingMin} Minuten.`, 423)
        : NextResponse.redirect(new URL(`/login?error=locked&min=${remainingMin}`, request.url))
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    })

    // Timing-safe: always hash even if user not found
    const dummyHash = '$2a$12$dummy.hash.for.timing.attack.prevention.only'
    const isValid = user ? await compare(password, user.passwordHash || dummyHash) : await compare(password, dummyHash)

    if (!user || !isValid) {
      const result = recordFailedLogin(email, ip)
      await logLoginAttempt(email, ip, userAgent, false, 'INVALID_CREDENTIALS')
      logger.warn('Failed login', { email, ip, attempts: result.attempts })

      const errParam = result.locked
        ? `error=locked&min=15`
        : `error=invalid_credentials&attempts=${result.attempts}`

      return contentType.includes('json')
        ? apiError('Ungültige Anmeldedaten', 401)
        : NextResponse.redirect(new URL(`/login?${errParam}`, request.url))
    }

    // Check if account is deactivated
    if (user.isDeactivated) {
      await logLoginAttempt(email, ip, userAgent, false, 'ACCOUNT_DEACTIVATED')
      return contentType.includes('json')
        ? apiError('Ihr Konto wurde deaktiviert. Bitte kontaktieren Sie den Support.', 403)
        : NextResponse.redirect(new URL('/login?error=deactivated', request.url))
    }

    // 2FA check
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        // Need 2FA – return special response
        const tempToken = Buffer.from(JSON.stringify({ userId: user.id, ts: Date.now() })).toString('base64')
        if (contentType.includes('json')) {
          return apiSuccess({ requiresTwoFactor: true, tempToken }, 202)
        }
        return NextResponse.redirect(
          new URL(`/two-factor?token=${encodeURIComponent(tempToken)}`, request.url)
        )
      }

      // Verify 2FA code
      const { verifyTotpCode, verifyBackupCode } = await import('@/lib/2fa/totp')
      let twoFaValid = false

      if (twoFactorCode.includes('-') || twoFactorCode.length === 9) {
        // Backup code
        const result = await verifyBackupCode(twoFactorCode, user.backupCodes)
        if (result.valid) {
          twoFaValid = true
          // Consume backup code
          const newCodes = [...user.backupCodes]
          newCodes.splice(result.index, 1)
          await prisma.user.update({ where: { id: user.id }, data: { backupCodes: newCodes } })
        }
      } else {
        twoFaValid = user.twoFactorSecret ? verifyTotpCode(user.twoFactorSecret, twoFactorCode) : false
      }

      if (!twoFaValid) {
        await logLoginAttempt(email, ip, userAgent, false, 'INVALID_2FA')
        return contentType.includes('json')
          ? apiError('Ungültiger 2FA-Code', 401)
          : NextResponse.redirect(new URL('/two-factor?error=invalid', request.url))
      }
    }

    // ✅ Login successful
    clearLoginAttempts(email, ip)

    const tokenPayload = { sub: user.id, email: user.email, role: user.role }
    const refreshExpiry = remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30d vs 1d
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
    ])

    // Store session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        ipAddress: ip,
        userAgent: userAgent.slice(0, 500),
        expiresAt: new Date(Date.now() + refreshExpiry * 1000),
        lastUsed: new Date(),
      },
    })

    // Log successful login
    await logLoginAttempt(email, ip, userAgent, true, undefined, user.id)
    await prisma.usageLog.create({
      data: { userId: user.id, action: 'LOGIN', ipAddress: ip, metadata: { userAgent: userAgent.slice(0, 200) } },
    })

    // Security alert email (non-blocking)
    if (user.notifySecurityAlerts) {
      const time = new Date().toLocaleString('de-DE', { timeZone: user.timezone || 'Europe/Berlin' })
      sendEmail({
        to: user.email,
        subject: 'Neue Anmeldung bei TeacherAI',
        html: loginAlertTemplate(user.name, ip, userAgent.slice(0, 100), time),
      }).catch(() => {})
    }

    logger.info('User logged in', { userId: user.id, email: user.email })

    const isProduction = process.env.NODE_ENV === 'production'
    const cookieBase = { httpOnly: true, secure: isProduction, sameSite: 'lax' as const, path: '/' }

    if (contentType.includes('json')) {
      const res = apiSuccess({
        user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.subscription?.plan || 'FREE' },
      })
      res.cookies.set('access_token', accessToken, { ...cookieBase, maxAge: 900 })
      res.cookies.set('refresh_token', refreshToken, { ...cookieBase, maxAge: refreshExpiry })
      return res
    }

    const res = NextResponse.redirect(new URL(redirectPath, request.url))
    res.cookies.set('access_token', accessToken, { ...cookieBase, maxAge: 900 })
    res.cookies.set('refresh_token', refreshToken, { ...cookieBase, maxAge: refreshExpiry })
    return res
  } catch (error) {
    logger.error('Login error', { error })
    return apiError('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.', 500)
  }
}

async function logLoginAttempt(
  email: string, ip: string, userAgent: string,
  success: boolean, failReason?: string, userId?: string
) {
  try {
    if (userId) {
      await prisma.loginHistory.create({
        data: { userId, ipAddress: ip, userAgent: userAgent.slice(0, 500), success, failReason },
      })
    }
  } catch {}
}
