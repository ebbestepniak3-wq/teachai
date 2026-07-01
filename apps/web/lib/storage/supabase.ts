// lib/storage/supabase.ts – File storage via Supabase Storage

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { UPLOAD_CONFIG, generateStorageKey } from '@/lib/upload/config'

// Server-side Supabase client (with service role)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase-Konfiguration fehlt (URL oder Service Role Key)')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

export interface UploadResult {
  success: boolean
  storageKey?: string
  publicUrl?: string
  error?: string
}

export interface PresignedUrlResult {
  success: boolean
  uploadUrl?: string
  storageKey?: string
  error?: string
}

// Upload a file buffer directly to Supabase Storage
export async function uploadFileToStorage(
  buffer: Buffer,
  userId: string,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  try {
    const supabase = getSupabaseAdmin()
    const storageKey = generateStorageKey(userId, fileName)

    const { data, error } = await supabase.storage
      .from(UPLOAD_CONFIG.BUCKET_NAME)
      .upload(storageKey, buffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl: '3600',
      })

    if (error) {
      logger.error('Supabase upload error', { error: error.message, storageKey })
      return { success: false, error: `Upload fehlgeschlagen: ${error.message}` }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(UPLOAD_CONFIG.BUCKET_NAME)
      .getPublicUrl(storageKey)

    logger.info('File uploaded to storage', { storageKey, size: buffer.length })
    return {
      success: true,
      storageKey: data.path,
      publicUrl: urlData.publicUrl,
    }
  } catch (error) {
    logger.error('Storage upload exception', { error })
    return { success: false, error: 'Speicherfehler beim Upload' }
  }
}

// Generate a presigned upload URL for direct client uploads
export async function getPresignedUploadUrl(
  userId: string,
  fileName: string,
  mimeType: string
): Promise<PresignedUrlResult> {
  try {
    const supabase = getSupabaseAdmin()
    const storageKey = generateStorageKey(userId, fileName)

    const { data, error } = await supabase.storage
      .from(UPLOAD_CONFIG.BUCKET_NAME)
      .createSignedUploadUrl(storageKey)

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      uploadUrl: data.signedUrl,
      storageKey,
    }
  } catch (error) {
    logger.error('Presign URL error', { error })
    return { success: false, error: 'URL-Generierung fehlgeschlagen' }
  }
}

// Get a signed download URL (for previews)
export async function getSignedDownloadUrl(storageKey: string, expiresIn = 3600): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.storage
      .from(UPLOAD_CONFIG.BUCKET_NAME)
      .createSignedUrl(storageKey, expiresIn)

    if (error) {
      logger.error('Signed URL error', { error: error.message })
      return null
    }

    return data.signedUrl
  } catch {
    return null
  }
}

// Delete a file from storage
export async function deleteFileFromStorage(storageKey: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase.storage
      .from(UPLOAD_CONFIG.BUCKET_NAME)
      .remove([storageKey])

    if (error) {
      logger.error('Storage delete error', { error: error.message, storageKey })
      return false
    }

    logger.info('File deleted from storage', { storageKey })
    return true
  } catch {
    return false
  }
}

// Delete multiple files
export async function deleteFilesFromStorage(storageKeys: string[]): Promise<void> {
  if (!storageKeys.length) return
  try {
    const supabase = getSupabaseAdmin()
    await supabase.storage.from(UPLOAD_CONFIG.BUCKET_NAME).remove(storageKeys)
  } catch (error) {
    logger.error('Bulk delete error', { error })
  }
}

// Get file metadata from storage
export async function getFileMetadata(storageKey: string): Promise<{ size: number } | null> {
  try {
    const supabase = getSupabaseAdmin()
    const folder = storageKey.split('/').slice(0, -1).join('/')
    const file = storageKey.split('/').pop() || ''

    const { data, error } = await supabase.storage
      .from(UPLOAD_CONFIG.BUCKET_NAME)
      .list(folder, { search: file })

    if (error || !data?.length) return null

    return { size: data[0]?.metadata?.size || 0 }
  } catch {
    return null
  }
}

// For development/testing – simulate storage when Supabase is not configured
export async function uploadFileToStorageDev(
  buffer: Buffer,
  userId: string,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const storageKey = generateStorageKey(userId, fileName)
    logger.info('[DEV] Simulated file upload', { storageKey, size: buffer.length, mimeType })
    return {
      success: true,
      storageKey,
      publicUrl: `http://localhost:3000/dev-preview/${storageKey}`,
    }
  }
  return uploadFileToStorage(buffer, userId, fileName, mimeType)
}
