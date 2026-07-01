// app/api/admin/logs/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiForbidden, apiUnauthorized } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 50

  const where = level ? { level } : {}

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.systemLog.count({ where }),
  ])

  return apiSuccess({ items: logs, total, page, totalPages: Math.ceil(total / pageSize) })
}
