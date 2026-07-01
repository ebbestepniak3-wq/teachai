// app/api/auth/change-email/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { sendEmail, emailVerificationTemplate } from '@/lib/email/mailer'
import { z } from 'zod'

const schema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return apiError('Ungültige Eingaben', 422)

    const { newEmail, password } = parsed.data
    const user = await prisma.user.findUnique({ where: { id: jwtUser.sub } })
    if (!user) return apiUnauthorized()

    const isValid = await compare(password, user.passwordHash || '')
    if (!isValid) return apiError('Falsches Passwort', 401)

    const existing = await prisma.user.findUnique({ where: { email: newEmail.toLowerCase() } })
    if (existing) return apiError('Diese E-Mail-Adresse ist bereits vergeben', 409)

    // Create verification token for new email
    const token = randomBytes(32).toString('hex')
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    // Update email (unverified until token clicked)
    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail.toLowerCase(), emailVerified: false },
    })

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`
    await sendEmail({
      to: newEmail,
      subject: 'TeacherAI – Neue E-Mail-Adresse bestätigen',
      html: emailVerificationTemplate(user.name, verifyUrl),
    })

    return apiSuccess({ message: 'Bestätigungs-E-Mail an neue Adresse gesendet.' })
  } catch {
    return apiError('E-Mail-Änderung fehlgeschlagen', 500)
  }
}
