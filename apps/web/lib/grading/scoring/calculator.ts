// lib/grading/scoring/calculator.ts – grade calculation

import {
  STANDARD_NOTENSCHLUESSEL,
  BAYERN_NOTENSCHLUESSEL,
  KULANT_NOTENSCHLUESSEL,
  STRENG_NOTENSCHLUESSEL,
  type NotenschluesselEntry,
  type Bewertungsstrenge,
} from '@/lib/grading/types'

export function getNotenschluessel(
  bundesland: string,
  strenge: Bewertungsstrenge
): NotenschluesselEntry[] {
  if (strenge === 'STRENG') return STRENG_NOTENSCHLUESSEL
  if (strenge === 'KULANT') return KULANT_NOTENSCHLUESSEL
  if (bundesland === 'Bayern') return BAYERN_NOTENSCHLUESSEL
  return STANDARD_NOTENSCHLUESSEL
}

export function calculateNote(
  erreichtePunkte: number,
  maxPunkte: number,
  bundesland: string,
  strenge: Bewertungsstrenge
): { note: string; noteNumerisch: number; prozent: number; bestanden: boolean } {
  if (maxPunkte <= 0) throw new Error('Maximalpunkte muss > 0 sein')

  const prozent = Math.round((erreichtePunkte / maxPunkte) * 100)
  const schluessel = getNotenschluessel(bundesland, strenge)

  const eintrag = schluessel.find(
    (e) => prozent >= e.minProzent && prozent <= e.maxProzent
  ) || schluessel[schluessel.length - 1]

  return {
    note: eintrag.note,
    noteNumerisch: eintrag.noteNumerisch,
    prozent,
    bestanden: eintrag.noteNumerisch <= 4.0,
  }
}

// Calculate note with plus/minus (e.g. "2+", "3-")
export function calculateDetailedNote(
  erreichtePunkte: number,
  maxPunkte: number,
  bundesland: string,
  strenge: Bewertungsstrenge
): { note: string; noteNumerisch: number; prozent: number; bestanden: boolean } {
  const base = calculateNote(erreichtePunkte, maxPunkte, bundesland, strenge)
  const prozent = base.prozent
  const schluessel = getNotenschluessel(bundesland, strenge)

  // Find the range width to determine +/-
  const currentRange = schluessel.find(
    (e) => prozent >= e.minProzent && prozent <= e.maxProzent
  )

  if (!currentRange || base.noteNumerisch === 1.0 || base.noteNumerisch === 6.0) {
    return base
  }

  const rangeWidth = currentRange.maxProzent - currentRange.minProzent
  const posInRange = prozent - currentRange.minProzent
  const thirdRange = rangeWidth / 3

  let modifier = ''
  let noteNumerisch = base.noteNumerisch

  if (posInRange >= rangeWidth - thirdRange) {
    modifier = '+'
    noteNumerisch = Math.max(1.0, base.noteNumerisch - 0.3)
  } else if (posInRange < thirdRange) {
    modifier = '-'
    noteNumerisch = Math.min(6.0, base.noteNumerisch + 0.3)
  }

  return {
    note: `${base.note}${modifier}`,
    noteNumerisch: Math.round(noteNumerisch * 10) / 10,
    prozent: base.prozent,
    bestanden: noteNumerisch <= 4.3,
  }
}

// Validate grading result plausibility
export function validateGradingPlausibility(
  aufgabenBewertungen: Array<{ erreichterPunkte: number; maxPunkte: number }>,
  gesamtpunkte: number,
  maximalpunkte: number
): string[] {
  const warnings: string[] = []

  // Check sum of task points = total
  const sumAufgaben = aufgabenBewertungen.reduce((s, a) => s + a.erreichterPunkte, 0)
  if (Math.abs(sumAufgaben - gesamtpunkte) > 0.5) {
    warnings.push(
      `Summe der Aufgabenpunkte (${sumAufgaben}) weicht von Gesamtpunkten (${gesamtpunkte}) ab`
    )
  }

  // Check no task exceeds its max
  for (const aufgabe of aufgabenBewertungen) {
    if (aufgabe.erreichterPunkte > aufgabe.maxPunkte) {
      warnings.push(`Aufgabe: ${aufgabe.erreichterPunkte} > ${aufgabe.maxPunkte} Maximalpunkte`)
    }
    if (aufgabe.erreichterPunkte < 0) {
      warnings.push(`Aufgabe: Negative Punkte (${aufgabe.erreichterPunkte})`)
    }
  }

  // Check total doesn't exceed max
  if (gesamtpunkte > maximalpunkte) {
    warnings.push(`Gesamtpunkte (${gesamtpunkte}) überschreiten Maximalpunkte (${maximalpunkte})`)
  }

  return warnings
}

// Recalculate total after teacher adjustments
export function recalculateFromAdjustments(
  originalBewertungen: Array<{ aufgabe: string; erreichterPunkte: number; maxPunkte: number }>,
  anpassungen: Array<{ aufgabe: string; neuesPunkte: number }>,
  maximalpunkte: number,
  bundesland: string,
  strenge: Bewertungsstrenge
) {
  const adjusted = originalBewertungen.map((b) => {
    const anpassung = anpassungen.find((a) => a.aufgabe === b.aufgabe)
    return {
      ...b,
      erreichterPunkte: anpassung ? anpassung.neuesPunkte : b.erreichterPunkte,
      angepasst: !!anpassung,
    }
  })

  const gesamtpunkte = adjusted.reduce((s, a) => s + a.erreichterPunkte, 0)
  const note = calculateDetailedNote(gesamtpunkte, maximalpunkte, bundesland, strenge)

  return { adjusted, gesamtpunkte, note }
}
