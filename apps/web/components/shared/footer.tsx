import Link from 'next/link'
import { GraduationCap, Twitter, Github, Linkedin, Mail } from 'lucide-react'

const LINKS = {
  Produkt: [
    { label: 'Funktionen', href: '/#funktionen' },
    { label: 'Preise', href: '/pricing' },
    { label: 'KI-Agenten', href: '/#funktionen' },
    { label: 'Demo', href: '/register' },
  ],
  Ressourcen: [
    { label: 'Dokumentation', href: '/api/swagger?format=ui' },
    { label: 'API-Referenz', href: '/api/swagger' },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/#faq' },
  ],
  Unternehmen: [
    { label: 'Über uns', href: '/about' },
    { label: 'Kontakt', href: '/kontakt' },
    { label: 'Datenschutz', href: '/datenschutz' },
    { label: 'Impressum', href: '/impressum' },
    { label: 'Nutzungsbedingungen', href: '/nutzungsbedingungen' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-black tracking-tight">TeacherAI</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Die KI-Bewertungsplattform für Lehrkräfte in Deutschland. 
              DSGVO-konform, transparent und für alle Schulformen.
            </p>
            <div className="flex gap-2 mt-5">
              {[
                { icon: Twitter, href: 'https://twitter.com/teachai_de', label: 'Twitter' },
                { icon: Linkedin, href: 'https://linkedin.com/company/teachai', label: 'LinkedIn' },
                { icon: Mail, href: 'mailto:kontakt@teachai.de', label: 'E-Mail' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:border-brand-500/40 hover:bg-brand-500/8 transition-all"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                {heading}
              </p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} TeacherAI GmbH · Hamburg · Alle Rechte vorbehalten</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Alle Systeme betriebsbereit
            </span>
            <span>·</span>
            <Link href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <span>·</span>
            <Link href="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
