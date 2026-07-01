// app/(admin)/admin/support/page.tsx
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HelpCircle, Filter, Clock, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Support-Tickets' }

const statusConfig = {
  OPEN: { label: 'Offen', variant: 'warning' as const },
  IN_PROGRESS: { label: 'In Bearbeitung', variant: 'info' as const },
  CLOSED: { label: 'Geschlossen', variant: 'default' as const },
}

const priorityConfig = {
  LOW: { label: 'Niedrig', color: 'text-muted-foreground' },
  MEDIUM: { label: 'Mittel', color: 'text-amber-400' },
  HIGH: { label: 'Hoch', color: 'text-red-400' },
}

export default async function AdminSupportPage() {
  const [tickets, counts] = await Promise.all([
    prisma.supportTicket.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.supportTicket.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ])

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count.status]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support-Tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tickets.length} Tickets insgesamt</p>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4" />
          Filtern
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Offen', count: countMap['OPEN'] || 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'In Bearbeitung', count: countMap['IN_PROGRESS'] || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Geschlossen', count: countMap['CLOSED'] || 0, color: 'text-muted-foreground', bg: 'bg-muted/30' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className={`p-5 ${stat.bg} rounded-2xl`}>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            Alle Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HelpCircle className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">Keine Tickets vorhanden.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const status = statusConfig[ticket.status as keyof typeof statusConfig]
                const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig]
                return (
                  <div
                    key={ticket.id}
                    className="group flex items-start gap-4 rounded-xl border border-border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{ticket.subject}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-xs font-medium ${priority.color}`}>{priority.label}</span>
                          <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ticket.user.name} ({ticket.user.email})
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-xs">
                      Öffnen
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
