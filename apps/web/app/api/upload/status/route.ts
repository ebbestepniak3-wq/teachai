// app/api/upload/status/route.ts – polling endpoint for upload/OCR status
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { getSignedDownloadUrl } from '@/lib/storage/supabase'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const { searchParams } = new URL(request.url)
  const uploadId = searchParams.get('id')
  const uploadIds = searchParams.get('ids')?.split(',').filter(Boolean)

  if (!uploadId && !uploadIds?.length) {
    return apiError('Upload-ID erforderlich', 400)
  }

  try {
    const ids = uploadId ? [uploadId] : uploadIds!

    const uploads = await prisma.upload.findMany({
      where: {
        id: { in: ids },
        userId: jwtUser.sub, // Security: only own uploads
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        status: true,
        pageCount: true,
        expiresAt: true,
        createdAt: true,
        storageKey: true,
        ocrText: true,
      },
    })

    if (uploads.length === 0) {
      return apiError('Upload nicht gefunden', 404)
    }

    // Add signed preview URLs for ready uploads (without exposing ocrText in list)
    const uploadsWithUrls = await Promise.all(
      uploads.map(async (upload) => {
        let previewUrl: string | null = null
        if (upload.status === 'READY' || upload.status === 'PROCESSING') {
          previewUrl = await getSignedDownloadUrl(upload.storageKey, 3600)
        }

        return {
          ...upload,
          previewUrl,
          ocrText: searchParams.get('includeOcr') === 'true' ? upload.ocrText : undefined,
          ocrPreview: upload.ocrText ? upload.ocrText.slice(0, 200) + '...' : null,
        }
      })
    )

    if (uploadId) {
      return apiSuccess(uploadsWithUrls[0])
    }

    return apiSuccess({ uploads: uploadsWithUrls })
  } catch (error) {
    return apiError('Statusabfrage fehlgeschlagen', 500)
  }
}
