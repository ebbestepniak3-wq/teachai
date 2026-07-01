// app/api/grading/execute/route.ts – trigger AI grading for a queued job
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { runGradingPipeline } from '@/lib/grading/engine'

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { jobId } = await request.json()
    if (!jobId) return apiError('Job-ID erforderlich', 400)

    // Verify job belongs to user
    const job = await prisma.gradingJob.findFirst({
      where: { id: jobId, userId: jwtUser.sub },
      select: { id: true, status: true, fach: true, klassenstufe: true },
    })

    if (!job) return apiError('Bewertungsauftrag nicht gefunden', 404)

    if (job.status === 'DONE') {
      return apiError('Bewertungsauftrag wurde bereits abgeschlossen', 409)
    }

    if (job.status === 'PROCESSING') {
      return apiSuccess({ message: 'Bewertung läuft bereits', jobId, status: 'PROCESSING' })
    }

    // Run pipeline asynchronously (non-blocking response)
    runGradingPipeline(jobId).catch((err) => {
      logger.error('Async grading pipeline failed', { jobId, err })
    })

    logger.info('Grading started', { jobId, userId: jwtUser.sub, fach: job.fach })

    return apiSuccess({
      message: 'KI-Bewertung gestartet',
      jobId,
      status: 'PROCESSING',
      estimatedSeconds: 45,
    })
  } catch (error) {
    logger.error('Execute route error', { error })
    return apiError('Bewertung konnte nicht gestartet werden', 500)
  }
}
