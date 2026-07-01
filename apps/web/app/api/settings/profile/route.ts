// app/api/settings/profile/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response'
import { updateProfileSchema } from '@/lib/validators'
import { logger } from '@/lib/logger'

export async function PATCH(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) return apiError('Ungültige Eingaben', 422)

    const user = await prisma.user.update({
      where: { id: jwtUser.sub },
      data: parsed.data,
      select: { id: true, name: true, email: true, bundesland: true, schulform: true, bio: true },
    })

    logger.info('Profile updated', { userId: jwtUser.sub })
    return apiSuccess(user)
  } catch (error) {
    logger.error('Profile update error', { error })
    return apiError('Profil konnte nicht aktualisiert werden', 500)
  }
}
