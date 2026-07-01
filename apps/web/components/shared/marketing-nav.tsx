'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { GraduationCap, Menu, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Funktionen', href: '/#funktionen' },
  { label: 'Preise',     href: '/pricing' },
  { label: 'FAQ',        href: '/#faq' },
  { label: 'Kontakt',    href: '/kontakt' },
]

export function MarketingNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <header className={cn(
      'fixed top-0 inset-x-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm'
        : 'bg-transparent'
    )}>
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center gap-8" role="navigation" aria-label="Hauptnavigation">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mr-auto md:mr-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand">
            <GraduationCap className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-sm font-black tracking-tight">TeacherAI</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-3.5 py-2 rounded-xl text-sm font-medium transition-colors',
                'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">Anmelden</Button>
          </Link>
          <Link href="/register">
            <Button variant="gradient" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Kostenlos starten
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-6 py-4 space-y-1 animate-slide-up">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2 border-t border-border mt-3">
            <Link href="/login" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">Anmelden</Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button variant="gradient" size="sm" className="w-full">Kostenlos</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
