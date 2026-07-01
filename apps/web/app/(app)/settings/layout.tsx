'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User, CreditCard, Receipt, Shield, Bell, Lock } from 'lucide-react'

const tabs = [
  { href: '/settings/profile', label: 'Profil', icon: User },
  { href: '/settings/subscription', label: 'Abonnement', icon: CreditCard },
  { href: '/settings/billing', label: 'Rechnungen', icon: Receipt },
  { href: '/settings/security', label: 'Sicherheit', icon: Shield },
  { href: '/settings/notifications', label: 'Benachrichtigungen', icon: Bell },
  { href: '/settings/privacy', label: 'Datenschutz', icon: Lock },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verwalten Sie Ihr Konto, Sicherheit und Datenschutz.
        </p>
      </div>

      {/* Scrollable tab navigation */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1 rounded-2xl border border-border bg-muted/30 p-1 min-w-max">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap',
                pathname === tab.href || pathname.startsWith(tab.href + '/')
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {children}
    </div>
  )
}
