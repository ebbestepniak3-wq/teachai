// app/api/auth/2fa/disable/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { password } = await request.json()
    if (!password) return apiError('Passwort ist erforderlich', 400)

    const user = await prisma.user.findUnique({ where: { id: jwtUser.sub } })
    if (!user) return apiUnauthorized()
    if (!user.twoFactorEnabled) return apiError('2FA ist nicht aktiviert', 400)

    const isValid = await compare(password, user.passwordHash || '')
    if (!isValid) return apiError('Falsches Passwort', 401)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      },
    })

    await prisma.usageLog.create({
      data: { userId: user.id, action: 'TWO_FACTOR_DISABLED' },
    })

    logger.info('2FA disabled', { userId: user.id })
    return apiSuccess({ message: '2FA wurde deaktiviert' })
  } catch (error) {
    logger.error('2FA disable error', { error })
    return apiError('2FA-Deaktivierung fehlgeschlagen', 500)
  }
}
