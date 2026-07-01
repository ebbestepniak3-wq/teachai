'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Loader2, Clock, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

type UploadStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED'

interface StatusStep {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const STEPS: StatusStep[] = [
  { id: 'upload', label: 'Hochgeladen', description: 'Datei erfolgreich empfangen', icon: Upload },
  { id: 'processing', label: 'Bildverarbeitung', description: 'Kontrast, Rotation, Schärfe', icon: Loader2 },
  { id: 'ocr', label: 'Texterkennung', description: 'OCR läuft…', icon: Loader2 },
  { id: 'ready', label: 'Bereit', description: 'Bereit zur KI-Bewertung', icon: CheckCircle },
]

function getActiveStep(status: UploadStatus): number {
  switch (status) {
    case 'PENDING': return 0
    case 'PROCESSING': return 2
    case 'READY': return 4
    case 'FAILED': return -1
    default: return 0
  }
}

interface UploadStatusIndicatorProps {
  uploadId: string
  initialStatus: UploadStatus
  onReady?: (uploadId: string) => void
}

export function UploadStatusIndicator({ uploadId, initialStatus, onReady }: UploadStatusIndicatorProps) {
  const [status, setStatus] = useState<UploadStatus>(initialStatus)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (status === 'READY' || status === 'FAILED') return

    const startTime = Date.now()
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload/status?id=${uploadId}`)
        if (!res.ok) return
        const data = await res.json()
        const newStatus = data.data?.status as UploadStatus

        if (newStatus !== status) {
          setStatus(newStatus)
          if (newStatus === 'READY') {
            onReady?.(uploadId)
            clearInterval(poll)
          }
          if (newStatus === 'FAILED') {
            clearInterval(poll)
          }
        }
      } catch {}
    }, 2000)

    return () => {
      clearInterval(timer)
      clearInterval(poll)
    }
  }, [uploadId, status])

  const activeStep = getActiveStep(status)
  const isFailed = status === 'FAILED'

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className={cn(
        'flex items-center gap-3 rounded-2xl border p-4',
        status === 'READY' && 'border-emerald-500/20 bg-emerald-500/5',
        status === 'FAILED' && 'border-red-500/20 bg-red-500/5',
        (status === 'PROCESSING' || status === 'PENDING') && 'border-blue-500/20 bg-blue-500/5',
      )}>
        {status === 'READY' && <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />}
        {status === 'FAILED' && <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />}
        {(status === 'PROCESSING' || status === 'PENDING') && (
          <Loader2 className="h-6 w-6 text-blue-400 animate-spin shrink-0" />
        )}
        <div>
          <p className="text-sm font-semibold">
            {status === 'READY' && 'Verarbeitung abgeschlossen!'}
            {status === 'FAILED' && 'Verarbeitung fehlgeschlagen'}
            {status === 'PROCESSING' && 'Wird verarbeitet…'}
            {status === 'PENDING' && 'Warte auf Verarbeitung…'}
          </p>
          <p className="text-xs text-muted-foreground">
            {status === 'READY' && 'Die Datei ist bereit zur KI-Bewertung.'}
            {status === 'FAILED' && 'Bitte laden Sie die Datei erneut hoch.'}
            {(status === 'PROCESSING' || status === 'PENDING') && `${elapsed}s vergangen…`}
          </p>
        </div>
      </div>

      {/* Progress steps */}
      {!isFailed && (
        <div className="relative flex items-start gap-0">
          {STEPS.map((step, index) => {
            const isCompleted = index < activeStep
            const isActive = index === activeStep - 1 || (activeStep === 0 && index === 0)
            const isPending = index >= activeStep

            const Icon = step.icon

            return (
              <div key={step.id} className="flex flex-1 flex-col items-center relative">
                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className="absolute left-1/2 top-4 h-0.5 w-full z-0">
                    <div
                      className={cn(
                        'h-full transition-all duration-500',
                        isCompleted ? 'bg-brand-500' : 'bg-border'
                      )}
                    />
                  </div>
                )}

                {/* Step circle */}
                <div className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isCompleted && 'border-brand-500 bg-brand-500',
                  isActive && 'border-blue-400 bg-blue-400/10',
                  isPending && !isActive && 'border-border bg-background',
                )}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : isActive ? (
                    <Icon className="h-4 w-4 text-blue-400 animate-spin" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-border" />
                  )}
                </div>

                {/* Step label */}
                <div className="mt-2 text-center px-1">
                  <p className={cn(
                    'text-[11px] font-medium leading-tight',
                    isCompleted ? 'text-brand-400' :
                    isActive ? 'text-blue-400' :
                    'text-muted-foreground'
                  )}>
                    {step.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
