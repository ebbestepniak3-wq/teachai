// app/api/dsgvo/route.ts – DSGVO data export, deletion requests
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'
import { audit } from '@/lib/audit/logger'
import { logger } from '@/lib/logger'

// GET: export all user data (Art. 20 DSGVO)
export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  try {
    const user = await prisma.user.findUnique({
      where: { id: jwtUser.sub },
      include: {
        subscription: true,
        uploads: { select: { id: true, fileName: true, fileSize: true, fileType: true, status: true, createdAt: true, expiresAt: true } },
        gradingJobs: {
          select: { id: true, fach: true, schulform: true, klassenstufe: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        invoices: { select: { id: true, amount: true, currency: true, status: true, createdAt: true } },
        notifications: { select: { type: true, title: true, isRead: true, createdAt: true }, take: 50 },
        loginHistory: {
          select: { success: true, ipAddress: true, createdAt: true },
          take: 100,
          orderBy: { createdAt: 'desc' },
        },
        supportTickets: { select: { id: true, subject: true, status: true, createdAt: true } },
      },
    })

    if (!user) return apiUnauthorized()

    // Remove sensitive fields
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      notice: 'Datenexport gemäß Art. 20 DSGVO',
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        bundesland: user.bundesland,
        schulform: user.schulform,
        schule: user.schule,
        faecher: user.faecher,
        klassen: user.klassen,
        language: user.language,
        timezone: user.timezone,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      },
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      } : null,
      uploads: user.uploads,
      gradingJobs: user.gradingJobs,
      invoices: user.invoices,
      loginHistory: user.loginHistory,
      notifications: user.notifications,
      supportTickets: user.supportTickets,
    }

    await audit.dataExport(jwtUser.sub, ip)
    logger.info('DSGVO data export', { userId: jwtUser.sub })

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="teachai-daten-${jwtUser.sub.slice(0, 8)}.json"`,
      },
    })
  } catch (error) {
    logger.error('DSGVO export error', { error })
    return apiError('Datenexport fehlgeschlagen', 500)
  }
}

// POST: create deletion request (Art. 17 DSGVO)
export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  try {
    const { type, message } = await request.json()

    // Log the request
    await prisma.systemLog.create({
      data: {
        level: 'warn',
        message: `DSGVO request: ${type}`,
        userId: jwtUser.sub,
        context: { type, message: message?.slice(0, 500), ipAddress: ip } as any,
      },
    })

    await audit.adminAction(jwtUser.sub, `dsgvo_request:${type}`)

    // Send notification to admin
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM',
          title: `DSGVO-Anfrage: ${type}`,
          message: `Nutzer ${jwtUser.sub} hat eine ${type}-Anfrage gestellt.`,
          link: `/admin/dsgvo`,
        },
      })
    }

    return apiSuccess({
      message: 'Ihre DSGVO-Anfrage wurde registriert. Wir bearbeiten sie innerhalb von 30 Tagen.',
    })
  } catch {
    return apiError('Anfrage fehlgeschlagen', 500)
  }
}
