// app/api/upload/complete/route.ts – called by client after direct Supabase upload
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const completeSchema = z.object({
  uploadId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const body = await request.json()
    const parsed = completeSchema.safeParse(body)
    if (!parsed.success) return apiError('Ungültige Eingaben', 422)

    const { uploadId } = parsed.data

    const upload = await prisma.upload.findFirst({
      where: { id: uploadId, userId: jwtUser.sub, status: 'PENDING' },
    })

    if (!upload) return apiError('Upload nicht gefunden', 404)

    // Mark as processing
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'PROCESSING' },
    })

    // Download from Supabase and run OCR
    const { getSignedDownloadUrl } = await import('@/lib/storage/supabase')
    const signedUrl = await getSignedDownloadUrl(upload.storageKey, 300)

    if (signedUrl) {
      // Async OCR (non-blocking)
      ;(async () => {
        try {
          const fileRes = await fetch(signedUrl)
          if (!fileRes.ok) throw new Error('Download failed')
          const buffer = Buffer.from(await fileRes.arrayBuffer())

          const { runOcrPipeline } = await import('@/lib/ocr/pipeline')
          const ocrResult = await runOcrPipeline(buffer, upload.fileType)

          await prisma.upload.update({
            where: { id: uploadId },
            data: {
              status: ocrResult.success ? 'READY' : 'FAILED',
              ocrText: ocrResult.success ? ocrResult.fullText : null,
              pageCount: ocrResult.totalPages || null,
            },
          })

          if (ocrResult.success) {
            await prisma.notification.create({
              data: {
                userId: jwtUser.sub,
                type: 'GRADING_DONE',
                title: 'Datei bereit',
                message: `"${upload.fileName}" ist bereit zur Bewertung.`,
                link: `/upload`,
              },
            })
          }

          logger.info('Upload complete + OCR done', { uploadId, success: ocrResult.success })
        } catch (err) {
          await prisma.upload.update({ where: { id: uploadId }, data: { status: 'FAILED' } })
          logger.error('Post-upload OCR failed', { uploadId, err })
        }
      })()
    }

    return apiSuccess({
      message: 'Upload registriert. Verarbeitung läuft.',
      uploadId,
      status: 'PROCESSING',
    })
  } catch (error) {
    logger.error('Upload complete error', { error })
    return apiError('Fehler beim Abschließen des Uploads', 500)
  }
}
