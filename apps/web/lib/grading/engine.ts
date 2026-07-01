// lib/grading/engine.ts – orchestrates the full grading pipeline

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { runClaudeGrading } from './claude-client'
import { executeGradingJob, apiMonitor } from '@/lib/queue/grading-queue'
import type { GradingInput, BewertungsrasterItem } from './types'

export interface GradingEngineResult {
  success: boolean
  jobId: string
  error?: string
}

/**
 * Run the complete grading pipeline for a job.
 * Called from the API route after a job is created with status QUEUED.
 */
export async function runGradingPipeline(jobId: string): Promise<GradingEngineResult> {
  const startTime = Date.now()

  try {
    // Load job with upload
    const job = await prisma.gradingJob.findUnique({
      where: { id: jobId },
      include: {
        upload: { select: { ocrText: true, fileType: true, pageCount: true, fileName: true } },
        user: { select: { id: true, name: true } },
      },
    })

    if (!job) {
      return { success: false, jobId, error: 'Bewertungsauftrag nicht gefunden' }
    }

    if (job.status === 'DONE') {
      return { success: true, jobId }
    }

    if (!job.upload.ocrText || job.upload.ocrText.trim().length < 10) {
      await prisma.gradingJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorMessage: 'Kein Text für Bewertung gefunden (OCR leer)' },
      })
      return { success: false, jobId, error: 'Kein Text für Bewertung gefunden' }
    }

    // Mark as PROCESSING
    await prisma.gradingJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    })

    // Build grading input
    const raster = job.bewertungsraster as any
    const bewertungsraster: BewertungsrasterItem[] = Array.isArray(raster?.aufgaben)
      ? raster.aufgaben
      : [{ aufgabe: 'Gesamtaufgabe', maxPunkte: raster?.maxPunkte || 100 }]

    const schwerpunkte: string[] = Array.isArray(raster?.schwerpunkte) ? raster.schwerpunkte : []

    const gradingInput: GradingInput = {
      ocrText: job.upload.ocrText,
      fileType: job.upload.fileType,
      pageCount: job.upload.pageCount || 1,
      bundesland: job.bundesland,
      schulform: job.schulform,
      klassenstufe: job.klassenstufe,
      fach: job.fach,
      aufgabentyp: job.aufgabentyp as any,
      bewertungsstrenge: (raster?.strenge || 'AUSGEWOGEN') as any,
      bewertungsschwerpunkte: schwerpunkte,
      maxPunkte: raster?.maxPunkte || 100,
      bewertungsraster,
      lehrerHinweise: job.lehrerHinweise || undefined,
      nachteilsausgleich: raster?.nachteilsausgleich || undefined,
    }

    // Execute with retry
    let gradingResult: Awaited<ReturnType<typeof runClaudeGrading>> | null = null

    await executeGradingJob(jobId, async () => {
      gradingResult = await runClaudeGrading(gradingInput, jobId)
      return { success: gradingResult.success, error: gradingResult.error }
    })

    if (!gradingResult || !gradingResult.success || !gradingResult.result) {
      const errorMsg = gradingResult?.error || 'KI-Bewertung fehlgeschlagen'
      await prisma.gradingJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: errorMsg,
        },
      })

      // Notify user
      await createGradingNotification(job.user.id, job.fach, job.upload.fileName || 'Unbekannt', false, jobId)

      return { success: false, jobId, error: errorMsg }
    }

    const result = gradingResult.result

    // Save grading report to database
    const report = await prisma.gradingReport.create({
      data: {
        gradingJobId: jobId,
        userId: job.userId,
        gesamtpunkte: result.gesamtpunkte,
        maximalpunkte: result.maximalpunkte,
        note: result.note,
        punkteVerteilung: result.aufgabenBewertungen as any,
        feedback: result.feedback,
        staerken: result.staerken as any,
        schwaechen: result.schwaechen as any,
        verbesserungsvorschlaege: result.verbesserungsvorschlaege as any,
        zusammenfassung: result.zusammenfassung,
        finalisiertVon: 'AI',
        // Store extended data as JSON in additional fields
        lehrerAnmerkungen: null,
      },
    })

    // Save AI log for monitoring + cost tracking
    await prisma.systemLog.create({
      data: {
        level: 'info',
        message: 'Grading completed',
        userId: job.userId,
        context: {
          jobId,
          reportId: report.id,
          tokensUsed: result.tokensUsed,
          modelUsed: result.modelUsed,
          processingTimeMs: result.processingTimeMs,
          note: result.note,
          punkte: `${result.gesamtpunkte}/${result.maximalpunkte}`,
          confidence: result.confidenceScore,
          fach: job.fach,
          cost: gradingResult.cost,
        } as any,
      },
    })

    // Update job status
    await prisma.gradingJob.update({
      where: { id: jobId },
      data: {
        status: 'DONE',
        tokensUsed: result.tokensUsed,
      },
    })

    // Track API usage
    apiMonitor.record({
      timestamp: Date.now(),
      jobId,
      tokensUsed: result.tokensUsed,
      cost: gradingResult.cost || 0,
      durationMs: Date.now() - startTime,
      success: true,
    })

    // Notify user
    await createGradingNotification(job.user.id, job.fach, job.upload.fileName || 'Unbekannt', true, jobId, report.id, result.note)

    // Check quota warning
    await checkAndNotifyQuota(job.userId)

    logger.info('Grading pipeline complete', {
      jobId,
      reportId: report.id,
      note: result.note,
      durationMs: Date.now() - startTime,
    })

    return { success: true, jobId }
  } catch (error: any) {
    logger.error('Grading pipeline exception', { jobId, error: error.message })

    await prisma.gradingJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', errorMessage: error.message || 'Unbekannter Fehler' },
    }).catch(() => {})

    apiMonitor.record({
      timestamp: Date.now(),
      jobId,
      tokensUsed: 0,
      cost: 0,
      durationMs: Date.now() - startTime,
      success: false,
    })

    return { success: false, jobId, error: error.message }
  }
}

async function createGradingNotification(
  userId: string,
  fach: string,
  fileName: string,
  success: boolean,
  jobId: string,
  reportId?: string,
  note?: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: success ? 'GRADING_DONE' : 'GRADING_FAILED',
        title: success ? `Bewertung fertig: ${fach}` : `Bewertung fehlgeschlagen: ${fach}`,
        message: success
          ? `Note ${note} – "${fileName}" wurde erfolgreich bewertet. Klicken Sie zum Bericht.`
          : `Die Bewertung von "${fileName}" ist fehlgeschlagen. Bitte versuchen Sie es erneut.`,
        link: success && reportId ? `/grading/result/${jobId}` : '/grading/history',
      },
    })
  } catch (err) {
    logger.warn('Failed to create grading notification', { err })
  }
}

async function checkAndNotifyQuota(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })
    if (!user || !user.notifyQuotaWarning) return

    const { PLAN_CONFIGS } = await import('@teachai/types')
    const plan = (user.subscription?.plan || 'FREE') as keyof typeof PLAN_CONFIGS
    const limit = PLAN_CONFIGS[plan].bewertungenProMonat

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const used = await prisma.gradingJob.count({
      where: { userId, status: 'DONE', createdAt: { gte: startOfMonth } },
    })

    const percent = (used / limit) * 100
    if (percent >= 80 && percent < 90) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'QUOTA_WARNING',
          createdAt: { gte: startOfMonth },
        },
      })
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'QUOTA_WARNING',
            title: 'Kontingent fast erschöpft',
            message: `Sie haben ${used} von ${limit} Bewertungen diesen Monat verbraucht (${Math.round(percent)}%).`,
            link: '/settings/subscription',
          },
        })
      }
    }
  } catch {}
}
