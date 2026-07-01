'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle, AlertCircle, Download, Edit3, RotateCcw, Save,
  ArrowLeft, FileText, TrendingUp, MessageSquare, Star, AlertTriangle,
  Lightbulb, Eye, Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface AufgabeBewertung {
  aufgabe: string
  aufgabenNummer: number
  erreichterPunkte: number
  maxPunkte: number
  prozent: number
  begruendung: string
  fehler: string[]
  korrekteLoesung?: string
  alternativeLoesung?: string
  lehrerKorrektur?: {
    original: number
    angepasst: number
    kommentar: string | null
  }
}

interface ReportData {
  id: string
  gesamtpunkte: number
  maximalpunkte: number
  note: string
  punkteVerteilung: AufgabeBewertung[]
  feedback: string
  staerken: string[]
  schwaechen: string[]
  verbesserungsvorschlaege: string[]
  zusammenfassung: string
  lehrerAnmerkungen: string | null
  finalisiertVon: string
  pdfStorageKey: string | null
}

interface GradingResultViewProps {
  jobId: string
  reportId: string
  fach: string
  schulform: string
  klassenstufe: string
  bundesland: string
  aufgabentyp: string
  fileName: string
  fileType: string
  pageCount: number
  previewUrl: string | null
  report: ReportData
}

export function GradingResultView({
  jobId, reportId, fach, schulform, klassenstufe, bundesland,
  aufgabentyp, fileName, fileType, pageCount, previewUrl, report,
}: GradingResultViewProps) {
  const { toast } = useToast()
  const [editMode, setEditMode] = useState(false)
  const [adjustments, setAdjustments] = useState<Record<string, number>>({})
  const [adjustmentComments, setAdjustmentComments] = useState<Record<string, string>>({})
  const [lehrerAnmerkungen, setLehrerAnmerkungen] = useState(report.lehrerAnmerkungen || '')
  const [currentReport, setCurrentReport] = useState(report)
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState(report.finalisiertVon === 'TEACHER')

  const prozent = Math.round((currentReport.gesamtpunkte / currentReport.maximalpunkte) * 100)

  const noteColor = currentReport.note.startsWith('1') ? 'text-emerald-400' :
    currentReport.note.startsWith('2') ? 'text-blue-400' :
    currentReport.note.startsWith('3') ? 'text-brand-400' :
    currentReport.note.startsWith('4') ? 'text-amber-400' : 'text-red-400'

  const noteBg = currentReport.note.startsWith('1') ? 'from-emerald-500 to-emerald-600' :
    currentReport.note.startsWith('2') ? 'from-blue-500 to-blue-600' :
    currentReport.note.startsWith('3') ? 'from-brand-500 to-brand-700' :
    currentReport.note.startsWith('4') ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600'

  function getAdjustedPoints(aufgabe: string, original: number): number {
    return adjustments[aufgabe] ?? original
  }

  function getAdjustedTotal(): number {
    return currentReport.punkteVerteilung.reduce((sum, a) => {
      return sum + getAdjustedPoints(a.aufgabe, a.erreichterPunkte)
    }, 0)
  }

  async function saveAdjustments(bestaetigt = false) {
    const anpassungen = Object.entries(adjustments).map(([aufgabe, neuesPunkte]) => ({
      aufgabe,
      neuesPunkte,
      kommentar: adjustmentComments[aufgabe],
    }))

    setSaving(true)
    try {
      const res = await fetch('/api/grading/adjust', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          anpassungen,
          lehrerAnmerkungen,
          bestaetigt,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setCurrentReport((prev) => ({
        ...prev,
        gesamtpunkte: data.data.neueGesamtpunkte,
        note: data.data.neueNote,
        punkteVerteilung: data.data.punkteVerteilung,
        finalisiertVon: bestaetigt ? 'TEACHER' : 'AI',
        lehrerAnmerkungen,
      }))

      if (bestaetigt) setConfirmed(true)
      setEditMode(false)
      setAdjustments({})

      toast({
        title: bestaetigt ? 'Bewertung bestätigt!' : 'Anpassungen gespeichert',
        description: `Note: ${data.data.neueNote} · ${data.data.neueGesamtpunkte}/${currentReport.maximalpunkte} Punkte`,
      })
    } catch (error: any) {
      toast({ title: 'Fehler beim Speichern', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function downloadPdf() {
    const res = await fetch(`/api/grading/pdf?reportId=${reportId}`)
    if (!res.ok) {
      toast({ title: 'PDF-Fehler', description: 'PDF konnte nicht generiert werden', variant: 'destructive' })
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bewertung-${fach}-klasse${klassenstufe}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/grading/history" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" />
            Alle Bewertungen
          </Link>
          <h1 className="text-2xl font-bold">Bewertungsergebnis</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {fach} · Klasse {klassenstufe} · {schulform} · {bundesland}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
            <Edit3 className="h-4 w-4" />
            {editMode ? 'Abbrechen' : 'Anpassen'}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPdf}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
          {!confirmed && (
            <Button
              variant="gradient"
              size="sm"
              onClick={() => saveAdjustments(true)}
              disabled={saving}
            >
              <CheckCircle className="h-4 w-4" />
              Bestätigen
            </Button>
          )}
          {confirmed && (
            <Badge variant="success" className="flex items-center gap-1.5 px-3 py-1.5">
              <Shield className="h-3.5 w-3.5" />
              Von Lehrkraft bestätigt
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Grade hero card */}
          <Card className={cn('border-2', currentReport.note.startsWith('1') ? 'border-emerald-500/30' : currentReport.note.startsWith('5') || currentReport.note.startsWith('6') ? 'border-red-500/30' : 'border-brand-500/20')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                {/* Grade circle */}
                <div className={cn('flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-xl', noteBg)}>
                  <span className="text-4xl font-black leading-none">{currentReport.note}</span>
                  <span className="mt-1 text-[11px] font-medium opacity-90">Note</span>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <span className={cn('text-3xl font-bold', noteColor)}>
                      {editMode ? getAdjustedTotal() : currentReport.gesamtpunkte}
                    </span>
                    <span className="text-lg text-muted-foreground">/ {currentReport.maximalpunkte} Punkte</span>
                    <span className="text-sm text-muted-foreground">({prozent}%)</span>
                  </div>

                  <Progress value={prozent} className="mt-3 h-2.5" />

                  <div className="mt-3 flex items-center gap-3">
                    <Badge variant={prozent >= 50 ? 'success' : 'destructive'} className="text-[11px]">
                      {prozent >= 50 ? '✓ Bestanden' : '✗ Nicht bestanden'}
                    </Badge>
                    <Badge variant={confirmed ? 'success' : 'outline'} className="text-[11px]">
                      {confirmed ? '👩‍🏫 Lehrkraft' : '🤖 KI-Vorschlag'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{aufgabentyp}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Punkteverteilung nach Aufgaben
                </span>
                {editMode && (
                  <span className="text-xs text-brand-400 font-normal">
                    Punkte anpassen ↓
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentReport.punkteVerteilung.map((aufgabe) => {
                const adjustedPts = getAdjustedPoints(aufgabe.aufgabe, aufgabe.erreichterPunkte)
                const adjustedPercent = Math.round((adjustedPts / aufgabe.maxPunkte) * 100)
                const wasAdjusted = aufgabe.lehrerKorrektur || adjustments[aufgabe.aufgabe] !== undefined

                return (
                  <div key={aufgabe.aufgabe} className={cn(
                    'rounded-2xl border p-4 transition-all',
                    wasAdjusted && 'border-amber-500/20 bg-amber-500/5',
                    !wasAdjusted && 'border-border'
                  )}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-semibold">{aufgabe.aufgabe}</p>
                          {wasAdjusted && (
                            <Badge variant="warning" className="text-[10px]">Angepasst</Badge>
                          )}
                        </div>

                        <Progress
                          value={adjustedPercent}
                          className="h-1.5 mb-2"
                        />

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {aufgabe.begruendung}
                        </p>

                        {aufgabe.fehler.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {aufgabe.fehler.map((fehler, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-xs text-red-400">
                                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                                {fehler}
                              </div>
                            ))}
                          </div>
                        )}

                        {aufgabe.korrekteLoesung && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs text-emerald-500">
                            <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />
                            Korrekt: {aufgabe.korrekteLoesung}
                          </div>
                        )}
                      </div>

                      {/* Points display / edit */}
                      <div className="shrink-0 text-right">
                        {editMode ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={adjustedPts}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.min(aufgabe.maxPunkte, parseFloat(e.target.value) || 0))
                                  setAdjustments((prev) => ({ ...prev, [aufgabe.aufgabe]: val }))
                                }}
                                step={0.5}
                                min={0}
                                max={aufgabe.maxPunkte}
                                className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              <span className="text-xs text-muted-foreground">/ {aufgabe.maxPunkte}</span>
                            </div>
                            <input
                              type="text"
                              placeholder="Kommentar..."
                              value={adjustmentComments[aufgabe.aufgabe] || ''}
                              onChange={(e) => setAdjustmentComments((prev) => ({ ...prev, [aufgabe.aufgabe]: e.target.value }))}
                              className="w-28 rounded-lg border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="text-xl font-bold">
                              {aufgabe.lehrerKorrektur ? aufgabe.lehrerKorrektur.angepasst : aufgabe.erreichterPunkte}
                            </span>
                            <span className="text-sm text-muted-foreground"> / {aufgabe.maxPunkte}</span>
                            <p className="text-xs text-muted-foreground">{adjustedPercent}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Edit mode save buttons */}
              {editMode && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditMode(false); setAdjustments({}) }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Zurücksetzen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveAdjustments(false)}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4" />
                    Speichern
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => saveAdjustments(true)}
                    disabled={saving}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Speichern & Bestätigen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Allgemeines Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {currentReport.feedback}
              </p>
            </CardContent>
          </Card>

          {/* Teacher notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lehrerkommentar</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={lehrerAnmerkungen}
                onChange={(e) => setLehrerAnmerkungen(e.target.value)}
                rows={3}
                placeholder="Eigene Anmerkungen, Hinweise für den Schüler oder interne Notizen..."
                className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {lehrerAnmerkungen !== (report.lehrerAnmerkungen || '') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => saveAdjustments(false)}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  Kommentar speichern
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentReport.zusammenfassung}
              </p>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 text-emerald-500" />
                Stärken
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentReport.staerken.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                  {s}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                Verbesserungspotenzial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentReport.schwaechen.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                  {s}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Improvement suggestions */}
          {currentReport.verbesserungsvorschlaege.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-400" />
                  Vorschläge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentReport.verbesserungsvorschlaege.map((v, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-blue-400 shrink-0">→</span>
                    {v}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* AI transparency */}
          <Card className="border-brand-500/20 bg-brand-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 mb-2">
                <Shield className="h-3.5 w-3.5" />
                KI-Transparenz
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Diese Bewertung ist ein <strong>Vorschlag</strong> der KI (claude-opus-4-6).
                Die endgültige Note liegt bei der Lehrkraft.
              </p>
              {!confirmed && (
                <Button
                  variant="gradient"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => saveAdjustments(true)}
                  disabled={saving}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Bewertung bestätigen
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
