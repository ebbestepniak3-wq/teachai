// app/api/admin/users/[id]/route.ts – single user management
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiForbidden, apiUnauthorized } from '@/lib/api-response'
import { audit } from '@/lib/audit/logger'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['TEACHER', 'ADMIN', 'SUPPORT']).optional(),
  isActive: z.boolean().optional(),
  isDeactivated: z.boolean().optional(),
  plan: z.enum(['FREE', 'BASIC', 'PRO', 'MAX_PRO']).optional(),
})

// GET: full user profile for admin
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      subscription: true,
      sessions: { orderBy: { lastUsed: 'desc' }, take: 5 },
      loginHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
      uploads: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, fileName: true, fileSize: true, status: true, createdAt: true } },
      gradingJobs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, fach: true, status: true, createdAt: true },
      },
      invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      supportTickets: { orderBy: { createdAt: 'desc' }, take: 5 },
      _count: {
        select: { uploads: true, gradingJobs: true, invoices: true, supportTickets: true },
      },
    },
  })

  if (!user) return apiError('Nutzer nicht gefunden', 404)

  return apiSuccess({
    ...user,
    passwordHash: undefined, // never expose
    twoFactorSecret: undefined,
    backupCodes: undefined,
  })
}

// PATCH: update user (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  try {
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const { plan, ...userUpdates } = parsed.data

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) return apiError('Nutzer nicht gefunden', 404)

    // Update user fields
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: userUpdates,
    })

    // Update plan if requested
    if (plan) {
      await prisma.subscription.upsert({
        where: { userId: params.id },
        create: { userId: params.id, plan, status: 'ACTIVE' },
        update: { plan, status: 'ACTIVE' },
      })
    }

    await audit.adminAction(jwtUser.sub, `user_update:${params.id}`, params.id)
    logger.info('Admin updated user', { adminId: jwtUser.sub, targetId: params.id, changes: body })

    return apiSuccess({ id: updatedUser.id, message: 'Nutzer aktualisiert' })
  } catch (error) {
    return apiError('Aktualisierung fehlgeschlagen', 500)
  }
}

// DELETE: delete user account (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  // Prevent self-deletion
  if (params.id === jwtUser.sub) {
    return apiError('Sie können Ihr eigenes Konto nicht löschen.', 400)
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) return apiError('Nutzer nicht gefunden', 404)

    await prisma.user.delete({ where: { id: params.id } })

    await audit.adminAction(jwtUser.sub, `user_deleted:${params.id}`, params.id)
    logger.info('Admin deleted user', { adminId: jwtUser.sub, targetId: params.id })

    return apiSuccess({ message: `Nutzer ${user.email} wurde gelöscht.` })
  } catch (error) {
    return apiError('Löschen fehlgeschlagen', 500)
  }
}
