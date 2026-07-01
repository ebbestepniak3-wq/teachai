// app/(app)/upload/page.tsx – Phase 4: complete upload page
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { UploadZone } from '@/components/upload/upload-zone'
import { PLAN_CONFIGS } from '@teachai/types'
import { UPLOAD_CONFIG } from '@/lib/upload/config'

export const metadata: Metadata = { title: 'Hochladen' }

export default async function UploadPage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: jwtUser.sub },
    include: { subscription: true },
  })
  if (!user) redirect('/login')

  const plan = (user.subscription?.plan || 'FREE') as keyof typeof PLAN_CONFIGS
  const planConfig = PLAN_CONFIGS[plan]
  const maxFiles = UPLOAD_CONFIG.MAX_FILES_PER_PLAN[plan]

  // Monthly usage
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const usageThisMonth = await prisma.gradingJob.count({
    where: { userId: jwtUser.sub, createdAt: { gte: startOfMonth } },
  })
  const remaining = Math.max(0, planConfig.bewertungenProMonat - usageThisMonth)

  // Recent uploads (still valid)
  const recentUploads = await prisma.upload.findMany({
    where: {
      userId: jwtUser.sub,
      status: { in: ['READY', 'PROCESSING'] },
      OR: [
        { expiresAt: { gt: new Date() } },
        { expiresAt: null },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Arbeit hochladen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Laden Sie Klassenarbeiten, Tests oder Klausuren hoch. Die KI erkennt automatisch den Text.
        </p>
      </div>
      <UploadZone
        plan={plan}
        maxFiles={maxFiles}
        remaining={remaining}
        monthlyLimit={planConfig.bewertungenProMonat}
        usageThisMonth={usageThisMonth}
        bundesland={user.bundesland}
        schulform={user.schulform}
        recentUploads={recentUploads.map((u) => ({
          id: u.id,
          fileName: u.fileName,
          fileSize: u.fileSize,
          fileType: u.fileType,
          status: u.status,
          pageCount: u.pageCount,
          expiresAt: u.expiresAt?.toISOString() || null,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
export const dynamic = 'force-dynamic'
