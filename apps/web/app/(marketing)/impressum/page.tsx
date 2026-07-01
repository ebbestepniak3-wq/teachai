// app/(marketing)/impressum/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Impressum – TeacherAI' }

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold mb-8">Impressum</h1>
      <div className="text-muted-foreground space-y-6 text-sm">
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Angaben gemäß § 5 TMG</h2>
          <address className="not-italic leading-relaxed">
            <strong className="text-foreground">TeacherAI GmbH</strong><br />
            Musterstraße 1<br />
            20095 Hamburg<br />
            Deutschland
          </address>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Kontakt</h2>
          <p>Telefon: +49 40 123456789<br />E-Mail: kontakt@teachai.de<br />Web: https://teachai.de</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Handelsregister</h2>
          <p>Registergericht: Amtsgericht Hamburg<br />Registernummer: HRB 123456</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Umsatzsteuer-ID</h2>
          <p>USt-IdNr.: DE123456789 (gemäß § 27a UStG)</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Geschäftsführung</h2>
          <p>Max Mustermann</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Verantwortlich für den Inhalt</h2>
          <p>Max Mustermann<br />TeacherAI GmbH<br />Musterstraße 1, 20095 Hamburg</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              https://ec.europa.eu/consumers/odr/
            </a><br /><br />
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Haftungsausschluss</h2>
          <p>
            Die KI-generierten Bewertungen sind Vorschläge und ersetzen keine pädagogische Fachkompetenz.
            Die endgültige Beurteilung liegt immer bei der Lehrkraft.
            TeacherAI übernimmt keine Haftung für Bewertungsentscheidungen auf Basis der KI-Vorschläge.
          </p>
        </section>
      </div>
    </div>
  )
}
