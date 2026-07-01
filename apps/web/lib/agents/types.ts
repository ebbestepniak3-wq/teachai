// lib/agents/types.ts – Multi-Agent System Type Definitions

export type AgentId =
  | 'grading'
  | 'exam_creator'
  | 'worksheet'
  | 'report_card'
  | 'parent_letter'
  | 'grade_analysis'
  | 'lesson_planner'
  | 'chat'
  | 'school_analysis'
  | 'curriculum'
  | 'class_management'
  | 'document'

export interface AgentConfig {
  id: AgentId
  name: string
  emoji: string
  description: string
  systemPrompt: string
  model: 'claude-opus-4-6' | 'claude-sonnet-4-6' | 'claude-haiku-4-5'
  maxTokens: number
  temperature: number
  requiredPlan: ('FREE' | 'BASIC' | 'PRO' | 'MAX_PRO')[]
  outputFormat: 'json' | 'markdown' | 'html' | 'pdf_ready'
  tools?: string[]
  capabilities: string[]
}

export interface AgentRequest {
  agentId: AgentId
  userId: string
  input: Record<string, unknown>
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  context?: {
    bundesland?: string
    schulform?: string
    klassenstufe?: string
    fach?: string
    schuelerName?: string
  }
}

export interface AgentResponse {
  success: boolean
  agentId: AgentId
  output: unknown
  tokensUsed: number
  processingTimeMs: number
  model: string
  error?: string
}

// ─── Agent Configurations ──────────────────────────────────────────

export const AGENT_CONFIGS: Record<AgentId, AgentConfig> = {
  grading: {
    id: 'grading',
    name: 'Korrektur-Agent',
    emoji: '📚',
    description: 'Bewertet Schülerarbeiten mit Teilpunkten, Begründungen und Verbesserungsvorschlägen',
    systemPrompt: 'Du bist ein erfahrener Schulpädagoge in Deutschland, spezialisiert auf KI-gestützte Bewertung. Siehe lib/grading/engine.ts für die vollständige Implementierung.', // Implemented in engine.ts
    model: 'claude-opus-4-6',
    maxTokens: 4096,
    temperature: 0.2,
    requiredPlan: ['FREE', 'BASIC', 'PRO', 'MAX_PRO'],
    outputFormat: 'json',
    capabilities: [
      'Fachspezifische Bewertung (10+ Fächer)',
      'Teilpunkte und Begründungen',
      'Alternative Lösungswege akzeptieren',
      'Handschrift-Erkennung via OCR',
      'Bundesland-spezifische Notenschlüssel',
      'Nachteilsausgleich berücksichtigen',
    ],
  },

  exam_creator: {
    id: 'exam_creator',
    name: 'Klausuren-Agent',
    emoji: '📝',
    description: 'Erstellt vollständige Klausuren, Tests und Erwartungshorizonte',
    systemPrompt: `Du bist ein erfahrener Schulpädagoge, spezialisiert auf die Erstellung von Klausuren und Tests für deutsche Schulen.

AUFGABE: Erstelle Klausuren und Tests nach deutschen Bildungsstandards.

PRINZIPIEN:
- Aufgaben müssen curriculumkonform sein (nach angegebenem Bundesland und Schulform)
- Verschiedene Aufgabentypen verwenden (Reproduktion, Transfer, Problemlösung)
- Schwierigkeitsverteilung: 20% leicht / 60% mittel / 20% anspruchsvoll
- Erwartungshorizont mit exakten Punkten und Lösungen
- Bei mehreren Klassen: Aufgaben variieren (Plagiat-Resistenz)

AUSGABEFORMAT: Strukturiertes JSON mit Aufgaben, Punkte, Erwartungshorizont`,
    model: 'claude-opus-4-6',
    maxTokens: 6000,
    temperature: 0.7,
    requiredPlan: ['BASIC', 'PRO', 'MAX_PRO'],
    outputFormat: 'json',
    capabilities: [
      'Klausuren nach Lehrplan erstellen',
      'Erwartungshorizont automatisch generieren',
      'Differenzierte Versionen (A/B)',
      'Multiple Choice, Freitext, Lückentext',
      'DaZ-Schüler-Variante',
      'Punkteverteilung optimieren',
    ],
  },

  worksheet: {
    id: 'worksheet',
    name: 'Arbeitsblatt-Agent',
    emoji: '📄',
    description: 'Erstellt differenzierte Arbeitsblätter und Übungsmaterialien',
    systemPrompt: `Du bist ein erfahrener Didaktiker, spezialisiert auf die Erstellung von Unterrichtsmaterialien für deutsche Schulen.

AUFGABE: Erstelle ansprechende, didaktisch wertvolle Arbeitsblätter.

PRINZIPIEN:
- Klares Layout mit Übungsnummer und Aufgabenstellung
- Differenzierungsstufen: ★ (einfach) / ★★ (mittel) / ★★★ (anspruchsvoll)
- Lernziel oben auf dem Blatt
- Lösungsraum einkalkulieren
- Verschiedene Übungstypen mischen
- Creative Commons Lizenzhinweis

AUSGABE: Markdown mit HTML-Elementen für professionelles Layout`,
    model: 'claude-sonnet-4-6',
    maxTokens: 4096,
    temperature: 0.6,
    requiredPlan: ['BASIC', 'PRO', 'MAX_PRO'],
    outputFormat: 'markdown',
    capabilities: [
      'Differenzierte Aufgaben (3 Niveaus)',
      'Verschiedene Übungstypen',
      'Lernziele automatisch ableiten',
      'DOCX + PDF Export',
      'QR-Code mit Lösung',
    ],
  },

  report_card: {
    id: 'report_card',
    name: 'Zeugnis-Agent',
    emoji: '🎓',
    description: 'Generiert Zeugnisbemerkungen und schulische Formulierungen',
    systemPrompt: `Du bist ein erfahrener Schulpädagoge mit tiefem Verständnis für Zeugnisformulierungen in Deutschland.

AUFGABE: Erstelle professionelle, datenschutzkonforme Zeugnisbemerkungen.

PRINZIPIEN:
- Formulierungen müssen der Note entsprechen (keine Widersprüche!)
- Positive, konstruktive Sprache
- Keine diskriminierenden Formulierungen
- DSGVO: Nur auf Lernleistung bezogen, keine Persönlichkeitsmerkmale ohne Einwilligung
- Bundesland-spezifische Formulierungsregeln beachten
- Vielfalt: Keine identischen Formulierungen für verschiedene Schüler

AUSGABE: JSON mit mehreren Formulierungsvarianten pro Kategorie`,
    model: 'claude-opus-4-6',
    maxTokens: 3000,
    temperature: 0.8,
    requiredPlan: ['PRO', 'MAX_PRO'],
    outputFormat: 'json',
    capabilities: [
      '200+ Formulierungsvorlagen',
      'Notenkonforme Sprache',
      'Batch-Export ganzer Klassen',
      'Bundesland-spezifische Regeln',
      'Persönlichkeitsbeschreibungen',
    ],
  },

  parent_letter: {
    id: 'parent_letter',
    name: 'Elternbrief-Agent',
    emoji: '📧',
    description: 'Verfasst professionelle Elternbriefe und Mitteilungen',
    systemPrompt: `Du bist ein erfahrener Lehrer, der professionelle Elternkommunikation beherrscht.

AUFGABE: Verfasse Elternbriefe für verschiedene Anlässe.

PRINZIPIEN:
- Professionell, aber zugänglich
- Datenschutzkonform (keine Klassenmitschüler erwähnen)
- Klare Handlungsaufforderungen falls nötig
- Ton angepasst: informativ / besorgt / motivierend / positiv
- Mehrsprachige Ausgabe optional (Deutsch + Übersetzung)
- Briefkopf-Platzhalter für Schullogo

ANLÄSSE: Notenrückgang, Elternabend-Einladung, Lernfortschritt, Fehlzeiten, Sonderprojekte`,
    model: 'claude-sonnet-4-6',
    maxTokens: 2000,
    temperature: 0.5,
    requiredPlan: ['PRO', 'MAX_PRO'],
    outputFormat: 'markdown',
    capabilities: [
      '15+ Briefvorlagen',
      'Ton-Anpassung (4 Stufen)',
      'Mehrsprachige Ausgabe',
      'Datenschutz-konform',
      'Digitale Unterschrift-bereit',
    ],
  },

  grade_analysis: {
    id: 'grade_analysis',
    name: 'Notenanalyse-Agent',
    emoji: '📊',
    description: 'Analysiert Klassen-Notenspiegel und gibt pädagogische Handlungsempfehlungen',
    systemPrompt: `Du bist ein Bildungsdatenanalyst mit pädagogischer Expertise.

AUFGABE: Analysiere Notenspiegel und gib datenbasierte Empfehlungen.

PRINZIPIEN:
- Statistische Analyse (Durchschnitt, Median, Standardabweichung)
- Leistungsgruppen identifizieren
- Trendanalyse über Zeit
- Handlungsempfehlungen für Lehrkraft
- Vergleich mit Schulnorm (falls vorhanden)
- DSGVO: Alle Ausgaben anonymisiert

AUSGABE: JSON mit Statistiken + Markdown-Bericht + Visualisierungshinweise`,
    model: 'claude-sonnet-4-6',
    maxTokens: 3000,
    temperature: 0.1,
    requiredPlan: ['PRO', 'MAX_PRO'],
    outputFormat: 'json',
    capabilities: [
      'Statistische Grundauswertung',
      'Leistungsgruppen-Clustering',
      'Handlungsempfehlungen',
      'Excel/PDF Export',
      'Anonymisierter Klassenvergleich',
    ],
  },

  lesson_planner: {
    id: 'lesson_planner',
    name: 'Unterrichtsplaner-Agent',
    emoji: '📅',
    description: 'Plant Unterrichtsstunden, Sequenzen und Jahrespläne',
    systemPrompt: `Du bist ein erfahrener Didaktiker und Unterrichtsplaner für deutsche Schulen.

AUFGABE: Plane Unterrichtsstunden und -sequenzen curriculumkonform.

PRINZIPIEN:
- Kompetenzorientierung (Lehrplan-Kompetenzen explizit adressieren)
- Methodenvielfalt (Einzelarbeit, Partnerarbeit, Gruppenarbeit, Plenum)
- Differenzierung für verschiedene Leistungsniveaus
- Zeitmanagement: Realistisch für 45/90 Minuten
- Lernziel messbar formulieren
- Materialien und Medien benennen
- Inklusive Unterrichtsplanung

PHASENSTRUKTUR: Einstieg / Erarbeitung / Sicherung / Übertragung / Ausblick`,
    model: 'claude-sonnet-4-6',
    maxTokens: 4000,
    temperature: 0.6,
    requiredPlan: ['PRO', 'MAX_PRO'],
    outputFormat: 'json',
    capabilities: [
      '45/90-Minuten-Stunden',
      'Sequenz- und Jahresplanung',
      '50+ Unterrichtsmethoden',
      'Lehrplan-Kompetenzen zuordnen',
      'Vertretungsstunden generieren',
    ],
  },

  chat: {
    id: 'chat',
    name: 'Chat-Agent',
    emoji: '🤖',
    description: 'Allgemeiner KI-Assistent für Lehrkräfte mit Kontextgedächtnis',
    systemPrompt: 'Du bist ein professioneller KI-Assistent für Lehrkräfte in Deutschland. Siehe app/api/assistant/chat/route.ts für die vollständige Implementierung.', // Implemented in assistant/chat
    model: 'claude-sonnet-4-6',
    maxTokens: 4096,
    temperature: 0.7,
    requiredPlan: ['PRO', 'MAX_PRO'],
    outputFormat: 'markdown',
    capabilities: [
      'Langzeit-Gedächtnis',
      'Dokument-Upload im Chat',
      'Bildanalyse (Tafelfotos)',
      'Allgemeine Fragen',
      'Streaming-Antworten',
    ],
  },

  school_analysis: {
    id: 'school_analysis',
    name: 'Schulanalyse-Agent',
    emoji: '📈',
    description: 'Analysiert schulweite Leistungsdaten für Schulleitung (B2B)',
    systemPrompt: `Du bist ein Bildungsdaten-Analyst für Schulleitungen.

AUFGABE: Analysiere schulweite anonymisierte Leistungsdaten und erstelle Managementberichte.

PRINZIPIEN:
- Vollständige Anonymisierung aller Schülerdaten
- Fachschaftsvergleiche (fair, ohne Schuldzuweisungen)
- Trend-Analyse über Schuljahre
- Benchmark mit ähnlichen Schulen (Schulform, Größe, Bundesland)
- Handlungsempfehlungen für Schulleitung
- Berichte für Schulaufsicht

AUSGABE: Executive Summary + Detailanalyse + Empfehlungen`,
    model: 'claude-opus-4-6',
    maxTokens: 5000,
    temperature: 0.2,
    requiredPlan: ['MAX_PRO'],
    outputFormat: 'json',
    capabilities: [
      'Schulweite Leistungsanalyse',
      'Fachschaftsvergleich',
      'Mehrijahres-Trend',
      'Schulaufsichts-Bericht',
      'Inklusions-KPIs',
    ],
  },

  curriculum: {
    id: 'curriculum',
    name: 'Lehrplan-Agent',
    emoji: '📖',
    description: 'Navigiert alle 16 Bundesland-Lehrpläne und ordnet Aufgaben Kompetenzen zu',
    systemPrompt: `Du bist ein Experte für alle deutschen Schulcurricula und Bildungsstandards.

AUFGABE: Helfe Lehrkräften, curriculumkonform zu unterrichten.

DATENBANK: Alle 16 Bundesland-Lehrpläne, KMK-Bildungsstandards, Kompetenzrahmen

FUNKTIONEN:
- Aufgaben zu Lehrplan-Kompetenzen zuordnen
- Curriculumlücken identifizieren
- Jahresplanung auf Lehrplan prüfen
- Kompetenznachweis-Tracker

AUSGABE: Kompetenz-Tags + Empfehlungen`,
    model: 'claude-sonnet-4-6',
    maxTokens: 3000,
    temperature: 0.1,
    requiredPlan: ['PRO', 'MAX_PRO'],
    outputFormat: 'json',
    capabilities: [
      'Alle 16 Bundesland-Lehrpläne',
      'KMK-Bildungsstandards',
      'Kompetenz-Mapping',
      'Jahresplan-Compliance-Check',
    ],
  },

  class_management: {
    id: 'class_management',
    name: 'Klassenmanagement-Agent',
    emoji: '🏫',
    description: 'Digitales Klassentagebuch mit KI-Unterstützung (B2B)',
    systemPrompt: `Du bist ein KI-Assistent für digitales Klassenmanagement.

AUFGABE: Unterstütze Lehrkräfte bei der Klassen-Administration.

DATENSCHUTZ: Alle Schülerdaten bleiben lokal, KI verarbeitet nur anonymisierte Muster

FUNKTIONEN:
- Sitzplan optimieren (nach Soziogramm-Eingabe)
- Verhaltensnotizen einordnen
- Fehlzeiten analysieren
- Elternkontakt-Protokoll
- Export für Schulverwaltungssoftware`,
    model: 'claude-sonnet-4-6',
    maxTokens: 2000,
    temperature: 0.3,
    requiredPlan: ['MAX_PRO'],
    outputFormat: 'json',
    capabilities: [
      'Sitzplan-Optimierung',
      'Fehlzeiten-Analyse',
      'Elternkontakt-Protokoll',
      'Export für ASV/Schild-NRW',
    ],
  },

  document: {
    id: 'document',
    name: 'Dokumenten-Agent',
    emoji: '📂',
    description: 'Verwaltet und befüllt schulische Dokumentvorlagen automatisch',
    systemPrompt: `Du bist ein Experte für schulische Dokumentenverwaltung.

AUFGABE: Erstelle und befülle schulische Dokumente automatisch.

VORLAGEN: Klassenarbeiten, Zeugnisse, Protokolle, Anträge, Elternbriefe, Berichte

FUNKTIONEN:
- Dokument-Templates erstellen
- Automatisches Befüllen aus Datenbank
- Digitale Unterschrift-Vorbereitung
- Archivierung nach Schulrecht (10 Jahre)`,
    model: 'claude-sonnet-4-6',
    maxTokens: 2000,
    temperature: 0.2,
    requiredPlan: ['MAX_PRO'],
    outputFormat: 'json',
    capabilities: [
      'Template-Management',
      'Auto-Fill aus DB',
      '10-Jahre-Archivierung',
      'Digitale Unterschrift',
    ],
  },
}

// Agent registry helpers
export function getAgentConfig(id: AgentId): AgentConfig {
  const config = AGENT_CONFIGS[id]
  if (!config) throw new Error(`Unknown agent: ${id}`)
  return config
}

export function getAvailableAgents(plan: string): AgentConfig[] {
  return Object.values(AGENT_CONFIGS).filter((a) =>
    a.requiredPlan.includes(plan as any)
  )
}

export function hasAgentAccess(agentId: AgentId, plan: string): boolean {
  const config = AGENT_CONFIGS[agentId]
  return config.requiredPlan.includes(plan as any)
}
