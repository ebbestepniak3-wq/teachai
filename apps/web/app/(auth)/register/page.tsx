// app/(auth)/register/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { UserPlus, ArrowLeft, Check } from 'lucide-react'

export const metadata: Metadata = { title: 'Registrieren' }

const BUNDESLAENDER = [
  'Baden-Württemberg','Bayern','Berlin','Brandenburg','Bremen','Hamburg',
  'Hessen','Mecklenburg-Vorpommern','Niedersachsen','Nordrhein-Westfalen',
  'Rheinland-Pfalz','Saarland','Sachsen','Sachsen-Anhalt','Schleswig-Holstein','Thüringen',
]

const SCHULFORMEN = [
  'Grundschule','Hauptschule','Realschule','Gesamtschule',
  'Gymnasium','Berufsschule','Förderschule','Sonstige',
]

const benefits = [
  '10 Bewertungen pro Monat kostenlos',
  'Kreditkarte nicht erforderlich',
  'DSGVO-konform & SSL-verschlüsselt',
  'EU-Server in Frankfurt',
]

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Konto erstellen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Starten Sie kostenlos. Keine Kreditkarte erforderlich.
        </p>
        {/* Benefits */}
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {benefits.map((b) => (
            <span key={b} className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-emerald-500" />
              {b}
            </span>
          ))}
        </div>
      </div>

      <Card className="shadow-2xl shadow-black/10">
        <CardContent className="p-6">
          {searchParams.error && (
            <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {searchParams.error === 'email_exists'
                ? 'Diese E-Mail-Adresse ist bereits registriert.'
                : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'}
            </div>
          )}

          <form action="/api/auth/register" method="POST" className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Vollständiger Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Max Mustermann"
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="max@schule-musterstadt.de"
                required
                autoComplete="email"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bundesland">Bundesland</Label>
                <select
                  id="bundesland"
                  name="bundesland"
                  required
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Bitte wählen</option>
                  {BUNDESLAENDER.map((bl) => (
                    <option key={bl} value={bl}>{bl}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="schulform">Schulform</Label>
                <select
                  id="schulform"
                  name="schulform"
                  required
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Bitte wählen</option>
                  {SCHULFORMEN.map((sf) => (
                    <option key={sf} value={sf}>{sf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Zahl"
                required
                autoComplete="new-password"
              />
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

            <div className="flex items-start gap-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                Ich stimme den{' '}
                <Link href="/nutzungsbedingungen" className="text-primary hover:underline">
                  Nutzungsbedingungen
                </Link>{' '}
                und der{' '}
                <Link href="/datenschutz" className="text-primary hover:underline">
                  Datenschutzerklärung
                </Link>{' '}
                zu. Ich bestätige, dass Schülerdaten nur für die Bewertung verwendet werden.
              </label>
            </div>

            <Button type="submit" variant="gradient" className="w-full" size="lg">
              <UserPlus className="h-4 w-4" />
              Kostenloses Konto erstellen
            </Button>
          </form>

          <Separator className="my-5" />

          <div className="text-center text-sm text-muted-foreground">
            Bereits ein Konto?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Anmelden
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
