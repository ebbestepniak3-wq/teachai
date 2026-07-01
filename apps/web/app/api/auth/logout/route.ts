// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value
    if (refreshToken) {
      const payload = await verifyRefreshToken(refreshToken)
      if (payload) {
        // Delete session from DB
        await prisma.session.deleteMany({
          where: { token: refreshToken, userId: payload.sub },
        })
        logger.info('User logged out', { userId: payload.sub })
      }
    }
  } catch (error) {
    logger.warn('Logout error (non-critical)', { error })
  }

  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.delete('access_token')
  response.cookies.delete('refresh_token')
  return response
}
