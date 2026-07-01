// app/api/auth/2fa/setup/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { generateTotpSecret, generateTotpUri } from '@/lib/2fa/totp'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const user = await prisma.user.findUnique({ where: { id: jwtUser.sub } })
    if (!user) return apiUnauthorized()

    if (user.twoFactorEnabled) {
      return apiError('2FA ist bereits aktiviert', 400)
    }

    // Generate new secret
    const secret = generateTotpSecret()
    const uri = generateTotpUri(secret, user.email)

    // Temporarily store secret (not yet activated)
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    })

    return apiSuccess({ secret, uri })
  } catch (error) {
    logger.error('2FA setup error', { error })
    return apiError('2FA-Einrichtung fehlgeschlagen', 500)
  }
}
