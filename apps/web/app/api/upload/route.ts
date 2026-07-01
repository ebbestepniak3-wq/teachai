// app/api/upload/route.ts – Phase 4: complete upload handler
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { validateFile, checkUploadQuota } from '@/lib/upload/validator'
import { uploadFileToStorageDev } from '@/lib/storage/supabase'
import { calculateExpiryDate, formatBytes } from '@/lib/upload/config'
import type { PlanKey } from '@/lib/upload/config'

// Max request body: 55MB (largest single file + form data overhead)

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: jwtUser.sub },
      include: { subscription: true },
    })
    if (!user) return apiUnauthorized()

    const plan = (user.subscription?.plan || 'FREE') as PlanKey

    // Parse multipart form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return apiError('Keine Dateien empfangen', 400)
    }

    // Check quota (file count + monthly limit)
    const quotaCheck = await checkUploadQuota(user.id, plan, files.length)
    if (!quotaCheck.valid) {
      return apiError(quotaCheck.error!, 429)
    }

    const uploadResults: Array<{
      uploadId: string
      fileName: string
      status: string
      error?: string
    }> = []

    // Process each file
    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const mimeType = file.type || 'application/octet-stream'
        const fileName = file.name

        // Validate file
        const validation = await validateFile(buffer, mimeType, fileName, file.size)
        if (!validation.valid) {
          uploadResults.push({
            uploadId: '',
            fileName,
            status: 'FAILED',
            error: validation.error,
          })
          continue
        }

        // Upload to storage
        const storageResult = await uploadFileToStorageDev(buffer, user.id, fileName, mimeType)
        if (!storageResult.success) {
          uploadResults.push({
            uploadId: '',
            fileName,
            status: 'FAILED',
            error: storageResult.error,
          })
          continue
        }

        // Calculate expiry
        const expiresAt = calculateExpiryDate(plan)

        // Determine page count estimate
        const pageCount = mimeType === 'application/pdf' ? null : 1 // PDFs: counted during OCR

        // Save upload record to database
        const upload = await prisma.upload.create({
          data: {
            userId: user.id,
            fileName,
            fileSize: file.size,
            fileType: mimeType,
            storageKey: storageResult.storageKey!,
            status: 'PROCESSING',
            pageCount,
            expiresAt,
          },
        })

        // Log usage
        await prisma.usageLog.create({
          data: {
            userId: user.id,
            action: 'UPLOAD',
            metadata: {
              uploadId: upload.id,
              fileName,
              fileSize: file.size,
              mimeType,
            },
          },
        })

        uploadResults.push({
          uploadId: upload.id,
          fileName,
          status: 'PROCESSING',
        })

        // Trigger OCR asynchronously (non-blocking)
        triggerOcr(upload.id, storageResult.storageKey!, mimeType, buffer).catch((err) => {
          logger.error('OCR trigger failed', { uploadId: upload.id, err })
        })

        logger.info('File uploaded successfully', {
          uploadId: upload.id,
          userId: user.id,
          fileName,
          size: formatBytes(file.size),
        })
      } catch (fileError) {
        logger.error('File processing error', { fileName: file.name, error: fileError })
        uploadResults.push({
          uploadId: '',
          fileName: file.name,
          status: 'FAILED',
          error: 'Verarbeitungsfehler',
        })
      }
    }

    const successCount = uploadResults.filter((r) => r.status === 'PROCESSING').length
    const failedCount = uploadResults.filter((r) => r.status === 'FAILED').length

    return apiSuccess({
      uploads: uploadResults,
      summary: {
        total: files.length,
        successful: successCount,
        failed: failedCount,
      },
    }, successCount > 0 ? 201 : 400)
  } catch (error) {
    logger.error('Upload route error', { error })
    return apiError('Upload fehlgeschlagen', 500)
  }
}

// GET: list user's uploads
export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20')
  const page = parseInt(searchParams.get('page') || '1')

  const where = {
    userId: jwtUser.sub,
    ...(status ? { status: status as any } : {}),
  }

  const [uploads, total] = await Promise.all([
    prisma.upload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.upload.count({ where }),
  ])

  return apiSuccess({
    uploads,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

// Async OCR trigger (runs after upload response is sent)
async function triggerOcr(uploadId: string, storageKey: string, mimeType: string, buffer: Buffer) {
  try {
    logger.info('Starting OCR for upload', { uploadId })

    const { runOcrPipeline } = await import('@/lib/ocr/pipeline')

    const ocrResult = await runOcrPipeline(buffer, mimeType, {
      autoRotate: true,
      enhanceContrast: true,
      sharpen: true,
      grayscale: true,
    })

    if (ocrResult.success) {
      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          ocrText: ocrResult.fullText,
          pageCount: ocrResult.totalPages,
          status: 'READY',
        },
      })

      // Create notification for user
      const upload = await prisma.upload.findUnique({ where: { id: uploadId }, select: { userId: true, fileName: true } })
      if (upload) {
        await prisma.notification.create({
          data: {
            userId: upload.userId,
            type: 'GRADING_DONE',
            title: 'Datei verarbeitet',
            message: `"${upload.fileName}" wurde erfolgreich verarbeitet und ist bereit zur Bewertung.`,
            link: `/upload?ready=${uploadId}`,
          },
        })
      }

      logger.info('OCR complete', {
        uploadId,
        pages: ocrResult.totalPages,
        confidence: ocrResult.averageConfidence,
        timeMs: ocrResult.processingTimeMs,
      })
    } else {
      await prisma.upload.update({
        where: { id: uploadId },
        data: { status: 'FAILED' },
      })
      logger.error('OCR failed', { uploadId, error: ocrResult.error })
    }
  } catch (error) {
    logger.error('OCR processing exception', { uploadId, error })
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'FAILED' },
    }).catch(() => {})
  }
}
