// app/(app)/settings/privacy/page.tsx
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Download, Trash2, Eye, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Datenschutz' }

export default async function PrivacyPage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: jwtUser.sub },
    select: {
      createdAt: true,
      emailVerified: true,
      _count: {
        select: { uploads: true, gradingJobs: true, sessions: true },
      },
    },
  })

  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      {/* Data overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Ihre gespeicherten Daten
          </CardTitle>
          <CardDescription>
            Übersicht aller Daten, die TeacherAI über Sie gespeichert hat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Konto erstellt', value: formatDate(user.createdAt) },
              { label: 'E-Mail-Status', value: user.emailVerified ? 'Verifiziert' : 'Nicht verifiziert' },
              { label: 'Hochgeladene Dateien', value: `${user._count.uploads} Dateien` },
              { label: 'Bewertungsaufträge', value: `${user._count.gradingJobs} Aufträge` },
              { label: 'Aktive Sitzungen', value: `${user._count.sessions} Sitzungen` },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-border p-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DSGVO rights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Ihre Datenschutzrechte (DSGVO)
          </CardTitle>
          <CardDescription>
            Als EU-Bürger haben Sie folgende Rechte bezüglich Ihrer Daten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              icon: Download,
              title: 'Daten exportieren (Art. 20)',
              desc: 'Alle Ihre Daten als JSON-Datei herunterladen.',
              action: 'Daten exportieren',
              variant: 'outline' as const,
            },
            {
              icon: FileText,
              title: 'Auskunft anfordern (Art. 15)',
              desc: 'Detaillierte Auskunft über alle gespeicherten Daten anfordern.',
              action: 'Auskunft anfordern',
              variant: 'outline' as const,
            },
            {
              icon: Trash2,
              title: 'Alle Daten löschen (Art. 17)',
              desc: 'Sämtliche personenbezogenen Daten dauerhaft und unwiderruflich löschen.',
              action: 'Löschantrag stellen',
              variant: 'destructive' as const,
            },
          ].map((right) => (
            <div key={right.title} className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <right.icon className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{right.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{right.desc}</p>
                </div>
              </div>
              <Button variant={right.variant} size="sm" className="shrink-0">
                {right.action}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Legal links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rechtliches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Datenschutzerklärung', href: '/datenschutz' },
            { label: 'Nutzungsbedingungen', href: '/nutzungsbedingungen' },
            { label: 'Cookie-Richtlinie', href: '/cookie-richtlinie' },
            { label: 'Auftragsverarbeitungsvertrag (AVV)', href: '#' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-xl border border-border p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {link.label}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Data retention info */}
      <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-brand-400">Datenschutzversprechen</p>
            <ul className="mt-2 space-y-1">
              {[
                'Alle Daten auf EU-Servern in Frankfurt (ISO 27001)',
                'Datenverschlüsselung in Transit und at Rest (AES-256)',
                'Automatische Löschung von Uploads nach Ablauf der Frist',
                'Keine Weitergabe an Dritte ohne Einwilligung',
                'Jährliche Datenschutz-Audits',
              ].map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
