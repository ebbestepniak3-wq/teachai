'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-8 w-8" />

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Heller Modus aktivieren' : 'Dunkler Modus aktivieren'}
      className="text-muted-foreground hover:text-foreground"
    >
      {theme === 'dark'
        ? <Sun  className="h-4 w-4 transition-transform hover:rotate-12" />
        : <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />
      }
    </Button>
  )
}
