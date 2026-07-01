// app/api/stripe/prices/route.ts
import { NextRequest } from 'next/server'
import { apiSuccess } from '@/lib/api-response'
import { PLAN_CONFIGS } from '@teachai/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const interval = searchParams.get('interval') || 'month'

  const yearlyDiscount = 0.2 // 20% discount for yearly

  const plans = Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
    id: key,
    name: config.name,
    monthlyPrice: config.price,
    yearlyPrice: config.price > 0 ? Math.round(config.price * 12 * (1 - yearlyDiscount)) : 0,
    yearlyMonthlyEquivalent: config.price > 0 ? Math.round(config.price * (1 - yearlyDiscount)) : 0,
    features: config.features,
    bewertungenProMonat: config.bewertungenProMonat,
    maxDateien: config.maxDateien,
    popular: key === 'PRO',
    trialDays: key !== 'FREE' ? 7 : 0,
    priceId: {
      month: process.env[`STRIPE_PRICE_${key}`] || null,
      year: process.env[`STRIPE_PRICE_${key}_YEARLY`] || null,
    },
  }))

  return apiSuccess({
    plans,
    interval,
    yearlyDiscount: yearlyDiscount * 100,
  })
}
