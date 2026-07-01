// app/(app)/layout.tsx – Phase 12: Premium app shell
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
import { Sidebar } from '@/components/shared/sidebar'
import { AppHeader } from '@/components/shared/app-header'
import { prisma } from '@/lib/prisma'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: jwtUser.sub },
    include: {
      subscription: { select: { plan: true } },
      _count: { select: { notifications: { where: { isRead: false } } } },
    },
  })

  if (!user)              redirect('/login')
  if (!user.emailVerified) redirect('/verify-email?resend=true')
  if (user.isDeactivated)  redirect('/login?error=deactivated')
  if (!user.isActive)      redirect('/login?error=inactive')

  const plan = user.subscription?.plan || 'FREE'

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        isAdmin={user.role === 'ADMIN'}
        userName={user.name}
        userPlan={plan}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <AppHeader
          userName={user.name}
          userRole={user.role}
          notificationCount={user._count.notifications}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
