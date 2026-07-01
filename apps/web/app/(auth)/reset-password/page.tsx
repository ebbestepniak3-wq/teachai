// app/(auth)/reset-password/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Key, ArrowLeft, AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Neues Passwort' }

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; error?: string }
}) {
  if (!searchParams.token) redirect('/forgot-password?error=missing_token')

  const errorMessages: Record<string, string> = {
    validation: 'Bitte prüfen Sie Ihre Eingaben.',
    mismatch: 'Passwörter stimmen nicht überein.',
    expired: 'Der Link ist abgelaufen. Bitte fordern Sie einen neuen an.',
    server: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl">
          <Key className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Neues Passwort</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Wählen Sie ein starkes neues Passwort für Ihr Konto.
        </p>
      </div>

      <Card className="shadow-2xl shadow-black/10">
        <CardContent className="p-6">
          {searchParams.error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {errorMessages[searchParams.error] || 'Ein Fehler ist aufgetreten.'}
            </div>
          )}

          <form action="/api/auth/reset-password" method="POST" className="space-y-4">
            <input type="hidden" name="token" value={searchParams.token} />

            <div className="space-y-1.5">
              <Label htmlFor="password">Neues Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mindestens 8 Zeichen, Großbuchstabe, Zahl"
                required
                autoComplete="new-password"
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Zahl
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" variant="gradient" className="w-full" size="lg">
              <Key className="h-4 w-4" />
              Passwort zurücksetzen
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Zurück zur Anmeldung
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
