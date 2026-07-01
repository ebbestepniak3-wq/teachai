// app/(admin)/admin/grading/page.tsx – AI grading monitoring
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, Clock, AlertCircle, Zap } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'KI-Bewertungsmonitor' }

export default async function AdminGradingPage() {
  const [
    activeJobs,
    recentJobs,
    failedJobs,
    totalDone,
    avgTime,
  ] = await Promise.all([
    prisma.gradingJob.count({ where: { status: { in: ['QUEUED', 'PROCESSING'] } } }),
    prisma.gradingJob.findMany({
      where: { status: { in: ['DONE', 'FAILED', 'PROCESSING'] } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true, email: true } },
        report: { select: { note: true, gesamtpunkte: true, maximalpunkte: true } },
      },
    }),
    prisma.gradingJob.count({ where: { status: 'FAILED' } }),
    prisma.gradingJob.count({ where: { status: 'DONE' } }),
    // Average token usage from logs
    prisma.systemLog.findMany({
      where: { message: 'Grading completed' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  const avgTokens = avgTime.length > 0
    ? Math.round(avgTime.reduce((s, l) => s + ((l.context as any)?.tokensUsed || 0), 0) / avgTime.length)
    : 0

  const totalCost = avgTime.reduce((s, l) => s + ((l.context as any)?.cost || 0), 0)

  const statusConfig = {
    QUEUED: { label: 'Wartend', variant: 'default' as const },
    PROCESSING: { label: 'Läuft', variant: 'info' as const },
    DONE: { label: 'Fertig', variant: 'success' as const },
    FAILED: { label: 'Fehler', variant: 'destructive' as const },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KI-Bewertungsmonitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">Echtzeit-Übersicht der KI-Engine</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Aktiv', value: activeJobs, icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Gesamt fertig', value: totalDone, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Ø Tokens', value: avgTokens.toLocaleString('de'), icon: Zap, color: 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'Fehler gesamt', value: failedJobs, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
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

      {/* Cost tracking */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Geschätzte API-Kosten (letzte 100 Bewertungen)</p>
              <p className="text-xs text-muted-foreground mt-0.5">Anthropic Claude API · Approximate</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{(totalCost / 100).toFixed(2).replace('.', ',')} €</p>
              <p className="text-xs text-muted-foreground">~{((totalCost / 100) / Math.max(1, avgTime.length)).toFixed(3)} € / Bewertung</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Letzte Bewertungsaufträge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Nutzer', 'Fach', 'Klasse', 'Note', 'Tokens', 'Status', 'Zeit'].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentJobs.map((job) => {
                  const sc = statusConfig[job.status as keyof typeof statusConfig]
                  return (
                    <tr key={job.id} className="hover:bg-accent/50 transition-colors">
                      <td className="py-3 pr-3">
                        <p className="text-xs font-medium">{job.user.name}</p>
                        <p className="text-[10px] text-muted-foreground">{job.user.email}</p>
                      </td>
                      <td className="py-3 pr-3 text-xs">{job.fach}</td>
                      <td className="py-3 pr-3 text-xs">Kl. {job.klassenstufe}</td>
                      <td className="py-3 pr-3">
                        {job.report ? (
                          <span className="text-sm font-bold text-brand-400">{job.report.note}</span>
                        ) : '–'}
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {job.tokensUsed ? job.tokensUsed.toLocaleString('de') : '–'}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {formatDateTime(job.updatedAt)}
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
export const dynamic = 'force-dynamic'
