// app/(auth)/two-factor/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Zwei-Faktor-Authentifizierung' }

export default function TwoFactorPage({
  searchParams,
}: {
  searchParams: { token?: string; error?: string }
}) {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-500/25">
          <Shield className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Sicherheitscheck</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Geben Sie den Code aus Ihrer Authenticator-App ein.
        </p>
      </div>

      <Card className="shadow-2xl shadow-black/10">
        <CardContent className="p-6">
          {searchParams.error && (
            <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {searchParams.error === 'invalid'
                ? 'Ungültiger Code. Bitte versuchen Sie es erneut.'
                : 'Ein Fehler ist aufgetreten.'}
            </div>
          )}

          <form action="/api/auth/login" method="POST" className="space-y-5">
            {searchParams.token && (
              <input type="hidden" name="twoFactorToken" value={searchParams.token} />
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Authenticator-Code</label>
              <input
                name="twoFactorCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                required
                autoComplete="one-time-code"
                autoFocus
                className="flex h-16 w-full rounded-xl border border-input bg-background px-4 text-center text-3xl font-mono tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <Button type="submit" variant="gradient" className="w-full" size="lg">
              Bestätigen
            </Button>
          </form>

          <div className="mt-5 space-y-3 border-t border-border pt-5">
            <p className="text-center text-xs text-muted-foreground">
              Keinen Zugriff auf Ihre App?
            </p>

            {/* Backup code form */}
            <details className="group">
              <summary className="cursor-pointer text-center text-xs text-primary hover:underline list-none">
                Backup-Code verwenden
              </summary>
              <form action="/api/auth/login" method="POST" className="mt-3 space-y-3">
                {searchParams.token && (
                  <input type="hidden" name="twoFactorToken" value={searchParams.token} />
                )}
                <input
                  name="twoFactorCode"
                  type="text"
                  placeholder="XXXX-XXXX"
                  required
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 text-center font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" variant="outline" size="sm" className="w-full">
                  Backup-Code verwenden
                </Button>
              </form>
            </details>
          </div>

          <div className="mt-4 text-center">
            <Link href="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" />
              Zurück zur Anmeldung
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
