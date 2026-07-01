// app/api/settings/password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmNewPassword: z.string(),
})

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const contentType = request.headers.get('content-type') || ''
    let body: Record<string, string>
    if (contentType.includes('json')) {
      body = await request.json()
    } else {
      const fd = await request.formData()
      body = Object.fromEntries(Array.from(fd.entries()).map(([k, v]) => [k, v.toString()]))
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || 'Ungültige Eingaben'
      if (!contentType.includes('json')) {
        return NextResponse.redirect(new URL(`/settings/security?error=${encodeURIComponent(msg)}`, request.url))
      }
      return apiError(msg, 422)
    }

    const { currentPassword, newPassword, confirmNewPassword } = parsed.data

    if (newPassword !== confirmNewPassword) {
      return contentType.includes('json')
        ? apiError('Neue Passwörter stimmen nicht überein', 400)
        : NextResponse.redirect(new URL('/settings/security?error=mismatch', request.url))
    }

    const user = await prisma.user.findUnique({ where: { id: jwtUser.sub } })
    if (!user) return apiUnauthorized()

    const isValid = await compare(currentPassword, user.passwordHash || '')
    if (!isValid) {
      return contentType.includes('json')
        ? apiError('Aktuelles Passwort ist falsch', 401)
        : NextResponse.redirect(new URL('/settings/security?error=wrong_current', request.url))
    }

    if (currentPassword === newPassword) {
      return contentType.includes('json')
        ? apiError('Das neue Passwort muss sich vom alten unterscheiden', 400)
        : NextResponse.redirect(new URL('/settings/security?error=same_password', request.url))
    }

    const newHash = await hash(newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })
    await prisma.usageLog.create({ data: { userId: user.id, action: 'PASSWORD_CHANGE' } })

    // Invalidate all other sessions
    const currentToken = request.cookies.get('refresh_token')?.value
    await prisma.session.deleteMany({
      where: { userId: user.id, NOT: { token: currentToken || '' } },
    })

    logger.info('Password changed', { userId: user.id })

    return contentType.includes('json')
      ? apiSuccess({ message: 'Passwort erfolgreich geändert' })
      : NextResponse.redirect(new URL('/settings/security?success=password_changed', request.url))
  } catch (error) {
    logger.error('Password change error', { error })
    return apiError('Passwortänderung fehlgeschlagen', 500)
  }
}
