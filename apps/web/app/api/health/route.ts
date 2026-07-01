// app/api/health/route.ts – health check for load balancer & monitoring
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  let dbStatus = 'ok'
  let dbLatency = 0

  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatency = Date.now() - dbStart
  } catch {
    dbStatus = 'error'
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded'

  return Response.json(
    {
      status,
      version: process.env.BUILD_VERSION || 'dev',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV,
      services: {
        database: { status: dbStatus, latencyMs: dbLatency },
        ai: { status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured' },
        storage: { status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not_configured' },
        payments: { status: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured' },
      },
      responseMs: Date.now() - startTime,
    },
    {
      status: status === 'ok' ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}
