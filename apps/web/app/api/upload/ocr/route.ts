// app/api/upload/ocr/route.ts – manually trigger or retry OCR
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { getSignedDownloadUrl } from '@/lib/storage/supabase'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { uploadId } = await request.json()
    if (!uploadId) return apiError('Upload-ID erforderlich', 400)

    const upload = await prisma.upload.findFirst({
      where: { id: uploadId, userId: jwtUser.sub },
    })

    if (!upload) return apiError('Upload nicht gefunden', 404)

    if (upload.status === 'READY') {
      return apiError('Datei wurde bereits verarbeitet', 400)
    }

    // Reset status to processing
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'PROCESSING' },
    })

    // Get signed URL to download the file
    const signedUrl = await getSignedDownloadUrl(upload.storageKey, 300)
    if (!signedUrl) {
      return apiError('Datei nicht im Speicher gefunden', 404)
    }

    // Download and re-process
    const fileRes = await fetch(signedUrl)
    if (!fileRes.ok) throw new Error('Datei konnte nicht heruntergeladen werden')

    const buffer = Buffer.from(await fileRes.arrayBuffer())

    // Trigger OCR async
    ;(async () => {
      try {
        const { runOcrPipeline } = await import('@/lib/ocr/pipeline')
        const ocrResult = await runOcrPipeline(buffer, upload.fileType)

        await prisma.upload.update({
          where: { id: uploadId },
          data: {
            status: ocrResult.success ? 'READY' : 'FAILED',
            ocrText: ocrResult.success ? ocrResult.fullText : null,
            pageCount: ocrResult.success ? ocrResult.totalPages : upload.pageCount,
          },
        })

        logger.info('OCR retry complete', { uploadId, success: ocrResult.success })
      } catch (err) {
        await prisma.upload.update({ where: { id: uploadId }, data: { status: 'FAILED' } })
        logger.error('OCR retry failed', { uploadId, err })
      }
    })()

    return apiSuccess({ message: 'OCR-Verarbeitung wurde neu gestartet', uploadId })
  } catch (error) {
    logger.error('OCR retry route error', { error })
    return apiError('OCR-Neustart fehlgeschlagen', 500)
  }
}

// GET: get OCR text for an upload
export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const { searchParams } = new URL(request.url)
  const uploadId = searchParams.get('id')
  if (!uploadId) return apiError('Upload-ID erforderlich', 400)

  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, userId: jwtUser.sub },
    select: { id: true, status: true, ocrText: true, pageCount: true, fileName: true },
  })

  if (!upload) return apiError('Upload nicht gefunden', 404)

  return apiSuccess({
    uploadId: upload.id,
    status: upload.status,
    ocrText: upload.ocrText,
    pageCount: upload.pageCount,
    fileName: upload.fileName,
    wordCount: upload.ocrText ? upload.ocrText.split(/\s+/).filter(Boolean).length : 0,
  })
}
