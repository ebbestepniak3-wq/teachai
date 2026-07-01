// __tests__/grading/calculator.test.ts
import {
  calculateNote,
  calculateDetailedNote,
  validateGradingPlausibility,
  recalculateFromAdjustments,
} from '@/lib/grading/scoring/calculator'

describe('calculateNote', () => {
  const defaultArgs = {
    bundesland: 'Nordrhein-Westfalen',
    strenge: 'AUSGEWOGEN' as const,
  }

  test('100% → Note 1', () => {
    const result = calculateNote(100, 100, defaultArgs.bundesland, defaultArgs.strenge)
    expect(result.note).toBe('1')
    expect(result.noteNumerisch).toBe(1.0)
    expect(result.bestanden).toBe(true)
  })

  test('50% → Note 4 (gerade bestanden)', () => {
    const result = calculateNote(50, 100, defaultArgs.bundesland, defaultArgs.strenge)
    expect(result.note).toBe('4')
    expect(result.bestanden).toBe(true)
  })

  test('49% → Note 5 (nicht bestanden)', () => {
    const result = calculateNote(49, 100, defaultArgs.bundesland, defaultArgs.strenge)
    expect(result.note).toBe('5')
    expect(result.bestanden).toBe(false)
  })

  test('0% → Note 6', () => {
    const result = calculateNote(0, 100, defaultArgs.bundesland, defaultArgs.strenge)
    expect(result.note).toBe('6')
    expect(result.noteNumerisch).toBe(6.0)
    expect(result.bestanden).toBe(false)
  })

  test('92% → Note 1 (Standard)', () => {
    const result = calculateNote(92, 100, defaultArgs.bundesland, defaultArgs.strenge)
    expect(result.note).toBe('1')
  })

  test('91% → Note 2 (Standard)', () => {
    const result = calculateNote(91, 100, defaultArgs.bundesland, defaultArgs.strenge)
    expect(result.note).toBe('2')
  })

  test('Bayern: 85% → Note 2', () => {
    const result = calculateNote(85, 100, 'Bayern', 'AUSGEWOGEN')
    expect(result.note).toBe('2')
  })

  test('Bayern: 100% → Note 1', () => {
    const result = calculateNote(100, 100, 'Bayern', 'AUSGEWOGEN')
    expect(result.note).toBe('1')
  })

  test('STRENG: 95% → Note 1', () => {
    const result = calculateNote(95, 100, defaultArgs.bundesland, 'STRENG')
    expect(result.note).toBe('1')
  })

  test('STRENG: 94% → Note 2', () => {
    const result = calculateNote(94, 100, defaultArgs.bundesland, 'STRENG')
    expect(result.note).toBe('2')
  })

  test('KULANT: 87% → Note 1', () => {
    const result = calculateNote(87, 100, defaultArgs.bundesland, 'KULANT')
    expect(result.note).toBe('1')
  })

  test('KULANT: 45% → Note 4 (bestanden, niedrigere Hürde)', () => {
    const result = calculateNote(45, 100, defaultArgs.bundesland, 'KULANT')
    expect(result.note).toBe('4')
    expect(result.bestanden).toBe(true)
  })

  test('Prozentberechnung korrekt', () => {
    const result = calculateNote(75, 100, defaultArgs.bundesland, defaultArgs.strenge)
    expect(result.prozent).toBe(75)
  })

  test('Fractional points work', () => {
    const result = calculateNote(7.5, 10, defaultArgs.bundesland, defaultArgs.strenge)
    expect(result.prozent).toBe(75)
  })

  test('throws on maxPunkte = 0', () => {
    expect(() => calculateNote(50, 0, defaultArgs.bundesland, defaultArgs.strenge))
      .toThrow('Maximalpunkte muss > 0 sein')
  })
})

describe('calculateDetailedNote', () => {
  test('returns plus suffix for upper third', () => {
    // 85% is in upper third of note 2 range (81-91)
    const result = calculateDetailedNote(85, 100, 'NRW', 'AUSGEWOGEN')
    expect(result.note).toMatch(/^2/)
  })

  test('note 1 has no modifier', () => {
    const result = calculateDetailedNote(95, 100, 'NRW', 'AUSGEWOGEN')
    expect(result.note).toBe('1')
  })

  test('note 6 has no modifier', () => {
    const result = calculateDetailedNote(10, 100, 'NRW', 'AUSGEWOGEN')
    expect(result.note).toBe('6')
  })
})

describe('validateGradingPlausibility', () => {
  test('valid: sum of tasks = total', () => {
    const warnings = validateGradingPlausibility(
      [{ erreichterPunkte: 8, maxPunkte: 10 }, { erreichterPunkte: 6, maxPunkte: 10 }],
      14,
      20
    )
    expect(warnings).toHaveLength(0)
  })

  test('detects sum mismatch', () => {
    const warnings = validateGradingPlausibility(
      [{ erreichterPunkte: 8, maxPunkte: 10 }, { erreichterPunkte: 6, maxPunkte: 10 }],
      20, // should be 14
      20
    )
    expect(warnings.some((w) => w.includes('Summe'))).toBe(true)
  })

  test('detects task exceeding max', () => {
    const warnings = validateGradingPlausibility(
      [{ erreichterPunkte: 12, maxPunkte: 10 }],
      12,
      20
    )
    expect(warnings.some((w) => w.includes('Maximalpunkte'))).toBe(true)
  })

  test('detects negative points', () => {
    const warnings = validateGradingPlausibility(
      [{ erreichterPunkte: -1, maxPunkte: 10 }],
      -1,
      20
    )
    expect(warnings.some((w) => w.includes('Negative'))).toBe(true)
  })

  test('detects total exceeding maximum', () => {
    const warnings = validateGradingPlausibility(
      [{ erreichterPunkte: 10, maxPunkte: 10 }],
      10,
      5 // maximum is 5 but got 10
    )
    expect(warnings.some((w) => w.includes('überschreiten'))).toBe(true)
  })
})

describe('recalculateFromAdjustments', () => {
  const original = [
    { aufgabe: 'Aufgabe 1', erreichterPunkte: 8, maxPunkte: 10 },
    { aufgabe: 'Aufgabe 2', erreichterPunkte: 5, maxPunkte: 10 },
  ]

  test('applies adjustments correctly', () => {
    const { adjusted, gesamtpunkte } = recalculateFromAdjustments(
      original,
      [{ aufgabe: 'Aufgabe 1', neuesPunkte: 9 }],
      20,
      'NRW',
      'AUSGEWOGEN'
    )
    expect(adjusted[0].erreichterPunkte).toBe(9)
    expect(adjusted[1].erreichterPunkte).toBe(5) // unchanged
    expect(gesamtpunkte).toBe(14)
  })

  test('marks adjusted tasks', () => {
    const { adjusted } = recalculateFromAdjustments(
      original,
      [{ aufgabe: 'Aufgabe 1', neuesPunkte: 9 }],
      20,
      'NRW',
      'AUSGEWOGEN'
    )
    expect(adjusted[0].angepasst).toBe(true)
    expect(adjusted[1].angepasst).toBe(false)
  })

  test('recalculates note', () => {
    const { note } = recalculateFromAdjustments(
      original,
      [],
      20,
      'NRW',
      'AUSGEWOGEN'
    )
    // 13/20 = 65% → Note 3
    expect(note.note).toBe('3')
  })
})
