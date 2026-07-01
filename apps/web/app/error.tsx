'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Global error:', error) }, [error])
  return (
    <html lang="de"><body>
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 bg-background text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/20 mb-6">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold">Etwas ist schiefgelaufen</h1>
      <p className="mt-3 text-muted-foreground max-w-md">
        Ein unerwarteter Fehler ist aufgetreten. Das Team wurde automatisch informiert.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs bg-muted rounded-lg px-3 py-1.5 text-muted-foreground">
          ID: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <Button variant="gradient" onClick={reset}>
          <RefreshCw className="h-4 w-4" />Erneut versuchen
        </Button>
        <Link href="/dashboard">
          <Button variant="outline"><Home className="h-4 w-4" />Dashboard</Button>
        </Link>
      </div>
    </div>
    </body></html>
  )
}
