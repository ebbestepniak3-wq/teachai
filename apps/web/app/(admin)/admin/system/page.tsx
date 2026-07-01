// app/(admin)/admin/system/page.tsx
import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import {
  CheckCircle, AlertCircle, Clock, Database, Cpu, HardDrive,
  Globe, Zap, RefreshCw,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Systemstatus' }

export default async function AdminSystemPage() {
  // Test DB connection
  let dbStatus = 'ok'
  let dbLatency = 0
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatency = Date.now() - start
  } catch {
    dbStatus = 'error'
  }

  const systemServices = [
    {
      name: 'Datenbankverbindung',
      status: dbStatus,
      latency: dbLatency,
      icon: Database,
      desc: 'PostgreSQL via Supabase',
    },
    {
      name: 'Claude API',
      status: process.env.ANTHROPIC_API_KEY ? 'ok' : 'warning',
      icon: Cpu,
      desc: 'Anthropic claude-sonnet-4-6',
    },
    {
      name: 'Supabase Storage',
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'warning',
      icon: HardDrive,
      desc: 'Dateispeicher & CDN',
    },
    {
      name: 'Stripe Payments',
      status: process.env.STRIPE_SECRET_KEY ? 'ok' : 'warning',
      icon: Globe,
      desc: 'Zahlungsabwicklung',
    },
    {
      name: 'Redis Cache',
      status: process.env.UPSTASH_REDIS_REST_URL ? 'ok' : 'warning',
      icon: Zap,
      desc: 'Rate Limiting & Queue',
    },
  ]

  const statusIcon = (status: string) => {
    if (status === 'ok') return <CheckCircle className="h-5 w-5 text-emerald-500" />
    if (status === 'warning') return <AlertCircle className="h-5 w-5 text-amber-500" />
    return <AlertCircle className="h-5 w-5 text-red-500" />
  }

  const statusBadge = (status: string) => {
    if (status === 'ok') return <Badge variant="success" className="text-[10px]">OK</Badge>
    if (status === 'warning') return <Badge variant="warning" className="text-[10px]">Konfiguration fehlt</Badge>
    return <Badge variant="destructive" className="text-[10px]">Fehler</Badge>
  }

  const envVars = [
    { key: 'DATABASE_URL', set: !!process.env.DATABASE_URL },
    { key: 'ANTHROPIC_API_KEY', set: !!process.env.ANTHROPIC_API_KEY },
    { key: 'JWT_SECRET', set: !!process.env.JWT_SECRET },
    { key: 'STRIPE_SECRET_KEY', set: !!process.env.STRIPE_SECRET_KEY },
    { key: 'NEXT_PUBLIC_SUPABASE_URL', set: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { key: 'UPSTASH_REDIS_REST_URL', set: !!process.env.UPSTASH_REDIS_REST_URL },
    { key: 'EMAIL_FROM', set: !!process.env.EMAIL_FROM },
    { key: 'NEXT_PUBLIC_APP_URL', set: !!process.env.NEXT_PUBLIC_APP_URL },
  ]

  const allOk = envVars.every((v) => v.set)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Systemstatus</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Echtzeit-Übersicht aller Dienste
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
          Aktualisieren
        </Button>
      </div>

      {/* Overall status banner */}
      <div className={`rounded-2xl border p-4 ${allOk ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
        <div className="flex items-center gap-3">
          {allOk
            ? <CheckCircle className="h-6 w-6 text-emerald-500" />
            : <AlertCircle className="h-6 w-6 text-amber-500" />
          }
          <div>
            <p className="font-semibold">{allOk ? 'Alle Systeme betriebsbereit' : 'Konfiguration unvollständig'}</p>
            <p className="text-xs text-muted-foreground">
              {allOk
                ? 'Alle Services sind aktiv und erreichbar.'
                : 'Einige Umgebungsvariablen fehlen. Prüfen Sie die .env-Konfiguration.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Service status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service-Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {systemServices.map((service) => (
            <div key={service.name} className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <service.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {service.latency !== undefined && service.status === 'ok' && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {service.latency}ms
                  </span>
                )}
                {statusIcon(service.status)}
                {statusBadge(service.status)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Environment variables check */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Umgebungsvariablen</CardTitle>
          <CardDescription>Konfigurationsstatus aller erforderlichen Variablen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {envVars.map((env) => (
              <div
                key={env.key}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  env.set ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <code className="text-xs font-mono text-muted-foreground">{env.key}</code>
                {env.set
                  ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                  : <AlertCircle className="h-4 w-4 text-red-500" />
                }
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Runtime info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Laufzeitinformationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Node.js Version', value: process.version },
              { label: 'Umgebung', value: process.env.NODE_ENV || 'development' },
              { label: 'App URL', value: process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000' },
              { label: 'Datum/Uhrzeit', value: new Date().toLocaleString('de-DE') },
              { label: 'Uptime', value: `${Math.floor(process.uptime() / 60)} Minuten` },
              { label: 'Plattform', value: process.platform },
            ].map((info) => (
              <div key={info.label} className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">{info.label}</p>
                <p className="mt-0.5 text-sm font-mono font-medium">{info.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export const dynamic = 'force-dynamic'
