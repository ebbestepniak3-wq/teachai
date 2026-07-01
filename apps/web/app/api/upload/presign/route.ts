// app/api/upload/presign/route.ts – generate presigned URL for large file uploads
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { getPresignedUploadUrl } from '@/lib/storage/supabase'
import { checkUploadQuota, validateFile } from '@/lib/upload/validator'
import { isAllowedMimeType, getMaxFileSize, calculateExpiryDate } from '@/lib/upload/config'
import type { PlanKey } from '@/lib/upload/config'
import { z } from 'zod'

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  fileSize: z.number().min(1),
})

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const body = await request.json()
    const parsed = presignSchema.safeParse(body)
    if (!parsed.success) return apiError('Ungültige Eingaben', 422)

    const { fileName, mimeType, fileSize } = parsed.data

    // Get user plan
    const user = await prisma.user.findUnique({
      where: { id: jwtUser.sub },
      include: { subscription: true },
    })
    if (!user) return apiUnauthorized()

    const plan = (user.subscription?.plan || 'FREE') as PlanKey

    // Check type allowed
    if (!isAllowedMimeType(mimeType)) {
      return apiError(`Dateityp "${mimeType}" nicht erlaubt`, 400)
    }

    // Check size
    const maxSize = getMaxFileSize(mimeType)
    if (fileSize > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024))
      return apiError(`Datei zu groß (max. ${maxMB} MB für diesen Typ)`, 400)
    }

    // Check quota
    const quotaCheck = await checkUploadQuota(jwtUser.sub, plan, 1)
    if (!quotaCheck.valid) {
      return apiError(quotaCheck.error!, 429)
    }

    // Generate presigned URL
    const presignResult = await getPresignedUploadUrl(jwtUser.sub, fileName, mimeType)
    if (!presignResult.success) {
      return apiError(presignResult.error || 'URL-Generierung fehlgeschlagen', 500)
    }

    // Pre-create upload record
    const expiresAt = calculateExpiryDate(plan)
    const upload = await prisma.upload.create({
      data: {
        userId: jwtUser.sub,
        fileName,
        fileSize,
        fileType: mimeType,
        storageKey: presignResult.storageKey!,
        status: 'PENDING',
        expiresAt,
      },
    })

    return apiSuccess({
      uploadUrl: presignResult.uploadUrl,
      uploadId: upload.id,
      storageKey: presignResult.storageKey,
      expiresAt: expiresAt?.toISOString(),
    })
  } catch (error) {
    return apiError('Presign-URL-Generierung fehlgeschlagen', 500)
  }
}
