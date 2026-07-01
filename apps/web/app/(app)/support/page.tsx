// app/(app)/support/page.tsx
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, Plus, MessageSquare, BookOpen, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Support' }

const ticketStatusConfig = {
  OPEN: { label: 'Offen', variant: 'warning' as const },
  IN_PROGRESS: { label: 'In Bearbeitung', variant: 'info' as const },
  CLOSED: { label: 'Geschlossen', variant: 'default' as const },
}

const faqItems = [
  { q: 'Wie lade ich eine Klassenarbeit hoch?', a: 'Gehen Sie zu "Hochladen" und ziehen Sie Ihre Datei in den Upload-Bereich.' },
  { q: 'Welche Dateiformate werden unterstützt?', a: 'PDF, DOCX, JPG, PNG, HEIC und WEBP werden unterstützt.' },
  { q: 'Wie lange dauert eine KI-Bewertung?', a: 'In der Regel 30–90 Sekunden, abhängig vom Umfang der Arbeit.' },
  { q: 'Sind meine Daten DSGVO-konform gespeichert?', a: 'Ja, alle Daten werden verschlüsselt auf EU-Servern in Frankfurt gespeichert.' },
]

export default async function SupportPage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: jwtUser.sub },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Wir helfen Ihnen gerne. Durchschnittliche Antwortzeit: 2–4 Stunden.
          </p>
        </div>
        <Button variant="gradient">
          <Plus className="h-4 w-4" />
          Neues Ticket
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: tickets + form */}
        <div className="lg:col-span-2 space-y-6">
          {/* New ticket form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Neues Ticket erstellen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Betreff</label>
                  <input
                    placeholder="Kurze Beschreibung des Problems..."
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Priorität</label>
                    <select className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="LOW">Niedrig</option>
                      <option value="MEDIUM" selected>Mittel</option>
                      <option value="HIGH">Hoch</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Beschreibung</label>
                  <textarea
                    rows={4}
                    placeholder="Beschreiben Sie Ihr Problem so detailliert wie möglich..."
                    className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button variant="gradient">Ticket absenden</Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ihre Tickets</CardTitle>
              <CardDescription>{tickets.length} Ticket{tickets.length !== 1 ? 's' : ''} insgesamt</CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <HelpCircle className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">Noch keine Tickets vorhanden.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => {
                    const status = ticketStatusConfig[ticket.status as keyof typeof ticketStatusConfig]
                    return (
                      <div
                        key={ticket.id}
                        className="flex items-start justify-between rounded-xl border border-border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ticket.subject}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Erstellt am {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                        <Badge variant={status.variant} className="ml-3 text-[10px] shrink-0">
                          {status.label}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: FAQ + resources */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Häufige Fragen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.q} className="space-y-1">
                  <p className="text-sm font-medium">{item.q}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold">Weitere Ressourcen</p>
              {[
                { label: 'Dokumentation', href: '#' },
                { label: 'Video-Tutorials', href: '#' },
                { label: 'Status-Seite', href: '#' },
              ].map((r) => (
                <a
                  key={r.label}
                  href={r.href}
                  className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {r.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'
