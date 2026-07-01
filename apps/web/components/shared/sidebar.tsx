'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap, LayoutDashboard, Upload, FileText, MessageSquare,
  BarChart3, Settings, HelpCircle, Receipt, Shield,
  Sparkles, Users, CreditCard, ScrollText, Activity, Bell, Brain,
  Zap, Wrench, ChevronLeft, ChevronRight, ExternalLink, Flag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'

const navItems = [
  { label: 'Dashboard',    href: '/dashboard',        icon: LayoutDashboard },
  { label: 'Hochladen',    href: '/upload',            icon: Upload },
  { label: 'Bewertungen',  href: '/grading/history',   icon: FileText },
  { label: 'Assistent',    href: '/assistant',         icon: MessageSquare, badge: 'PRO' },
  { label: 'Statistiken',  href: '/statistics',        icon: BarChart3 },
]

const bottomItems = [
  { label: 'Benachrichtigungen', href: '/settings/notifications', icon: Bell },
  { label: 'Einstellungen',      href: '/settings/profile',       icon: Settings },
  { label: 'Abonnement',         href: '/settings/subscription',  icon: CreditCard },
  { label: 'Support',            href: '/support',                icon: HelpCircle },
]

const adminItems = [
  { label: 'Overview',       href: '/admin/dashboard',     icon: Shield },
  { label: 'Analytics',      href: '/admin/analytics',     icon: BarChart3 },
  { label: 'Nutzer',         href: '/admin/users',         icon: Users },
  { label: 'Abonnements',    href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Billing',        href: '/admin/billing',       icon: Receipt },
  { label: 'KI-Monitor',     href: '/admin/grading',       icon: Brain },
  { label: 'Feature Flags',  href: '/admin/feature-flags', icon: Flag },
  { label: 'Wartung',        href: '/admin/maintenance',   icon: Wrench },
  { label: 'Support',        href: '/admin/support',       icon: HelpCircle },
  { label: 'System',         href: '/admin/system',        icon: Activity },
  { label: 'Protokolle',     href: '/admin/logs',          icon: ScrollText },
]

interface SidebarProps {
  isAdmin?: boolean
  userName?: string
  userPlan?: string
}

export function Sidebar({ isAdmin, userName, userPlan }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebar-collapsed') : null
    if (saved === 'true') setCollapsed(true)
  }, [])

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    if (typeof window !== 'undefined') localStorage.setItem('sidebar-collapsed', String(next))
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const planBadgeVariant = userPlan === 'MAX_PRO' ? 'warning'
    : userPlan === 'PRO' ? 'brand'
    : userPlan === 'BASIC' ? 'info'
    : 'default'

  if (!mounted) return (
    <aside className="w-64 shrink-0 hidden lg:flex" />
  )

  return (
    <aside
      className={cn(
        'relative hidden lg:flex flex-col shrink-0 border-r border-border bg-card/60 backdrop-blur-xl transition-all duration-300 ease-out',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-border',
        collapsed && 'justify-center px-2'
      )}>
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand">
            <GraduationCap className="h-4.5 w-4.5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-black tracking-tight leading-none">TeacherAI</p>
              {userPlan && (
                <Badge variant={planBadgeVariant} className="mt-0.5 text-[9px] py-0 h-3.5 px-1.5">
                  {userPlan.replace('_', ' ')}
                </Badge>
              )}
            </div>
          )}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-7 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent transition-colors"
        aria-label={collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />
        }
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
        {!collapsed && (
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Navigation
          </p>
        )}

        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-all duration-150',
                active
                  ? 'bg-brand-500/12 text-brand-400 font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className={cn(
                'h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105',
                active ? 'text-brand-400' : ''
              )} />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <Badge variant="brand" className="text-[9px] py-0 h-4 px-1.5 shrink-0">
                  {item.badge}
                </Badge>
              )}
              {active && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />
              )}
            </Link>
          )
        })}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className={cn('pt-4 pb-2', collapsed && 'flex justify-center')}>
              {!collapsed ? (
                <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Admin
                </p>
              ) : (
                <div className="h-px w-5 bg-border" />
              )}
            </div>
            {adminItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-all duration-150',
                    active
                      ? 'bg-amber-500/12 text-amber-400 font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-amber-400' : '')} />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border py-3 px-2 space-y-0.5">
        {bottomItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all',
                active && 'bg-accent text-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            </Link>
          )
        })}
      </div>

      {/* User hint */}
      {!collapsed && userName && (
        <div className="border-t border-border px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white text-[11px] font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{userPlan || 'Free'}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
