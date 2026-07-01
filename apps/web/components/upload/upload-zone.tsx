'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, X, CheckCircle, AlertCircle, FileText, Image,
  Clock, Trash2, Eye, Loader2, Plus, ChevronRight, Info,
  Zap, BookOpen, GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { cn, formatFileSize, formatDate } from '@/lib/utils'
import { GradingForm } from '@/components/upload/grading-form'

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'processing' | 'ready' | 'error'
  progress: number
  uploadId?: string
  error?: string
  previewUrl?: string
}

interface RecentUpload {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  status: string
  pageCount: number | null
  expiresAt: string | null
  createdAt: string
}

interface UploadZoneProps {
  plan: string
  maxFiles: number
  remaining: number
  monthlyLimit: number
  usageThisMonth: number
  bundesland?: string | null
  schulform?: string | null
  recentUploads: RecentUpload[]
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'image/tiff': ['.tiff', '.tif'],
}

const ACCEPT_STRING = Object.entries(ACCEPTED_TYPES)
  .map(([type, exts]) => [type, ...exts].join(','))
  .join(',')

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />
  return <FileText className="h-5 w-5" />
}

const statusConfig = {
  pending: { label: 'Wartend', color: 'text-muted-foreground', bg: 'bg-muted/30' },
  uploading: { label: 'Wird hochgeladen', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  processing: { label: 'OCR läuft', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ready: { label: 'Bereit zur Bewertung', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  error: { label: 'Fehler', color: 'text-red-400', bg: 'bg-red-500/10' },
}

export function UploadZone({
  plan, maxFiles, remaining, monthlyLimit, usageThisMonth,
  bundesland, schulform, recentUploads,
}: UploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null)
  const [showGradingForm, setShowGradingForm] = useState(false)
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  const { toast } = useToast()
  const router = useRouter()

  // Poll for status updates on processing files
  useEffect(() => {
    const processingIds = files
      .filter((f) => f.status === 'uploading' || f.status === 'processing')
      .map((f) => f.uploadId)
      .filter(Boolean) as string[]

    if (processingIds.length === 0) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload/status?ids=${processingIds.join(',')}`)
        if (!res.ok) return
        const data = await res.json()
        const uploads = data.data?.uploads || []

        setFiles((prev) =>
          prev.map((f) => {
            const serverUpload = uploads.find((u: any) => u.id === f.uploadId)
            if (!serverUpload) return f

            if (serverUpload.status === 'READY') {
              return { ...f, status: 'ready', progress: 100, previewUrl: serverUpload.previewUrl }
            }
            if (serverUpload.status === 'FAILED') {
              return { ...f, status: 'error', error: 'Verarbeitung fehlgeschlagen' }
            }
            return f
          })
        )
      } catch {}
    }, 2000)

    return () => clearInterval(interval)
  }, [files])

  function validateFile(file: File): string | null {
    const allowedTypes = Object.keys(ACCEPTED_TYPES)
    if (!allowedTypes.includes(file.type)) {
      return `Dateityp nicht unterstützt: ${file.name}`
    }
    const maxSize = file.type.startsWith('image/') ? 20 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      const maxMB = file.type.startsWith('image/') ? 20 : 50
      return `Datei zu groß: ${file.name} (max. ${maxMB} MB)`
    }
    return null
  }

  function addFiles(newFiles: FileList | File[]) {
    const fileArray = Array.from(newFiles)

    // Check max files per plan
    const currentCount = files.filter((f) => f.status !== 'error').length
    if (currentCount + fileArray.length > maxFiles) {
      toast({
        title: `Zu viele Dateien`,
        description: `Ihr ${plan}-Plan erlaubt maximal ${maxFiles} Dateien gleichzeitig.`,
        variant: 'destructive',
      })
      return
    }

    // Check monthly remaining
    if (fileArray.length > remaining) {
      toast({
        title: 'Kontingent fast erschöpft',
        description: `Sie können nur noch ${remaining} Bewertungen diesen Monat erstellen.`,
        variant: 'destructive',
      })
    }

    const uploadFiles: UploadFile[] = []
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        toast({ title: 'Ungültige Datei', description: error, variant: 'destructive' })
        continue
      }
      uploadFiles.push({
        id: Math.random().toString(36).slice(2),
        file,
        status: 'pending',
        progress: 0,
      })
    }

    setFiles((prev) => [...prev, ...uploadFiles])
  }

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (dragCounter.current === 1) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    const dropped = e.dataTransfer.files
    if (dropped.length > 0) addFiles(dropped)
  }, [maxFiles, files, remaining])

  async function uploadFile(uploadFile: UploadFile) {
    setFiles((prev) =>
      prev.map((f) => f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 10 } : f)
    )

    try {
      const formData = new FormData()
      formData.append('files', uploadFile.file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id && f.progress < 80
              ? { ...f, progress: f.progress + Math.random() * 15 }
              : f
          )
        )
      }, 300)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      clearInterval(progressInterval)

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload fehlgeschlagen')
      }

      const uploadResult = data.data?.uploads?.[0]
      if (!uploadResult || uploadResult.status === 'FAILED') {
        throw new Error(uploadResult?.error || 'Upload fehlgeschlagen')
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'processing', progress: 90, uploadId: uploadResult.uploadId }
            : f
        )
      )

      toast({
        title: 'Datei hochgeladen',
        description: `"${uploadFile.file.name}" wird verarbeitet…`,
      })
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', progress: 0, error: error.message || 'Upload fehlgeschlagen' }
            : f
        )
      )
      toast({
        title: 'Upload fehlgeschlagen',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  async function uploadAllPending() {
    const pending = files.filter((f) => f.status === 'pending')
    await Promise.all(pending.map(uploadFile))
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  async function deleteUpload(uploadId: string) {
    try {
      const res = await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
      })
      if (res.ok) {
        toast({ title: 'Datei gelöscht' })
        router.refresh()
      }
    } catch {
      toast({ title: 'Fehler beim Löschen', variant: 'destructive' })
    }
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const readyCount = files.filter((f) => f.status === 'ready').length
  const processingCount = files.filter((f) => f.status === 'uploading' || f.status === 'processing').length

  const selectedReady = files.find((f) => f.id === selectedUploadId && f.status === 'ready')

  return (
    <div className="space-y-6">
      {/* Quota bar */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/50 p-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Monatliches Kontingent</span>
            <span className="text-sm text-muted-foreground">
              {usageThisMonth}/{monthlyLimit} Bewertungen
            </span>
          </div>
          <Progress value={(usageThisMonth / monthlyLimit) * 100} className="h-1.5" />
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold">{remaining}</p>
          <p className="text-xs text-muted-foreground">verbleibend</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Upload area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Drop zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 cursor-pointer select-none',
              isDragging
                ? 'border-brand-500 bg-brand-500/10 scale-[1.01] shadow-xl shadow-brand-500/10'
                : 'border-border hover:border-brand-500/50 hover:bg-brand-500/5 bg-card/30'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT_STRING}
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />

            <div className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200 mb-4',
              isDragging ? 'bg-brand-500/20 scale-110' : 'bg-muted/50'
            )}>
              {isDragging
                ? <Plus className="h-8 w-8 text-brand-400 animate-bounce" />
                : <Upload className="h-8 w-8 text-muted-foreground" />
              }
            </div>

            {isDragging ? (
              <div>
                <p className="text-lg font-bold text-brand-400">Dateien loslassen</p>
                <p className="mt-1 text-sm text-muted-foreground">Dateien werden sofort verarbeitet</p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold">
                  Dateien hierher ziehen oder{' '}
                  <span className="text-brand-400 hover:underline">auswählen</span>
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  PDF, DOCX, ODT, JPG, PNG, WebP, HEIC, TIFF
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {[
                    `Max. ${maxFiles} Dateien (${plan})`,
                    'Bilder bis 20 MB',
                    'Dokumente bis 50 MB',
                  ].map((info) => (
                    <span key={info} className="flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                      <Info className="h-3 w-3" />
                      {info}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{files.length} Datei(en) ausgewählt</p>
                <div className="flex gap-2">
                  {pendingCount > 0 && (
                    <Button variant="gradient" size="sm" onClick={uploadAllPending}>
                      <Upload className="h-4 w-4" />
                      {pendingCount} hochladen
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                    Alle entfernen
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {files.map((f) => {
                  const sc = statusConfig[f.status]
                  return (
                    <div
                      key={f.id}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 transition-all',
                        f.status === 'ready' && 'border-emerald-500/20 bg-emerald-500/5',
                        f.status === 'error' && 'border-red-500/20 bg-red-500/5',
                        f.status === 'processing' && 'border-amber-500/20 bg-amber-500/5',
                        f.status === 'uploading' && 'border-blue-500/20 bg-blue-500/5',
                        f.status === 'pending' && 'border-border bg-card/30',
                      )}
                    >
                      {/* Icon */}
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', sc.bg)}>
                        {f.status === 'uploading' || f.status === 'processing'
                          ? <Loader2 className={cn('h-4.5 w-4.5 animate-spin', sc.color)} />
                          : f.status === 'ready'
                          ? <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                          : f.status === 'error'
                          ? <AlertCircle className="h-4.5 w-4.5 text-red-500" />
                          : <span className={sc.color}>{getFileIcon(f.file.type)}</span>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.file.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{formatFileSize(f.file.size)}</span>
                          <span className={cn('text-xs font-medium', sc.color)}>{sc.label}</span>
                          {f.error && (
                            <span className="text-xs text-red-400 truncate">{f.error}</span>
                          )}
                        </div>
                        {(f.status === 'uploading' || f.status === 'processing') && (
                          <Progress value={f.progress} className="mt-1.5 h-1" />
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {f.status === 'ready' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedUploadId(f.id)
                              setShowGradingForm(true)
                            }}
                            title="Bewertung starten"
                            className="text-emerald-500"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                        {f.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => uploadFile(f)}
                            title="Hochladen"
                          >
                            <Upload className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeFile(f.id)}
                          title="Entfernen"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Start grading CTA */}
              {readyCount > 0 && !showGradingForm && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {readyCount} Datei{readyCount > 1 ? 'en' : ''} bereit!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      OCR abgeschlossen. Jetzt Bewertungsdetails eingeben.
                    </p>
                  </div>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => {
                      const firstReady = files.find((f) => f.status === 'ready')
                      if (firstReady) {
                        setSelectedUploadId(firstReady.id)
                        setShowGradingForm(true)
                      }
                    }}
                  >
                    Weiter
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Grading form or recent uploads */}
        <div className="lg:col-span-2 space-y-4">
          {showGradingForm && selectedUploadId ? (
            <GradingForm
              uploadId={files.find((f) => f.id === selectedUploadId)?.uploadId || ''}
              fileName={files.find((f) => f.id === selectedUploadId)?.file.name || ''}
              defaultBundesland={bundesland || ''}
              defaultSchulform={schulform || ''}
              onSuccess={(jobId) => {
                setShowGradingForm(false)
                toast({ title: 'Bewertungsauftrag erstellt!', description: 'Die KI bewertet Ihre Arbeit.' })
              }}
              onCancel={() => setShowGradingForm(false)}
            />
          ) : (
            <>
              {/* Hints */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    Hinweise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: BookOpen, text: 'Digitale PDFs werden sofort verarbeitet' },
                    { icon: Image, text: 'Fotos: gut beleuchtet, gerade ausgerichtet' },
                    { icon: Zap, text: 'Handschrift wird automatisch erkannt' },
                    { icon: GraduationCap, text: 'Mehrere Dateien = Bewertung nacheinander' },
                  ].map((hint) => (
                    <div key={hint.text} className="flex items-start gap-2.5">
                      <hint.icon className="h-4 w-4 shrink-0 text-brand-400 mt-0.5" />
                      <p className="text-xs text-muted-foreground">{hint.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent uploads */}
              {recentUploads.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Zuletzt hochgeladen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recentUploads.map((upload) => (
                      <div key={upload.id} className="group flex items-center gap-2.5 rounded-xl border border-border p-2.5 hover:bg-accent/50 transition-colors">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                          {upload.fileType.startsWith('image/')
                            ? <Image className="h-3.5 w-3.5 text-muted-foreground" />
                            : <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{upload.fileName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge
                              variant={upload.status === 'READY' ? 'success' : upload.status === 'PROCESSING' ? 'info' : 'default'}
                              className="text-[9px] py-0 h-4"
                            >
                              {upload.status === 'READY' ? 'Bereit' : upload.status === 'PROCESSING' ? 'Läuft' : upload.status}
                            </Badge>
                            {upload.pageCount && (
                              <span className="text-[10px] text-muted-foreground">{upload.pageCount} Seiten</span>
                            )}
                            {upload.expiresAt && (
                              <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDate(upload.expiresAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {upload.status === 'READY' && (
                            <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => deleteUpload(upload.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
