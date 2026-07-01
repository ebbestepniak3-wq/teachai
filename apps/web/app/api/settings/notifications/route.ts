// app/api/settings/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const contentType = request.headers.get('content-type') || ''
    let body: Record<string, string>
    if (contentType.includes('json')) {
      body = await request.json()
    } else {
      const fd = await request.formData()
      body = Object.fromEntries(Array.from(fd.entries()).map(([k, v]) => [k, v.toString()]))
    }

    await prisma.user.update({
      where: { id: jwtUser.sub },
      data: {
        notifyGradingDone: body.notifyGradingDone === 'on' || body.notifyGradingDone === 'true',
        notifyQuotaWarning: body.notifyQuotaWarning === 'on' || body.notifyQuotaWarning === 'true',
        notifyNewsletter: body.notifyNewsletter === 'on' || body.notifyNewsletter === 'true',
        notifyEmail: body.notifyEmail === 'on' || body.notifyEmail === 'true',
        // notifySecurityAlerts always stays true (cannot be disabled)
      },
    })

    if (!contentType.includes('json')) {
      return NextResponse.redirect(new URL('/settings/notifications?success=true', request.url))
    }
    return apiSuccess({ message: 'Einstellungen gespeichert' })
  } catch {
    return apiError('Fehler beim Speichern', 500)
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request)
}
