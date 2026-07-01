// app/api/auth/deactivate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(1),
  action: z.enum(['deactivate', 'delete']),
  confirm: z.string(),
})

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return apiError('Ungültige Eingaben', 422)

    const { password, action, confirm } = parsed.data

    if (confirm !== 'BESTÄTIGEN') {
      return apiError('Bitte geben Sie "BESTÄTIGEN" ein', 400)
    }

    const user = await prisma.user.findUnique({ where: { id: jwtUser.sub } })
    if (!user) return apiUnauthorized()

    const isValid = await compare(password, user.passwordHash || '')
    if (!isValid) return apiError('Falsches Passwort', 401)

    if (action === 'deactivate') {
      await prisma.user.update({
        where: { id: user.id },
        data: { isDeactivated: true },
      })
      await prisma.session.deleteMany({ where: { userId: user.id } })
      logger.info('Account deactivated', { userId: user.id })
    } else if (action === 'delete') {
      // DSGVO Art. 17 – Right to erasure
      await prisma.user.delete({ where: { id: user.id } })
      logger.info('Account deleted (DSGVO)', { userId: user.id })
    }

    const res = NextResponse.redirect(new URL('/login?message=account_closed', request.url))
    res.cookies.delete('access_token')
    res.cookies.delete('refresh_token')
    return res
  } catch (error) {
    logger.error('Account deactivation error', { error })
    return apiError('Fehler bei der Kontoaktion', 500)
  }
}
