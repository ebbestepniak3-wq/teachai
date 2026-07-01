// app/api/assistant/conversations/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { z } from 'zod'

// GET: list all conversations
export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const id = searchParams.get('id')

  // Single conversation
  if (id) {
    const conv = await prisma.assistantConversation.findFirst({
      where: { id, userId: jwtUser.sub },
    })
    if (!conv) return apiError('Gespräch nicht gefunden', 404)
    return apiSuccess(conv)
  }

  const conversations = await prisma.assistantConversation.findMany({
    where: {
      userId: jwtUser.sub,
      ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  return apiSuccess({ conversations })
}

// PATCH: rename conversation
export async function PATCH(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { id, title } = await request.json()
    if (!id || !title) return apiError('ID und Titel erforderlich', 400)

    const conv = await prisma.assistantConversation.updateMany({
      where: { id, userId: jwtUser.sub },
      data: { title: title.slice(0, 100) },
    })

    if (conv.count === 0) return apiError('Gespräch nicht gefunden', 404)
    return apiSuccess({ message: 'Titel aktualisiert' })
  } catch {
    return apiError('Fehler beim Aktualisieren', 500)
  }
}

// DELETE: delete conversation(s)
export async function DELETE(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { id, all } = await request.json()

    if (all) {
      await prisma.assistantConversation.deleteMany({ where: { userId: jwtUser.sub } })
      return apiSuccess({ message: 'Alle Gespräche gelöscht' })
    }

    if (id) {
      await prisma.assistantConversation.deleteMany({
        where: { id, userId: jwtUser.sub },
      })
      return apiSuccess({ message: 'Gespräch gelöscht' })
    }

    return apiError('ID erforderlich', 400)
  } catch {
    return apiError('Fehler beim Löschen', 500)
  }
}
