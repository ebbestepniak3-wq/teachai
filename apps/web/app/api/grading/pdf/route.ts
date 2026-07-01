// app/api/grading/pdf/route.ts – generate and serve PDF report
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiUnauthorized } from '@/lib/api-response'
import { generateGradingPdf } from '@/lib/pdf/generator'
import { uploadFileToStorageDev } from '@/lib/storage/supabase'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const { searchParams } = new URL(request.url)
  const reportId = searchParams.get('reportId')
  if (!reportId) return apiError('Report-ID erforderlich', 400)

  try {
    const report = await prisma.gradingReport.findFirst({
      where: { id: reportId, userId: jwtUser.sub },
      include: {
        gradingJob: {
          include: {
            upload: { select: { fileName: true } },
          },
        },
      },
    })

    if (!report) return apiError('Bericht nicht gefunden', 404)

    const job = report.gradingJob
    const raster = job.bewertungsraster as any
    const punkteVerteilung = report.punkteVerteilung as any[]

    const pdfData = {
      bundesland: job.bundesland,
      schulform: job.schulform,
      datum: new Date().toLocaleDateString('de-DE'),
      fach: job.fach,
      klassenstufe: job.klassenstufe,
      aufgabentyp: job.aufgabentyp,
      gesamtpunkte: report.gesamtpunkte,
      maximalpunkte: report.maximalpunkte,
      prozent: Math.round((report.gesamtpunkte / report.maximalpunkte) * 100),
      note: report.note,
      bestanden: parseFloat(report.note) <= 4,
      aufgabenBewertungen: punkteVerteilung.map((a) => ({
        aufgabe: a.aufgabe || '',
        aufgabenNummer: a.aufgabenNummer || 1,
        erreichterPunkte: a.erreichterPunkte || 0,
        maxPunkte: a.maxPunkte || 0,
        prozent: Math.round(((a.erreichterPunkte || 0) / (a.maxPunkte || 1)) * 100),
        begruendung: a.begruendung || '',
        fehler: a.fehler || [],
        korrekteLoesung: a.korrekteLoesung,
      })),
      feedback: report.feedback,
      staerken: report.staerken as string[],
      schwaechen: report.schwaechen as string[],
      verbesserungsvorschlaege: report.verbesserungsvorschlaege as string[],
      zusammenfassung: report.zusammenfassung,
      lehrerAnmerkungen: report.lehrerAnmerkungen || undefined,
      finalisiertVon: report.finalisiertVon,
      beruecksichtigteHinweise: [],
      unsicherheiten: [],
      confidenceScore: 85,
      aiModel: 'claude-opus-4-6',
    }

    const pdfBuffer = await generateGradingPdf(pdfData)

    // Cache PDF in storage
    if (!report.pdfStorageKey) {
      const storageResult = await uploadFileToStorageDev(
        pdfBuffer,
        jwtUser.sub,
        `bewertung-${reportId}.pdf`,
        'application/pdf'
      )

      if (storageResult.success && storageResult.storageKey) {
        await prisma.gradingReport.update({
          where: { id: reportId },
          data: { pdfStorageKey: storageResult.storageKey },
        })
      }
    }

    const fileName = `bewertung-${job.fach}-klasse${job.klassenstufe}-${new Date().toISOString().slice(0, 10)}.pdf`

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    logger.error('PDF generation route error', { error, reportId })
    return apiError('PDF konnte nicht generiert werden', 500)
  }
}
