'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap, ChevronLeft, Send, Loader2, BookOpen,
  Scale, FileText, MessageSquare, AlertCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

const SCHULFORMEN = [
  'Grundschule', 'Hauptschule', 'Realschule', 'Gesamtschule',
  'Gymnasium', 'Berufsschule', 'Förderschule', 'Sonstige',
]

const FAUECHER = [
  'Mathematik', 'Deutsch', 'Englisch', 'Französisch', 'Latein',
  'Physik', 'Chemie', 'Biologie', 'Geschichte', 'Geographie',
  'Sozialkunde', 'Wirtschaft', 'Informatik', 'Kunst', 'Musik',
  'Sport', 'Religion/Ethik', 'Philosophie', 'Sonstiges',
]

const AUFGABENTYPEN = [
  { value: 'KLASSENARBEIT', label: 'Klassenarbeit', icon: '📝' },
  { value: 'TEST', label: 'Test', icon: '✏️' },
  { value: 'KLAUSUR', label: 'Klausur', icon: '📋' },
  { value: 'HAUSAUFGABE', label: 'Hausaufgabe', icon: '🏠' },
  { value: 'PROJEKT', label: 'Projekt', icon: '📊' },
  { value: 'SONSTIGES', label: 'Sonstiges', icon: '📄' },
] as const

const BEWERTUNGSSCHWERPUNKTE = [
  'Inhalt & Argumentation', 'Sprachliche Korrektheit', 'Rechtschreibung & Grammatik',
  'Textstruktur & Aufbau', 'Kreativität & Originalität', 'Rechenweg & Herleitung',
  'Vollständigkeit der Lösung', 'Logische Schlüssigkeit', 'Fachvokabular',
]

interface GradingFormProps {
  uploadId: string
  fileName: string
  defaultBundesland?: string
  defaultSchulform?: string
  onSuccess: (jobId: string) => void
  onCancel: () => void
}

export function GradingForm({
  uploadId, fileName, defaultBundesland, defaultSchulform,
  onSuccess, onCancel,
}: GradingFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    bundesland: defaultBundesland || '',
    schulform: defaultSchulform || '',
    klassenstufe: '',
    fach: '',
    aufgabentyp: 'KLASSENARBEIT' as string,
    bewertungsstrenge: 'AUSGEWOGEN' as 'STRENG' | 'AUSGEWOGEN' | 'KULANT',
    bewertungsschwerpunkte: [] as string[],
    lehrerHinweise: '',
    nachteilsausgleich: '',
    maxPunkte: 100,
  })

  function updateForm(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleSchwerpunkt(schwerpunkt: string) {
    setForm((prev) => ({
      ...prev,
      bewertungsschwerpunkte: prev.bewertungsschwerpunkte.includes(schwerpunkt)
        ? prev.bewertungsschwerpunkte.filter((s) => s !== schwerpunkt)
        : [...prev.bewertungsschwerpunkte, schwerpunkt],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.bundesland || !form.schulform || !form.klassenstufe || !form.fach) {
      toast({
        title: 'Pflichtfelder fehlen',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive',
      })
      return
    }

    if (!uploadId) {
      toast({
        title: 'Upload noch nicht abgeschlossen',
        description: 'Die Datei wird noch verarbeitet.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/grading/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, ...form }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Bewertungsauftrag fehlgeschlagen')
      }

      onSuccess(data.data.jobId)
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const selectClass = "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
  const inputClass = "flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <Card className="border-brand-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            Bewertungsdetails
          </CardTitle>
          <Button variant="ghost" size="icon-sm" onClick={onCancel}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          📄 {fileName}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Basic info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Pflichtangaben
            </p>
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Bundesland *</label>
                  <select
                    value={form.bundesland}
                    onChange={(e) => updateForm('bundesland', e.target.value)}
                    className={selectClass}
                    required
                  >
                    <option value="">Wählen...</option>
                    {BUNDESLAENDER.map((bl) => (
                      <option key={bl} value={bl}>{bl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Schulform *</label>
                  <select
                    value={form.schulform}
                    onChange={(e) => updateForm('schulform', e.target.value)}
                    className={selectClass}
                    required
                  >
                    <option value="">Wählen...</option>
                    {SCHULFORMEN.map((sf) => (
                      <option key={sf} value={sf}>{sf}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Klasse *</label>
                  <select
                    value={form.klassenstufe}
                    onChange={(e) => updateForm('klassenstufe', e.target.value)}
                    className={selectClass}
                    required
                  >
                    <option value="">Wählen...</option>
                    {Array.from({ length: 13 }, (_, i) => i + 1).map((k) => (
                      <option key={k} value={String(k)}>{k}. Klasse</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Fach *</label>
                  <select
                    value={form.fach}
                    onChange={(e) => updateForm('fach', e.target.value)}
                    className={selectClass}
                    required
                  >
                    <option value="">Wählen...</option>
                    {FAUECHER.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Aufgabentyp */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Art des Leistungsnachweises
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {AUFGABENTYPEN.map((typ) => (
                <button
                  key={typ.value}
                  type="button"
                  onClick={() => updateForm('aufgabentyp', typ.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition-all',
                    form.aufgabentyp === typ.value
                      ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                      : 'border-border hover:border-border/80 hover:bg-accent text-muted-foreground'
                  )}
                >
                  <span className="text-base">{typ.icon}</span>
                  <span className="font-medium">{typ.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Max Punkte */}
          <div>
            <label className="text-xs font-medium mb-1 block">
              Maximale Punktzahl
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.maxPunkte}
                onChange={(e) => updateForm('maxPunkte', parseInt(e.target.value) || 100)}
                min={1}
                max={1000}
                className={cn(inputClass, 'w-24')}
              />
              <span className="text-xs text-muted-foreground">Punkte (1–1000)</span>
            </div>
          </div>

          {/* Bewertungsstrenge */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Bewertungsstrenge
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'STRENG', label: 'Streng', emoji: '🎯', desc: 'Hohe Maßstäbe' },
                { value: 'AUSGEWOGEN', label: 'Ausgewogen', emoji: '⚖️', desc: 'Standard' },
                { value: 'KULANT', label: 'Kulant', emoji: '🤝', desc: 'Wohlwollend' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateForm('bewertungsstrenge', opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-xl border p-2 text-xs transition-all',
                    form.bewertungsstrenge === opt.value
                      ? 'border-brand-500/50 bg-brand-500/10'
                      : 'border-border hover:bg-accent'
                  )}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span className={cn('font-medium', form.bewertungsstrenge === opt.value ? 'text-brand-400' : 'text-foreground')}>
                    {opt.label}
                  </span>
                  <span className="text-muted-foreground text-[10px]">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bewertungsschwerpunkte */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Schwerpunkte (optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BEWERTUNGSSCHWERPUNKTE.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => toggleSchwerpunkt(sp)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs transition-all',
                    form.bewertungsschwerpunkte.includes(sp)
                      ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                      : 'border-border text-muted-foreground hover:border-brand-500/30 hover:text-foreground'
                  )}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Lehrerhinweise */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Individuelle Hinweise (optional)
            </label>
            <textarea
              value={form.lehrerHinweise}
              onChange={(e) => updateForm('lehrerHinweise', e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="z.B. &#34;Argumentation stärker gewichten&#34; oder &#34;Handschrift sehr unleserlich&#34;"
              className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-[10px] text-muted-foreground text-right">
              {form.lehrerHinweise.length}/2000
            </p>
          </div>

          {/* Nachteilsausgleich */}
          <div>
            <label className="text-xs font-medium block mb-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-amber-400" />
              Nachteilsausgleich (optional)
            </label>
            <input
              type="text"
              value={form.nachteilsausgleich}
              onChange={(e) => updateForm('nachteilsausgleich', e.target.value)}
              maxLength={500}
              placeholder="z.B. Legasthenie, Dyskalkulie, verlängerte Bearbeitungszeit..."
              className={inputClass}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button type="submit" variant="gradient" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird erstellt…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Bewertung starten
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
