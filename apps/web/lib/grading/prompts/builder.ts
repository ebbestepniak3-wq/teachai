// lib/grading/prompts/builder.ts – build the complete grading prompt for Claude

import type { GradingInput, BewertungsrasterItem } from '@/lib/grading/types'
import { buildSubjectSection } from './subject-prompts'

export function buildGradingSystemPrompt(): string {
  return `Du bist ein erfahrener Schulpädagoge in Deutschland, spezialisiert auf die objektive und faire Bewertung von Schülerarbeiten.

DEINE AUFGABE:
- Erstelle einen professionellen Bewertungsvorschlag für die vorliegende Schülerarbeit
- Die endgültige Note liegt immer bei der Lehrkraft – du machst einen VORSCHLAG
- Sei fair, konsistent und nachvollziehbar in deiner Bewertung
- Vergib Teilpunkte für teilweise richtige Antworten
- Erkenne und anerkenne alternative richtige Lösungswege
- Kennzeichne Unsicherheiten offen, statt falsche Sicherheit zu suggerieren

KRITISCHE REGELN:
1. NIEMALS Punkte vergeben, die über dem Maximum liegen
2. NIEMALS negative Punkte vergeben
3. Summe der Aufgabenpunkte MUSS gleich den Gesamtpunkten sein
4. Begründe JEDEN Punktabzug konkret
5. Antworte IMMER im vorgegebenen JSON-Format
6. Wenn Text unleserlich oder unklar ist, kennzeichne dies als Unsicherheit

DATENSCHUTZ:
- Keine Schülerdaten speichern oder weitergeben
- Vertraulich mit dem Inhalt umgehen`
}

export function buildGradingUserPrompt(input: GradingInput): string {
  const {
    ocrText, bundesland, schulform, klassenstufe, fach,
    aufgabentyp, bewertungsstrenge, bewertungsschwerpunkte,
    maxPunkte, bewertungsraster, lehrerHinweise, nachteilsausgleich,
  } = input

  const strengeText = {
    STRENG: 'streng (hohe Anforderungen, kleiner Fehler = mehr Punktabzug)',
    AUSGEWOGEN: 'ausgewogen (standard, faire Mitte)',
    KULANT: 'kulant (wohlwollend, Ansätze werden honoriert)',
  }[bewertungsstrenge]

  const rasterText = formatBewertungsraster(bewertungsraster, maxPunkte)
  const subjectSection = buildSubjectSection(fach, bewertungsschwerpunkte)

  const hinweisSection = buildHinweisSection(lehrerHinweise, nachteilsausgleich, bewertungsschwerpunkte)

  return `# Bewertungsauftrag

## Kontext
- **Bundesland:** ${bundesland}
- **Schulform:** ${schulform}  
- **Klassenstufe:** ${klassenstufe}. Klasse
- **Fach:** ${fach}
- **Leistungsnachweis:** ${aufgabentyp}
- **Bewertungsstrenge:** ${strengeText}
- **Maximalpunkte:** ${maxPunkte} Punkte

${hinweisSection}

${subjectSection}

## Bewertungsraster
${rasterText}

## Schülerarbeit (OCR-extrahierter Text)
---
${ocrText}
---

## Deine Aufgabe

Bewerte die Schülerarbeit anhand des Bewertungsrasters und erstelle einen strukturierten Bewertungsvorschlag.

**WICHTIG**: Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt in exakt diesem Format:

\`\`\`json
{
  "gesamtpunkte": <number>,
  "aufgabenBewertungen": [
    {
      "aufgabe": "<Aufgabenbezeichnung>",
      "aufgabenNummer": <number>,
      "erreichterPunkte": <number>,
      "maxPunkte": <number>,
      "prozent": <number>,
      "teilpunkteBewertung": [
        {
          "kriterium": "<Kriterium>",
          "erhaltenePunkte": <number>,
          "maxPunkte": <number>,
          "begruendung": "<kurze Begründung>"
        }
      ],
      "begruendung": "<Begründung für die Punkte>",
      "fehler": ["<Fehler 1>", "<Fehler 2>"],
      "korrekteLoesung": "<Was wäre die korrekte Lösung oder ein Hinweis>",
      "alternativeLoesung": "<Falls vorhanden: alternative richtige Lösung>"
    }
  ],
  "feedback": "<Allgemeines Feedback an den Schüler (300-500 Wörter, konstruktiv und pädagogisch)>",
  "staerken": ["<Stärke 1>", "<Stärke 2>", "<Stärke 3>"],
  "schwaechen": ["<Schwäche 1>", "<Schwäche 2>"],
  "verbesserungsvorschlaege": ["<Vorschlag 1>", "<Vorschlag 2>", "<Vorschlag 3>"],
  "zusammenfassung": "<Kurze Zusammenfassung in 2-3 Sätzen>",
  "begruendung": "<Begründung der Gesamtbewertung>",
  "unsicherheiten": ["<Bereich wo Text unleserlich war>", "<Weitere Unsicherheit>"],
  "beruecksichtigteHinweise": ["<Welche Lehrerhinweise wurden berücksichtigt>"],
  "plausibilitaetshinweise": ["<Auffälligkeit 1>"],
  "confidenceScore": <number 0-100>
}
\`\`\`

Stelle sicher:
- Summe aller erreichterPunkte in aufgabenBewertungen = gesamtpunkte
- Kein erreichterPunkte > maxPunkte einer Aufgabe
- gesamtpunkte <= ${maxPunkte}
- Alle Zahlen sind numerische Werte (kein String)
- feedback ist motivierend und konstruktiv formuliert, nicht demotivierend
- Antworte NUR mit dem JSON, ohne weiteren Text`
}

function formatBewertungsraster(raster: BewertungsrasterItem[], maxPunkte: number): string {
  if (!raster || raster.length === 0) {
    return `- Aufgabe 1: ${maxPunkte} Punkte (Gesamtbewertung)`
  }

  return raster
    .map((item, i) => {
      let line = `- **${item.aufgabe}** (${item.maxPunkte} Punkte)`
      if (item.beschreibung) line += `\n  ${item.beschreibung}`
      if (item.teilpunkte && item.teilpunkte.length > 0) {
        item.teilpunkte.forEach((tp) => {
          line += `\n    - ${tp.kriterium}: ${tp.punkte} Punkte`
        })
      }
      return line
    })
    .join('\n')
}

function buildHinweisSection(
  lehrerHinweise?: string,
  nachteilsausgleich?: string,
  schwerpunkte?: string[]
): string {
  const parts: string[] = []

  if (lehrerHinweise) {
    parts.push(`## Hinweise der Lehrkraft\n${lehrerHinweise}`)
  }

  if (nachteilsausgleich) {
    parts.push(`## Anerkannter Nachteilsausgleich\n⚠️ **Bitte berücksichtigen:** ${nachteilsausgleich}\nDiese Besonderheit soll transparent in die Bewertung einfließen und im Bericht dokumentiert werden.`)
  }

  if (schwerpunkte && schwerpunkte.length > 0) {
    parts.push(`## Bewertungsschwerpunkte der Lehrkraft\nFolgende Aspekte sollen stärker gewichtet werden:\n${schwerpunkte.map((s) => `- ${s}`).join('\n')}`)
  }

  return parts.join('\n\n')
}
