// app/(marketing)/pricing/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Zap, Sparkles, Rocket, Crown } from 'lucide-react'
import { PLAN_CONFIGS } from '@teachai/types'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Preise' }

const planIcons = { FREE: Zap, BASIC: Sparkles, PRO: Rocket, MAX_PRO: Crown }
const planColors = {
  FREE: 'from-slate-500 to-slate-600',
  BASIC: 'from-blue-500 to-blue-600',
  PRO: 'from-brand-500 to-brand-700',
  MAX_PRO: 'from-amber-500 to-orange-500',
}

const featureComparison = [
  { label: 'Bewertungen / Monat', free: '10', basic: '20', pro: '40', max: '80' },
  { label: 'Dateien gleichzeitig', free: '2', basic: '5', pro: '10', max: '20' },
  { label: 'Dateispeicherung', free: '24 Stunden', basic: 'Unbegrenzt', pro: 'Unbegrenzt', max: 'Unbegrenzt' },
  { label: 'PDF-Export', free: false, basic: true, pro: true, max: true },
  { label: 'KI-Assistent', free: false, basic: false, pro: true, max: true },
  { label: 'Statistiken', free: false, basic: false, pro: true, max: true },
  { label: 'Prioritäts-Support', free: false, basic: false, pro: false, max: true },
  { label: 'API-Zugang', free: false, basic: false, pro: false, max: true },
]

export default function PricingPage() {
  return (
    <div className="py-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="brand" className="mb-4">Preise</Badge>
          <h1 className="text-5xl font-bold tracking-tight">
            Einfach & transparent
          </h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Starten Sie kostenlos. Upgrade wenn Sie bereit sind. Jederzeit kündbar.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-20">
          {(Object.entries(PLAN_CONFIGS) as [keyof typeof PLAN_CONFIGS, typeof PLAN_CONFIGS[keyof typeof PLAN_CONFIGS]][]).map(([planKey, config]) => {
            const Icon = planIcons[planKey]
            const isPopular = planKey === 'PRO'

            return (
              <div
                key={planKey}
                className={cn(
                  'relative rounded-2xl border p-6 transition-all duration-200',
                  isPopular
                    ? 'border-brand-500/50 bg-brand-500/5 shadow-2xl shadow-brand-500/10 scale-[1.02]'
                    : 'border-border bg-card hover:shadow-lg'
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge variant="brand" className="shadow-md">⭐ Empfohlen</Badge>
                  </div>
                )}

                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${planColors[planKey]} shadow-lg mb-5`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <h2 className="text-xl font-bold">{config.name}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  {config.price === 0 ? (
                    <span className="text-3xl font-bold">Kostenlos</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">
                        {(config.price / 100).toFixed(2).replace('.', ',')} €
                      </span>
                      <span className="text-sm text-muted-foreground">/Monat</span>
                    </>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  {config.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="mt-8 block">
                  <Button
                    variant={isPopular ? 'gradient' : 'outline'}
                    className="w-full"
                    size="lg"
                  >
                    {config.price === 0 ? 'Kostenlos starten' : 'Jetzt upgraden'}
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>

        {/* Feature comparison table */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-8">Vollständiger Vergleich</h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-4 pl-6 text-left text-sm font-semibold">Feature</th>
                  {['Free', 'Basic', 'Pro', 'Max Pro'].map((plan) => (
                    <th key={plan} className="py-4 px-4 text-center text-sm font-semibold">{plan}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {featureComparison.map((row) => (
                  <tr key={row.label} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 pl-6 text-sm">{row.label}</td>
                    {[row.free, row.basic, row.pro, row.max].map((val, i) => (
                      <td key={i} className="py-3.5 px-4 text-center">
                        {typeof val === 'boolean' ? (
                          val ? (
                            <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ teaser */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Noch Fragen?{' '}
            <Link href="/faq" className="text-primary hover:underline">Zu den häufigen Fragen</Link>
            {' '}oder{' '}
            <Link href="/support" className="text-primary hover:underline">Support kontaktieren</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
