// app/(marketing)/nutzungsbedingungen/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nutzungsbedingungen – TeacherAI' }

export default function NutzungsbedingungenPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold mb-8">Nutzungsbedingungen</h1>
      <p className="text-sm text-muted-foreground mb-8">Stand: {new Date().toLocaleDateString('de-DE')}</p>

      <div className="text-muted-foreground space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. Geltungsbereich</h2>
          <p>Diese Nutzungsbedingungen gelten für die Nutzung der TeacherAI-Plattform (teachai.de) der TeacherAI GmbH, Hamburg. Mit der Registrierung akzeptieren Sie diese Bedingungen.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. Leistungsbeschreibung</h2>
          <p>TeacherAI bietet KI-gestützte Unterstützung bei der Bewertung von Schülerarbeiten. Die KI-generierten Bewertungen sind <strong className="text-foreground">Vorschläge</strong> – die endgültige pädagogische Entscheidung liegt immer bei der Lehrkraft.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. Nutzungsvoraussetzungen</h2>
          <p>TeacherAI ist ausschließlich für Lehrkräfte bestimmt. Die Nutzung für andere Zwecke ist untersagt. Sie müssen mindestens 18 Jahre alt sein.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">4. Pflichten der Nutzer</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li>Hochgeladene Arbeiten dürfen nur aus Unterrichtszwecken verwendet werden</li>
            <li>Schülerdaten sind anonymisiert hochzuladen, soweit möglich</li>
            <li>Die Plattform darf nicht für ungesetzliche Zwecke genutzt werden</li>
            <li>Zugangsdaten sind vertraulich zu halten</li>
            <li>Keine automatisierten Zugriffe ohne ausdrückliche Erlaubnis</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">5. Abonnements & Zahlungen</h2>
          <p>Abonnements verlängern sich automatisch monatlich/jährlich. Kündigung ist jederzeit möglich – das Abo läuft bis zum Ende des bezahlten Zeitraums. Rückerstattungen nur bei nachgewiesenen technischen Defekten unsererseits.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">6. Datenschutz & KI-Verarbeitung</h2>
          <p>Mit dem Hochladen von Dateien willigen Sie ein, dass der enthaltene Text zur KI-Bewertung an unsere Dienstleister (Anthropic) übertragen wird. Schülerdaten werden nicht dauerhaft gespeichert oder für Training verwendet.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">7. Haftungsbeschränkung</h2>
          <p>TeacherAI haftet nicht für Bewertungsentscheidungen, die auf Basis unserer KI-Vorschläge getroffen werden. Die KI kann Fehler machen. Wir haften nicht für entgangene Gewinne oder mittelbare Schäden.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">8. Verfügbarkeit</h2>
          <p>Wir streben eine Verfügbarkeit von 99,5% an, garantieren aber keine ununterbrochene Verfügbarkeit. Wartungsarbeiten werden angekündigt, sofern planbar.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">9. Kündigung</h2>
          <p>Wir behalten uns das Recht vor, Konten bei Verstoß gegen diese Bedingungen zu sperren oder zu löschen. Nutzer können ihr Konto jederzeit selbst löschen.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">10. Anwendbares Recht</h2>
          <p>Es gilt deutsches Recht. Gerichtsstand ist Hamburg.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">11. Kontakt</h2>
          <p>Bei Fragen: legal@teachai.de · TeacherAI GmbH · Musterstraße 1 · 20095 Hamburg</p>
        </section>
      </div>
    </div>
  )
}
