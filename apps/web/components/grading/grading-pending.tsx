'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Brain, FileText, CheckCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GradingPendingProps {
  jobId: string
  fach: string
  klassenstufe: string
  fileName: string
}

const STEPS = [
  { id: 'queue', label: 'Auftrag in Warteschlange', icon: FileText, estimateS: 2 },
  { id: 'analyze', label: 'Text wird analysiert', icon: Brain, estimateS: 15 },
  { id: 'grade', label: 'KI bewertet Aufgaben', icon: Sparkles, estimateS: 25 },
  { id: 'finalize', label: 'Bericht wird erstellt', icon: CheckCircle, estimateS: 5 },
]

const MESSAGES = [
  'KI liest die Schülerantworten…',
  'Inhalt wird auf Korrektheit geprüft…',
  'Teilpunkte werden vergeben…',
  'Alternative Lösungswege werden geprüft…',
  'Feedback wird formuliert…',
  'Stärken und Schwächen werden analysiert…',
  'Verbesserungsvorschläge werden erstellt…',
  'Bewertungsbericht wird fertiggestellt…',
]

export function GradingPending({ jobId, fach, klassenstufe, fileName }: GradingPendingProps) {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [triggered, setTriggered] = useState(false)

  // Trigger grading execution
  useEffect(() => {
    if (triggered) return
    setTriggered(true)

    fetch('/api/grading/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    }).catch(() => {})
  }, [jobId, triggered])

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Rotate messages
  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  // Advance steps based on elapsed time
  useEffect(() => {
    let cumulative = 0
    for (let i = 0; i < STEPS.length; i++) {
      cumulative += STEPS[i].estimateS
      if (elapsed < cumulative) {
        setActiveStep(i)
        break
      }
    }
  }, [elapsed])

  // Poll for completion
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/grading/result?jobId=${jobId}`)
        if (!res.ok) return
        const data = await res.json()
        const status = data.data?.status

        if (status === 'DONE') {
          clearInterval(poll)
          router.refresh()
        } else if (status === 'FAILED') {
          clearInterval(poll)
          router.refresh()
        }
      } catch {}
    }, 3000)

    return () => clearInterval(poll)
  }, [jobId, router])

  const totalEstimate = STEPS.reduce((s, step) => s + step.estimateS, 0)
  const progressPercent = Math.min(95, (elapsed / totalEstimate) * 100)

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 mb-6">
            <Brain className="h-10 w-10 text-brand-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold">KI bewertet Ihre Arbeit</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {fach} · Klasse {klassenstufe} · {fileName}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground animate-fade-in" key={messageIndex}>
              {MESSAGES[messageIndex]}
            </p>
            <span className="text-xs text-muted-foreground">{elapsed}s</span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isCompleted = i < activeStep
            const isActive = i === activeStep
            const isPending = i > activeStep
            const Icon = step.icon

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-4 rounded-2xl border p-4 transition-all duration-500',
                  isCompleted && 'border-emerald-500/20 bg-emerald-500/5',
                  isActive && 'border-brand-500/30 bg-brand-500/5 shadow-sm',
                  isPending && 'border-border opacity-40'
                )}
              >
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
                  isCompleted && 'bg-emerald-500',
                  isActive && 'bg-brand-500',
                  isPending && 'bg-muted'
                )}>
                  {isCompleted
                    ? <CheckCircle className="h-5 w-5 text-white" />
                    : isActive
                    ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                    : <Icon className="h-5 w-5 text-muted-foreground" />
                  }
                </div>
                <div className="flex-1">
                  <p className={cn(
                    'text-sm font-medium',
                    isCompleted && 'text-emerald-500',
                    isActive && 'text-foreground',
                    isPending && 'text-muted-foreground'
                  )}>
                    {step.label}
                  </p>
                </div>
                {isActive && (
                  <span className="text-xs text-brand-400 shrink-0">
                    ~{step.estimateS}s
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Info */}
        <div className="rounded-2xl border border-border bg-muted/20 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Die KI analysiert Ihren Text sorgfältig auf Korrektheit, Vollständigkeit und
            alternative Lösungswege. Dies dauert typischerweise 30–90 Sekunden.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Diese Seite aktualisiert sich automatisch, wenn die Bewertung fertig ist.
          </p>
        </div>
      </div>
    </div>
  )
}
