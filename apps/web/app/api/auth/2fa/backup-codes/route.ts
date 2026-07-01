// app/api/auth/2fa/backup-codes/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { generateBackupCodes, hashBackupCode } from '@/lib/2fa/totp'
import { sendEmail, twoFactorBackupCodesTemplate } from '@/lib/email/mailer'

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { password } = await request.json()
    if (!password) return apiError('Passwort ist erforderlich', 400)

    const user = await prisma.user.findUnique({ where: { id: jwtUser.sub } })
    if (!user || !user.twoFactorEnabled) return apiError('2FA ist nicht aktiviert', 400)

    const isValid = await compare(password, user.passwordHash || '')
    if (!isValid) return apiError('Falsches Passwort', 401)

    const plainCodes = generateBackupCodes()
    const hashedCodes = await Promise.all(plainCodes.map(hashBackupCode))

    await prisma.user.update({
      where: { id: user.id },
      data: { backupCodes: hashedCodes },
    })

    sendEmail({
      to: user.email,
      subject: 'TeacherAI – Neue Backup-Codes',
      html: twoFactorBackupCodesTemplate(user.name, plainCodes),
    }).catch(() => {})

    return apiSuccess({ backupCodes: plainCodes })
  } catch {
    return apiError('Fehler beim Generieren der Backup-Codes', 500)
  }
}
