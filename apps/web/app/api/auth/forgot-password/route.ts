// app/api/auth/forgot-password/route.ts – Phase 9: fully wired with email
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { apiSuccess, apiError } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { authRateLimit } from '@/lib/rate-limit'
import { sendEmail, passwordResetTemplate } from '@/lib/email/mailer'

export async function POST(request: NextRequest) {
  const rl = authRateLimit(request)
  if (!rl.success) return apiError('Zu viele Anfragen', 429)

  try {
    const contentType = request.headers.get('content-type') || ''
    let email: string

    if (contentType.includes('application/json')) {
      const body = await request.json()
      email = body.email?.toLowerCase().trim()
    } else {
      const formData = await request.formData()
      email = (formData.get('email')?.toString() || '').toLowerCase().trim()
    }

    if (!email) {
      return contentType.includes('json')
        ? apiError('E-Mail-Adresse ist erforderlich', 400)
        : NextResponse.redirect(new URL('/forgot-password?error=missing', request.url))
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (user) {
      const token = randomBytes(32).toString('hex')
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      })

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
      sendEmail({
        to: user.email,
        subject: 'TeacherAI – Passwort zurücksetzen',
        html: passwordResetTemplate(user.name, resetUrl),
        text: `Ihr Passwort-Reset-Link: ${resetUrl}\n\nGültig für 1 Stunde. Falls Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail.`,
      }).catch((err) => logger.error('Password reset email failed', { err }))

      logger.info('Password reset requested', { userId: user.id })
    }

    return contentType.includes('json')
      ? apiSuccess({ message: 'Falls die E-Mail registriert ist, wurde ein Link verschickt.' })
      : NextResponse.redirect(new URL('/forgot-password?sent=true', request.url))
  } catch (error) {
    logger.error('Forgot password error', { error })
    return apiError('Ein Fehler ist aufgetreten', 500)
  }
}
