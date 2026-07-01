import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-current border-t-transparent opacity-70',
        sizes[size],
        className
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" className="text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Laden...</p>
      </div>
    </div>
  )
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('shimmer h-4 rounded-lg', className)} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border p-6 space-y-4">
      <SkeletonLine className="w-1/3" />
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-1/2" />
    </div>
  )
}
