// app/api/auth/sessions/[sessionId]/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const session = await prisma.session.findFirst({
      where: { id: params.sessionId, userId: jwtUser.sub },
    })

    if (!session) return apiError('Sitzung nicht gefunden', 404)

    await prisma.session.delete({ where: { id: params.sessionId } })
    return apiSuccess({ message: 'Sitzung beendet' })
  } catch {
    return apiError('Sitzung konnte nicht beendet werden', 500)
  }
}

// Delete all other sessions (except current)
export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const currentToken = request.cookies.get('refresh_token')?.value

  await prisma.session.deleteMany({
    where: {
      userId: jwtUser.sub,
      NOT: currentToken ? { token: currentToken } : undefined,
    },
  })

  return apiSuccess({ message: 'Alle anderen Sitzungen beendet' })
}
