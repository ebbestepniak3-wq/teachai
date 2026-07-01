// app/(app)/assistant/page.tsx – Phase 6: full streaming AI chat assistant
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AssistantChat } from '@/components/assistant/chat'
import { PLAN_CONFIGS } from '@teachai/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lock, Sparkles } from 'lucide-react'

export const metadata: Metadata = { title: 'KI-Assistent' }

export default async function AssistantPage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: jwtUser.sub },
    include: { subscription: true },
  })
  if (!user) redirect('/login')

  const plan = (user.subscription?.plan || 'FREE') as keyof typeof PLAN_CONFIGS
  const hasAccess = ['PRO', 'MAX_PRO'].includes(plan)

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-6">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">KI-Assistent</h1>
        <p className="mt-3 text-muted-foreground max-w-md">
          Der KI-Assistent ist ab dem <strong>Pro-Plan</strong> verfügbar.
          Erstellen Sie Unterrichtsmaterialien, Arbeitsblätter, Elternbriefe und mehr.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/settings/subscription">
            <Button variant="gradient" size="lg">
              <Sparkles className="h-5 w-5" />
              Auf Pro upgraden (12,99 €/Mo.)
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">Zurück</Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">7 Tage kostenlos testen · Jederzeit kündbar</p>
      </div>
    )
  }

  // Load recent conversations
  const conversations = await prisma.assistantConversation.findMany({
    where: { userId: jwtUser.sub },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  })

  return (
    <AssistantChat
      userId={jwtUser.sub}
      userName={user.name}
      bundesland={user.bundesland}
      schulform={user.schulform}
      faecher={user.faecher}
      initialConversations={conversations.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt.toISOString(),
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  )
}
