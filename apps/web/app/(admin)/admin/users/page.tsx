// app/(admin)/admin/users/page.tsx
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Search, MoreHorizontal, Shield, Ban } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Nutzerverwaltung' }

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: true,
      _count: { select: { gradingJobs: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nutzerverwaltung</h1>
          <p className="mt-1 text-sm text-muted-foreground">{users.length} registrierte Nutzer</p>
        </div>
        {/* Search placeholder */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <input placeholder="Nutzer suchen..." className="w-48 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Alle Nutzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Name / E-Mail', 'Plan', 'Rolle', 'Bewertungen', 'Registriert', 'Status', ''].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="group hover:bg-accent/50 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="text-[10px]">
                        {u.subscription?.plan || 'FREE'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={u.role === 'ADMIN' ? 'warning' : 'default'} className="text-[10px]">
                        {u.role === 'ADMIN' ? 'Admin' : 'Lehrkraft'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm">{u._count.gradingJobs}</td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={u.emailVerified ? 'success' : 'warning'} className="text-[10px]">
                        {u.emailVerified ? 'Verifiziert' : 'Ausstehend'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon-sm" title="Admin machen">
                          <Shield className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" title="Sperren">
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export const dynamic = 'force-dynamic'
