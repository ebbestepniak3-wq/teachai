// app/(admin)/layout.tsx
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
import { Sidebar } from '@/components/shared/sidebar'
import { AppHeader } from '@/components/shared/app-header'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jwtUser = await getServerUser()
  if (!jwtUser || jwtUser.role !== 'ADMIN') redirect('/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: jwtUser.sub },
    include: { subscription: true },
  })
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isAdmin />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          userName={user.name}
          userRole={user.role}
        />
        {/* Admin banner */}
        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-6 py-2">
          <Shield className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs text-amber-500 font-medium">Admin-Bereich</span>
          <Badge variant="warning" className="text-[10px]">Erhöhte Berechtigungen</Badge>
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </div>
  )
}
