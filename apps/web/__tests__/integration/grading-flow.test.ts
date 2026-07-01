// __tests__/integration/grading-flow.test.ts
import { calculateDetailedNote } from '@/lib/grading/scoring/calculator'
import { buildGradingUserPrompt } from '@/lib/grading/prompts/builder'
import { validateFile } from '@/lib/upload/validator'
import { isAllowedMimeType, getMaxFileSize, UPLOAD_CONFIG } from '@/lib/upload/config'

// ─── Upload Validation ────────────────────────────────────────────

describe('Upload validation integration', () => {
  test('PDF with correct magic bytes passes', async () => {
    const pdfHeader = Buffer.from('%PDF-1.4 test content', 'binary')
    const result = await validateFile(pdfHeader, 'application/pdf', 'test.pdf', pdfHeader.length)
    expect(result.valid).toBe(true)
  })

  test('PDF with wrong magic bytes fails', async () => {
    const fakePdf = Buffer.from('FAKE content not a pdf', 'binary')
    const result = await validateFile(fakePdf, 'application/pdf', 'fake.pdf', fakePdf.length)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('PDF')
  })

  test('PNG with correct magic bytes passes', async () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00])
    const result = await validateFile(pngHeader, 'image/png', 'test.png', pngHeader.length)
    expect(result.valid).toBe(true)
  })

  test('file exceeding max size fails', async () => {
    const bigBuffer = Buffer.alloc(10)
    const result = await validateFile(bigBuffer, 'image/jpeg', 'huge.jpg', 25 * 1024 * 1024 + 1)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('groß')
  })

  test('disallowed MIME type fails', async () => {
    const buffer = Buffer.from('test')
    const result = await validateFile(buffer, 'application/exe', 'virus.exe', 100)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Dateityp')
  })

  test('filename with path traversal fails', async () => {
    const buffer = Buffer.from('%PDF-1.4 x', 'binary')
    const result = await validateFile(buffer, 'application/pdf', '../../../etc/passwd', 100)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Dateiname')
  })

  test('all allowed MIME types are recognized', () => {
    const allowedTypes = Object.keys(UPLOAD_CONFIG.ALLOWED_MIME_TYPES)
    for (const mimeType of allowedTypes) {
      expect(isAllowedMimeType(mimeType)).toBe(true)
    }
  })

  test('image files have smaller max size than documents', () => {
    const imgMax = getMaxFileSize('image/jpeg')
    const docMax = getMaxFileSize('application/pdf')
    expect(imgMax).toBeLessThan(docMax)
  })
})

// ─── Plan limits ──────────────────────────────────────────────────

describe('Plan limits', () => {
  test('FREE plan has correct limits', () => {
    expect(UPLOAD_CONFIG.MAX_FILES_PER_PLAN.FREE).toBe(2)
    expect(UPLOAD_CONFIG.STORAGE_DURATION_HOURS.FREE).toBe(24)
  })

  test('MAX_PRO plan has most files', () => {
    const max = UPLOAD_CONFIG.MAX_FILES_PER_PLAN.MAX_PRO
    const allValues = Object.values(UPLOAD_CONFIG.MAX_FILES_PER_PLAN)
    expect(max).toBe(Math.max(...allValues))
  })

  test('paid plans have unlimited storage', () => {
    expect(UPLOAD_CONFIG.STORAGE_DURATION_HOURS.BASIC).toBeNull()
    expect(UPLOAD_CONFIG.STORAGE_DURATION_HOURS.PRO).toBeNull()
    expect(UPLOAD_CONFIG.STORAGE_DURATION_HOURS.MAX_PRO).toBeNull()
  })
})

// ─── Grading flow integration ─────────────────────────────────────

describe('Grading flow integration', () => {
  const baseInput = {
    ocrText: 'Schülerantwort: Die Aufgabe wurde bearbeitet.',
    fileType: 'image/jpeg',
    pageCount: 1,
    bundesland: 'Bayern',
    schulform: 'Gymnasium',
    klassenstufe: '10',
    fach: 'Mathematik',
    aufgabentyp: 'KLASSENARBEIT' as const,
    bewertungsstrenge: 'AUSGEWOGEN' as const,
    bewertungsschwerpunkte: [],
    maxPunkte: 100,
    bewertungsraster: [
      { aufgabe: 'Aufgabe 1', maxPunkte: 50 },
      { aufgabe: 'Aufgabe 2', maxPunkte: 50 },
    ],
  }

  test('builds a valid prompt for Mathematik', () => {
    const prompt = buildGradingUserPrompt(baseInput)
    expect(prompt).toContain('Bayern')
    expect(prompt).toContain('Gymnasium')
    expect(prompt).toContain('Mathematik')
    expect(prompt).toContain('100')
    expect(prompt).toContain('gesamtpunkte')
  })

  test('includes nachteilsausgleich in prompt when provided', () => {
    const input = { ...baseInput, nachteilsausgleich: 'Legasthenie' }
    const prompt = buildGradingUserPrompt(input)
    expect(prompt).toContain('Legasthenie')
    expect(prompt).toContain('Nachteilsausgleich')
  })

  test('grade calculation is consistent across calls', () => {
    const result1 = calculateDetailedNote(75, 100, 'Bayern', 'AUSGEWOGEN')
    const result2 = calculateDetailedNote(75, 100, 'Bayern', 'AUSGEWOGEN')
    expect(result1.note).toBe(result2.note)
    expect(result1.noteNumerisch).toBe(result2.noteNumerisch)
  })

  test('passing threshold is correct for Bayern', () => {
    // Bayern: 55% = note 4 (passing)
    const pass = calculateDetailedNote(55, 100, 'Bayern', 'AUSGEWOGEN')
    expect(pass.bestanden).toBe(true)

    // Bayern: 54% = note 5 (failing)
    const fail = calculateDetailedNote(54, 100, 'Bayern', 'AUSGEWOGEN')
    expect(fail.bestanden).toBe(false)
  })

  test('strict mode requires more points to pass', () => {
    const percent = 52 // passes in standard but not strict
    const standard = calculateDetailedNote(percent, 100, 'NRW', 'AUSGEWOGEN')
    const strict = calculateDetailedNote(percent, 100, 'NRW', 'STRENG')

    // Standard: 50% = pass; Strict: 55% = pass
    expect(standard.bestanden).toBe(true)
    expect(strict.bestanden).toBe(false)
  })
})
