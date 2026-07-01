// app/(auth)/login/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { LogIn, ArrowRight, GraduationCap } from 'lucide-react'

export const metadata: Metadata = { title: 'Anmelden' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string }
}) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-500/25">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Willkommen zurück</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Melden Sie sich bei Ihrem TeacherAI-Konto an.
        </p>
      </div>

      <Card className="shadow-2xl shadow-black/10">
        <CardContent className="p-6">
          {searchParams.error && (
            <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {searchParams.error === 'invalid_credentials'
                ? 'Ungültige E-Mail-Adresse oder falsches Passwort.'
                : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'}
            </div>
          )}

          <form action="/api/auth/login" method="POST" className="space-y-4">
            {searchParams.redirect && (
              <input type="hidden" name="redirect" value={searchParams.redirect} />
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="max.mustermann@schule.de"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Passwort vergessen?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <label htmlFor="remember" className="text-xs text-muted-foreground">
                Angemeldet bleiben
              </label>
            </div>

            <Button type="submit" variant="gradient" className="w-full" size="lg">
              <LogIn className="h-4 w-4" />
              Anmelden
            </Button>
          </form>

          <Separator className="my-5" />

          <div className="text-center text-sm text-muted-foreground">
            Noch kein Konto?{' '}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Kostenlos registrieren
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Mit der Anmeldung stimmen Sie unseren{' '}
        <Link href="/nutzungsbedingungen" className="hover:underline">Nutzungsbedingungen</Link>{' '}
        und der{' '}
        <Link href="/datenschutz" className="hover:underline">Datenschutzerklärung</Link>{' '}
        zu.
      </p>
    </div>
  )
}
