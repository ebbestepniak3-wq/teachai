// app/api/auth/2fa/verify/route.ts – verify code and activate 2FA
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { verifyTotpCode, generateBackupCodes, hashBackupCode } from '@/lib/2fa/totp'
import { sendEmail, twoFactorBackupCodesTemplate } from '@/lib/email/mailer'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { code } = await request.json()
    if (!code) return apiError('Code ist erforderlich', 400)

    const user = await prisma.user.findUnique({ where: { id: jwtUser.sub } })
    if (!user || !user.twoFactorSecret) return apiError('Kein 2FA-Secret gefunden', 400)
    if (user.twoFactorEnabled) return apiError('2FA ist bereits aktiviert', 400)

    if (!verifyTotpCode(user.twoFactorSecret, code)) {
      return apiError('Ungültiger Code. Bitte prüfen Sie Ihre Authenticator-App.', 400)
    }

    // Generate backup codes
    const plainBackupCodes = generateBackupCodes()
    const hashedBackupCodes = await Promise.all(plainBackupCodes.map(hashBackupCode))

    // Activate 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        backupCodes: hashedBackupCodes,
      },
    })

    await prisma.usageLog.create({
      data: { userId: user.id, action: 'TWO_FACTOR_ENABLED' },
    })

    // Email backup codes
    sendEmail({
      to: user.email,
      subject: 'TeacherAI – Ihre 2FA Backup-Codes',
      html: twoFactorBackupCodesTemplate(user.name, plainBackupCodes),
    }).catch(() => {})

    logger.info('2FA enabled', { userId: user.id })

    return apiSuccess({ backupCodes: plainBackupCodes })
  } catch (error) {
    logger.error('2FA verify error', { error })
    return apiError('2FA-Aktivierung fehlgeschlagen', 500)
  }
}
