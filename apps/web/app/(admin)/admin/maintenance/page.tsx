// app/(admin)/admin/maintenance/page.tsx
import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isMaintenanceMode } from '@/lib/feature-flags'
import { MaintenanceToggle } from '@/components/admin/maintenance-toggle'
import { Wrench, AlertTriangle, Clock, Shield } from 'lucide-react'

export const metadata: Metadata = { title: 'Wartungsmodus' }
export const dynamic = 'force-dynamic'

export default function MaintenancePage() {
  const isActive = isMaintenanceMode()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          Wartungsmodus
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sperrt die Plattform für alle Nutzer außer Admins.
        </p>
      </div>

      <Card className={isActive ? 'border-amber-500/30 bg-amber-500/5' : ''}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="font-semibold text-lg">Wartungsmodus</p>
                <Badge variant={isActive ? 'warning' : 'default'} className="text-[10px]">
                  {isActive ? '⚠ AKTIV' : 'Inaktiv'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isActive
                  ? 'Die Plattform ist im Wartungsmodus. Nutzer sehen eine Wartungsseite.'
                  : 'Die Plattform ist normal zugänglich.'}
              </p>

              <div className="space-y-2">
                {[
                  { icon: AlertTriangle, text: 'Alle nicht-Admin-Nutzer werden auf eine Wartungsseite weitergeleitet' },
                  { icon: Shield, text: 'Admin-Konten bleiben vollständig zugänglich' },
                  { icon: Clock, text: 'API-Endpunkte bleiben für Webhooks (z.B. Stripe) aktiv' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <item.icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
            <MaintenanceToggle isActive={isActive} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wartungsseiten-Nachricht</CardTitle>
          <CardDescription>Diese Nachricht wird Nutzern im Wartungsmodus angezeigt.</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            defaultValue="TeacherAI wird gerade gewartet und ist in Kürze wieder verfügbar. Wir entschuldigen uns für die Unannehmlichkeiten."
            rows={3}
            className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </CardContent>
      </Card>
    </div>
  )
}
