// app/api/admin/coupons/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { apiError, apiSuccess, apiForbidden, apiUnauthorized } from '@/lib/api-response'
import { getStripe, createCoupon } from '@/lib/stripe/client'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  try {
    const stripe = getStripe()
    const coupons = await stripe.coupons.list({ limit: 50 })
    const codes = await stripe.promotionCodes.list({ limit: 100, active: true })

    return apiSuccess({
      coupons: coupons.data.map((c) => ({
        id: c.id,
        name: c.name,
        percentOff: c.percent_off,
        amountOff: c.amount_off,
        duration: c.duration,
        timesRedeemed: c.times_redeemed,
        maxRedemptions: c.max_redemptions,
        valid: c.valid,
        created: new Date(c.created * 1000).toISOString(),
      })),
      promotionCodes: codes.data.map((pc) => ({
        id: pc.id,
        code: pc.code,
        active: pc.active,
        timesRedeemed: pc.times_redeemed,
        maxRedemptions: pc.max_redemptions,
        couponId: pc.coupon.id,
        expiresAt: pc.expires_at ? new Date(pc.expires_at * 1000).toISOString() : null,
      })),
    })
  } catch (error: any) {
    if (error.message?.includes('nicht konfiguriert')) {
      return apiSuccess({ coupons: [], promotionCodes: [], note: 'Stripe nicht konfiguriert' })
    }
    return apiError('Fehler beim Laden der Gutscheincodes', 500)
  }
}

const createCouponSchema = z.object({
  name: z.string().min(1),
  percentOff: z.number().min(1).max(100).optional(),
  amountOff: z.number().min(1).optional(),
  duration: z.enum(['once', 'repeating', 'forever']),
  durationInMonths: z.number().optional(),
  maxRedemptions: z.number().optional(),
  code: z.string().min(3).optional(),
})

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  try {
    const body = await request.json()
    const parsed = createCouponSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const coupon = await createCoupon(parsed.data)

    // Create promotion code if requested
    if (parsed.data.code) {
      const stripe = getStripe()
      await stripe.promotionCodes.create({
        coupon: coupon.id,
        code: parsed.data.code.toUpperCase(),
        ...(parsed.data.maxRedemptions ? { max_redemptions: parsed.data.maxRedemptions } : {}),
      })
    }

    return apiSuccess({ couponId: coupon.id }, 201)
  } catch (error: any) {
    return apiError(error.message || 'Gutschein konnte nicht erstellt werden', 500)
  }
}
