// app/(app)/settings/subscription/page.tsx – Phase 6: full Stripe subscription
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SubscriptionManager } from '@/components/stripe/subscription-manager'
import { PLAN_CONFIGS } from '@teachai/types'

export const metadata: Metadata = { title: 'Abonnement' }

export default async function SubscriptionPage({ searchParams }: { searchParams: { success?: string; canceled?: string } }) {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: jwtUser.sub },
    include: {
      subscription: true,
      invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
  if (!user) redirect('/login')

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const usageThisMonth = await prisma.gradingJob.count({
    where: { userId: jwtUser.sub, createdAt: { gte: startOfMonth } },
  })

  const plan = (user.subscription?.plan || 'FREE') as keyof typeof PLAN_CONFIGS
  const planConfig = PLAN_CONFIGS[plan]

  return (
    <SubscriptionManager
      currentPlan={plan}
      planConfig={planConfig}
      subscription={user.subscription ? {
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() || null,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        trialEnd: user.subscription.trialEnd?.toISOString() || null,
        stripeSubscriptionId: user.subscription.stripeSubscriptionId,
      } : null}
      usageThisMonth={usageThisMonth}
      monthlyLimit={planConfig.bewertungenProMonat}
      successMessage={searchParams.success === 'true'}
      canceledMessage={searchParams.canceled === 'true'}
    />
  )
}
