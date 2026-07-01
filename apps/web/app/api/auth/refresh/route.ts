// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, signAccessToken } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value

  if (!refreshToken) return apiError('Kein Refresh-Token', 401)

  try {
    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) return apiError('Ungültiger Refresh-Token', 401)

    // Verify session still exists in DB
    const session = await prisma.session.findFirst({
      where: {
        token: refreshToken,
        userId: payload.sub,
        expiresAt: { gt: new Date() },
      },
    })

    if (!session) return apiError('Sitzung abgelaufen', 401)

    // Check user still active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isDeactivated: true },
    })

    if (!user || user.isDeactivated) return apiError('Konto nicht verfügbar', 403)

    // Issue new access token
    const newAccessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    // Update session last used
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsed: new Date() },
    })

    const isProduction = process.env.NODE_ENV === 'production'
    const res = apiSuccess({ refreshed: true })
    res.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 900,
      path: '/',
    })
    return res
  } catch (error) {
    logger.error('Token refresh error', { error })
    return apiError('Token konnte nicht erneuert werden', 500)
  }
}
