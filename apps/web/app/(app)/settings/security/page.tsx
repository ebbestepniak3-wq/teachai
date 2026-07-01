// app/(app)/settings/security/page.tsx – Phase 3: full security page
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TwoFactorSetup } from '@/components/auth/two-factor-setup'
import { Shield, Key, Monitor, Trash2, AlertTriangle, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Sicherheit' }

export default async function SecurityPage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const [user, sessions, loginHistory] = await Promise.all([
    prisma.user.findUnique({ where: { id: jwtUser.sub } }),
    prisma.session.findMany({
      where: { userId: jwtUser.sub, expiresAt: { gt: new Date() } },
      orderBy: { lastUsed: 'desc' },
    }),
    prisma.loginHistory.findMany({
      where: { userId: jwtUser.sub },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            Passwort ändern
          </CardTitle>
          <CardDescription>
            Verwenden Sie ein starkes, einzigartiges Passwort. Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Zahl.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/settings/password" method="POST" className="space-y-4 max-w-md">
            {[
              { label: 'Aktuelles Passwort', name: 'currentPassword', auto: 'current-password' },
              { label: 'Neues Passwort', name: 'newPassword', auto: 'new-password' },
              { label: 'Passwort bestätigen', name: 'confirmNewPassword', auto: 'new-password' },
            ].map((f) => (
              <div key={f.name} className="space-y-1.5">
                <label className="text-sm font-medium">{f.label}</label>
                <input
                  type="password"
                  name={f.name}
                  required
                  autoComplete={f.auto}
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
            <Button variant="gradient" type="submit">
              Passwort aktualisieren
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">E-Mail-Adresse ändern</CardTitle>
          <CardDescription>
            Aktuelle E-Mail: <strong>{user.email}</strong>
            {!user.emailVerified && (
              <Badge variant="warning" className="ml-2 text-[10px]">Nicht verifiziert</Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-3 max-w-md">
            <input
              type="email"
              name="newEmail"
              placeholder="neue@email.de"
              className="flex h-10 flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password"
              name="password"
              placeholder="Passwort bestätigen"
              className="flex h-10 flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button variant="outline" type="button">Ändern</Button>
          </form>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Zwei-Faktor-Authentifizierung
          </CardTitle>
          <CardDescription>
            Schützen Sie Ihr Konto mit einem zusätzlichen Sicherheitsfaktor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup isEnabled={user.twoFactorEnabled} />

          {user.twoFactorEnabled && (
            <>
              <Separator className="my-5" />
              <div>
                <p className="text-sm font-medium mb-1">Backup-Codes</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Sie haben {user.backupCodes.length} Backup-Code(s) verbleibend. Generieren Sie neue Codes, wenn Sie fast alle verbraucht haben.
                </p>
                <Button variant="outline" size="sm">
                  Neue Backup-Codes generieren
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            Aktive Sitzungen
          </CardTitle>
          <CardDescription>
            {sessions.length} aktive Sitzung{sessions.length !== 1 ? 'en' : ''} auf Ihren Geräten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine aktiven Sitzungen.</p>
          ) : (
            sessions.map((session, i) => (
              <div key={session.id} className="flex items-center justify-between rounded-xl border border-border p-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {session.userAgent?.split(/\(|AppleWebKit/)[0]?.trim() || 'Unbekannt'}
                      </p>
                      {i === 0 && <Badge variant="success" className="text-[10px] shrink-0">Diese Sitzung</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.ipAddress || '–'} · Zuletzt aktiv: {formatDateTime(session.lastUsed)}
                    </p>
                  </div>
                </div>
                {i > 0 && (
                  <form action={`/api/auth/sessions/${session.id}`} method="DELETE">
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </div>
            ))
          )}

          {sessions.length > 1 && (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive mt-1">
              Alle anderen Sitzungen beenden
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Login history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Anmeldeverlauf
          </CardTitle>
          <CardDescription>Letzte 10 Anmeldeversuche</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loginHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Kein Verlauf vorhanden.</p>
            ) : (
              loginHistory.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${entry.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {entry.success
                      ? <Shield className="h-4 w-4 text-emerald-500" />
                      : <AlertTriangle className="h-4 w-4 text-red-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {entry.success ? 'Erfolgreiche Anmeldung' : 'Fehlgeschlagene Anmeldung'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.ipAddress || 'IP unbekannt'} · {formatDateTime(entry.createdAt)}
                      {entry.failReason && ` · ${entry.failReason}`}
                    </p>
                  </div>
                  <Badge variant={entry.success ? 'success' : 'destructive'} className="text-[10px] shrink-0">
                    {entry.success ? 'OK' : 'Fehler'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Gefahrenzone
          </CardTitle>
          <CardDescription>Irreversible Aktionen. Bitte mit Vorsicht verwenden.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <div>
              <p className="text-sm font-medium">Konto deaktivieren</p>
              <p className="text-xs text-muted-foreground">Ihr Konto wird gesperrt. Sie können es reaktivieren.</p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
              Deaktivieren
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
            <div>
              <p className="text-sm font-medium">Konto löschen</p>
              <p className="text-xs text-muted-foreground">Alle Daten werden dauerhaft gelöscht (DSGVO Art. 17).</p>
            </div>
            <Button variant="destructive" size="sm">Löschen</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
