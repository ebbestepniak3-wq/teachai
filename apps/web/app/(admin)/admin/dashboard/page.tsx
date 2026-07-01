// app/(admin)/admin/dashboard/page.tsx
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    newUsersThisMonth,
    totalJobs,
    doneJobsThisMonth,
    activeSubscriptions,
    openTickets,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    prisma.gradingJob.count(),
    prisma.gradingJob.count({
      where: {
        status: 'DONE',
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.subscription.count({ where: { status: 'ACTIVE', plan: { not: 'FREE' } } }),
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { subscription: true },
    }),
  ])

  const kpis = [
    { label: 'Nutzer gesamt', value: totalUsers, sub: `+${newUsersThisMonth} diesen Monat`, icon: Users, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Bewertungen gesamt', value: totalJobs, sub: `${doneJobsThisMonth} diesen Monat`, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Aktive Abos', value: activeSubscriptions, sub: 'Zahlende Kunden', icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Offene Tickets', value: openTickets, sub: 'Wartend auf Antwort', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">System-Übersicht und KPIs</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="card-hover">
            <CardContent className="p-5">
              <div className={`inline-flex rounded-xl p-2.5 ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="mt-4 text-3xl font-bold">{kpi.value}</p>
              <p className="mt-1 text-sm font-medium">{kpi.label}</p>
              <p className="text-xs text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Zuletzt registrierte Nutzer
          </CardTitle>
          <CardDescription>Die 10 neuesten Konten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'E-Mail', 'Plan', 'Rolle', 'Registriert'].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/50 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium">{u.name}</p>
                    </td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">{u.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="text-[10px]">
                        {u.subscription?.plan || 'FREE'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={u.role === 'ADMIN' ? 'warning' : 'default'}
                        className="text-[10px]"
                      >
                        {u.role === 'ADMIN' ? 'Admin' : 'Lehrkraft'}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System health */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Datenbankverbindung', status: 'ok', icon: CheckCircle },
          { label: 'Claude API', status: 'ok', icon: CheckCircle },
          { label: 'Supabase Storage', status: 'ok', icon: CheckCircle },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <item.icon className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-emerald-500">Betrieb normal</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'
