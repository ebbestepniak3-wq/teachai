// app/(marketing)/faq/page.tsx
import { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'

export const metadata: Metadata = { title: 'FAQ – Häufige Fragen' }

const faqCategories = [
  {
    category: 'Allgemein',
    faqs: [
      { q: 'Was ist TeacherAI?', a: 'TeacherAI ist eine KI-gestützte SaaS-Plattform für Lehrkräfte in Deutschland. Sie können Klassenarbeiten, Tests, Klausuren und andere Leistungsnachweise hochladen. Die KI analysiert die Arbeiten und erstellt einen transparenten Bewertungsvorschlag.' },
      { q: 'Für wen ist TeacherAI geeignet?', a: 'TeacherAI richtet sich ausschließlich an Lehrkräfte aller Schulformen und Klassenstufen in Deutschland. Von der Grundschule bis zum Gymnasium, von Mathe bis Deutsch.' },
    ],
  },
  {
    category: 'Datenschutz & Sicherheit',
    faqs: [
      { q: 'Ist TeacherAI DSGVO-konform?', a: 'Ja, vollständig. Alle Daten werden auf EU-Servern in Frankfurt verarbeitet und gespeichert. Wir schließen einen Auftragsverarbeitungsvertrag (AVV) ab. Free-Nutzer erhalten automatische Datenlöschung nach 24 Stunden.' },
      { q: 'Werden Schülerdaten gespeichert?', a: 'Nein, personenbezogene Schülerdaten werden nicht dauerhaft gespeichert. Der extrahierte Text wird nur zur Bewertung verwendet und anschließend gelöscht. Es findet keine Profilerstellung statt.' },
      { q: 'Ist die Verbindung verschlüsselt?', a: 'Ja. Alle Verbindungen nutzen HTTPS mit TLS-Verschlüsselung. Dateien werden verschlüsselt übertragen und gespeichert.' },
    ],
  },
  {
    category: 'Upload & Bewertung',
    faqs: [
      { q: 'Welche Dateiformate werden unterstützt?', a: 'PDF, DOCX, JPG, PNG, HEIC und WEBP. Auch mehrseitige Dokumente, Scans und handgeschriebene Texte werden unterstützt.' },
      { q: 'Wie gut funktioniert die Handschriftserkennung?', a: 'Sehr zuverlässig. Wir nutzen modernste OCR-Technologie mit automatischer Bildverbesserung. Sowohl Druckschrift als auch Kursivschrift werden erkannt.' },
      { q: 'Wie lange dauert eine Bewertung?', a: 'In der Regel 30–90 Sekunden, abhängig vom Umfang der Arbeit und der Auslastung des Systems.' },
      { q: 'Kann ich die KI-Bewertung ändern?', a: 'Ja, immer. Die endgültige Note liegt bei Ihnen. Die KI liefert einen transparenten Vorschlag mit Begründungen, den Sie vollständig übernehmen, anpassen oder ablehnen können.' },
    ],
  },
  {
    category: 'Abonnement & Zahlung',
    faqs: [
      { q: 'Wie kann ich upgraden?', a: 'Im Bereich Einstellungen → Abonnement können Sie jederzeit upgraden. Die Zahlung erfolgt monatlich über Stripe.' },
      { q: 'Kann ich jederzeit kündigen?', a: 'Ja. Sie können jederzeit ohne Angabe von Gründen kündigen. Ihr Abo läuft bis zum Ende des bezahlten Zeitraums weiter.' },
      { q: 'Welche Zahlungsmethoden werden akzeptiert?', a: 'Alle gängigen Kreditkarten (Visa, Mastercard, American Express), SEPA-Lastschrift und SOFORT-Überweisung über Stripe.' },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-16">
          <Badge variant="brand" className="mb-4">FAQ</Badge>
          <h1 className="text-5xl font-bold tracking-tight">Häufige Fragen</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Alles, was Sie über TeacherAI wissen müssen.
          </p>
        </div>

        <div className="space-y-12">
          {faqCategories.map((cat) => (
            <div key={cat.category}>
              <h2 className="mb-6 text-lg font-bold border-b border-border pb-3">{cat.category}</h2>
              <div className="space-y-4">
                {cat.faqs.map((faq) => (
                  <div key={faq.q} className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-semibold">{faq.q}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-16 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center">
          <MessageSquare className="h-10 w-10 text-brand-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold">Noch Fragen?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Unser Support-Team hilft Ihnen gerne weiter.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/register">
              <Button variant="gradient">Kostenlos testen</Button>
            </Link>
            <Link href="mailto:support@teachai.de">
              <Button variant="outline">Support kontaktieren</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
