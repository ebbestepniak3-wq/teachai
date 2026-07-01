// app/api/stripe/cancel/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { cancelSubscription, resumeSubscription } from '@/lib/stripe/client'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const { action } = await request.json()

    const sub = await prisma.subscription.findUnique({ where: { userId: jwtUser.sub } })
    if (!sub || sub.plan === 'FREE') return apiError('Kein aktives Abonnement', 404)

    if (action === 'cancel') {
      await cancelSubscription(jwtUser.sub)
      return apiSuccess({ message: 'Abonnement wird zum Ende des Abrechnungszeitraums gekündigt.' })
    }

    if (action === 'resume') {
      await resumeSubscription(jwtUser.sub)
      return apiSuccess({ message: 'Abonnement-Kündigung wurde zurückgezogen.' })
    }

    return apiError('Ungültige Aktion', 400)
  } catch (error: any) {
    return apiError(error.message || 'Fehler bei der Abo-Verwaltung', 500)
  }
}
