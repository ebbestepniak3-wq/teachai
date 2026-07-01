// __tests__/grading/prompt-builder.test.ts
import { buildGradingUserPrompt, buildGradingSystemPrompt } from '@/lib/grading/prompts/builder'
import { getSubjectConfig } from '@/lib/grading/prompts/subject-prompts'
import type { GradingInput } from '@/lib/grading/types'

const baseInput: GradingInput = {
  ocrText: 'Die Schülerantwort lautet: x = 5',
  fileType: 'image/jpeg',
  pageCount: 1,
  bundesland: 'Bayern',
  schulform: 'Gymnasium',
  klassenstufe: '10',
  fach: 'Mathematik',
  aufgabentyp: 'KLASSENARBEIT',
  bewertungsstrenge: 'AUSGEWOGEN',
  bewertungsschwerpunkte: [],
  maxPunkte: 100,
  bewertungsraster: [
    { aufgabe: 'Aufgabe 1', maxPunkte: 50, beschreibung: 'Lineare Gleichungen' },
    { aufgabe: 'Aufgabe 2', maxPunkte: 50, beschreibung: 'Quadratische Gleichungen' },
  ],
}

describe('buildGradingSystemPrompt', () => {
  test('returns non-empty string', () => {
    const prompt = buildGradingSystemPrompt()
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })

  test('contains key grading instructions', () => {
    const prompt = buildGradingSystemPrompt()
    expect(prompt).toContain('Teilpunkte')
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('Unsicherheiten')
  })
})

describe('buildGradingUserPrompt', () => {
  test('contains school context', () => {
    const prompt = buildGradingUserPrompt(baseInput)
    expect(prompt).toContain('Bayern')
    expect(prompt).toContain('Gymnasium')
    expect(prompt).toContain('10')
    expect(prompt).toContain('Mathematik')
    expect(prompt).toContain('KLASSENARBEIT')
  })

  test('contains Bewertungsraster', () => {
    const prompt = buildGradingUserPrompt(baseInput)
    expect(prompt).toContain('Aufgabe 1')
    expect(prompt).toContain('50')
  })

  test('contains OCR text', () => {
    const prompt = buildGradingUserPrompt(baseInput)
    expect(prompt).toContain('Die Schülerantwort lautet: x = 5')
  })

  test('includes Lehrerhinweise when provided', () => {
    const input = { ...baseInput, lehrerHinweise: 'Rechenweg besonders beachten' }
    const prompt = buildGradingUserPrompt(input)
    expect(prompt).toContain('Rechenweg besonders beachten')
  })

  test('includes Nachteilsausgleich when provided', () => {
    const input = { ...baseInput, nachteilsausgleich: 'Legasthenie anerkannt' }
    const prompt = buildGradingUserPrompt(input)
    expect(prompt).toContain('Legasthenie anerkannt')
    expect(prompt).toContain('Nachteilsausgleich')
  })

  test('contains strenge info', () => {
    const prompt = buildGradingUserPrompt(baseInput)
    expect(prompt).toContain('ausgewogen')
  })

  test('contains STRENG description for strict mode', () => {
    const input = { ...baseInput, bewertungsstrenge: 'STRENG' as const }
    const prompt = buildGradingUserPrompt(input)
    expect(prompt).toContain('streng')
  })

  test('requests JSON output', () => {
    const prompt = buildGradingUserPrompt(baseInput)
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('gesamtpunkte')
    expect(prompt).toContain('aufgabenBewertungen')
  })

  test('contains max punkte constraint', () => {
    const prompt = buildGradingUserPrompt(baseInput)
    expect(prompt).toContain('100')
  })
})

describe('getSubjectConfig', () => {
  test('returns Mathematik config', () => {
    const config = getSubjectConfig('Mathematik')
    expect(config.fach).toBe('Mathematik')
    expect(config.bewertungsDimensionen.length).toBeGreaterThan(0)
    expect(config.besonderheiten.some((b) => b.includes('Rechenweg'))).toBe(true)
  })

  test('returns Deutsch config', () => {
    const config = getSubjectConfig('Deutsch')
    expect(config.fach).toBe('Deutsch')
    expect(config.bewertungsDimensionen).toContain('Grammatik und Syntax')
  })

  test('returns Englisch config', () => {
    const config = getSubjectConfig('Englisch')
    expect(config.fach).toBe('Englisch')
  })

  test('returns default for unknown subject', () => {
    const config = getSubjectConfig('Handarbeit')
    expect(config.fach).toBe('Allgemein')
    expect(config.bewertungsDimensionen.length).toBeGreaterThan(0)
  })

  test('partial match works', () => {
    const config = getSubjectConfig('Physik Leistungskurs')
    expect(config.fach).toBe('Physik')
  })
})
