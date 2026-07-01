'use client'

import { useMemo } from 'react'
import { checkPasswordStrength } from '@/lib/security'
import { cn } from '@/lib/utils'

interface PasswordStrengthMeterProps {
  password: string
  className?: string
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => checkPasswordStrength(password), [password])

  if (!password) return null

  const barColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-400',
    'bg-emerald-400',
    'bg-emerald-500',
  ]

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength bars */}
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              i < strength.score
                ? barColors[strength.score]
                : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Label + feedback */}
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-xs font-medium',
          strength.score <= 1 ? 'text-red-400' :
          strength.score === 2 ? 'text-amber-400' :
          'text-emerald-400'
        )}>
          {strength.label}
        </span>
      </div>

      {strength.feedback.length > 0 && (
        <ul className="space-y-0.5">
          {strength.feedback.map((tip) => (
            <li key={tip} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
