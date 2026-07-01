// app/(admin)/admin/analytics/page.tsx – live analytics dashboard
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSystemMetrics, checkAllServices } from '@/lib/monitoring'
import {
  Users, TrendingUp, FileText, Brain, DollarSign, Activity,
  Zap, AlertCircle, CheckCircle, Clock, Server,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Live Analytics' }
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnalyticsPage() {
  const now = new Date()
  const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const start30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers, newUsers24h, newUsers7d,
    totalJobs, jobs24h, jobs7d,
    activeSubscriptions, mrr, arr,
    failedJobs24h, systemMetrics, services,
    gradingByFach, registrationsPerDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: start24h } } }),
    prisma.user.count({ where: { createdAt: { gte: start7d } } }),
    prisma.gradingJob.count(),
    prisma.gradingJob.count({ where: { createdAt: { gte: start24h } } }),
    prisma.gradingJob.count({ where: { createdAt: { gte: start7d } } }),
    prisma.subscription.count({ where: { status: 'ACTIVE', plan: { not: 'FREE' } } }),
    // MRR from invoices this month
    prisma.invoice.aggregate({
      where: { status: 'PAID', createdAt: { gte: startMonth } },
      _sum: { amount: true },
    }),
    // ARR estimate
    prisma.invoice.aggregate({
      where: { status: 'PAID', createdAt: { gte: start30d } },
      _sum: { amount: true },
    }),
    prisma.gradingJob.count({ where: { status: 'FAILED', createdAt: { gte: start24h } } }),
    Promise.resolve(getSystemMetrics()),
    checkAllServices(),
    // Jobs by subject
    prisma.gradingJob.groupBy({
      by: ['fach'],
      where: { createdAt: { gte: start7d } },
      _count: { fach: true },
      orderBy: { _count: { fach: 'desc' } },
      take: 8,
    }),
    // Registrations per day (last 7 days)
    prisma.user.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: start7d } },
      _count: { id: true },
    }),
  ])

  const mrrAmount = (mrr._sum.amount || 0) / 100
  const arrAmount = Math.round((arr._sum.amount || 0) / 100 * 12)

  const kpis = [
    { label: 'Nutzer gesamt', value: totalUsers.toLocaleString('de'), sub: `+${newUsers24h} heute`, icon: Users, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Neue Nutzer (7T)', value: newUsers7d, sub: `+${newUsers24h} in 24h`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Bewertungen gesamt', value: totalJobs.toLocaleString('de'), sub: `${jobs24h} in 24h`, icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'MRR', value: `${mrrAmount.toFixed(0)} €`, sub: 'Dieser Monat', icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'ARR (Schätzung)', value: `${arrAmount.toLocaleString('de')} €`, sub: 'Auf Jahresbasis', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Aktive Abos', value: activeSubscriptions, sub: 'Zahlende Kunden', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Fehler 24h', value: failedJobs24h, sub: 'Fehlgeschlagene KI', icon: AlertCircle, color: failedJobs24h > 5 ? 'text-red-400' : 'text-muted-foreground', bg: failedJobs24h > 5 ? 'bg-red-500/10' : 'bg-muted/20' },
    { label: 'Speicher (Server)', value: `${systemMetrics.memory.percent}%`, sub: `${systemMetrics.memory.used} MB`, icon: Server, color: systemMetrics.memory.percent > 80 ? 'text-red-400' : 'text-emerald-400', bg: 'bg-muted/20' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Zuletzt aktualisiert: {now.toLocaleTimeString('de-DE')} · Uptime: {Math.floor(systemMetrics.uptime / 3600)}h {Math.floor((systemMetrics.uptime % 3600) / 60)}m
          </p>
        </div>
        <Badge variant="success" className="text-xs">● Live</Badge>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="card-hover">
            <CardContent className="p-5">
              <div className={`inline-flex rounded-xl p-2.5 ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className={`mt-4 text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="mt-1 text-xs font-medium">{kpi.label}</p>
              <p className="text-xs text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Service health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Service-Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div className="flex items-center gap-3">
                  {s.status === 'ok'
                    ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                    : s.status === 'degraded'
                    ? <AlertCircle className="h-4 w-4 text-amber-500" />
                    : <AlertCircle className="h-4 w-4 text-red-500" />
                  }
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    {s.message && <p className="text-xs text-muted-foreground">{s.message}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.latencyMs !== undefined && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{s.latencyMs}ms
                    </span>
                  )}
                  <Badge
                    variant={s.status === 'ok' ? 'success' : s.status === 'degraded' ? 'warning' : 'destructive'}
                    className="text-[10px]"
                  >
                    {s.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Häufigste Fächer (7 Tage)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gradingByFach.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Keine Daten</p>
            ) : (
              gradingByFach.map((item, i) => {
                const maxCount = gradingByFach[0]._count.fach
                const percent = Math.round((item._count.fach / maxCount) * 100)
                return (
                  <div key={item.fach} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.fach}</span>
                      <span className="text-muted-foreground">{item._count.fach}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* System metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            System-Metriken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Prozess-Uptime', value: `${Math.floor(systemMetrics.uptime / 3600)}h ${Math.floor((systemMetrics.uptime % 3600) / 60)}m` },
              { label: 'Node.js', value: systemMetrics.process.version },
              { label: 'RAM verwendet', value: `${systemMetrics.memory.used} MB (${systemMetrics.memory.percent}%)` },
              { label: 'Plattform', value: systemMetrics.process.platform },
              { label: 'Anfragen (60s)', value: systemMetrics.requests.total },
              { label: 'Fehler (60s)', value: systemMetrics.requests.failed },
              { label: 'Ø Antwortzeit', value: `${systemMetrics.requests.avgResponseMs}ms` },
              { label: 'PID', value: systemMetrics.process.pid },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="mt-0.5 text-sm font-mono font-medium">{m.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
