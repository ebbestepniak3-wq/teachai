// app/api/cron/cleanup-uploads/route.ts – cleanup expired uploads (run via Vercel Cron)
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFilesFromStorage } from '@/lib/storage/supabase'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email/mailer'

// Protect with cron secret
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const now = new Date()

    // Find uploads expiring within 4 hours (send warning)
    const warningThreshold = new Date(now.getTime() + 4 * 60 * 60 * 1000)
    const expiringSoon = await prisma.upload.findMany({
      where: {
        expiresAt: { gt: now, lte: warningThreshold },
        status: 'READY',
      },
      include: { user: { select: { email: true, name: true, notifyEmail: true } } },
    })

    // Send expiry warnings
    let warningsSent = 0
    for (const upload of expiringSoon) {
      if (!upload.user.notifyEmail) continue
      const hoursLeft = Math.round((upload.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60))

      await sendEmail({
        to: upload.user.email,
        subject: 'TeacherAI – Datei läuft bald ab',
        html: `
          <p>Hallo ${upload.user.name},</p>
          <p>Ihre hochgeladene Datei <strong>"${upload.fileName}"</strong> wird in ca. <strong>${hoursLeft} Stunden</strong> automatisch gelöscht.</p>
          <p>Starten Sie jetzt eine Bewertung oder downloaden Sie die Datei, bevor sie gelöscht wird.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/upload">Zum Upload-Bereich</a></p>
        `,
      }).catch(() => {})

      warningsSent++
    }

    // Find and delete expired uploads
    const expiredUploads = await prisma.upload.findMany({
      where: { expiresAt: { lte: now } },
      select: { id: true, storageKey: true },
    })

    if (expiredUploads.length > 0) {
      const storageKeys = expiredUploads.map((u) => u.storageKey)
      const uploadIds = expiredUploads.map((u) => u.id)

      // Delete from storage
      await deleteFilesFromStorage(storageKeys)

      // Delete from DB (cascades to grading jobs, reports)
      await prisma.upload.deleteMany({ where: { id: { in: uploadIds } } })

      logger.info('Expired uploads cleaned up', {
        count: expiredUploads.length,
        uploadIds,
      })
    }

    return Response.json({
      success: true,
      deleted: expiredUploads.length,
      warningsSent,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    logger.error('Cleanup job error', { error })
    return Response.json({ success: false, error: String(error) }, { status: 500 })
  }
}
