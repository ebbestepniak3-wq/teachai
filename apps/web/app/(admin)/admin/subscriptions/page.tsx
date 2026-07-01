// app/(admin)/admin/subscriptions/page.tsx
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, TrendingUp, Users, DollarSign } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PLAN_CONFIGS } from '@teachai/types'

export const metadata: Metadata = { title: 'Abonnements' }

export default async function AdminSubscriptionsPage() {
  const [subscriptions, planStats] = await Promise.all([
    prisma.subscription.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
    prisma.subscription.groupBy({
      by: ['plan'],
      _count: { plan: true },
    }),
  ])

  const statusConfig = {
    ACTIVE: { label: 'Aktiv', variant: 'success' as const },
    CANCELED: { label: 'Gekündigt', variant: 'default' as const },
    PAST_DUE: { label: 'Überfällig', variant: 'destructive' as const },
    TRIALING: { label: 'Testphase', variant: 'info' as const },
    INCOMPLETE: { label: 'Unvollständig', variant: 'warning' as const },
  }

  const mrr = subscriptions
    .filter((s) => s.status === 'ACTIVE' && s.plan !== 'FREE')
    .reduce((sum, s) => sum + (PLAN_CONFIGS[s.plan as keyof typeof PLAN_CONFIGS]?.price || 0), 0)

  const planStatMap = Object.fromEntries(planStats.map((p) => [p.plan, p._count.plan]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <p className="mt-1 text-sm text-muted-foreground">Übersicht aller Kundenpläne</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'MRR (Monat)', value: formatCurrency(mrr), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Zahlende Kunden', value: subscriptions.filter(s => s.plan !== 'FREE' && s.status === 'ACTIVE').length, icon: CreditCard, color: 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'Free-Nutzer', value: planStatMap['FREE'] || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Gesamt Abos', value: subscriptions.length, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((kpi) => (
          <Card key={kpi.label} className="card-hover">
            <CardContent className="p-5">
              <div className={`inline-flex rounded-xl p-2.5 ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="mt-4 text-2xl font-bold">{kpi.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan distribution */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(['FREE', 'BASIC', 'PRO', 'MAX_PRO'] as const).map((plan) => (
          <Card key={plan}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{planStatMap[plan] || 0}</p>
              <p className="text-sm text-muted-foreground">{PLAN_CONFIGS[plan].name}</p>
              <p className="text-xs text-muted-foreground">
                {plan !== 'FREE' ? formatCurrency(PLAN_CONFIGS[plan].price) + '/Mo.' : 'Kostenlos'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscriptions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Abonnements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Nutzer', 'Plan', 'Status', 'Periode Ende', 'Stripe', ''].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.map((sub) => {
                  const status = statusConfig[sub.status as keyof typeof statusConfig]
                  return (
                    <tr key={sub.id} className="hover:bg-accent/50 transition-colors group">
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium">{sub.user.name}</p>
                        <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="text-[10px]">{sub.plan}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-sm text-muted-foreground">
                        {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '–'}
                      </td>
                      <td className="py-3 pr-4">
                        {sub.stripeSubscriptionId ? (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {sub.stripeSubscriptionId.slice(0, 14)}...
                          </span>
                        ) : '–'}
                      </td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                          Details
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
