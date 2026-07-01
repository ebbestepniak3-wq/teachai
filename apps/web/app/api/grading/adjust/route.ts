// app/api/grading/adjust/route.ts – save teacher adjustments to grading
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const adjustSchema = z.object({
  reportId: z.string().min(1),
  anpassungen: z.array(z.object({
    aufgabe: z.string(),
    neuesPunkte: z.number().min(0),
    kommentar: z.string().optional(),
  })),
  lehrerAnmerkungen: z.string().max(5000).optional(),
  bestaetigt: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const body = await request.json()
    const parsed = adjustSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const { reportId, anpassungen, lehrerAnmerkungen, bestaetigt } = parsed.data

    // Verify ownership
    const report = await prisma.gradingReport.findFirst({
      where: { id: reportId, userId: jwtUser.sub },
      include: { gradingJob: { select: { bundesland: true, bewertungsraster: true, fach: true } } },
    })

    if (!report) return apiError('Bericht nicht gefunden', 404)

    // Calculate new totals
    const currentPunkteVerteilung = report.punkteVerteilung as any[]
    const raster = report.gradingJob.bewertungsraster as any
    const maxPunkte = raster?.maxPunkte || report.maximalpunkte
    const strenge = raster?.strenge || 'AUSGEWOGEN'

    const updatedPunkteVerteilung = currentPunkteVerteilung.map((aufgabe: any) => {
      const anpassung = anpassungen.find((a) => a.aufgabe === aufgabe.aufgabe)
      if (!anpassung) return aufgabe

      const oldPunkte = aufgabe.erreichterPunkte
      const newPunkte = Math.max(0, Math.min(anpassung.neuesPunkte, aufgabe.maxPunkte))

      return {
        ...aufgabe,
        erreichterPunkte: newPunkte,
        lehrerKorrektur: {
          original: oldPunkte,
          angepasst: newPunkte,
          kommentar: anpassung.kommentar || null,
          zeitstempel: new Date().toISOString(),
        },
      }
    })

    // Recalculate total
    const neueGesamtpunkte = updatedPunkteVerteilung.reduce(
      (sum: number, a: any) => sum + (a.erreichterPunkte || 0), 0
    )

    // Recalculate note
    const { calculateDetailedNote } = await import('@/lib/grading/scoring/calculator')
    const neueNote = calculateDetailedNote(
      neueGesamtpunkte,
      maxPunkte,
      report.gradingJob.bundesland || 'Allgemein',
      strenge
    )

    // Update report
    const updated = await prisma.gradingReport.update({
      where: { id: reportId },
      data: {
        punkteVerteilung: updatedPunkteVerteilung as any,
        gesamtpunkte: neueGesamtpunkte,
        note: neueNote.note,
        lehrerAnmerkungen: lehrerAnmerkungen ?? report.lehrerAnmerkungen,
        finalisiertVon: bestaetigt ? 'TEACHER' : 'AI',
        updatedAt: new Date(),
      },
    })

    // Log adjustment
    await prisma.systemLog.create({
      data: {
        level: 'info',
        message: 'Teacher adjusted grading',
        userId: jwtUser.sub,
        context: {
          reportId,
          anpassungen: anpassungen.length,
          alteNote: report.note,
          neueNote: neueNote.note,
          altePunkte: report.gesamtpunkte,
          neuePunkte: neueGesamtpunkte,
        } as any,
      },
    })

    logger.info('Grading adjusted by teacher', {
      reportId,
      userId: jwtUser.sub,
      alteNote: report.note,
      neueNote: neueNote.note,
    })

    return apiSuccess({
      reportId,
      neueGesamtpunkte,
      neueNote: neueNote.note,
      bestaetigt: bestaetigt || false,
      punkteVerteilung: updatedPunkteVerteilung,
    })
  } catch (error) {
    logger.error('Adjust grading error', { error })
    return apiError('Anpassung fehlgeschlagen', 500)
  }
}
