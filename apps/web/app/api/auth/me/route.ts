// app/api/auth/me/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiUnauthorized } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const user = await prisma.user.findUnique({
    where: { id: jwtUser.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      emailVerified: true,
      bundesland: true,
      schulform: true,
      subscription: { select: { plan: true, status: true } },
    },
  })

  if (!user) return apiUnauthorized()

  return apiSuccess({
    ...user,
    plan: user.subscription?.plan || 'FREE',
  })
}
