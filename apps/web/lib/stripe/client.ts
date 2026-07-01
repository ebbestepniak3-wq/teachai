// lib/stripe/client.ts – Stripe server-side client and helpers

import Stripe from 'stripe'
import { logger } from '@/lib/logger'
import { PLAN_CONFIGS } from '@teachai/types'

// Stripe singleton
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY nicht konfiguriert')
    stripeInstance = new Stripe(key, {
      apiVersion: '2024-06-20',
      typescript: true,
      telemetry: false,
      appInfo: { name: 'TeacherAI', version: '1.0.0', url: 'https://teachai.de' },
    })
  }
  return stripeInstance
}

// Price ID mapping from env
export function getStripePriceId(plan: string, interval: 'month' | 'year' = 'month'): string {
  const suffix = interval === 'year' ? '_YEARLY' : ''
  const key = `STRIPE_PRICE_${plan}${suffix}` as keyof NodeJS.ProcessEnv
  const priceId = process.env[key]
  if (!priceId) throw new Error(`Stripe Price ID fehlt für Plan ${plan} (${interval})`)
  return priceId
}

// Create or retrieve Stripe customer
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const { prisma } = await import('@/lib/prisma')
  const stripe = getStripe()

  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (sub?.stripeCustomerId) return sub.stripeCustomerId

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId, platform: 'teachai' },
  })

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId: customer.id, plan: 'FREE', status: 'ACTIVE' },
    update: { stripeCustomerId: customer.id },
  })

  logger.info('Stripe customer created', { customerId: customer.id, userId })
  return customer.id
}

// Create checkout session
export async function createCheckoutSession(params: {
  userId: string
  email: string
  name: string
  plan: string
  interval: 'month' | 'year'
  couponCode?: string
  successUrl: string
  cancelUrl: string
  trialDays?: number
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()
  const { userId, email, name, plan, interval, couponCode, successUrl, cancelUrl, trialDays } = params

  const customerId = await getOrCreateStripeCustomer(userId, email, name)
  const priceId = getStripePriceId(plan, interval)

  // Validate coupon if provided
  let promotionCodeId: string | undefined
  if (couponCode) {
    try {
      const codes = await stripe.promotionCodes.list({ code: couponCode, active: true, limit: 1 })
      if (codes.data.length > 0) {
        promotionCodeId = codes.data[0].id
      }
    } catch (err) {
      logger.warn('Invalid coupon code', { couponCode })
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    allow_promotion_codes: !promotionCodeId,
    ...(promotionCodeId ? { discounts: [{ promotion_code: promotionCodeId }] } : {}),
    subscription_data: {
      metadata: { userId, plan },
      ...(trialDays ? { trial_period_days: trialDays } : {}),
    },
    metadata: { userId, plan },
    billing_address_collection: 'auto',
    customer_update: { address: 'auto' },
    payment_method_types: ['card', 'sepa_debit', 'apple_pay', 'google_pay', 'bancontact', 'ideal'],
    locale: 'de',
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: true },
  })

  logger.info('Checkout session created', { sessionId: session.id, userId, plan })
  return session
}

// Create billing portal session
export async function createPortalSession(userId: string, returnUrl: string): Promise<string> {
  const stripe = getStripe()
  const { prisma } = await import('@/lib/prisma')

  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub?.stripeCustomerId) throw new Error('Kein Stripe-Kunde gefunden')

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: returnUrl,
  })

  return session.url
}

// Sync subscription from Stripe to DB
export async function syncSubscriptionFromStripe(stripeSubscription: Stripe.Subscription): Promise<void> {
  const { prisma } = await import('@/lib/prisma')

  const userId = stripeSubscription.metadata.userId
  if (!userId) {
    logger.warn('Subscription without userId', { subId: stripeSubscription.id })
    return
  }

  const planName = stripeSubscription.metadata.plan || 'BASIC'

  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: 'ACTIVE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'CANCELED',
    past_due: 'PAST_DUE',
    trialing: 'TRIALING',
    unpaid: 'PAST_DUE',
    paused: 'CANCELED',
  }

  const status = statusMap[stripeSubscription.status] || 'ACTIVE'
  const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000)
  const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)
  const trialEnd = stripeSubscription.trial_end
    ? new Date(stripeSubscription.trial_end * 1000)
    : null

  await prisma.subscription.update({
    where: { userId },
    data: {
      stripeSubscriptionId: stripeSubscription.id,
      plan: planName as any,
      status: status as any,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialEnd,
    },
  })

  logger.info('Subscription synced from Stripe', { userId, plan: planName, status })
}

// Create coupon
export async function createCoupon(params: {
  name: string
  percentOff?: number
  amountOff?: number
  duration: 'once' | 'repeating' | 'forever'
  durationInMonths?: number
  maxRedemptions?: number
  expiresAt?: Date
}): Promise<Stripe.Coupon> {
  const stripe = getStripe()

  const coupon = await stripe.coupons.create({
    name: params.name,
    ...(params.percentOff ? { percent_off: params.percentOff } : {}),
    ...(params.amountOff ? { amount_off: params.amountOff, currency: 'eur' } : {}),
    duration: params.duration,
    ...(params.durationInMonths ? { duration_in_months: params.durationInMonths } : {}),
    ...(params.maxRedemptions ? { max_redemptions: params.maxRedemptions } : {}),
    ...(params.expiresAt ? { redeem_by: Math.floor(params.expiresAt.getTime() / 1000) } : {}),
  })

  return coupon
}

// Cancel subscription at period end
export async function cancelSubscription(userId: string): Promise<void> {
  const stripe = getStripe()
  const { prisma } = await import('@/lib/prisma')

  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub?.stripeSubscriptionId) throw new Error('Kein aktives Abonnement')

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })

  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  })

  logger.info('Subscription scheduled for cancellation', { userId })
}

// Resume subscription
export async function resumeSubscription(userId: string): Promise<void> {
  const stripe = getStripe()
  const { prisma } = await import('@/lib/prisma')

  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub?.stripeSubscriptionId) throw new Error('Kein aktives Abonnement')

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: false,
  })

  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: false },
  })

  logger.info('Subscription resumed', { userId })
}
