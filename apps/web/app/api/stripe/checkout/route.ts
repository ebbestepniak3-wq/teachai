// app/api/stripe/checkout/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { createCheckoutSession } from '@/lib/stripe/client'
import { z } from 'zod'

const schema = z.object({
  plan: z.enum(['BASIC', 'PRO', 'MAX_PRO']),
  interval: z.enum(['month', 'year']).default('month'),
  couponCode: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return apiError('Ungültige Eingaben', 422)

    const { plan, interval, couponCode } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: jwtUser.sub },
      include: { subscription: true },
    })
    if (!user) return apiUnauthorized()

    // Prevent duplicate active subscriptions for same plan
    if (user.subscription?.plan === plan && user.subscription?.status === 'ACTIVE') {
      return apiError('Sie haben bereits diesen Plan.', 409)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      plan,
      interval,
      couponCode,
      successUrl: `${appUrl}/settings/subscription?success=true`,
      cancelUrl: `${appUrl}/settings/subscription?canceled=true`,
      trialDays: user.subscription?.plan === 'FREE' ? 7 : undefined,
    })

    return apiSuccess({ checkoutUrl: session.url, sessionId: session.id })
  } catch (error: any) {
    if (error.message?.includes('Price ID')) {
      return apiError('Dieser Plan ist momentan nicht verfügbar', 503)
    }
    return apiError(error.message || 'Checkout-Sitzung konnte nicht erstellt werden', 500)
  }
}
