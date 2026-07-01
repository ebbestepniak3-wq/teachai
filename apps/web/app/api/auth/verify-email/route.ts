// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/verify-email?error=missing_token', request.url))
  }

  try {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verificationToken) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid_token', request.url))
    }

    if (verificationToken.usedAt) {
      return NextResponse.redirect(new URL('/login?message=already_verified', request.url))
    }

    if (new Date() > verificationToken.expiresAt) {
      return NextResponse.redirect(new URL('/verify-email?error=expired', request.url))
    }

    // Mark token as used and verify user
    await Promise.all([
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      }),
    ])

    logger.info('Email verified', { userId: verificationToken.userId })

    return NextResponse.redirect(new URL('/verify-email?verified=true', request.url))
  } catch (error) {
    logger.error('Email verification error', { error })
    return NextResponse.redirect(new URL('/verify-email?error=server', request.url))
  }
}

// Resend verification email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return apiError('E-Mail ist erforderlich', 400)

    const user = await prisma.user.findUnique({ where: { email } })

    if (user && !user.emailVerified) {
      const { randomBytes } = await import('crypto')
      const token = randomBytes(32).toString('hex')

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      const { sendEmail, emailVerificationTemplate } = await import('@/lib/email/mailer')
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`
      await sendEmail({
        to: user.email,
        subject: 'TeacherAI – E-Mail-Adresse bestätigen',
        html: emailVerificationTemplate(user.name, verifyUrl),
      })
    }

    // Always return success to prevent enumeration
    return Response.json({ success: true, message: 'Falls die E-Mail existiert, wurde ein Link verschickt.' })
  } catch (error) {
    return apiError('Fehler beim Senden der E-Mail', 500)
  }
}
