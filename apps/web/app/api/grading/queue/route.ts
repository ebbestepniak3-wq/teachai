// app/api/grading/queue/route.ts – queue status and monitoring
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiUnauthorized, apiForbidden } from '@/lib/api-response'
import { gradingQueue, apiMonitor } from '@/lib/queue/grading-queue'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'status'

  // User job status
  if (type === 'my-jobs') {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const jobs = await prisma.gradingJob.findMany({
      where: {
        userId: jwtUser.sub,
        status: { in: ['QUEUED', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, status: true, fach: true, createdAt: true,
        upload: { select: { fileName: true } },
      },
    })
    return apiSuccess({ jobs })
  }

  // Admin-only monitoring
  if (type === 'monitoring') {
    if (jwtUser.role !== 'ADMIN') return apiForbidden()

    const [queueStatus, apiStats] = await Promise.all([
      Promise.resolve(gradingQueue.getStatus()),
      Promise.resolve(apiMonitor.getStats(60)),
    ])

    // DB stats
    const [totalJobs, doneToday, failedToday] = await Promise.all([
      prisma.gradingJob.count({ where: { status: { in: ['QUEUED', 'PROCESSING'] } } }),
      prisma.gradingJob.count({
        where: {
          status: 'DONE',
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.gradingJob.count({
        where: {
          status: 'FAILED',
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ])

    return apiSuccess({
      queue: queueStatus,
      api: apiStats,
      db: { active: totalJobs, doneToday, failedToday },
    })
  }

  // Default: queue status
  return apiSuccess(gradingQueue.getStatus())
}
