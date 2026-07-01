// lib/upload/config.ts – Upload limits, allowed types, security constants

export const UPLOAD_CONFIG = {
  // Allowed MIME types with their display names
  ALLOWED_MIME_TYPES: {
    'application/pdf': { ext: 'pdf', label: 'PDF', icon: '📄' },
    'application/msword': { ext: 'doc', label: 'Word', icon: '📝' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', label: 'Word', icon: '📝' },
    'application/vnd.oasis.opendocument.text': { ext: 'odt', label: 'ODT', icon: '📝' },
    'image/jpeg': { ext: 'jpg', label: 'JPEG', icon: '🖼️' },
    'image/png': { ext: 'png', label: 'PNG', icon: '🖼️' },
    'image/webp': { ext: 'webp', label: 'WebP', icon: '🖼️' },
    'image/heic': { ext: 'heic', label: 'HEIC', icon: '🖼️' },
    'image/heif': { ext: 'heif', label: 'HEIF', icon: '🖼️' },
    'image/tiff': { ext: 'tiff', label: 'TIFF', icon: '🖼️' },
  } as const,

  // File size limits by type
  MAX_FILE_SIZE_MB: {
    image: 20,   // Images up to 20MB
    document: 50, // PDFs/Docs up to 50MB
  },

  MAX_FILE_SIZE_BYTES: {
    image: 20 * 1024 * 1024,
    document: 50 * 1024 * 1024,
  },

  // Max files per plan
  MAX_FILES_PER_PLAN: {
    FREE: 2,
    BASIC: 5,
    PRO: 10,
    MAX_PRO: 20,
  } as const,

  // Storage duration by plan (hours, null = unlimited)
  STORAGE_DURATION_HOURS: {
    FREE: 24,
    BASIC: null,
    PRO: null,
    MAX_PRO: null,
  } as const,

  // Supabase storage bucket
  BUCKET_NAME: 'teachai-uploads',

  // Chunk size for multipart upload (5MB)
  CHUNK_SIZE_BYTES: 5 * 1024 * 1024,

  // Warning threshold (hours before expiry)
  EXPIRY_WARNING_HOURS: 4,

  // Allowed file signatures (magic bytes) for security
  FILE_SIGNATURES: {
    pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
    jpg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    docx: [0x50, 0x4B, 0x03, 0x04], // ZIP (DOCX is ZIP-based)
    webp: [0x52, 0x49, 0x46, 0x46], // RIFF
  },
} as const

export type AllowedMimeType = keyof typeof UPLOAD_CONFIG.ALLOWED_MIME_TYPES
export type PlanKey = keyof typeof UPLOAD_CONFIG.MAX_FILES_PER_PLAN

export function getFileTypeInfo(mimeType: string) {
  return UPLOAD_CONFIG.ALLOWED_MIME_TYPES[mimeType as AllowedMimeType] || null
}

export function isAllowedMimeType(mimeType: string): boolean {
  return mimeType in UPLOAD_CONFIG.ALLOWED_MIME_TYPES
}

export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function getMaxFileSize(mimeType: string): number {
  return isImageType(mimeType)
    ? UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES.image
    : UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES.document
}

export function getMaxFilesForPlan(plan: PlanKey): number {
  return UPLOAD_CONFIG.MAX_FILES_PER_PLAN[plan]
}

export function getStorageDurationHours(plan: PlanKey): number | null {
  return UPLOAD_CONFIG.STORAGE_DURATION_HOURS[plan]
}

export function calculateExpiryDate(plan: PlanKey): Date | null {
  const hours = getStorageDurationHours(plan)
  if (!hours) return null
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

// Human-readable file size
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Generate a unique storage key for a file
export function generateStorageKey(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50)
  return `uploads/${userId}/${timestamp}-${random}-${safeName}`
}
