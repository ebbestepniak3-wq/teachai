// app/(app)/statistics/page.tsx – Phase 9: final with real data
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Clock, FileText, CheckCircle, Target, Calendar } from 'lucide-react'
import { PLAN_CONFIGS } from '@teachai/types'

export const metadata: Metadata = { title: 'Statistiken' }

export default async function StatisticsPage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: d.toLocaleDateString('de-DE', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
  })

  const [totalJobs, doneJobs, fachStats, monthlyStats, user] = await Promise.all([
    prisma.gradingJob.count({ where: { userId: jwtUser.sub } }),
    prisma.gradingJob.count({ where: { userId: jwtUser.sub, status: 'DONE' } }),
    prisma.gradingJob.groupBy({
      by: ['fach'],
      where: { userId: jwtUser.sub, status: 'DONE' },
      _count: { fach: true },
      orderBy: { _count: { fach: 'desc' } },
      take: 5,
    }),
    Promise.all(
      months.map((m) =>
        prisma.gradingJob.count({
          where: {
            userId: jwtUser.sub,
            status: 'DONE',
            createdAt: {
              gte: new Date(m.year, m.month, 1),
              lt: new Date(m.year, m.month + 1, 1),
            },
          },
        })
      )
    ),
    prisma.user.findUnique({
      where: { id: jwtUser.sub },
      include: { subscription: true },
    }),
  ])

  const usageThisMonth = monthlyStats[5]
  const plan = (user?.subscription?.plan || 'FREE') as keyof typeof PLAN_CONFIGS
  const monthlyLimit = PLAN_CONFIGS[plan].bewertungenProMonat
  const estimatedHoursSaved = Math.round(doneJobs * 0.5 * 10) / 10
  const maxMonthly = Math.max(...monthlyStats, 1)

  const kpiCards = [
    { label: 'Gesamt bewertet', value: totalJobs, sub: `${doneJobs} erfolgreich`, icon: FileText, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Diesen Monat', value: usageThisMonth, sub: `von ${monthlyLimit} möglich`, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Stunden gespart', value: `${estimatedHoursSaved}h`, sub: '~30 Min. pro Bewertung', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Erfolgsrate', value: totalJobs > 0 ? `${Math.round((doneJobs / totalJobs) * 100)}%` : '–', sub: 'erfolgreich bewertet', icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Statistiken</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ihre persönliche Nutzungsübersicht auf einen Blick.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Real bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Bewertungen pro Monat
            </CardTitle>
            <CardDescription>Letzte 6 Monate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3 h-40 pt-4">
              {months.map((m, i) => {
                const count = monthlyStats[i]
                const heightPercent = maxMonthly > 0 ? Math.max(4, (count / maxMonthly) * 100) : 4
                return (
                  <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{count > 0 ? count : ''}</span>
                    <div
                      className="w-full rounded-t-lg bg-primary/30 hover:bg-primary/60 transition-colors cursor-default"
                      style={{ height: `${heightPercent}%` }}
                      title={`${m.label}: ${count} Bewertungen`}
                    />
                    <span className="text-[10px] text-muted-foreground">{m.label}</span>
                  </div>
                )
              })}
            </div>
            {doneJobs === 0 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Noch keine Bewertungen. Laden Sie Ihre erste Arbeit hoch!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Real subject breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Häufigste Fächer
            </CardTitle>
            <CardDescription>Nach Anzahl der Bewertungen</CardDescription>
          </CardHeader>
          <CardContent>
            {fachStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle className="h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">Noch keine Daten vorhanden.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fachStats.map((item) => {
                  const percent = Math.round((item._count.fach / fachStats[0]._count.fach) * 100)
                  return (
                    <div key={item.fach} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.fach}</span>
                        <span className="text-muted-foreground">{item._count.fach}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ihre Errungenschaften</CardTitle>
          <CardDescription>Meilensteine auf Ihrer TeacherAI-Reise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Erste Bewertung', desc: 'Sie haben begonnen!', done: doneJobs >= 1, icon: '🎯', threshold: 1 },
              { label: '10 Bewertungen', desc: 'Fleißige Lehrkraft', done: doneJobs >= 10, icon: '📚', threshold: 10 },
              { label: '50 Bewertungen', desc: 'KI-Profi', done: doneJobs >= 50, icon: '🏆', threshold: 50 },
              { label: '5 Stunden gespart', desc: 'Zeitgewinner', done: estimatedHoursSaved >= 5, icon: '⏰', threshold: 0 },
            ].map((badge) => (
              <div
                key={badge.label}
                className={`rounded-2xl border p-4 text-center transition-all ${
                  badge.done
                    ? 'border-brand-500/30 bg-brand-500/10'
                    : 'border-border bg-muted/20 opacity-50 grayscale'
                }`}
              >
                <div className="text-3xl">{badge.icon}</div>
                <p className="mt-2 text-sm font-semibold">{badge.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{badge.desc}</p>
                {badge.done && (
                  <Badge variant="brand" className="mt-2 text-[10px]">Erreicht ✓</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
