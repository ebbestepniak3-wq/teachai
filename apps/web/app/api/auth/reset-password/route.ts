// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let body: Record<string, string>
    if (contentType.includes('json')) {
      body = await request.json()
    } else {
      const fd = await request.formData()
      body = Object.fromEntries(Array.from(fd.entries()).map(([k, v]) => [k, v.toString()]))
    }

    const isJson = contentType.includes('json')
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return isJson
        ? apiError('Ungültige Eingaben', 422)
        : NextResponse.redirect(new URL('/reset-password?error=validation', request.url))
    }

    const { token, password, confirmPassword } = parsed.data
    if (password !== confirmPassword) {
      return isJson
        ? apiError('Passwörter stimmen nicht überein', 400)
        : NextResponse.redirect(new URL(`/reset-password?token=${token}&error=mismatch`, request.url))
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken || resetToken.usedAt || new Date() > resetToken.expiresAt) {
      return isJson
        ? apiError('Ungültiger oder abgelaufener Token', 400)
        : NextResponse.redirect(new URL('/forgot-password?error=expired', request.url))
    }

    const passwordHash = await hash(password, 12)

    await Promise.all([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      // Invalidate all sessions for security
      prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
    ])

    await prisma.usageLog.create({
      data: { userId: resetToken.userId, action: 'PASSWORD_CHANGE' },
    })

    logger.info('Password reset successful', { userId: resetToken.userId })

    return isJson
      ? apiSuccess({ message: 'Passwort erfolgreich zurückgesetzt' })
      : NextResponse.redirect(new URL('/login?message=password_reset', request.url))
  } catch (error) {
    logger.error('Password reset error', { error })
    return apiError('Fehler beim Zurücksetzen des Passworts', 500)
  }
}
