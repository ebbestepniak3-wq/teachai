// app/(admin)/admin/billing/page.tsx – admin billing overview
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Billing-Übersicht' }

export default async function AdminBillingPage() {
  const [subs, invoices] = await Promise.all([
    prisma.subscription.groupBy({ by: ['plan', 'status'], _count: { plan: true } }),
    prisma.invoice.findMany({
      where: { status: 'PAID', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  const mrr = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const activePaid = subs.filter((s) => s.status === 'ACTIVE' && s.plan !== 'FREE').reduce((s, x) => s + x._count.plan, 0)
  const freeUsers = subs.find((s) => s.plan === 'FREE')?._count.plan || 0
  const trialing = subs.find((s) => s.status === 'TRIALING')?._count.plan || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing-Übersicht</h1>
        <p className="mt-1 text-sm text-muted-foreground">Stripe-Daten · letzte 30 Tage</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'MRR (30 Tage)', value: formatCurrency(mrr, 'eur'), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Zahlende Kunden', value: activePaid, icon: CreditCard, color: 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'Free-Nutzer', value: freeUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Testphasen', value: trialing, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((kpi) => (
          <Card key={kpi.label} className="card-hover">
            <CardContent className="p-5">
              <div className={`inline-flex rounded-xl p-2.5 ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="mt-4 text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {(['FREE', 'BASIC', 'PRO', 'MAX_PRO'] as const).map((plan) => {
          const count = subs.filter((s) => s.plan === plan).reduce((s, x) => s + x._count.plan, 0)
          return (
            <Card key={plan}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{plan.replace('_', ' ')}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Letzte Rechnungen (30 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Nutzer', 'Betrag', 'Währung', 'Status', 'Datum'].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-accent/50 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="text-xs font-medium">{inv.user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{inv.user.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-sm font-semibold">{formatCurrency(inv.amount, inv.currency)}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{inv.currency.toUpperCase()}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="success" className="text-[10px]">Bezahlt</Badge>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{formatDate(inv.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export const dynamic = 'force-dynamic'
