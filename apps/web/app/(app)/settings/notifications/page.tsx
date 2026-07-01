// app/(app)/settings/notifications/page.tsx
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Mail, Shield, AlertCircle, CheckCircle, Zap } from 'lucide-react'

export const metadata: Metadata = { title: 'Benachrichtigungen' }

export default async function NotificationsSettingsPage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: jwtUser.sub },
    select: {
      notifyGradingDone: true,
      notifyQuotaWarning: true,
      notifyNewsletter: true,
      notifySecurityAlerts: true,
      notifyEmail: true,
    },
  })

  if (!user) redirect('/login')

  const settings = [
    {
      key: 'notifyGradingDone',
      label: 'Bewertung abgeschlossen',
      desc: 'Benachrichtigung wenn eine KI-Bewertung fertig ist.',
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      value: user.notifyGradingDone,
    },
    {
      key: 'notifyQuotaWarning',
      label: 'Kontingent-Warnung',
      desc: 'Warnung wenn 80% des monatlichen Kontingents verbraucht sind.',
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      value: user.notifyQuotaWarning,
    },
    {
      key: 'notifySecurityAlerts',
      label: 'Sicherheitshinweise',
      desc: 'Benachrichtigungen bei neuen Anmeldungen und Sicherheitsereignissen.',
      icon: Shield,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
      value: user.notifySecurityAlerts,
    },
    {
      key: 'notifyNewsletter',
      label: 'Newsletter & Updates',
      desc: 'Neuigkeiten zu TeacherAI-Features und Verbesserungen.',
      icon: Bell,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      value: user.notifyNewsletter,
    },
    {
      key: 'notifyEmail',
      label: 'E-Mail-Benachrichtigungen',
      desc: 'Alle obigen Benachrichtigungen auch per E-Mail erhalten.',
      icon: Mail,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      value: user.notifyEmail,
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Benachrichtigungseinstellungen
          </CardTitle>
          <CardDescription>
            Wählen Sie, worüber Sie informiert werden möchten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/settings/notifications" method="POST" className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.key}
                className="flex items-start justify-between gap-4 rounded-xl border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${setting.bg}`}>
                    <setting.icon className={`h-4.5 w-4.5 ${setting.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{setting.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{setting.desc}</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center shrink-0">
                  <input
                    type="checkbox"
                    name={setting.key}
                    defaultChecked={setting.value}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full border border-input bg-muted after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-4 peer-focus:ring-2 peer-focus:ring-primary/50" />
                </label>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <Button variant="gradient" type="submit">Einstellungen speichern</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
        Sicherheitshinweise können nicht deaktiviert werden und werden immer gesendet. Sie schützen Ihr Konto.
      </div>
    </div>
  )
}
