// app/(app)/grading/history/page.tsx
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Filter, Download } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Bewertungen' }

const statusConfig = {
  DONE: { label: 'Fertig', variant: 'success' as const },
  PROCESSING: { label: 'Läuft', variant: 'warning' as const },
  QUEUED: { label: 'Wartend', variant: 'default' as const },
  FAILED: { label: 'Fehler', variant: 'destructive' as const },
}

export default async function GradingHistoryPage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const jobs = await prisma.gradingJob.findMany({
    where: { userId: jwtUser.sub },
    orderBy: { createdAt: 'desc' },
    include: { report: true, upload: true },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bewertungen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {jobs.length} Bewertung{jobs.length !== 1 ? 'en' : ''} insgesamt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
            Filtern
          </Button>
          <Link href="/upload">
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" />
              Neue Bewertung
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Bewertungsaufträge</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-4 text-base font-semibold">Noch keine Bewertungen</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                Laden Sie Ihre erste Schülerarbeit hoch, um die KI-Bewertung zu starten.
              </p>
              <Link href="/upload" className="mt-6">
                <Button variant="gradient">
                  <Plus className="h-4 w-4" />
                  Erste Bewertung starten
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Fach', 'Schulform', 'Klasse', 'Datum', 'Note', 'Status', ''].map((h) => (
                      <th
                        key={h}
                        className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobs.map((job) => {
                    const status = statusConfig[job.status as keyof typeof statusConfig]
                    return (
                      <tr
                        key={job.id}
                        className="group transition-colors hover:bg-accent/50"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium">{job.fach}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-sm text-muted-foreground">{job.schulform}</td>
                        <td className="py-3 pr-4 text-sm text-muted-foreground">Klasse {job.klassenstufe}</td>
                        <td className="py-3 pr-4 text-sm text-muted-foreground">{formatDate(job.createdAt)}</td>
                        <td className="py-3 pr-4">
                          {job.report ? (
                            <span className="text-base font-bold">{job.report.note}</span>
                          ) : (
                            <span className="text-muted-foreground">–</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={status.variant} className="text-[10px]">
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {job.report && (
                              <Link href={`/reports/${job.report.id}`}>
                                <Button variant="ghost" size="icon-sm">
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
                            {job.report?.pdfStorageKey && (
                              <Button variant="ghost" size="icon-sm">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
