// app/(app)/reports/[id]/page.tsx
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Printer, FileText, CheckCircle, AlertCircle, TrendingUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Bewertungsbericht' }

export default async function ReportPage({ params }: { params: { id: string } }) {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const report = await prisma.gradingReport.findFirst({
    where: { id: params.id, userId: jwtUser.sub },
    include: { gradingJob: { include: { upload: true } } },
  })

  if (!report) notFound()

  const job = report.gradingJob
  const noteColor = (note: string) => {
    const n = parseFloat(note)
    if (n <= 2) return 'text-emerald-400'
    if (n <= 3) return 'text-blue-400'
    if (n <= 4) return 'text-amber-400'
    return 'text-red-400'
  }

  const percent = Math.round((report.gesamtpunkte / report.maximalpunkte) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/grading/history" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" />
            Zurück zur Übersicht
          </Link>
          <h1 className="text-2xl font-bold">Bewertungsbericht</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.fach} · {job.schulform} · Klasse {job.klassenstufe} · {formatDate(report.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4" />
            Drucken
          </Button>
          <Button variant="gradient" size="sm">
            <Download className="h-4 w-4" />
            PDF laden
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main report */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overall score */}
          <Card className="border-brand-500/20 bg-brand-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamtergebnis</p>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className={`text-5xl font-bold ${noteColor(report.note)}`}>
                      {report.note}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      {report.gesamtpunkte}/{report.maximalpunkte} Pkt. ({percent}%)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={report.finalisiertVon === 'TEACHER' ? 'success' : 'brand'} className="text-[10px]">
                    {report.finalisiertVon === 'TEACHER' ? 'Von Lehrkraft geprüft' : 'KI-Bewertung'}
                  </Badge>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-3 rounded-full bg-background overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Point breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Punkteverteilung nach Aufgaben
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(report.punkteVerteilung)
                  ? (report.punkteVerteilung as Array<{ aufgabe: string; erreichterPunkte: number; maxPunkte: number; begruendung: string }>).map((item) => (
                    <div key={item.aufgabe} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Aufgabe {item.aufgabe}</span>
                        <span className="text-sm font-bold">
                          {item.erreichterPunkte}/{item.maxPunkte} Pkt.
                        </span>
                      </div>
                      {item.begruendung && (
                        <p className="mt-1.5 text-xs text-muted-foreground">{item.begruendung}</p>
                      )}
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${(item.erreichterPunkte / item.maxPunkte) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                  : <p className="text-sm text-muted-foreground">Keine Aufgabendetails verfügbar.</p>
                }
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Allgemeines Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.feedback}</p>
            </CardContent>
          </Card>

          {/* Teacher notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lehrernotizen</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                defaultValue={report.lehrerAnmerkungen ?? ''}
                rows={3}
                placeholder="Eigene Anmerkungen hinzufügen..."
                className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button variant="outline" size="sm" className="mt-2">Notizen speichern</Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Stärken
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(report.staerken as string[]).map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                  <span className="text-muted-foreground">{s}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Schwächen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(report.schwaechen as string[]).map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                  <span className="text-muted-foreground">{s}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                Verbesserungsvorschläge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(report.verbesserungsvorschlaege as string[]).map((v, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <TrendingUp className="h-3.5 w-3.5 shrink-0 text-blue-400 mt-0.5" />
                  <span className="text-muted-foreground">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
