// app/(marketing)/page.tsx – Phase 12: Premium Landing Page
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles, ArrowRight, Check, Upload, FileText, Brain, Shield,
  Clock, Star, ChevronDown, Zap, Rocket, Crown, GraduationCap,
  Users, TrendingUp, Lock, Globe, ChevronRight, Play,
  CheckCircle, BookOpen, Award, BarChart3, MessageSquare,
} from 'lucide-react'
import { PLAN_CONFIGS } from '@teachai/types'
import { JsonLd, softwareApplicationSchema, faqSchema } from '@/components/seo/meta'

/* ── Data ─────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Upload,
    title: 'Jedes Format, jede Handschrift',
    desc: 'PDF, Word, Fotos, Scans – unsere KI erkennt selbst unleserliche Handschriften mit Claude Vision.',
    gradient: 'from-blue-500 to-cyan-400',
    stat: '98%',
    statLabel: 'OCR-Genauigkeit',
  },
  {
    icon: Brain,
    title: 'Intelligente Bewertung',
    desc: 'Teilpunkte, alternative Lösungswege, Begründungen – transparent und nachvollziehbar wie ein Fachkollege.',
    gradient: 'from-brand-500 to-purple-500',
    stat: '60s',
    statLabel: 'Ø Bewertungszeit',
  },
  {
    icon: FileText,
    title: 'Professionelle Berichte',
    desc: 'Automatische PDF-Reports mit Stärken, Schwächen, Feedback und Verbesserungsvorschlägen.',
    gradient: 'from-emerald-500 to-teal-400',
    stat: '100%',
    statLabel: 'DSGVO-konform',
  },
  {
    icon: Shield,
    title: 'Datenschutz by Design',
    desc: 'EU-Server, DSGVO-nativ, Schülerdaten werden nicht für KI-Training verwendet.',
    gradient: 'from-amber-500 to-orange-400',
    stat: 'EU',
    statLabel: 'Frankfurt Server',
  },
  {
    icon: BarChart3,
    title: 'Klassen-Statistiken',
    desc: 'Notenverteilung, Lernfortschritt, Handlungsempfehlungen – auf einen Blick.',
    gradient: 'from-pink-500 to-rose-400',
    stat: 'Pro',
    statLabel: 'ab Pro-Plan',
  },
  {
    icon: MessageSquare,
    title: 'KI-Assistent',
    desc: 'Elternbriefe, Klausuren, Arbeitsblätter, Zeugnisbemerkungen – der Assistent der alles kann.',
    gradient: 'from-violet-500 to-indigo-400',
    stat: '12+',
    statLabel: 'Aufgabentypen',
  },
]

const STEPS = [
  { icon: Upload,   num: '01', title: 'Hochladen',  desc: 'Foto, Scan oder Datei per Drag & Drop – jedes Format wird akzeptiert.' },
  { icon: Brain,    num: '02', title: 'KI bewertet',desc: 'Claude analysiert in ~60 Sekunden mit Teilpunkten und Begründungen.' },
  { icon: CheckCircle, num: '03', title: 'Prüfen & Anpassen', desc: 'Punkte korrigieren, Kommentare ergänzen, Note bestätigen.' },
  { icon: FileText, num: '04', title: 'PDF-Bericht', desc: 'Professioneller Bericht auf Knopfdruck – fertig zum Drucken.' },
]

const TESTIMONIALS = [
  {
    name: 'Dr. Monika S.',
    role: 'Deutschlehrerin, Gymnasium Bayern',
    text: 'TeacherAI spart mir jede Woche 5–6 Stunden. Die KI-Bewertungen sind erstaunlich fair und gut begründet.',
    avatar: 'MS',
    stars: 5,
  },
  {
    name: 'Thomas W.',
    role: 'Mathematiklehrer, Realschule NRW',
    text: 'Endlich versteht die KI Rechenwege! Auch Teilpunkte und alternative Lösungen werden korrekt bewertet.',
    avatar: 'TW',
    stars: 5,
  },
  {
    name: 'Julia K.',
    role: 'Englischlehrerin, Gesamtschule Hamburg',
    text: 'Das Feedback ist so strukturiert, dass ich es direkt an Schüler weitergeben kann. Absolute Zeitersparnis.',
    avatar: 'JK',
    stars: 5,
  },
]

const FAQS = [
  {
    question: 'Ist TeacherAI DSGVO-konform?',
    answer: 'Ja, vollständig. Alle Daten werden auf EU-Servern in Frankfurt verarbeitet. Schülerdaten werden nicht für KI-Training verwendet. Wir haben AVVs mit allen Auftragsverarbeitern (Anthropic, Supabase, Stripe).',
  },
  {
    question: 'Welche Fächer werden unterstützt?',
    answer: 'TeacherAI unterstützt alle Hauptfächer: Deutsch, Mathematik, Englisch, Französisch, Latein, Physik, Chemie, Biologie, Geschichte, Geographie und mehr. Die Architektur erlaubt einfache Erweiterung.',
  },
  {
    question: 'Kann ich die KI-Bewertung korrigieren?',
    answer: 'Absolut – das ist gewollt! Die KI macht einen Vorschlag, Sie prüfen und bestätigen. Jede Änderung wird protokolliert. Die Verantwortung liegt immer bei der Lehrkraft.',
  },
  {
    question: 'Funktioniert OCR auch bei Handschrift?',
    answer: 'Ja, mit hoher Genauigkeit. Claude Vision ist spezialisiert auf schulische Handschriften. Bei unleserlichen Stellen markiert die KI Unsicherheiten transparent.',
  },
  {
    question: 'Gibt es eine kostenlose Version?',
    answer: 'Ja! Der Free-Plan ist dauerhaft kostenlos mit 10 Bewertungen pro Monat – ohne Kreditkarte. Kostenpflichtige Pläne starten ab 7,99 €/Monat.',
  },
  {
    question: 'Welche Dateiformate werden unterstützt?',
    answer: 'PDF, Word (DOCX), OpenDocument (ODT), JPG, PNG, WebP, HEIC und TIFF. Mehrseitige Dokumente werden automatisch verarbeitet.',
  },
]

const PLAN_DISPLAY = [
  { key: 'FREE', name: 'Free', price: '0', icon: Zap, gradient: 'from-slate-500 to-slate-600', popular: false },
  { key: 'BASIC', name: 'Basic', price: '7,99', icon: Sparkles, gradient: 'from-blue-500 to-blue-600', popular: false },
  { key: 'PRO', name: 'Pro', price: '12,99', icon: Rocket, gradient: 'from-brand-500 to-brand-700', popular: true },
  { key: 'MAX_PRO', name: 'Max Pro', price: '19,99', icon: Crown, gradient: 'from-amber-500 to-orange-500', popular: false },
]

const STATS = [
  { value: '850K+', label: 'Lehrkräfte in Deutschland' },
  { value: '30+', label: 'Stunden/Monat gespart' },
  { value: '16', label: 'Bundesländer unterstützt' },
  { value: '100%', label: 'EU-Datenschutz' },
]

/* ── Component ────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <JsonLd schema={softwareApplicationSchema()} />
      <JsonLd schema={faqSchema(FAQS)} />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
        {/* Background effects */}
        <div className="absolute inset-0 gradient-bg" />
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/8 px-4 py-1.5 mb-8 animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-brand-400">KI-Bewertung für deutsche Lehrkräfte</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] animate-slide-up">
            Korrekturen in{' '}
            <span className="gradient-text">Minuten</span>
            <br />
            statt Stunden.
          </h1>

          <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-slide-up delay-100">
            Die KI bewertet – die Lehrkraft entscheidet.
            Transparent, DSGVO-konform, für alle 16 Bundesländer.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center animate-slide-up delay-200">
            <Link href="/register">
              <Button variant="gradient" size="xl" className="glow-brand group">
                Kostenlos starten
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#wie-es-funktioniert">
              <Button variant="outline" size="xl" className="group">
                <Play className="h-4 w-4" />
                Wie es funktioniert
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted-foreground animate-fade-in delay-300">
            Kostenlos · Keine Kreditkarte · 10 Bewertungen/Monat inklusive
          </p>

          {/* Hero stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-slide-up delay-300">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4">
                <p className="text-2xl font-black gradient-text">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Hero mockup placeholder */}
          <div className="mt-16 mx-auto max-w-4xl animate-scale-in delay-400">
            <div className="relative rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-1 shadow-xl shadow-black/20">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border">
                {['bg-red-400', 'bg-yellow-400', 'bg-green-400'].map((c) => (
                  <div key={c} className={`w-3 h-3 rounded-full ${c}`} />
                ))}
                <div className="flex-1 mx-4 rounded-lg bg-muted/50 h-6" />
              </div>
              <div className="p-6 space-y-3">
                <div className="flex gap-4">
                  <div className="w-1/3 space-y-2">
                    <div className="h-32 rounded-xl bg-gradient-to-br from-brand-500/10 to-purple-500/10 border border-brand-500/20 flex items-center justify-center">
                      <GraduationCap className="h-10 w-10 text-brand-400/60" />
                    </div>
                    <div className="h-4 rounded bg-muted/50 w-3/4" />
                    <div className="h-3 rounded bg-muted/30 w-1/2" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-5 rounded bg-muted/50 w-32" />
                      <Badge variant="success" className="text-[10px]">✓ KI-Bewertung fertig</Badge>
                    </div>
                    {[
                      { name: 'Aufgabe 1', pts: 8, max: 10, pct: 80 },
                      { name: 'Aufgabe 2', pts: 7, max: 10, pct: 70 },
                      { name: 'Aufgabe 3', pts: 9, max: 10, pct: 90 },
                    ].map((a) => (
                      <div key={a.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-medium">{a.name}</span>
                          <span className="font-bold">{a.pts}/{a.max}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                            style={{ width: `${a.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-500/10 to-purple-500/5 border border-brand-500/20 px-4 py-3 mt-2">
                      <span className="text-sm font-semibold">Vorgeschlagene Note</span>
                      <span className="text-2xl font-black gradient-text">2+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ──────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20 py-5">
        <div className="mx-auto max-w-5xl px-6 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          {[
            { icon: Shield, text: 'DSGVO-konform' },
            { icon: Globe, text: 'EU-Server Frankfurt' },
            { icon: Lock, text: 'Ende-zu-Ende verschlüsselt' },
            { icon: GraduationCap, text: 'Für alle Schulformen' },
            { icon: Star, text: '4,8 / 5 Bewertung' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5">
              <item.icon className="h-4 w-4 text-brand-400" />
              <span className="font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section id="funktionen" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <Badge variant="brand" className="mb-4">Funktionen</Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Alles was Lehrkräfte brauchen
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Von der Handschrifterkennung bis zum PDF-Bericht – vollständig automatisiert.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-3xl border border-border bg-card p-6 card-hover overflow-hidden"
              >
                {/* Hover gradient */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-brand-500/3 to-purple-500/3" />

                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} shadow-lg mb-5`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>

                <div className="mt-5 flex items-center gap-2">
                  <div className="rounded-xl bg-muted/50 px-3 py-1.5">
                    <span className="text-xl font-black gradient-text">{f.stat}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">{f.statLabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section id="wie-es-funktioniert" className="py-24 md:py-32 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <Badge variant="brand" className="mb-4">So funktioniert's</Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              In 4 Schritten fertig
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
              Von der Schülerarbeit zum professionellen Bericht in unter zwei Minuten.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-brand-500/30 to-transparent z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="relative inline-flex mb-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-brand-500 text-[10px] font-black text-brand-400">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/register">
              <Button variant="gradient" size="lg" className="glow-brand">
                Jetzt kostenlos testen
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <Badge variant="brand" className="mb-4">Stimmen</Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Was Lehrkräfte sagen
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3 stagger">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-3xl border border-border bg-card p-6 card-hover">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-foreground/90 mb-5">
                  „{t.text}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <section id="preise" className="py-24 md:py-32 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <Badge variant="brand" className="mb-4">Preise</Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Einfach und transparent
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              7 Tage kostenlos testen · Jederzeit kündbar · Keine versteckten Kosten
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PLAN_DISPLAY.map((plan) => {
              const config = PLAN_CONFIGS[plan.key as keyof typeof PLAN_CONFIGS]
              const Icon = plan.icon
              return (
                <div
                  key={plan.key}
                  className={`relative rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular
                      ? 'border-brand-500/40 bg-gradient-to-b from-brand-500/8 to-transparent shadow-brand'
                      : 'border-border bg-card card-hover'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge variant="brand" className="shadow-brand text-[11px] px-3">
                        ⭐ Beliebtester Plan
                      </Badge>
                    </div>
                  )}

                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${plan.gradient} shadow-md mb-5`}>
                    <Icon className="h-5.5 w-5.5 text-white" />
                  </div>

                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="mt-2 mb-5">
                    {plan.price === '0' ? (
                      <span className="text-3xl font-black">Kostenlos</span>
                    ) : (
                      <>
                        <span className="text-3xl font-black">{plan.price} €</span>
                        <span className="text-sm text-muted-foreground">/Monat</span>
                      </>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {config.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/register" className="block">
                    <Button
                      variant={plan.popular ? 'gradient' : 'outline'}
                      size="sm"
                      className="w-full"
                    >
                      {plan.price === '0' ? 'Kostenlos starten' : '7 Tage testen'}
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Alle Preise inkl. MwSt. · Jährliche Zahlung spart 20% ·{' '}
            <Link href="/pricing" className="text-primary hover:underline">Preise vergleichen →</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-14">
            <Badge variant="brand" className="mb-4">FAQ</Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Häufige Fragen
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-border bg-card overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 font-semibold text-sm hover:bg-accent/50 transition-colors list-none">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">Weitere Fragen?</p>
            <Link href="/kontakt">
              <Button variant="outline">Kontakt aufnehmen <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-12 md:p-16 text-center text-white shadow-brand-lg">
            {/* Background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

            <div className="relative">
              <Badge className="mb-6 border-white/20 bg-white/15 text-white text-xs">
                🎉 Kostenlos starten – keine Kreditkarte nötig
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Bereit, Zeit zu sparen?
              </h2>
              <p className="text-lg text-white/80 max-w-lg mx-auto mb-8">
                Schließen Sie sich tausenden Lehrkräften an, die TeacherAI täglich nutzen.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <Button
                    size="xl"
                    className="bg-white text-brand-700 hover:bg-white/90 hover:text-brand-800 shadow-xl font-bold"
                  >
                    Jetzt kostenlos starten
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="xl" variant="glass">
                    Bereits registriert? Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
