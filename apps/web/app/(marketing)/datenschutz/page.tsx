// app/(marketing)/datenschutz/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung – TeacherAI',
  description: 'Datenschutzerklärung von TeacherAI gemäß DSGVO',
}

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-8">

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website:<br /><br />
            <strong className="text-foreground">TeacherAI GmbH</strong><br />
            Musterstraße 1<br />
            20095 Hamburg<br />
            Deutschland<br />
            E-Mail: datenschutz@teachai.de<br />
            Telefon: +49 40 123456789
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. Erhobene Daten & Zwecke</h2>
          <h3 className="text-base font-semibold text-foreground mb-2">2.1 Konto-Registrierung</h3>
          <p>Bei der Registrierung erheben wir: Name, E-Mail-Adresse, Bundesland, Schulform. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>
          <h3 className="text-base font-semibold text-foreground mb-2 mt-4">2.2 Hochgeladene Dateien</h3>
          <p>Hochgeladene Schülerarbeiten werden ausschließlich zur KI-Bewertung verarbeitet und nach Ablauf der plan-abhängigen Speicherfrist automatisch gelöscht (Free: 24h). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
          <h3 className="text-base font-semibold text-foreground mb-2 mt-4">2.3 KI-Verarbeitung</h3>
          <p>Texte aus hochgeladenen Arbeiten werden zur Bewertung an die Anthropic Claude API übertragen. Anthropic verarbeitet diese Daten als Auftragsverarbeiter (Art. 28 DSGVO). Es findet keine Profilerstellung von Schülerdaten statt.</p>
          <h3 className="text-base font-semibold text-foreground mb-2 mt-4">2.4 Zahlungsdaten</h3>
          <p>Zahlungen werden über Stripe verarbeitet. TeacherAI speichert keine Kreditkartendaten. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
          <h3 className="text-base font-semibold text-foreground mb-2 mt-4">2.5 Server-Logs</h3>
          <p>Sicherheits- und Fehler-Logs werden 90 Tage gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. Auftragsverarbeiter</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-semibold text-foreground">Dienstleister</th>
                <th className="text-left py-2 pr-4 font-semibold text-foreground">Zweck</th>
                <th className="text-left py-2 font-semibold text-foreground">Standort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['Anthropic PBC', 'KI-Textverarbeitung', 'USA (SCCs)'],
                ['Supabase Inc.', 'Datei-Speicherung', 'EU (Frankfurt)'],
                ['Stripe Inc.', 'Zahlungsabwicklung', 'USA (SCCs)'],
                ['Resend Inc.', 'E-Mail-Versand', 'EU'],
                ['Upstash Inc.', 'Cache/Queue', 'EU'],
              ].map(([name, purpose, location]) => (
                <tr key={name}>
                  <td className="py-2 pr-4 font-medium text-foreground">{name}</td>
                  <td className="py-2 pr-4">{purpose}</td>
                  <td className="py-2">{location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">4. Ihre Rechte</h2>
          <p>Sie haben folgende Rechte gemäß DSGVO:</p>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li><strong className="text-foreground">Auskunft</strong> (Art. 15): Welche Daten wir speichern</li>
            <li><strong className="text-foreground">Berichtigung</strong> (Art. 16): Falsche Daten korrigieren</li>
            <li><strong className="text-foreground">Löschung</strong> (Art. 17): Recht auf Vergessen</li>
            <li><strong className="text-foreground">Einschränkung</strong> (Art. 18): Verarbeitung begrenzen</li>
            <li><strong className="text-foreground">Datenübertragbarkeit</strong> (Art. 20): Daten exportieren</li>
            <li><strong className="text-foreground">Widerspruch</strong> (Art. 21): Gegen berechtigte Interessen</li>
          </ul>
          <p className="mt-4">Zur Ausübung Ihrer Rechte: datenschutz@teachai.de oder in Ihren <a href="/settings/privacy" className="text-primary hover:underline">Kontoeinstellungen</a>.</p>
          <p className="mt-2">Beschwerderecht bei der zuständigen Aufsichtsbehörde: Hamburgischer Beauftragter für Datenschutz und Informationsfreiheit (HmbBfDI).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">5. Datensicherheit</h2>
          <p>Alle Verbindungen sind TLS-verschlüsselt. Daten werden verschlüsselt auf EU-Servern gespeichert. Zugriff ist auf autorisierte Mitarbeiter beschränkt und wird vollständig protokolliert.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">6. Cookies</h2>
          <p>Wir verwenden ausschließlich technisch notwendige Cookies für die Authentifizierung (HttpOnly, Secure). Es werden keine Tracking- oder Marketing-Cookies gesetzt ohne Ihre Einwilligung.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">7. Kontakt</h2>
          <p>Bei Datenschutzfragen: datenschutz@teachai.de</p>
          <p className="mt-2 text-xs">Stand: {new Date().getFullYear()}. Letzte Aktualisierung: {new Date().toLocaleDateString('de-DE')}.</p>
        </section>

      </div>
    </div>
  )
}
