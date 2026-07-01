// app/(app)/upload/history/page.tsx
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Image, Clock, AlertCircle, CheckCircle, Loader2, Trash2, Eye, Plus } from 'lucide-react'
import { formatDate, formatDateTime, formatFileSize } from '@/lib/utils'

export const metadata: Metadata = { title: 'Upload-Verlauf' }

const statusConfig = {
  PENDING: { label: 'Wartend', variant: 'default' as const, icon: Clock },
  PROCESSING: { label: 'Wird verarbeitet', variant: 'info' as const, icon: Loader2 },
  READY: { label: 'Bereit', variant: 'success' as const, icon: CheckCircle },
  FAILED: { label: 'Fehler', variant: 'destructive' as const, icon: AlertCircle },
}

export default async function UploadHistoryPage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const [uploads, stats] = await Promise.all([
    prisma.upload.findMany({
      where: { userId: jwtUser.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        gradingJobs: {
          select: { id: true, status: true, fach: true },
          take: 1,
        },
      },
    }),
    prisma.upload.groupBy({
      by: ['status'],
      where: { userId: jwtUser.sub },
      _count: { status: true },
    }),
  ])

  const statMap = Object.fromEntries(stats.map((s) => [s.status, s._count.status]))
  const totalSize = uploads.reduce((sum, u) => sum + u.fileSize, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Upload-Verlauf</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {uploads.length} Dateien · {formatFileSize(totalSize)} gesamt
          </p>
        </div>
        <Link href="/upload">
          <Button variant="gradient">
            <Plus className="h-4 w-4" />
            Neue Datei
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Bereit', count: statMap['READY'] || 0, color: 'text-emerald-400' },
          { label: 'Verarbeitung', count: statMap['PROCESSING'] || 0, color: 'text-blue-400' },
          { label: 'Wartend', count: statMap['PENDING'] || 0, color: 'text-muted-foreground' },
          { label: 'Fehler', count: statMap['FAILED'] || 0, color: 'text-red-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Alle Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">Noch keine Dateien hochgeladen</p>
              <Link href="/upload" className="mt-4">
                <Button variant="gradient" size="sm">Erste Datei hochladen</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Datei', 'Größe', 'Seiten', 'Status', 'Läuft ab', 'Hochgeladen', ''].map((h) => (
                      <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {uploads.map((upload) => {
                    const sc = statusConfig[upload.status as keyof typeof statusConfig]
                    const StatusIcon = sc.icon
                    const isExpiringSoon = upload.expiresAt &&
                      new Date(upload.expiresAt).getTime() - Date.now() < 4 * 60 * 60 * 1000

                    return (
                      <tr key={upload.id} className="group hover:bg-accent/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                              {upload.fileType.startsWith('image/')
                                ? <Image className="h-4 w-4 text-muted-foreground" />
                                : <FileText className="h-4 w-4 text-muted-foreground" />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[200px]">{upload.fileName}</p>
                              <p className="text-xs text-muted-foreground">{upload.fileType.split('/')[1]?.toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-sm text-muted-foreground">
                          {formatFileSize(upload.fileSize)}
                        </td>
                        <td className="py-3 pr-4 text-sm">
                          {upload.pageCount ? `${upload.pageCount} S.` : '–'}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className={cn(
                              'h-3.5 w-3.5',
                              upload.status === 'READY' ? 'text-emerald-500' :
                              upload.status === 'FAILED' ? 'text-red-500' :
                              upload.status === 'PROCESSING' ? 'text-blue-400 animate-spin' :
                              'text-muted-foreground'
                            )} />
                            <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          {upload.expiresAt ? (
                            <span className={cn(
                              'flex items-center gap-1 text-xs',
                              isExpiringSoon ? 'text-amber-500' : 'text-muted-foreground'
                            )}>
                              {isExpiringSoon && <AlertCircle className="h-3 w-3" />}
                              {formatDate(upload.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-500">Unbegrenzt</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-sm text-muted-foreground">
                          {formatDateTime(upload.createdAt)}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {upload.status === 'READY' && (
                              <Link href="/upload">
                                <Button variant="ghost" size="icon-sm" title="Bewertung starten">
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
