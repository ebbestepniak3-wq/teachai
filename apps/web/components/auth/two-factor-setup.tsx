'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Smartphone, Copy, Check, Eye, EyeOff, Shield, Download, RefreshCw,
  AlertTriangle, CheckCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface TwoFactorSetupProps {
  isEnabled: boolean
  onStatusChange?: (enabled: boolean) => void
}

type Step = 'idle' | 'setup' | 'verify' | 'backup' | 'done'

export function TwoFactorSetup({ isEnabled, onStatusChange }: TwoFactorSetupProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('idle')
  const [secret, setSecret] = useState('')
  const [qrUri, setQrUri] = useState('')
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisable, setShowDisable] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  async function startSetup() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSecret(data.data.secret)
      setQrUri(data.data.uri)
      setStep('setup')
    } catch (e: any) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function verifyAndEnable() {
    if (code.length !== 6) {
      toast({ title: 'Ungültiger Code', description: 'Bitte geben Sie einen 6-stelligen Code ein.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBackupCodes(data.data.backupCodes)
      setStep('backup')
      onStatusChange?.(true)
    } catch (e: any) {
      toast({ title: 'Ungültiger Code', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function disableTwoFactor() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: '2FA deaktiviert', description: 'Zwei-Faktor-Authentifizierung wurde deaktiviert.', variant: 'default' })
      setShowDisable(false)
      setDisablePassword('')
      onStatusChange?.(false)
    } catch (e: any) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function copySecret() {
    await navigator.clipboard.writeText(secret.replace(/\s/g, ''))
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  function downloadBackupCodes() {
    const content = ['TeacherAI – 2FA Backup-Codes', '='.repeat(30), '', ...backupCodes, '', 'Jeder Code kann nur einmal verwendet werden.'].join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'teachai-backup-codes.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Currently enabled ──
  if (isEnabled && step === 'idle') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Zwei-Faktor-Authentifizierung</p>
              <Badge variant="success" className="mt-0.5 text-[10px]">Aktiviert</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowDisable(!showDisable)}>
            Deaktivieren
          </Button>
        </div>

        {showDisable && (
          <Card className="border-destructive/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-destructive font-medium">
                <AlertTriangle className="h-4 w-4" />
                2FA deaktivieren
              </div>
              <p className="text-xs text-muted-foreground">
                Geben Sie Ihr Passwort zur Bestätigung ein. Dies macht Ihr Konto weniger sicher.
              </p>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Ihr Passwort"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={disableTwoFactor} loading={loading}>
                  2FA deaktivieren
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowDisable(false)}>Abbrechen</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ── Step: idle (not enabled) ──
  if (step === 'idle') {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Zwei-Faktor-Authentifizierung</p>
            <p className="text-xs text-muted-foreground">Authenticator-App (TOTP)</p>
          </div>
        </div>
        <Button variant="gradient" size="sm" onClick={startSetup} loading={loading}>
          Aktivieren
        </Button>
      </div>
    )
  }

  // ── Step: setup (show QR + secret) ──
  if (step === 'setup') {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold mb-1">Schritt 1: Authenticator-App scannen</p>
          <p className="text-xs text-muted-foreground mb-4">
            Öffnen Sie Google Authenticator, Authy oder eine ähnliche App und scannen Sie diesen QR-Code.
          </p>
          {/* QR Code placeholder – use a QR library in production */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-brand-500/30 bg-brand-500/5">
              <div className="text-center">
                <Smartphone className="h-8 w-8 text-brand-400 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">QR-Code erscheint hier</p>
                <p className="text-[10px] text-muted-foreground">(In Produktion: qrcode-Bibliothek)</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Oder geben Sie den Code manuell ein:</p>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-2">
              <code className="text-xs font-mono tracking-wider text-brand-400">
                {showSecret ? secret : '••••  ••••  ••••  ••••'}
              </code>
              <button onClick={() => setShowSecret(!showSecret)} className="text-muted-foreground hover:text-foreground">
                {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button onClick={copySecret} className="text-muted-foreground hover:text-foreground">
                {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
        <Button variant="gradient" onClick={() => setStep('verify')} className="w-full">
          Weiter – Code eingeben
        </Button>
      </div>
    )
  }

  // ── Step: verify ──
  if (step === 'verify') {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold mb-1">Schritt 2: Code bestätigen</p>
          <p className="text-xs text-muted-foreground mb-4">
            Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="flex h-14 w-full rounded-xl border border-input bg-background px-4 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('setup')} className="flex-1">Zurück</Button>
          <Button variant="gradient" onClick={verifyAndEnable} loading={loading} className="flex-1"
            disabled={code.length !== 6}>
            2FA aktivieren
          </Button>
        </div>
      </div>
    )
  }

  // ── Step: backup codes ──
  if (step === 'backup') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">2FA erfolgreich aktiviert!</p>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Backup-Codes sichern</p>
          <p className="text-xs text-muted-foreground mb-3">
            Bewahren Sie diese Codes sicher auf. Jeder kann nur einmal verwendet werden.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code) => (
              <div key={code} className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-center font-mono text-xs text-brand-400">
                {code}
              </div>
            ))}
          </div>
        </div>
        <Button variant="outline" onClick={downloadBackupCodes} className="w-full">
          <Download className="h-4 w-4" />
          Backup-Codes herunterladen
        </Button>
        <Button variant="gradient" onClick={() => setStep('done')} className="w-full">
          Fertig
        </Button>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <Shield className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-semibold">Zwei-Faktor-Authentifizierung</p>
          <Badge variant="success" className="mt-0.5 text-[10px]">Aktiviert</Badge>
        </div>
      </div>
    )
  }

  return null
}
