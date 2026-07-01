// app/(admin)/admin/logs/page.tsx
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollText, AlertCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Fehlerprotokolle' }

export default async function AdminLogsPage() {
  const [systemLogs, loginFailures] = await Promise.all([
    prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => []),
    prisma.loginHistory.findMany({
      where: { success: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { email: true } } },
    }),
  ])

  const levelConfig = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', badge: 'info' as const },
    warn: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', badge: 'warning' as const },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', badge: 'destructive' as const },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fehlerprotokolle</h1>
          <p className="mt-1 text-sm text-muted-foreground">Systemlogs und Fehlermeldungen</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
          Aktualisieren
        </Button>
      </div>

      {/* Failed logins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Fehlgeschlagene Anmeldeversuche
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loginFailures.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Keine fehlgeschlagenen Anmeldeversuche.</p>
          ) : (
            <div className="space-y-2">
              {loginFailures.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{entry.user?.email || 'Unbekannt'}</span>
                      {' – '}{entry.failReason || 'Fehler'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      IP: {entry.ipAddress || '–'} · {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-[10px] shrink-0">Fehler</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" />
            Systemprotokolle
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemLogs.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ScrollText className="h-8 w-8 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Keine Systemlogs vorhanden.</p>
              <p className="mt-1 text-xs text-muted-foreground">Logs werden in der Datenbank gespeichert sobald Ereignisse auftreten.</p>
            </div>
          ) : (
            <div className="space-y-2 font-mono">
              {systemLogs.map((log) => {
                const config = levelConfig[log.level as keyof typeof levelConfig] || levelConfig.info
                const Icon = config.icon
                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 rounded-xl border border-border p-3 ${config.bg}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{log.message}</p>
                      {log.context && (
                        <pre className="mt-1 text-[10px] text-muted-foreground overflow-x-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                        {log.userId && ` · User: ${log.userId}`}
                      </p>
                    </div>
                    <Badge variant={config.badge} className="text-[10px] shrink-0 uppercase">
                      {log.level}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
export const dynamic = 'force-dynamic'
