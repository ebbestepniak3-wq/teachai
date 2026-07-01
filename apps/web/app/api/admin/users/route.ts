// app/api/admin/users/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiForbidden, apiUnauthorized } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const search = searchParams.get('search') || ''

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true } },
        _count: { select: { gradingJobs: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return apiSuccess({
    items: users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}
