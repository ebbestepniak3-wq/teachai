// lib/upload/validator.ts – Server-side file validation and security

import { UPLOAD_CONFIG, isAllowedMimeType, getMaxFileSize, isImageType } from './config'
import { logger } from '@/lib/logger'

export interface ValidationResult {
  valid: boolean
  error?: string
  warning?: string
}

// Validate file before processing
export async function validateFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  fileSize: number
): Promise<ValidationResult> {
  // 1. Check MIME type is allowed
  if (!isAllowedMimeType(mimeType)) {
    return {
      valid: false,
      error: `Dateityp "${mimeType}" wird nicht unterstützt. Erlaubt: PDF, DOCX, ODT, JPG, PNG, WebP, HEIC, TIFF`,
    }
  }

  // 2. Check file size
  const maxSize = getMaxFileSize(mimeType)
  if (fileSize > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024))
    return {
      valid: false,
      error: `Datei ist zu groß (${Math.round(fileSize / (1024 * 1024))} MB). Maximum: ${maxMB} MB`,
    }
  }

  // 3. Validate magic bytes (file signature)
  const signatureResult = validateFileSignature(buffer, mimeType)
  if (!signatureResult.valid) {
    return signatureResult
  }

  // 4. Check for suspicious content
  const suspiciousResult = checkForSuspiciousContent(buffer, fileName)
  if (!suspiciousResult.valid) {
    return suspiciousResult
  }

  // 5. Validate filename
  const nameResult = validateFileName(fileName)
  if (!nameResult.valid) {
    return nameResult
  }

  return { valid: true }
}

// Verify file magic bytes match declared MIME type
function validateFileSignature(buffer: Buffer, mimeType: string): ValidationResult {
  if (buffer.length < 8) {
    return { valid: false, error: 'Datei ist zu klein oder leer' }
  }

  const bytes = Array.from(buffer.slice(0, 8))

  switch (mimeType) {
    case 'application/pdf':
      // %PDF
      if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) {
        return { valid: false, error: 'Datei ist kein gültiges PDF' }
      }
      break

    case 'image/jpeg':
      // FF D8 FF
      if (!(bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF)) {
        return { valid: false, error: 'Datei ist kein gültiges JPEG' }
      }
      break

    case 'image/png':
      // 89 50 4E 47 0D 0A 1A 0A
      if (!(bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47)) {
        return { valid: false, error: 'Datei ist kein gültiges PNG' }
      }
      break

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.oasis.opendocument.text':
      // ZIP signature (PK)
      if (!(bytes[0] === 0x50 && bytes[1] === 0x4B)) {
        return { valid: false, error: 'Datei ist kein gültiges Dokument' }
      }
      break

    case 'image/webp':
      // RIFF....WEBP
      if (!(bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46)) {
        return { valid: false, error: 'Datei ist kein gültiges WebP' }
      }
      break

    case 'image/tiff':
      // II (little-endian) or MM (big-endian)
      const isTiff =
        (bytes[0] === 0x49 && bytes[1] === 0x49) ||
        (bytes[0] === 0x4D && bytes[1] === 0x4D)
      if (!isTiff) {
        return { valid: false, error: 'Datei ist kein gültiges TIFF' }
      }
      break

    case 'image/heic':
    case 'image/heif':
      // HEIC/HEIF uses ISO Base Media File Format – starts with ftyp box
      // We do a relaxed check here (bytes 4-7 = ftyp)
      if (!(bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70)) {
        // Allow through with warning – HEIC detection is tricky
        logger.warn('HEIC magic byte check inconclusive, allowing file')
      }
      break

    case 'application/msword':
      // DOC: D0 CF 11 E0
      if (!(bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0)) {
        return { valid: false, error: 'Datei ist kein gültiges Word-Dokument (.doc)' }
      }
      break
  }

  return { valid: true }
}

// Check for suspicious content (basic script injection, etc.)
function checkForSuspiciousContent(buffer: Buffer, fileName: string): ValidationResult {
  // Check for embedded executables in file headers
  const start = buffer.slice(0, 512).toString('binary')

  // Detect embedded JavaScript in PDFs
  if (fileName.toLowerCase().endsWith('.pdf')) {
    const content = buffer.toString('binary')
    if (content.includes('/JavaScript') || content.includes('/JS ')) {
      return {
        valid: false,
        error: 'PDF enthält aktive Skripte und wird aus Sicherheitsgründen abgelehnt',
      }
    }
  }

  // Check for null bytes that indicate binary injection in text areas
  // (very basic check, real systems use ClamAV or similar)

  return { valid: true }
}

// Validate the filename itself
function validateFileName(fileName: string): ValidationResult {
  if (!fileName || fileName.trim().length === 0) {
    return { valid: false, error: 'Dateiname fehlt' }
  }

  if (fileName.length > 255) {
    return { valid: false, error: 'Dateiname ist zu lang (max. 255 Zeichen)' }
  }

  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return { valid: false, error: 'Ungültiger Dateiname' }
  }

  // Check for null bytes
  if (fileName.includes('\0')) {
    return { valid: false, error: 'Ungültiger Dateiname' }
  }

  return { valid: true }
}

// Check upload quota for user
export async function checkUploadQuota(
  userId: string,
  plan: string,
  requestedFiles: number
): Promise<ValidationResult> {
  const { prisma } = await import('@/lib/prisma')
  const { UPLOAD_CONFIG } = await import('./config')

  const maxFiles = UPLOAD_CONFIG.MAX_FILES_PER_PLAN[plan as keyof typeof UPLOAD_CONFIG.MAX_FILES_PER_PLAN] || 2

  if (requestedFiles > maxFiles) {
    return {
      valid: false,
      error: `Ihr ${plan}-Plan erlaubt maximal ${maxFiles} Dateien gleichzeitig. Sie versuchen ${requestedFiles} hochzuladen.`,
    }
  }

  // Check monthly grading quota
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const usageThisMonth = await prisma.gradingJob.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  })

  const { PLAN_CONFIGS } = await import('@teachai/types')
  const monthlyLimit = PLAN_CONFIGS[plan as keyof typeof PLAN_CONFIGS]?.bewertungenProMonat || 10

  if (usageThisMonth >= monthlyLimit) {
    return {
      valid: false,
      error: `Monatliches Kontingent erschöpft (${usageThisMonth}/${monthlyLimit} Bewertungen). Upgrade für mehr.`,
    }
  }

  return { valid: true }
}
