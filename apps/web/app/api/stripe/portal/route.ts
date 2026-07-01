// app/api/stripe/portal/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { createPortalSession } from '@/lib/stripe/client'

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = `${appUrl}/settings/billing`

    const url = await createPortalSession(jwtUser.sub, returnUrl)
    return apiSuccess({ url })
  } catch (error: any) {
    if (error.message?.includes('Kein Stripe-Kunde')) {
      return apiError('Kein Stripe-Konto vorhanden. Bitte zuerst upgraden.', 404)
    }
    return apiError('Billing-Portal konnte nicht geöffnet werden', 500)
  }
}
