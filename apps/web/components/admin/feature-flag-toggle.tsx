'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface FeatureFlagToggleProps {
  flagKey: string
  enabled: boolean
}

export function FeatureFlagToggle({ flagKey, enabled }: FeatureFlagToggleProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: flagKey, enabled: !isEnabled }),
      })

      if (!res.ok) throw new Error('Toggle failed')

      setIsEnabled(!isEnabled)
      toast({
        title: `Feature ${!isEnabled ? 'aktiviert' : 'deaktiviert'}`,
        description: flagKey,
      })
      router.refresh()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <label className={`relative inline-flex cursor-pointer items-center ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      <input
        type="checkbox"
        checked={isEnabled}
        onChange={toggle}
        className="peer sr-only"
      />
      <div className="peer h-6 w-11 rounded-full border border-input bg-muted transition-all after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-5 peer-focus:ring-2 peer-focus:ring-emerald-500/30" />
    </label>
  )
}
