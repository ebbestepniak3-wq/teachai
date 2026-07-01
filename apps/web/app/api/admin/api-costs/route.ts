// app/api/admin/api-costs/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiForbidden, apiUnauthorized } from '@/lib/api-response'
import { apiMonitor } from '@/lib/queue/grading-queue'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  const { searchParams } = new URL(request.url)
  const period = parseInt(searchParams.get('period') || '60') // minutes

  // API monitor stats
  const stats = apiMonitor.getStats(period)

  // DB-based cost tracking
  const since = new Date(Date.now() - period * 60 * 1000)
  const logs = await prisma.systemLog.findMany({
    where: {
      message: 'Grading completed',
      createdAt: { gte: since },
    },
    select: { context: true, createdAt: true },
  })

  const totalTokens = logs.reduce((s, l) => s + ((l.context as any)?.tokensUsed || 0), 0)
  const totalCost = logs.reduce((s, l) => s + ((l.context as any)?.cost || 0), 0)
  const avgTokensPerGrading = logs.length > 0 ? Math.round(totalTokens / logs.length) : 0

  // Cost breakdown by fach
  const fachBreakdown: Record<string, { count: number; tokens: number; cost: number }> = {}
  for (const log of logs) {
    const ctx = log.context as any
    const fach = ctx?.fach || 'Unbekannt'
    if (!fachBreakdown[fach]) fachBreakdown[fach] = { count: 0, tokens: 0, cost: 0 }
    fachBreakdown[fach].count++
    fachBreakdown[fach].tokens += ctx?.tokensUsed || 0
    fachBreakdown[fach].cost += ctx?.cost || 0
  }

  return apiSuccess({
    period: `${period} Minuten`,
    summary: {
      totalGradings: logs.length,
      totalTokens,
      totalCostCents: Math.round(totalCost),
      totalCostEur: (totalCost / 100).toFixed(2),
      avgTokensPerGrading,
      avgCostPerGradingCents: logs.length > 0 ? Math.round(totalCost / logs.length) : 0,
    },
    apiMonitor: stats,
    fachBreakdown: Object.entries(fachBreakdown)
      .map(([fach, data]) => ({ fach, ...data, costEur: (data.cost / 100).toFixed(3) }))
      .sort((a, b) => b.tokens - a.tokens),
  })
}
