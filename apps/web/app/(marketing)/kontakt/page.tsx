// app/(marketing)/kontakt/page.tsx
import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, MessageSquare, Phone, Clock, MapPin, Send } from 'lucide-react'
import { generateSeoMetadata } from '@/components/seo/meta'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Kontakt – TeacherAI',
  description: 'Kontaktieren Sie das TeacherAI-Team. Wir helfen Ihnen bei Fragen zur Plattform, zu Abonnements und technischem Support.',
  path: '/kontakt',
})

export default function KontaktPage() {
  return (
    <div className="py-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight">Kontakt</h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Fragen, Feedback oder Support? Wir helfen Ihnen gerne.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Nachricht senden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Max Mustermann" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input id="email" type="email" placeholder="max@schule.de" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subject">Betreff</Label>
                  <select
                    id="subject"
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="general">Allgemeine Anfrage</option>
                    <option value="support">Technischer Support</option>
                    <option value="billing">Abonnement & Zahlung</option>
                    <option value="datenschutz">Datenschutz / DSGVO</option>
                    <option value="feedback">Feedback & Verbesserungen</option>
                    <option value="partnership">Partnerschaft / B2B</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Nachricht</Label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Beschreiben Sie Ihr Anliegen..."
                    required
                    className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <Button variant="gradient" type="submit" size="lg" className="w-full">
                  <Send className="h-5 w-5" />
                  Nachricht senden
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Mit dem Absenden stimmen Sie unserer{' '}
                  <a href="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</a> zu.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Contact info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Kontaktinformationen</h2>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: 'E-Mail Support', value: 'support@teachai.de', href: 'mailto:support@teachai.de' },
                  { icon: Mail, label: 'Allgemein', value: 'kontakt@teachai.de', href: 'mailto:kontakt@teachai.de' },
                  { icon: Mail, label: 'Datenschutz', value: 'datenschutz@teachai.de', href: 'mailto:datenschutz@teachai.de' },
                  { icon: MapPin, label: 'Adresse', value: 'TeacherAI GmbH · Musterstraße 1 · 20095 Hamburg', href: null },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-xl border border-border p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                      <item.icon className="h-4.5 w-4.5 text-brand-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-medium text-primary hover:underline">{item.value}</a>
                      ) : (
                        <p className="text-sm font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Reaktionszeiten</h2>
              <div className="space-y-3">
                {[
                  { plan: 'Free & Basic', time: 'Innerhalb von 3 Werktagen' },
                  { plan: 'Pro', time: 'Innerhalb von 24 Stunden' },
                  { plan: 'Max Pro', time: 'Prioritäts-Support, < 4 Stunden' },
                ].map((item) => (
                  <div key={item.plan} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.plan}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ hint */}
            <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5">
              <p className="text-sm font-semibold text-brand-400 mb-1">💡 FAQ zuerst checken</p>
              <p className="text-sm text-muted-foreground mb-3">
                Viele Fragen werden bereits in unserem FAQ beantwortet.
              </p>
              <a href="/faq">
                <Button variant="outline" size="sm" className="border-brand-500/30 text-brand-400">
                  Zu den häufigen Fragen
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
