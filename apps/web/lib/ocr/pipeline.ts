// lib/ocr/pipeline.ts – OCR pipeline: image preprocessing + text extraction

import { logger } from '@/lib/logger'

export interface OcrPage {
  pageNumber: number
  text: string
  confidence: number
  wordCount: number
  hasHandwriting: boolean
}

export interface OcrResult {
  success: boolean
  pages: OcrPage[]
  fullText: string
  totalPages: number
  averageConfidence: number
  processingTimeMs: number
  error?: string
}

export interface ImagePreprocessOptions {
  autoRotate?: boolean
  enhanceContrast?: boolean
  deskew?: boolean
  removeNoise?: boolean
  sharpen?: boolean
  grayscale?: boolean
}

// Main OCR pipeline entry point
export async function runOcrPipeline(
  buffer: Buffer,
  mimeType: string,
  options: ImagePreprocessOptions = {}
): Promise<OcrResult> {
  const startTime = Date.now()

  try {
    logger.info('Starting OCR pipeline', { mimeType, size: buffer.length })

    let pages: OcrPage[]

    if (mimeType === 'application/pdf') {
      pages = await processPdf(buffer, options)
    } else if (mimeType.startsWith('image/')) {
      pages = await processImage(buffer, mimeType, options)
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.oasis.opendocument.text'
    ) {
      pages = await processDocument(buffer, mimeType)
    } else {
      return {
        success: false,
        pages: [],
        fullText: '',
        totalPages: 0,
        averageConfidence: 0,
        processingTimeMs: Date.now() - startTime,
        error: 'Nicht unterstützter Dateityp für OCR',
      }
    }

    const fullText = pages.map((p) => p.text).join('\n\n--- Seite ' + (pages.indexOf(pages[pages.length - 1]) + 1) + ' ---\n\n')
    const averageConfidence = pages.length > 0
      ? Math.round(pages.reduce((sum, p) => sum + p.confidence, 0) / pages.length)
      : 0

    const processingTimeMs = Date.now() - startTime
    logger.info('OCR pipeline complete', {
      pages: pages.length,
      confidence: averageConfidence,
      timeMs: processingTimeMs,
    })

    return {
      success: true,
      pages,
      fullText: pages.map((p, i) => `[Seite ${i + 1}]\n${p.text}`).join('\n\n'),
      totalPages: pages.length,
      averageConfidence,
      processingTimeMs,
    }
  } catch (error) {
    logger.error('OCR pipeline error', { error })
    return {
      success: false,
      pages: [],
      fullText: '',
      totalPages: 0,
      averageConfidence: 0,
      processingTimeMs: Date.now() - startTime,
      error: 'OCR-Verarbeitung fehlgeschlagen',
    }
  }
}

// Process a PDF file – extract text from each page
async function processPdf(buffer: Buffer, options: ImagePreprocessOptions): Promise<OcrPage[]> {
  // In production: use pdf2pic or pdfjs-dist to convert pages to images, then OCR
  // For now: attempt direct text extraction from PDF, with Claude Vision fallback

  try {
    // Try to extract embedded text first (fast path for digital PDFs)
    const embeddedText = await extractPdfText(buffer)

    if (embeddedText.trim().length > 50) {
      // PDF has embedded text – use it directly
      const pageTexts = embeddedText.split(/\f/).filter((t) => t.trim().length > 0)
      return pageTexts.map((text, i) => ({
        pageNumber: i + 1,
        text: text.trim(),
        confidence: 98,
        wordCount: text.trim().split(/\s+/).length,
        hasHandwriting: false,
      }))
    }

    // PDF is scanned – fall back to image-based OCR via Claude Vision
    const claudeResult = await ocrWithClaudeVision(buffer, 'application/pdf')
    return claudeResult
  } catch (error) {
    logger.error('PDF processing error', { error })
    throw error
  }
}

// Process a single image file
async function processImage(
  buffer: Buffer,
  mimeType: string,
  options: ImagePreprocessOptions
): Promise<OcrPage[]> {
  // Preprocess image if needed
  const processedBuffer = await preprocessImage(buffer, mimeType, options)

  // Use Claude Vision for OCR (best quality for handwriting)
  const pages = await ocrWithClaudeVision(processedBuffer, mimeType)
  return pages
}

// Process DOCX/ODT – extract text directly
async function processDocument(buffer: Buffer, mimeType: string): Promise<OcrPage[]> {
  try {
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await extractDocxText(buffer)
    }
    if (mimeType === 'application/vnd.oasis.opendocument.text') {
      return await extractOdtText(buffer)
    }
    throw new Error('Unbekanntes Dokumentformat')
  } catch (error) {
    logger.error('Document extraction error', { error })
    return [{
      pageNumber: 1,
      text: 'Fehler beim Extrahieren des Textes',
      confidence: 0,
      wordCount: 0,
      hasHandwriting: false,
    }]
  }
}

// Image preprocessing (contrast, rotation, denoising)
async function preprocessImage(
  buffer: Buffer,
  mimeType: string,
  options: ImagePreprocessOptions
): Promise<Buffer> {
  // In production: use sharp.js for image processing
  // Sharp operations would include:
  // .rotate() for auto-rotation based on EXIF
  // .normalize() for contrast enhancement
  // .sharpen() for clarity
  // .grayscale() for better OCR on color images
  // .median() for noise reduction

  // Since sharp requires native binaries, we simulate preprocessing
  // and return the original buffer (the OCR model handles quality internally)
  if (process.env.NODE_ENV === 'production') {
    try {
      // Dynamic import of sharp (optional dependency)
      const sharp = (await import('sharp')).default
      let pipeline = sharp(buffer)

      if (options.grayscale !== false) {
        pipeline = pipeline.grayscale()
      }
      if (options.enhanceContrast !== false) {
        pipeline = pipeline.normalize()
      }
      if (options.sharpen !== false) {
        pipeline = pipeline.sharpen({ sigma: 1.5 })
      }
      if (options.autoRotate !== false) {
        pipeline = pipeline.rotate() // Auto-rotate based on EXIF
      }
      if (options.removeNoise !== false) {
        pipeline = pipeline.median(1) // Light noise reduction
      }

      return await pipeline.toBuffer()
    } catch {
      // sharp not available – return original
      return buffer
    }
  }

  return buffer
}

// OCR using Claude Vision API (best for handwriting)
async function ocrWithClaudeVision(buffer: Buffer, mimeType: string): Promise<OcrPage[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    logger.warn('ANTHROPIC_API_KEY not set – using placeholder OCR')
    return [{
      pageNumber: 1,
      text: '[OCR-Platzhalter: Anthropic API Key nicht konfiguriert]\n\nDieser Text würde nach Konfiguration des API-Keys durch den echten extrahierten Text ersetzt werden.',
      confidence: 0,
      wordCount: 10,
      hasHandwriting: false,
    }]
  }

  try {
    // Determine media type for Claude API
    const claudeMediaType = mimeType === 'application/pdf'
      ? 'application/pdf'
      : mimeType.includes('jpeg') || mimeType.includes('jpg')
      ? 'image/jpeg'
      : mimeType.includes('png')
      ? 'image/png'
      : mimeType.includes('webp')
      ? 'image/webp'
      : 'image/jpeg'

    const base64Data = buffer.toString('base64')

    const isDocument = mimeType === 'application/pdf'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              isDocument
                ? {
                    type: 'document',
                    source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
                  }
                : {
                    type: 'image',
                    source: { type: 'base64', media_type: claudeMediaType, data: base64Data },
                  },
              {
                type: 'text',
                text: `Extrahiere den vollständigen Text aus diesem Dokument/Bild.

WICHTIG:
- Übertrage JEDEN Text exakt wie er geschrieben ist, einschließlich Fehler
- Behalte die Struktur (Absätze, Aufzählungen, Überschriften) bei
- Bei handschriftlichem Text: Schreibe den Text so wie er steht, markiere unleserliche Stellen mit [unleserlich]
- Seiten trennen mit: --- Seite N ---
- Füge am Ende hinzu: [Konfidenz: X%] wobei X die geschätzte Erkennungsgenauigkeit ist
- Erkenne ob es sich um Handschrift oder Druck handelt und gib [HANDSCHRIFT] oder [DRUCK] an

Extrahiere jetzt den Text:`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      logger.error('Claude OCR API error', { status: response.status, err })
      throw new Error(`Claude API Fehler: ${response.status}`)
    }

    const data = await response.json()
    const rawText = data.content?.[0]?.text || ''

    // Parse the response into pages
    return parseClaudeOcrResponse(rawText)
  } catch (error) {
    logger.error('Claude Vision OCR error', { error })
    throw error
  }
}

// Parse Claude's OCR response into structured pages
function parseClaudeOcrResponse(rawText: string): OcrPage[] {
  const hasHandwriting = rawText.includes('[HANDSCHRIFT]')

  // Try to split by page markers
  const pageMarkers = /---\s*Seite\s*(\d+)\s*---/gi
  const parts = rawText.split(pageMarkers).filter((p) => p.trim().length > 0)

  // Extract confidence
  const confidenceMatch = rawText.match(/\[Konfidenz:\s*(\d+)%\]/i)
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 85

  if (parts.length <= 1) {
    // Single page or no page markers
    const cleanText = rawText
      .replace(/\[Konfidenz:\s*\d+%\]/gi, '')
      .replace(/\[HANDSCHRIFT\]/gi, '')
      .replace(/\[DRUCK\]/gi, '')
      .trim()

    return [{
      pageNumber: 1,
      text: cleanText,
      confidence,
      wordCount: cleanText.split(/\s+/).filter((w) => w.length > 0).length,
      hasHandwriting,
    }]
  }

  // Multiple pages
  const pages: OcrPage[] = []
  let pageNum = 1

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    // Skip if this is just a page number (from the split)
    if (/^\d+$/.test(part.trim())) {
      pageNum = parseInt(part)
      continue
    }

    const cleanText = part
      .replace(/\[Konfidenz:\s*\d+%\]/gi, '')
      .replace(/\[HANDSCHRIFT\]/gi, '')
      .replace(/\[DRUCK\]/gi, '')
      .trim()

    if (cleanText.length > 0) {
      pages.push({
        pageNumber: pageNum,
        text: cleanText,
        confidence,
        wordCount: cleanText.split(/\s+/).filter((w) => w.length > 0).length,
        hasHandwriting,
      })
      pageNum++
    }
  }

  return pages.length > 0 ? pages : [{
    pageNumber: 1,
    text: rawText.trim(),
    confidence,
    wordCount: rawText.trim().split(/\s+/).length,
    hasHandwriting,
  }]
}

// Extract embedded text from PDF (no OCR needed for digital PDFs)
async function extractPdfText(buffer: Buffer): Promise<string> {
  // In production: use pdf-parse or pdfjs-dist
  try {
    // Dynamic import
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch {
    // pdf-parse not available or failed
    return ''
  }
}

// Extract text from DOCX
async function extractDocxText(buffer: Buffer): Promise<OcrPage[]> {
  try {
    const mammoth = (await import('mammoth')).default
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value || ''

    // Split by form feed or double newlines as page boundaries
    const pages = text.split(/\f/).filter((p) => p.trim().length > 0)

    if (pages.length === 0) {
      return [{
        pageNumber: 1,
        text: text.trim(),
        confidence: 100,
        wordCount: text.split(/\s+/).length,
        hasHandwriting: false,
      }]
    }

    return pages.map((pageText, i) => ({
      pageNumber: i + 1,
      text: pageText.trim(),
      confidence: 100,
      wordCount: pageText.trim().split(/\s+/).length,
      hasHandwriting: false,
    }))
  } catch (error) {
    logger.warn('mammoth not available, using placeholder', { error })
    return [{
      pageNumber: 1,
      text: '[Word-Dokument: Text-Extraktion in Produktion verfügbar]',
      confidence: 0,
      wordCount: 0,
      hasHandwriting: false,
    }]
  }
}

// Extract text from ODT
async function extractOdtText(buffer: Buffer): Promise<OcrPage[]> {
  // ODT is ZIP-based, contains content.xml
  try {
    const { unzipSync } = await import('fflate')
    const unzipped = unzipSync(new Uint8Array(buffer))
    const contentXml = unzipped['content.xml']

    if (!contentXml) throw new Error('content.xml not found in ODT')

    const xmlText = Buffer.from(contentXml).toString('utf-8')
    // Strip XML tags
    const text = xmlText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    return [{
      pageNumber: 1,
      text,
      confidence: 100,
      wordCount: text.split(/\s+/).length,
      hasHandwriting: false,
    }]
  } catch {
    return [{
      pageNumber: 1,
      text: '[ODT-Dokument: Text-Extraktion in Produktion verfügbar]',
      confidence: 0,
      wordCount: 0,
      hasHandwriting: false,
    }]
  }
}
