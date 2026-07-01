// app/api/upload/delete/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { deleteFileFromStorage } from '@/lib/storage/supabase'
import { logger } from '@/lib/logger'

export async function DELETE(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { uploadId } = await request.json()
    if (!uploadId) return apiError('Upload-ID erforderlich', 400)

    const upload = await prisma.upload.findFirst({
      where: { id: uploadId, userId: jwtUser.sub },
    })

    if (!upload) return apiError('Upload nicht gefunden', 404)

    // Check: can't delete if grading job is running
    const activeJob = await prisma.gradingJob.findFirst({
      where: { uploadId, status: { in: ['QUEUED', 'PROCESSING'] } },
    })
    if (activeJob) {
      return apiError('Datei kann nicht gelöscht werden, solange die Bewertung läuft', 409)
    }

    // Delete from storage
    await deleteFileFromStorage(upload.storageKey)

    // Delete from DB (cascades to grading jobs + reports)
    await prisma.upload.delete({ where: { id: uploadId } })

    logger.info('Upload deleted', { uploadId, userId: jwtUser.sub })
    return apiSuccess({ message: 'Datei erfolgreich gelöscht' })
  } catch (error) {
    logger.error('Delete upload error', { error })
    return apiError('Löschvorgang fehlgeschlagen', 500)
  }
}
