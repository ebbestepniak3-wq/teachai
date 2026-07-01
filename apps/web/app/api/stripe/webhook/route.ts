// app/api/stripe/webhook/route.ts – handle all Stripe webhook events
import { NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, syncSubscriptionFromStripe } from '@/lib/stripe/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email/mailer'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    logger.warn('Webhook signature verification failed', { error: err.message })
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  logger.info('Stripe webhook received', { type: event.type, id: event.id })

  try {
    switch (event.type) {
      // ── Checkout completed ─────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          await syncSubscriptionFromStripe(sub)

          // Create success notification
          const userId = session.metadata?.userId
          if (userId) {
            const plan = session.metadata?.plan
            await prisma.notification.create({
              data: {
                userId,
                type: 'SUBSCRIPTION_RENEWED',
                title: 'Abo aktiviert!',
                message: `Ihr ${plan}-Abonnement wurde erfolgreich aktiviert. Viel Erfolg!`,
                link: '/settings/subscription',
              },
            })
          }
        }
        break
      }

      // ── Subscription updated ───────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await syncSubscriptionFromStripe(sub)
        break
      }

      // ── Subscription deleted ───────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata.userId

        if (userId) {
          await prisma.subscription.update({
            where: { userId },
            data: { plan: 'FREE', status: 'CANCELED', stripeSubscriptionId: null },
          })

          await prisma.notification.create({
            data: {
              userId,
              type: 'SUBSCRIPTION_EXPIRED',
              title: 'Abonnement beendet',
              message: 'Ihr Abonnement wurde beendet. Sie befinden sich jetzt im Free-Plan.',
              link: '/settings/subscription',
            },
          })

          // Send email
          const user = await prisma.user.findUnique({ where: { id: userId } })
          if (user) {
            await sendEmail({
              to: user.email,
              subject: 'TeacherAI – Abonnement beendet',
              html: `<p>Hallo ${user.name},<br><br>Ihr TeacherAI-Abonnement wurde beendet. Sie können jederzeit ein neues Abo abschließen unter: <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription">Abonnement</a></p>`,
            })
          }
        }
        break
      }

      // ── Invoice paid ───────────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
          include: { user: true },
        })

        if (sub) {
          // Record invoice in DB
          await prisma.invoice.create({
            data: {
              userId: sub.userId,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_paid,
              currency: invoice.currency.toUpperCase(),
              status: 'PAID',
              description: `TeacherAI ${sub.plan} Abonnement`,
              pdfUrl: invoice.invoice_pdf,
            },
          })

          logger.info('Invoice paid', { invoiceId: invoice.id, userId: sub.userId, amount: invoice.amount_paid })
        }
        break
      }

      // ── Invoice payment failed ─────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        })

        if (sub) {
          await prisma.notification.create({
            data: {
              userId: sub.userId,
              type: 'SUBSCRIPTION_EXPIRED',
              title: 'Zahlung fehlgeschlagen',
              message: 'Die Zahlung für Ihr Abonnement ist fehlgeschlagen. Bitte aktualisieren Sie Ihre Zahlungsmethode.',
              link: '/settings/billing',
            },
          })

          const user = await prisma.user.findUnique({ where: { id: sub.userId } })
          if (user) {
            await sendEmail({
              to: user.email,
              subject: 'TeacherAI – Zahlung fehlgeschlagen',
              html: `<p>Hallo ${user.name},<br><br>Die Zahlung für Ihr TeacherAI-Abonnement ist fehlgeschlagen. Bitte aktualisieren Sie Ihre Zahlungsmethode: <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing">Zahlungsmethode aktualisieren</a></p>`,
            })
          }
        }
        break
      }

      // ── Trial ending ───────────────────────────────────
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata.userId

        if (userId) {
          const daysLeft = Math.ceil(
            ((sub.trial_end || 0) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
          )

          await prisma.notification.create({
            data: {
              userId,
              type: 'SUBSCRIPTION_EXPIRED',
              title: `Testphase endet in ${daysLeft} Tagen`,
              message: 'Ihre kostenlose Testphase endet bald. Aktualisieren Sie Ihre Zahlungsmethode.',
              link: '/settings/billing',
            },
          })
        }
        break
      }

      default:
        logger.info('Unhandled webhook event', { type: event.type })
    }
  } catch (error) {
    logger.error('Webhook handler error', { type: event.type, error })
    return new Response('Webhook handler error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
