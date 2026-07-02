// app/(app)/dashboard/page.tsx – Phase 12: Premium Dashboard
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Upload, Brain, FileText, Sparkles, ArrowRight, Clock,
  TrendingUp, CheckCircle, AlertCircle, Zap, Calendar,
  Plus, ChevronRight, Award, Target,
} from 'lucide-react'
import { PLAN_CONFIGS } from '@teachai/types'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

function getGreeting(name: string): string {
  const h = new Date().getHours()
  const first = name.split(' ')[0]
  if (h < 12) return `Guten Morgen, ${first}!`
  if (h < 18) return `Guten Tag, ${first}!`
  return `Guten Abend, ${first}!`
}

const PLAN_FEATURES = {
  FREE:    { icon: Zap,      color: 'text-slate-400',  gradient: 'from-slate-500 to-slate-600' },
  BASIC:   { icon: Sparkles, color: 'text-blue-400',   gradient: 'from-blue-500 to-blue-600' },
  PRO:     { icon: TrendingUp,color: 'text-brand-400',  gradient: 'from-brand-500 to-brand-700' },
  MAX_PRO: { icon: Award,    color: 'text-amber-400',  gradient: 'from-amber-500 to-orange-500' },
}

export default async function DashboardPage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const user = await prisma.user.findUnique({
    where: { id: jwtUser.sub },
    include: {
      subscription: true,
      gradingJobs: {
        where: { createdAt: { gte: startOfMonth }, status: 'DONE' },
        select: { id: true, fach: true, createdAt: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      uploads: {
        where: { status: 'READY' },
        select: { id: true, fileName: true, fileType: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  })

  if (!user) redirect('/login')

  const plan = (user.subscription?.plan || 'FREE') as keyof typeof PLAN_CONFIGS
  const planConfig = PLAN_CONFIGS[plan]
  const planFeatures = PLAN_FEATURES[plan]

  const [totalJobs, monthlyJobs, failedJobs] = await Promise.all([
    prisma.gradingJob.count({ where: { userId: jwtUser.sub } }),
    prisma.gradingJob.count({ where: { userId: jwtUser.sub, status: 'DONE', createdAt: { gte: startOfMonth } } }),
    prisma.gradingJob.count({ where: { userId: jwtUser.sub, status: 'FAILED' } }),
  ])

  const monthlyLimit = planConfig.bewertungenProMonat
  const usagePercent = Math.round((monthlyJobs / monthlyLimit) * 100)
  const remaining = Math.max(0, monthlyLimit - monthlyJobs)
  const savedHours = Math.round(totalJobs * 0.5 * 10) / 10
  const periodEnd = user.subscription?.currentPeriodEnd

  const PlanIcon = planFeatures.icon

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{getGreeting(user.name)}</h1>
          <p className="mt-1 text-muted-foreground">
            {monthlyJobs === 0
              ? 'Starten Sie mit Ihrer ersten KI-Bewertung.'
              : `${monthlyJobs} Bewertung${monthlyJobs !== 1 ? 'en' : ''} diesen Monat – super!`}
          </p>
        </div>
        <Link href="/upload">
          <Button variant="gradient" size="lg" className="glow-brand group shrink-0">
            <Plus className="h-5 w-5" />
            Neue Bewertung
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Diesen Monat',
            value: monthlyJobs,
            sub: `von ${monthlyLimit} möglich`,
            icon: Brain,
            color: 'text-brand-400',
            bg: 'bg-brand-500/10',
            progress: usagePercent,
          },
          {
            label: 'Gesamt bewertet',
            value: totalJobs,
            sub: 'seit Registrierung',
            icon: FileText,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Stunden gespart',
            value: `${savedHours}h`,
            sub: '~30 Min. pro Arbeit',
            icon: Clock,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Noch verfügbar',
            value: remaining,
            sub: 'Bewertungen',
            icon: Target,
            color: remaining < 3 ? 'text-red-400' : 'text-cyan-400',
            bg: remaining < 3 ? 'bg-red-500/10' : 'bg-cyan-500/10',
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="card-hover overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
              <p className={`mt-4 text-3xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="mt-0.5 text-sm font-medium">{kpi.label}</p>
              <p className="text-xs text-muted-foreground">{kpi.sub}</p>
              {kpi.progress !== undefined && (
                <div className="mt-3">
                  <Progress value={kpi.progress} className="h-1.5" />
                  <p className="mt-1 text-[10px] text-muted-foreground">{kpi.progress}% verbraucht</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent grading jobs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  Letzte Bewertungen
                </CardTitle>
                <Link href="/grading/history">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    Alle anzeigen <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {user.gradingJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                    <Brain className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium">Noch keine Bewertungen</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                    Laden Sie Ihre erste Schülerarbeit hoch – in 60 Sekunden haben Sie eine KI-Bewertung.
                  </p>
                  <Link href="/upload" className="mt-4">
                    <Button variant="gradient" size="sm">
                      <Plus className="h-4 w-4" /> Jetzt starten
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {user.gradingJobs.map((job) => (
                    <Link key={job.id} href={`/grading/result/${job.id}`}>
                      <div className="group flex items-center gap-4 rounded-xl border border-border p-3.5 transition-all hover:bg-accent/60 hover:border-brand-500/20">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10">
                          <FileText className="h-4.5 w-4.5 text-brand-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{job.fach}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(job.createdAt)}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
                      </div>
                    </Link>
                  ))}
                  <Link href="/grading/history" className="block">
                    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:text-foreground hover:border-brand-500/30 hover:bg-accent/40 transition-all">
                      Alle Bewertungen anzeigen <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Plan card */}
          <Card className="overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${planFeatures.gradient}`} />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${planFeatures.gradient} shadow-md`}>
                  <PlanIcon className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">{planConfig.name}-Plan</p>
                  <p className="text-xs text-muted-foreground">
                    {plan === 'FREE' ? 'Kostenlos' : `${planConfig.price / 100} €/Monat`}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Bewertungen</span>
                  <span className="font-medium">{monthlyJobs}/{monthlyLimit}</span>
                </div>
                <Progress value={usagePercent} className="h-2" />
              </div>

              {periodEnd && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                  <Calendar className="h-3.5 w-3.5" />
                  Nächste Zahlung: {formatDate(periodEnd)}
                </div>
              )}

              {plan === 'FREE' && (
                <Link href="/settings/subscription">
                  <Button variant="gradient" size="sm" className="w-full glow-brand">
                    <Sparkles className="h-4 w-4" />
                    Auf Pro upgraden
                  </Button>
                </Link>
              )}
              {usagePercent >= 80 && plan !== 'FREE' && plan !== 'MAX_PRO' && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 mt-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Kontingent fast aufgebraucht. Jetzt upgraden.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Schnellzugriff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: Upload,      label: 'Neue Bewertung',     href: '/upload',          color: 'text-brand-400',   bg: 'bg-brand-500/10' },
                { icon: Sparkles,    label: 'KI-Assistent',       href: '/assistant',       color: 'text-purple-400',  bg: 'bg-purple-500/10' },
                { icon: FileText,    label: 'Alle Bewertungen',   href: '/grading/history', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { icon: TrendingUp,  label: 'Statistiken',        href: '/statistics',      color: 'text-amber-400',   bg: 'bg-amber-500/10' },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent transition-colors group">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.bg}`}>
                      <action.icon className={`h-4 w-4 ${action.color}`} />
                    </div>
                    <span className="text-sm font-medium flex-1">{action.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'
