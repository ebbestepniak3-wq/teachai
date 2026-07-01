// app/api/grading/recalculate/route.ts – recalculate note after adjustments
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { calculateDetailedNote } from '@/lib/grading/scoring/calculator'

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { reportId, bundesland, strenge } = await request.json()
    if (!reportId) return apiError('Report-ID erforderlich', 400)

    const report = await prisma.gradingReport.findFirst({
      where: { id: reportId, userId: jwtUser.sub },
    })

    if (!report) return apiError('Bericht nicht gefunden', 404)

    const punkteVerteilung = report.punkteVerteilung as any[]
    const gesamtpunkte = punkteVerteilung.reduce(
      (sum: number, a: any) => sum + (a.erreichterPunkte || 0), 0
    )

    const note = calculateDetailedNote(
      gesamtpunkte,
      report.maximalpunkte,
      bundesland || 'Allgemein',
      strenge || 'AUSGEWOGEN'
    )

    await prisma.gradingReport.update({
      where: { id: reportId },
      data: {
        gesamtpunkte,
        note: note.note,
        updatedAt: new Date(),
      },
    })

    return apiSuccess({
      gesamtpunkte,
      note: note.note,
      noteNumerisch: note.noteNumerisch,
      prozent: note.prozent,
      bestanden: note.bestanden,
    })
  } catch (error) {
    return apiError('Neuberechnung fehlgeschlagen', 500)
  }
}
