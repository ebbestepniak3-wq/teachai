// app/api/notifications/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20')

  const notifications = await prisma.notification.findMany({
    where: {
      userId: jwtUser.sub,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const unreadCount = await prisma.notification.count({
    where: { userId: jwtUser.sub, isRead: false },
  })

  return apiSuccess({ notifications, unreadCount })
}

export async function PATCH(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { ids, markAll } = await request.json()

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: jwtUser.sub, isRead: false },
        data: { isRead: true },
      })
    } else if (ids?.length) {
      await prisma.notification.updateMany({
        where: { userId: jwtUser.sub, id: { in: ids } },
        data: { isRead: true },
      })
    }

    return apiSuccess({ message: 'Benachrichtigungen als gelesen markiert' })
  } catch {
    return apiError('Fehler beim Aktualisieren', 500)
  }
}

export async function DELETE(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { ids } = await request.json()
    await prisma.notification.deleteMany({
      where: { userId: jwtUser.sub, ...(ids?.length ? { id: { in: ids } } : {}) },
    })
    return apiSuccess({ message: 'Benachrichtigungen gelöscht' })
  } catch {
    return apiError('Fehler beim Löschen', 500)
  }
}
