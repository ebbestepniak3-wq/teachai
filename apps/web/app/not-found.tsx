// app/not-found.tsx – Phase 12: Premium 404
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GraduationCap, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <html lang="de"><body>
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 bg-background text-center">
      <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-radial from-brand-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand mb-8 animate-float">
          <GraduationCap className="h-10 w-10 text-white" />
        </div>

        <p className="text-8xl font-black gradient-text leading-none animate-scale-in">404</p>
        <h1 className="mt-4 text-2xl font-bold animate-fade-in">Seite nicht gefunden</h1>
        <p className="mt-3 text-muted-foreground max-w-sm animate-fade-in delay-100">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-slide-up delay-200">
          <Link href="/dashboard">
            <Button variant="gradient" size="lg"><Home className="h-5 w-5" />Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg"><ArrowLeft className="h-5 w-5" />Startseite</Button>
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-2 max-w-xs w-full animate-fade-in delay-300">
          {[
            { href: '/upload', label: '📤 Bewertung' },
            { href: '/grading/history', label: '📋 Verlauf' },
            { href: '/support', label: '💬 Support' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-border bg-card/50 px-3 py-2.5 text-xs text-center text-muted-foreground hover:text-foreground hover:border-brand-500/30 hover:bg-accent transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
    </body></html>
  )
}
