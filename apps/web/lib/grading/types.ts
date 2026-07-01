// lib/grading/types.ts – all grading-related types

export type Bewertungsstrenge = 'STRENG' | 'AUSGEWOGEN' | 'KULANT'
export type AufgabenTyp = 'KLASSENARBEIT' | 'TEST' | 'KLAUSUR' | 'HAUSAUFGABE' | 'PROJEKT' | 'SONSTIGES'

// ─── Input ───────────────────────────────────────────────────────────────────

export interface GradingInput {
  // File content
  ocrText: string
  fileType: string
  pageCount: number

  // Context
  bundesland: string
  schulform: string
  klassenstufe: string
  fach: string
  aufgabentyp: AufgabenTyp

  // Grading parameters
  bewertungsstrenge: Bewertungsstrenge
  bewertungsschwerpunkte: string[]
  maxPunkte: number
  bewertungsraster: BewertungsrasterItem[]

  // Optional teacher hints
  lehrerHinweise?: string
  nachteilsausgleich?: string
}

export interface BewertungsrasterItem {
  aufgabe: string
  maxPunkte: number
  beschreibung?: string
  teilpunkte?: TeilpunktItem[]
}

export interface TeilpunktItem {
  kriterium: string
  punkte: number
}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface GradingResult {
  // Metadata
  jobId: string
  processingTimeMs: number
  tokensUsed: number
  modelUsed: string
  confidenceScore: number // 0-100

  // Overall assessment
  gesamtpunkte: number
  maximalpunkte: number
  note: string
  noteNumerisch: number // 1.0 – 6.0
  bestanden: boolean

  // Detailed breakdown
  aufgabenBewertungen: AufgabeBewertung[]

  // Qualitative assessment
  feedback: string
  staerken: string[]
  schwaechen: string[]
  verbesserungsvorschlaege: string[]
  zusammenfassung: string

  // Transparency
  begruendung: string
  unsicherheiten: string[] // Items where AI was uncertain
  beruecksichtigteHinweise: string[] // Which teacher hints were applied

  // Plausibility
  plausibilitaetshinweise: string[]
}

export interface AufgabeBewertung {
  aufgabe: string
  aufgabenNummer: number
  erreichterPunkte: number
  maxPunkte: number
  prozent: number
  teilpunkteBewertung: TeilpunktBewertung[]
  begruendung: string
  fehler: string[]
  korrekteLoesung?: string
  alternativeLoesung?: string
}

export interface TeilpunktBewertung {
  kriterium: string
  erhaltenePunkte: number
  maxPunkte: number
  begruendung: string
}

// ─── Teacher adjustments ─────────────────────────────────────────────────────

export interface LehrerAnpassung {
  aufgabe: string
  altesPunkte: number
  neuesPunkte: number
  kommentar?: string
  zeitstempel: string
  lehrerName?: string
}

// ─── Queue ───────────────────────────────────────────────────────────────────

export interface QueueJob {
  jobId: string
  userId: string
  uploadId: string
  priority: number
  createdAt: number
  attempts: number
  maxAttempts: number
  lastError?: string
}

export type QueueStatus = 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED' | 'RETRYING'

// ─── Notenberechnung ─────────────────────────────────────────────────────────

export interface NotenschluesselEntry {
  minProzent: number
  maxProzent: number
  note: string
  noteNumerisch: number
}

// German grading scale (Notenschlüssel) by Bundesland
export const STANDARD_NOTENSCHLUESSEL: NotenschluesselEntry[] = [
  { minProzent: 92, maxProzent: 100, note: '1', noteNumerisch: 1.0 },
  { minProzent: 81, maxProzent: 91, note: '2', noteNumerisch: 2.0 },
  { minProzent: 67, maxProzent: 80, note: '3', noteNumerisch: 3.0 },
  { minProzent: 50, maxProzent: 66, note: '4', noteNumerisch: 4.0 },
  { minProzent: 30, maxProzent: 49, note: '5', noteNumerisch: 5.0 },
  { minProzent: 0, maxProzent: 29, note: '6', noteNumerisch: 6.0 },
]

// Bayern uses slightly different scale
export const BAYERN_NOTENSCHLUESSEL: NotenschluesselEntry[] = [
  { minProzent: 100, maxProzent: 100, note: '1', noteNumerisch: 1.0 },
  { minProzent: 85, maxProzent: 99, note: '2', noteNumerisch: 2.0 },
  { minProzent: 70, maxProzent: 84, note: '3', noteNumerisch: 3.0 },
  { minProzent: 55, maxProzent: 69, note: '4', noteNumerisch: 4.0 },
  { minProzent: 40, maxProzent: 54, note: '5', noteNumerisch: 5.0 },
  { minProzent: 0, maxProzent: 39, note: '6', noteNumerisch: 6.0 },
]

// Kulant (lenient) scale
export const KULANT_NOTENSCHLUESSEL: NotenschluesselEntry[] = [
  { minProzent: 87, maxProzent: 100, note: '1', noteNumerisch: 1.0 },
  { minProzent: 74, maxProzent: 86, note: '2', noteNumerisch: 2.0 },
  { minProzent: 60, maxProzent: 73, note: '3', noteNumerisch: 3.0 },
  { minProzent: 45, maxProzent: 59, note: '4', noteNumerisch: 4.0 },
  { minProzent: 25, maxProzent: 44, note: '5', noteNumerisch: 5.0 },
  { minProzent: 0, maxProzent: 24, note: '6', noteNumerisch: 6.0 },
]

// Streng (strict) scale
export const STRENG_NOTENSCHLUESSEL: NotenschluesselEntry[] = [
  { minProzent: 95, maxProzent: 100, note: '1', noteNumerisch: 1.0 },
  { minProzent: 85, maxProzent: 94, note: '2', noteNumerisch: 2.0 },
  { minProzent: 70, maxProzent: 84, note: '3', noteNumerisch: 3.0 },
  { minProzent: 55, maxProzent: 69, note: '4', noteNumerisch: 4.0 },
  { minProzent: 33, maxProzent: 54, note: '5', noteNumerisch: 5.0 },
  { minProzent: 0, maxProzent: 32, note: '6', noteNumerisch: 6.0 },
]
