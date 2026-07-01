// app/(auth)/verify-email/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'E-Mail bestätigen' }

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string; verified?: string; resend?: string }
}) {
  if (searchParams.verified) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold">E-Mail bestätigt!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ihr Konto wurde erfolgreich verifiziert.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block">
          <Button variant="gradient" size="lg">Zum Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 animate-pulse_slow">
        <Mail className="h-8 w-8 text-brand-400" />
      </div>
      <h1 className="text-2xl font-bold">E-Mail bestätigen</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Wir haben eine Bestätigungs-E-Mail an{' '}
        <strong className="text-foreground">{searchParams.email || 'Ihre E-Mail-Adresse'}</strong>{' '}
        geschickt.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
        Prüfen Sie auch Ihren Spam-Ordner.
      </p>
      <div className="mt-8 space-y-3">
        <Button variant="outline" className="w-full">
          <Mail className="h-4 w-4" />
          E-Mail erneut senden
        </Button>
        <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground">
          Zurück zur Anmeldung
        </Link>
      </div>
    </div>
  )
}
