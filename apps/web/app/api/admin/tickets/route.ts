// app/api/admin/tickets/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiForbidden, apiUnauthorized, apiError } from '@/lib/api-response'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 20

  const where = status ? { status: status as any } : {}
  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.supportTicket.count({ where }),
  ])

  return apiSuccess({ items: tickets, total, page, totalPages: Math.ceil(total / pageSize) })
}

const updateSchema = z.object({
  ticketId: z.string(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).optional(),
  assignedTo: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  try {
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return apiError('Ungültige Eingaben', 422)

    const { ticketId, status, assignedTo } = parsed.data
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(status ? { status, ...(status === 'CLOSED' ? { resolvedAt: new Date() } : {}) } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
      },
    })

    return apiSuccess(ticket)
  } catch {
    return apiError('Ticket konnte nicht aktualisiert werden', 500)
  }
}
