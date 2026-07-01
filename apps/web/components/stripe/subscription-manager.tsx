'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Check, X, Loader2, CreditCard, ExternalLink, Zap, Sparkles,
  Rocket, Crown, AlertCircle, CheckCircle, Calendar, ToggleLeft,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate, formatCurrency } from '@/lib/utils'

interface SubscriptionManagerProps {
  currentPlan: string
  planConfig: {
    name: string
    price: number
    bewertungenProMonat: number
    maxDateien: number
    features: readonly string[]
  }
  subscription: {
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    trialEnd: string | null
    stripeSubscriptionId: string | null
  } | null
  usageThisMonth: number
  monthlyLimit: number
  successMessage: boolean
  canceledMessage: boolean
}

const planIcons = { FREE: Zap, BASIC: Sparkles, PRO: Rocket, MAX_PRO: Crown }
const planColors = {
  FREE: 'from-slate-500 to-slate-600',
  BASIC: 'from-blue-500 to-blue-600',
  PRO: 'from-brand-500 to-brand-700',
  MAX_PRO: 'from-amber-500 to-orange-500',
}

const PLANS_CONFIG = [
  {
    id: 'FREE',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Zap,
    gradient: 'from-slate-500 to-slate-600',
    features: ['10 Bewertungen/Monat', '2 Dateien gleichzeitig', '24h Speicherung', 'Standard-Geschwindigkeit'],
  },
  {
    id: 'BASIC',
    name: 'Basic',
    monthlyPrice: 799,
    yearlyPrice: 7670,
    icon: Sparkles,
    gradient: 'from-blue-500 to-blue-600',
    features: ['20 Bewertungen/Monat', '5 Dateien gleichzeitig', 'Unbegrenzte Speicherung', 'Schnellere KI', 'Priorisierte Warteschlange'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    monthlyPrice: 1299,
    yearlyPrice: 12470,
    icon: Rocket,
    gradient: 'from-brand-500 to-brand-700',
    features: ['40 Bewertungen/Monat', '10 Dateien gleichzeitig', 'Unbegrenzte Speicherung', 'Noch schnellere KI', 'KI-Assistent', 'Erweiterte Optionen'],
    popular: true,
  },
  {
    id: 'MAX_PRO',
    name: 'Max Pro',
    monthlyPrice: 1999,
    yearlyPrice: 19190,
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
    features: ['80 Bewertungen/Monat', '20 Dateien gleichzeitig', 'Höchste Priorität', 'Schnellste Verarbeitung', 'Premium-Support', 'Beta-Funktionen'],
  },
]

export function SubscriptionManager({
  currentPlan, planConfig, subscription, usageThisMonth, monthlyLimit,
  successMessage, canceledMessage,
}: SubscriptionManagerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [couponCode, setCouponCode] = useState('')
  const [showCoupon, setShowCoupon] = useState(false)

  const Icon = planIcons[currentPlan as keyof typeof planIcons] || Zap
  const gradient = planColors[currentPlan as keyof typeof planColors] || 'from-slate-500 to-slate-600'
  const usagePercent = Math.round((usageThisMonth / monthlyLimit) * 100)
  const isCanceling = subscription?.cancelAtPeriodEnd
  const isTrialing = subscription?.status === 'TRIALING'

  async function upgrade(planId: string) {
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, interval, couponCode: couponCode || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.data.checkoutUrl
    } catch (err: any) {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  async function openPortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.data.url
    } catch (err: any) {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  async function cancelOrResume(action: 'cancel' | 'resume') {
    setLoading(action)
    try {
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: action === 'cancel' ? 'Kündigung eingereicht' : 'Kündigung zurückgezogen', description: data.data.message })
      window.location.reload()
    } catch (err: any) {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success / Cancel messages */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-500">Zahlung erfolgreich!</p>
            <p className="text-xs text-muted-foreground">Ihr Abonnement wurde erfolgreich aktiviert.</p>
          </div>
        </div>
      )}
      {canceledMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-500">Zahlung abgebrochen. Sie können jederzeit upgraden.</p>
        </div>
      )}

      {/* Current plan card */}
      <Card className="border-primary/20 overflow-hidden">
        <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{planConfig.name}</h2>
                  <Badge variant={subscription?.status === 'ACTIVE' ? 'success' : subscription?.status === 'TRIALING' ? 'info' : 'warning'} className="text-[10px]">
                    {subscription?.status === 'TRIALING' ? '🎁 Testphase' : subscription?.status === 'ACTIVE' ? 'Aktiv' : subscription?.status || 'Aktiv'}
                  </Badge>
                  {isCanceling && (
                    <Badge variant="warning" className="text-[10px]">⚠ Kündigung beantragt</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {currentPlan === 'FREE'
                    ? 'Kostenloses Konto'
                    : `${formatCurrency(planConfig.price)} / Monat`}
                </p>
                {subscription?.currentPeriodEnd && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {isCanceling ? 'Läuft ab am' : 'Nächste Zahlung am'}: {formatDate(subscription.currentPeriodEnd)}
                  </p>
                )}
                {isTrialing && subscription?.trialEnd && (
                  <p className="text-xs text-brand-400 mt-1">
                    Testphase endet am {formatDate(subscription.trialEnd)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {currentPlan !== 'FREE' && (
                <>
                  <Button variant="outline" size="sm" onClick={openPortal} disabled={loading === 'portal'}>
                    {loading === 'portal' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    Zahlungsportal
                  </Button>
                  {isCanceling ? (
                    <Button variant="outline" size="sm" onClick={() => cancelOrResume('resume')} disabled={!!loading}>
                      Kündigung zurückziehen
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => cancelOrResume('cancel')}
                      disabled={!!loading}
                    >
                      Kündigen
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Usage progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Monatliches Kontingent</span>
              <span className="text-sm text-muted-foreground">{usageThisMonth} / {monthlyLimit}</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
            {usagePercent >= 80 && (
              <p className="mt-1.5 text-xs text-amber-500">
                ⚡ {Math.round(monthlyLimit - usageThisMonth)} Bewertungen verbleibend
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan selection */}
      <div>
        {/* Interval toggle */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Plan wechseln</h2>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-1">
            <button
              onClick={() => setInterval('month')}
              className={cn('rounded-lg px-4 py-1.5 text-sm font-medium transition-all', interval === 'month' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}
            >
              Monatlich
            </button>
            <button
              onClick={() => setInterval('year')}
              className={cn('flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all', interval === 'year' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}
            >
              Jährlich
              <Badge variant="success" className="text-[10px]">-20%</Badge>
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS_CONFIG.map((plan) => {
            const PlanIcon = plan.icon
            const isCurrent = plan.id === currentPlan
            const price = interval === 'year' ? plan.yearlyPrice : plan.monthlyPrice
            const monthEquiv = interval === 'year' && plan.yearlyPrice > 0
              ? Math.round(plan.yearlyPrice / 12)
              : plan.monthlyPrice

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl border p-5 transition-all duration-200',
                  isCurrent ? 'border-primary/50 bg-primary/5 shadow-lg' : 'border-border hover:border-primary/30 hover:shadow-md',
                  plan.popular && !isCurrent && 'border-brand-500/30 scale-[1.02]'
                )}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="brand" className="text-[10px] shadow-sm">⭐ Beliebt</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="success" className="text-[10px] shadow-sm">Ihr Plan</Badge>
                  </div>
                )}

                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${plan.gradient} shadow-md mb-4`}>
                  <PlanIcon className="h-5 w-5 text-white" />
                </div>

                <h3 className="font-bold text-lg">{plan.name}</h3>

                <div className="mt-2">
                  {price === 0 ? (
                    <span className="text-2xl font-bold">Kostenlos</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold">
                        {(monthEquiv / 100).toFixed(2).replace('.', ',')} €
                      </span>
                      <span className="text-sm text-muted-foreground">/Mo.</span>
                      {interval === 'year' && (
                        <p className="text-xs text-emerald-500">
                          {(price / 100).toFixed(0)} €/Jahr gespart!
                        </p>
                      )}
                    </>
                  )}
                </div>

                {interval === 'year' && plan.id !== 'FREE' && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    statt {(plan.monthlyPrice / 100).toFixed(2).replace('.', ',')} €/Mo.
                  </p>
                )}

                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular && !isCurrent ? 'gradient' : isCurrent ? 'outline' : 'outline'}
                  size="sm"
                  className="mt-5 w-full"
                  disabled={isCurrent || !!loading}
                  onClick={() => !isCurrent && plan.id !== 'FREE' && upgrade(plan.id)}
                >
                  {loading === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCurrent ? 'Aktueller Plan' : plan.id === 'FREE' ? 'Downgrade' : `Upgrade → ${plan.name}`}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Coupon code */}
        <div className="mt-5">
          <button
            onClick={() => setShowCoupon(!showCoupon)}
            className="text-xs text-primary hover:underline"
          >
            Gutscheincode eingeben
          </button>
          {showCoupon && (
            <div className="mt-2 flex gap-2 max-w-xs">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="TEACHAI20"
                className="flex h-9 flex-1 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button variant="outline" size="sm" onClick={() => setShowCoupon(false)}>
                Anwenden
              </Button>
            </div>
          )}
        </div>

        {/* Trial notice */}
        {currentPlan === 'FREE' && (
          <div className="mt-4 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4 text-center">
            <p className="text-sm font-medium text-brand-400">🎁 7 Tage kostenlos testen</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Alle kostenpflichtigen Pläne beinhalten eine 7-tägige Testphase. Keine Zahlung nötig.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
