'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell, Search, Menu, GraduationCap, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':              'Dashboard',
  '/upload':                 'Neue Bewertung',
  '/grading/history':        'Bewertungen',
  '/assistant':              'KI-Assistent',
  '/statistics':             'Statistiken',
  '/settings/profile':       'Profil',
  '/settings/security':      'Sicherheit',
  '/settings/notifications': 'Benachrichtigungen',
  '/settings/billing':       'Rechnungen',
  '/settings/subscription':  'Abonnement',
  '/settings/privacy':       'Datenschutz',
  '/support':                'Support',
  '/admin/dashboard':        'Admin – Übersicht',
  '/admin/analytics':        'Live Analytics',
  '/admin/users':            'Nutzerverwaltung',
  '/admin/grading':          'KI-Monitor',
  '/admin/billing':          'Billing',
  '/admin/subscriptions':    'Abonnements',
  '/admin/feature-flags':    'Feature Flags',
  '/admin/maintenance':      'Wartungsmodus',
  '/admin/system':           'Systemstatus',
  '/admin/logs':             'Protokolle',
  '/admin/support':          'Support-Tickets',
}

function getPageTitle(pathname: string): string {
  // Exact match
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  // Prefix match (e.g. /grading/result/xyz)
  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname.startsWith(route)) return title
  }
  return 'TeacherAI'
}

interface AppHeaderProps {
  userName?: string
  userRole?: string
  notificationCount?: number
}

export function AppHeader({ userName, userRole, notificationCount = 0 }: AppHeaderProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const isAdmin = userRole === 'ADMIN'

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6 gap-4">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold truncate">{title}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Search hint */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden md:flex text-muted-foreground hover:text-foreground"
          aria-label="Suche"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell initialCount={notificationCount} />

        {/* User badge */}
        {userName && (
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white text-[11px] font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium max-w-[120px] truncate">{userName}</span>
            {isAdmin && (
              <Badge variant="warning" className="text-[9px] py-0 h-4 px-1.5">Admin</Badge>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
