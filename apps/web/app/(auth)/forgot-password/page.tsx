// app/(auth)/forgot-password/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Passwort zurücksetzen' }

export default function ForgotPasswordPage({ searchParams }: { searchParams: { sent?: string } }) {
  if (searchParams.sent) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <Mail className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold">E-Mail verschickt</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen
          Link zum Zurücksetzen des Passworts geschickt.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Prüfen Sie auch Ihren Spam-Ordner. Der Link ist 1 Stunde gültig.
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück zur Anmeldung
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Passwort zurücksetzen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Geben Sie Ihre E-Mail-Adresse ein. Wir schicken Ihnen einen Reset-Link.
        </p>
      </div>

      <Card className="shadow-2xl shadow-black/10">
        <CardContent className="p-6">
          <form action="/api/auth/forgot-password" method="POST" className="space-y-4">
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

            <Button type="submit" variant="gradient" className="w-full" size="lg">
              <Mail className="h-4 w-4" />
              Reset-Link senden
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
