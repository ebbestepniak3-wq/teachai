// app/api/admin/stats/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiForbidden, apiUnauthorized } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    totalJobs,
    jobsThisMonth,
    activeSubscriptions,
    openTickets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    prisma.gradingJob.count(),
    prisma.gradingJob.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.subscription.count({ where: { status: 'ACTIVE', plan: { not: 'FREE' } } }),
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
  ])

  return apiSuccess({
    users: { total: totalUsers, thisMonth: newUsersThisMonth, lastMonth: newUsersLastMonth },
    jobs: { total: totalJobs, thisMonth: jobsThisMonth },
    subscriptions: { active: activeSubscriptions },
    support: { openTickets },
  })
}
