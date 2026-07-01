// app/api/grading/jobs/route.ts – list grading jobs
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiUnauthorized } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where = {
    userId: jwtUser.sub,
    ...(status ? { status: status as any } : {}),
  }

  const [jobs, total] = await Promise.all([
    prisma.gradingJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        upload: { select: { fileName: true, fileType: true, pageCount: true } },
        report: {
          select: { id: true, note: true, gesamtpunkte: true, maximalpunkte: true },
        },
      },
    }),
    prisma.gradingJob.count({ where }),
  ])

  return apiSuccess({
    jobs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
