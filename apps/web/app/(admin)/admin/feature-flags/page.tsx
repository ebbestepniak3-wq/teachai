// app/(admin)/admin/feature-flags/page.tsx
import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAllFlags } from '@/lib/feature-flags'
import { FeatureFlagToggle } from '@/components/admin/feature-flag-toggle'
import { Flag, Shield, Users, Zap } from 'lucide-react'

export const metadata: Metadata = { title: 'Feature Flags' }
export const dynamic = 'force-dynamic'

export default function FeatureFlagsPage() {
  const flags = getAllFlags()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flag className="h-6 w-6" />
          Feature Flags
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Schalten Sie Features ein/aus ohne Deployment. Änderungen wirken sofort.
        </p>
      </div>

      <div className="grid gap-4">
        {flags.map((flag) => (
          <Card key={flag.key} className={flag.enabled ? 'border-emerald-500/20' : 'border-border'}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{flag.label}</p>
                    <Badge variant={flag.enabled ? 'success' : 'default'} className="text-[10px]">
                      {flag.enabled ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <code className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
                      {flag.key}
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>

                  <div className="mt-3 flex items-center gap-4">
                    {flag.plans.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Nur für: {flag.plans.join(', ')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Alle Nutzer</span>
                      </div>
                    )}

                    {flag.rolloutPercent < 100 && flag.enabled && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-amber-500">
                          {flag.rolloutPercent}% Rollout
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <FeatureFlagToggle flagKey={flag.key} enabled={flag.enabled} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
