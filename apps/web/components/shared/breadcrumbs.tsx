'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  upload: 'Hochladen',
  grading: 'Bewertungen',
  history: 'Verlauf',
  reports: 'Berichte',
  assistant: 'KI-Assistent',
  statistics: 'Statistiken',
  settings: 'Einstellungen',
  profile: 'Profil',
  subscription: 'Abonnement',
  billing: 'Rechnungen',
  security: 'Sicherheit',
  notifications: 'Benachrichtigungen',
  privacy: 'Datenschutz',
  devices: 'Geräte',
  support: 'Support',
  admin: 'Admin',
  users: 'Nutzer',
  subscriptions: 'Abonnements',
  logs: 'Protokolle',
  system: 'System',
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Don't show breadcrumbs on top-level pages
  if (segments.length <= 1) return null

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = routeLabels[segment] || segment
    const isLast = index === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
