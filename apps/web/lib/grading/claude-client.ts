// lib/grading/claude-client.ts – Claude API integration for grading

import { logger } from '@/lib/logger'
import { buildGradingSystemPrompt, buildGradingUserPrompt } from './prompts/builder'
import { calculateDetailedNote, validateGradingPlausibility } from './scoring/calculator'
import type { GradingInput, GradingResult, AufgabeBewertung } from './types'

const CLAUDE_MODEL = 'claude-opus-4-6'
const MAX_TOKENS = 4096
const TIMEOUT_MS = 120_000 // 2 minutes

export interface ClaudeGradingResponse {
  success: boolean
  result?: GradingResult
  error?: string
  tokensUsed?: number
  cost?: number
}

// Token cost estimation (approximate, in EUR cents)
function estimateCost(inputTokens: number, outputTokens: number): number {
  // claude-opus-4-6: ~$15/M input, ~$75/M output (approximate)
  const inputCost = (inputTokens / 1_000_000) * 15 * 100 // EUR cents
  const outputCost = (outputTokens / 1_000_000) * 75 * 100
  return Math.round((inputCost + outputCost) * 100) / 100
}

export async function runClaudeGrading(
  input: GradingInput,
  jobId: string
): Promise<ClaudeGradingResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    logger.error('ANTHROPIC_API_KEY not configured', { jobId })
    return { success: false, error: 'KI-Service nicht konfiguriert' }
  }

  const startTime = Date.now()

  try {
    logger.info('Starting Claude grading', { jobId, fach: input.fach, klassenstufe: input.klassenstufe })

    const systemPrompt = buildGradingSystemPrompt()
    const userPrompt = buildGradingUserPrompt(input)

    // API call with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const errorBody = await response.text()
      logger.error('Claude API error', { jobId, status: response.status, body: errorBody })

      if (response.status === 429) {
        return { success: false, error: 'KI-Rate-Limit erreicht. Bitte in 1 Minute erneut versuchen.' }
      }
      if (response.status === 401) {
        return { success: false, error: 'KI-API-Authentifizierung fehlgeschlagen' }
      }
      return { success: false, error: `KI-API-Fehler: ${response.status}` }
    }

    const apiData = await response.json()
    const rawText = apiData.content?.[0]?.text || ''
    const inputTokens = apiData.usage?.input_tokens || 0
    const outputTokens = apiData.usage?.output_tokens || 0
    const tokensUsed = inputTokens + outputTokens
    const cost = estimateCost(inputTokens, outputTokens)

    logger.info('Claude API response received', {
      jobId, inputTokens, outputTokens, tokensUsed, cost,
      processingMs: Date.now() - startTime,
    })

    // Parse the JSON response
    const parsed = parseClaudeGradingResponse(rawText)
    if (!parsed.success || !parsed.data) {
      logger.error('Failed to parse Claude response', { jobId, rawText: rawText.slice(0, 500) })
      return { success: false, error: 'KI-Antwort konnte nicht verarbeitet werden' }
    }

    // Build grading result
    const rawData = parsed.data

    // Calculate note
    const gesamtpunkte = Math.min(rawData.gesamtpunkte, input.maxPunkte)
    const noteCalc = calculateDetailedNote(
      gesamtpunkte,
      input.maxPunkte,
      input.bundesland,
      input.bewertungsstrenge
    )

    // Validate plausibility
    const plausibilitaetshinweise = [
      ...validateGradingPlausibility(rawData.aufgabenBewertungen, gesamtpunkte, input.maxPunkte),
      ...(rawData.plausibilitaetshinweise || []),
    ]

    const result: GradingResult = {
      jobId,
      processingTimeMs: Date.now() - startTime,
      tokensUsed,
      modelUsed: CLAUDE_MODEL,
      confidenceScore: rawData.confidenceScore || 80,

      gesamtpunkte,
      maximalpunkte: input.maxPunkte,
      note: noteCalc.note,
      noteNumerisch: noteCalc.noteNumerisch,
      bestanden: noteCalc.bestanden,

      aufgabenBewertungen: normalizeAufgabenBewertungen(rawData.aufgabenBewertungen),

      feedback: rawData.feedback || '',
      staerken: rawData.staerken || [],
      schwaechen: rawData.schwaechen || [],
      verbesserungsvorschlaege: rawData.verbesserungsvorschlaege || [],
      zusammenfassung: rawData.zusammenfassung || '',

      begruendung: rawData.begruendung || '',
      unsicherheiten: rawData.unsicherheiten || [],
      beruecksichtigteHinweise: rawData.beruecksichtigteHinweise || [],
      plausibilitaetshinweise,
    }

    logger.info('Grading complete', {
      jobId,
      note: result.note,
      punkte: `${result.gesamtpunkte}/${result.maximalpunkte}`,
      confidence: result.confidenceScore,
    })

    return { success: true, result, tokensUsed, cost }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error('Claude API timeout', { jobId, timeoutMs: TIMEOUT_MS })
      return { success: false, error: `KI-Timeout nach ${TIMEOUT_MS / 1000}s. Bitte erneut versuchen.` }
    }
    logger.error('Claude grading exception', { jobId, error })
    return { success: false, error: 'Unerwarteter Fehler bei der KI-Bewertung' }
  }
}

// Parse and validate the JSON from Claude
function parseClaudeGradingResponse(rawText: string): { success: boolean; data?: any } {
  try {
    // Extract JSON from markdown code block if present
    let jsonStr = rawText

    const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    } else {
      // Try to find raw JSON object
      const objMatch = rawText.match(/\{[\s\S]*\}/)
      if (objMatch) jsonStr = objMatch[0]
    }

    const data = JSON.parse(jsonStr)

    // Basic validation
    if (typeof data.gesamtpunkte !== 'number') {
      throw new Error('gesamtpunkte is not a number')
    }
    if (!Array.isArray(data.aufgabenBewertungen)) {
      throw new Error('aufgabenBewertungen is not an array')
    }

    return { success: true, data }
  } catch (error) {
    logger.error('JSON parse error', { error, rawText: rawText.slice(0, 1000) })
    return { success: false }
  }
}

// Normalize and clamp aufgaben bewertungen
function normalizeAufgabenBewertungen(raw: any[]): AufgabeBewertung[] {
  return raw.map((a, i) => ({
    aufgabe: String(a.aufgabe || `Aufgabe ${i + 1}`),
    aufgabenNummer: Number(a.aufgabenNummer || i + 1),
    erreichterPunkte: Math.max(0, Math.min(Number(a.erreichterPunkte || 0), Number(a.maxPunkte || 0))),
    maxPunkte: Number(a.maxPunkte || 0),
    prozent: Number(a.prozent || 0),
    teilpunkteBewertung: Array.isArray(a.teilpunkteBewertung)
      ? a.teilpunkteBewertung.map((tp: any) => ({
          kriterium: String(tp.kriterium || ''),
          erhaltenePunkte: Math.max(0, Number(tp.erhaltenePunkte || 0)),
          maxPunkte: Number(tp.maxPunkte || 0),
          begruendung: String(tp.begruendung || ''),
        }))
      : [],
    begruendung: String(a.begruendung || ''),
    fehler: Array.isArray(a.fehler) ? a.fehler.map(String) : [],
    korrekteLoesung: a.korrekteLoesung ? String(a.korrekteLoesung) : undefined,
    alternativeLoesung: a.alternativeLoesung ? String(a.alternativeLoesung) : undefined,
  }))
}
