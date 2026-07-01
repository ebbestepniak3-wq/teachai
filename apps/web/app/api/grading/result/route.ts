// app/api/grading/result/route.ts – get grading result with full details
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  const reportId = searchParams.get('reportId')

  if (!jobId && !reportId) return apiError('jobId oder reportId erforderlich', 400)

  try {
    // Find the grading job
    const job = await prisma.gradingJob.findFirst({
      where: {
        ...(jobId ? { id: jobId } : {}),
        userId: jwtUser.sub,
      },
      include: {
        upload: {
          select: {
            fileName: true,
            fileType: true,
            pageCount: true,
            storageKey: true,
          },
        },
        report: true,
      },
    })

    if (!job) return apiError('Bewertungsauftrag nicht gefunden', 404)

    // Return status if not done
    if (job.status !== 'DONE' || !job.report) {
      return apiSuccess({
        jobId: job.id,
        status: job.status,
        fach: job.fach,
        schulform: job.schulform,
        klassenstufe: job.klassenstufe,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        report: null,
      })
    }

    // Get signed preview URL
    const { getSignedDownloadUrl } = await import('@/lib/storage/supabase')
    const previewUrl = await getSignedDownloadUrl(job.upload.storageKey, 3600)

    return apiSuccess({
      jobId: job.id,
      status: job.status,
      fach: job.fach,
      schulform: job.schulform,
      klassenstufe: job.klassenstufe,
      bundesland: job.bundesland,
      aufgabentyp: job.aufgabentyp,
      lehrerHinweise: job.lehrerHinweise,
      tokensUsed: job.tokensUsed,
      createdAt: job.createdAt,
      upload: {
        fileName: job.upload.fileName,
        fileType: job.upload.fileType,
        pageCount: job.upload.pageCount,
        previewUrl,
      },
      report: {
        id: job.report.id,
        gesamtpunkte: job.report.gesamtpunkte,
        maximalpunkte: job.report.maximalpunkte,
        note: job.report.note,
        punkteVerteilung: job.report.punkteVerteilung,
        feedback: job.report.feedback,
        staerken: job.report.staerken,
        schwaechen: job.report.schwaechen,
        verbesserungsvorschlaege: job.report.verbesserungsvorschlaege,
        zusammenfassung: job.report.zusammenfassung,
        lehrerAnmerkungen: job.report.lehrerAnmerkungen,
        finalisiertVon: job.report.finalisiertVon,
        updatedAt: job.report.updatedAt,
        pdfStorageKey: job.report.pdfStorageKey,
      },
    })
  } catch (error) {
    return apiError('Ergebnis konnte nicht geladen werden', 500)
  }
}
