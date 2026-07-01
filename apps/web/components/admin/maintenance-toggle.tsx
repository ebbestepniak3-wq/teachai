'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Wrench } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function MaintenanceToggle({ isActive }: { isActive: boolean }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function toggle() {
    if (!confirm(isActive
      ? 'Wartungsmodus deaktivieren? Nutzer können wieder auf die Plattform zugreifen.'
      : 'ACHTUNG: Wartungsmodus aktivieren? Alle Nutzer werden auf eine Wartungsseite weitergeleitet!'
    )) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'maintenance_mode', enabled: !isActive }),
      })
      if (!res.ok) throw new Error('Fehler')

      toast({
        title: isActive ? 'Wartungsmodus deaktiviert' : 'Wartungsmodus aktiviert',
        description: isActive ? 'Plattform ist wieder normal zugänglich.' : 'Nutzer werden auf Wartungsseite weitergeleitet.',
        variant: isActive ? 'default' : 'destructive',
      })
      router.refresh()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={isActive ? 'outline' : 'destructive'}
      onClick={toggle}
      disabled={loading}
      className="shrink-0"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
      {isActive ? 'Deaktivieren' : 'Aktivieren'}
    </Button>
  )
}
