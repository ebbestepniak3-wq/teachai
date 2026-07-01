// app/api/auth/register/route.ts – Phase 3
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { authRateLimit } from '@/lib/rate-limit'
import { sendEmail, emailVerificationTemplate } from '@/lib/email/mailer'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
  bundesland: z.string().min(1),
  schulform: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const rl = authRateLimit(request)
  if (!rl.success) return apiError('Zu viele Anfragen', 429)

  try {
    const contentType = request.headers.get('content-type') || ''
    let body: Record<string, string>
    if (contentType.includes('application/json')) {
      body = await request.json()
    } else {
      const fd = await request.formData()
      body = Object.fromEntries(Array.from(fd.entries()).map(([k, v]) => [k, v.toString()]))
    }

    const isJson = contentType.includes('json')
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return isJson
        ? apiError(parsed.error.errors[0]?.message || 'Ungültige Eingaben', 422)
        : NextResponse.redirect(new URL('/register?error=validation', request.url))
    }

    const { name, email, password, confirmPassword, bundesland, schulform } = parsed.data
    if (password !== confirmPassword) {
      return isJson
        ? apiError('Passwörter stimmen nicht überein', 400)
        : NextResponse.redirect(new URL('/register?error=password_mismatch', request.url))
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return isJson
        ? apiError('Diese E-Mail-Adresse ist bereits registriert', 409)
        : NextResponse.redirect(new URL('/register?error=email_exists', request.url))
    }

    const passwordHash = await hash(password, 12)
    const verifyToken = randomBytes(32).toString('hex')

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        passwordHash,
        bundesland,
        schulform,
        subscription: { create: { plan: 'FREE', status: 'ACTIVE' } },
        verificationTokens: {
          create: { token: verifyToken, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        },
      },
    })

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verifyToken}`
    sendEmail({
      to: user.email,
      subject: 'TeacherAI – E-Mail-Adresse bestätigen',
      html: emailVerificationTemplate(user.name, verifyUrl),
    }).catch(() => {})

    logger.info('User registered', { userId: user.id })

    return isJson
      ? apiSuccess({ userId: user.id }, 201)
      : NextResponse.redirect(new URL(`/verify-email?email=${encodeURIComponent(user.email)}`, request.url))
  } catch (error) {
    logger.error('Registration error', { error })
    return apiError('Registrierung fehlgeschlagen', 500)
  }
}
