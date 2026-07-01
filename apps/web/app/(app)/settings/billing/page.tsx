// app/(app)/settings/billing/page.tsx
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Receipt, Download, CreditCard, ExternalLink } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Rechnungen' }

export default async function BillingPage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const invoices = await prisma.invoice.findMany({
    where: { userId: jwtUser.sub },
    orderBy: { createdAt: 'desc' },
  })

  const statusConfig = {
    PAID: { label: 'Bezahlt', variant: 'success' as const },
    OPEN: { label: 'Offen', variant: 'warning' as const },
    VOID: { label: 'Storniert', variant: 'default' as const },
    UNCOLLECTIBLE: { label: 'Nicht einziehbar', variant: 'destructive' as const },
  }

  return (
    <div className="space-y-6">
      {/* Payment method placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Zahlungsmethode
          </CardTitle>
          <CardDescription>Verwalten Sie Ihre Zahlungsdaten über das Stripe-Portal.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-16 items-center justify-center rounded-lg border border-border bg-muted text-xs font-bold text-muted-foreground">
              VISA
            </div>
            <div>
              <p className="text-sm font-medium">•••• •••• •••• 4242</p>
              <p className="text-xs text-muted-foreground">Läuft ab 12/2027</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
            Im Portal verwalten
          </Button>
        </CardContent>
      </Card>

      {/* Invoices table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Rechnungshistorie
          </CardTitle>
          <CardDescription>
            Alle Ihre Rechnungen auf einen Blick.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-sm font-medium">Keine Rechnungen vorhanden</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Rechnungen erscheinen hier nach dem ersten Upgrade.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Datum', 'Beschreibung', 'Betrag', 'Status', ''].map((h) => (
                      <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => {
                    const status = statusConfig[inv.status as keyof typeof statusConfig]
                    return (
                      <tr key={inv.id} className="group hover:bg-accent/50 transition-colors">
                        <td className="py-3 pr-4 text-sm">{formatDate(inv.createdAt)}</td>
                        <td className="py-3 pr-4 text-sm text-muted-foreground">
                          {inv.description || 'TeacherAI Abonnement'}
                        </td>
                        <td className="py-3 pr-4 text-sm font-semibold">
                          {formatCurrency(inv.amount, inv.currency)}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={status.variant} className="text-[10px]">
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {inv.pdfUrl && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              asChild
                            >
                              <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
