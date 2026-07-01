// app/api/grading/prepare/route.ts – Phase 4: prepare grading job (no AI yet)
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const prepareSchema = z.object({
  uploadId: z.string().min(1),
  bundesland: z.string().min(1, 'Bundesland ist erforderlich'),
  schulform: z.string().min(1, 'Schulform ist erforderlich'),
  klassenstufe: z.string().min(1, 'Klassenstufe ist erforderlich'),
  fach: z.string().min(1, 'Fach ist erforderlich'),
  aufgabentyp: z.enum(['KLASSENARBEIT', 'TEST', 'KLAUSUR', 'HAUSAUFGABE', 'PROJEKT', 'SONSTIGES']),
  bewertungsstrenge: z.enum(['STRENG', 'AUSGEWOGEN', 'KULANT']).default('AUSGEWOGEN'),
  bewertungsschwerpunkte: z.array(z.string()).default([]),
  lehrerHinweise: z.string().max(2000).optional(),
  nachteilsausgleich: z.string().max(500).optional(),
  maxPunkte: z.number().min(1).max(1000).default(100),
})

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const body = await request.json()
    const parsed = prepareSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return apiError(firstError.message || 'Ungültige Eingaben', 422)
    }

    const {
      uploadId, bundesland, schulform, klassenstufe, fach,
      aufgabentyp, bewertungsstrenge, bewertungsschwerpunkte,
      lehrerHinweise, nachteilsausgleich, maxPunkte,
    } = parsed.data

    // Verify upload belongs to user and is ready
    const upload = await prisma.upload.findFirst({
      where: { id: uploadId, userId: jwtUser.sub },
    })

    if (!upload) {
      return apiError('Upload nicht gefunden', 404)
    }

    if (upload.status !== 'READY') {
      return apiError(
        upload.status === 'PROCESSING'
          ? 'Datei wird noch verarbeitet. Bitte warten Sie.'
          : 'Datei ist nicht bereit zur Bewertung.',
        409
      )
    }

    // Check monthly quota
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const user = await prisma.user.findUnique({
      where: { id: jwtUser.sub },
      include: { subscription: true },
    })

    const { PLAN_CONFIGS } = await import('@teachai/types')
    const plan = (user?.subscription?.plan || 'FREE') as keyof typeof PLAN_CONFIGS
    const monthlyLimit = PLAN_CONFIGS[plan].bewertungenProMonat

    const usageThisMonth = await prisma.gradingJob.count({
      where: { userId: jwtUser.sub, createdAt: { gte: startOfMonth } },
    })

    if (usageThisMonth >= monthlyLimit) {
      return apiError(
        `Monatliches Kontingent erschöpft (${usageThisMonth}/${monthlyLimit}). Bitte upgraden Sie Ihren Plan.`,
        429
      )
    }

    // Build Bewertungsraster
    const bewertungsraster = {
      maxPunkte,
      strenge: bewertungsstrenge,
      schwerpunkte: bewertungsschwerpunkte,
      nachteilsausgleich: nachteilsausgleich || null,
    }

    // Combine teacher hints
    const vollstaendigeHinweise = [
      lehrerHinweise,
      nachteilsausgleich ? `Nachteilsausgleich: ${nachteilsausgleich}` : null,
      bewertungsschwerpunkte.length > 0
        ? `Bewertungsschwerpunkte: ${bewertungsschwerpunkte.join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n\n')

    // Create grading job (status QUEUED – will be executed in Phase 5)
    const gradingJob = await prisma.gradingJob.create({
      data: {
        uploadId,
        userId: jwtUser.sub,
        bundesland,
        schulform,
        klassenstufe,
        fach,
        aufgabentyp,
        bewertungsraster,
        lehrerHinweise: vollstaendigeHinweise || null,
        status: 'QUEUED',
      },
    })

    logger.info('Grading job created', {
      jobId: gradingJob.id,
      userId: jwtUser.sub,
      fach,
      schulform,
      klassenstufe,
    })

    return apiSuccess(
      {
        jobId: gradingJob.id,
        status: 'QUEUED',
        message: 'Bewertungsauftrag erstellt. Die KI-Bewertung startet in Kürze.',
        estimatedTimeSeconds: 45,
      },
      201
    )
  } catch (error) {
    logger.error('Grading prepare error', { error })
    return apiError('Bewertungsauftrag konnte nicht erstellt werden', 500)
  }
}
