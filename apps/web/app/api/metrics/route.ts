// app/api/metrics/route.ts – Prometheus-compatible metrics endpoint
import { NextRequest } from 'next/server'
import { getSystemMetrics, checkAllServices, generatePrometheusMetrics } from '@/lib/monitoring'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Optional: protect with bearer token
  const authHeader = request.headers.get('authorization')
  const metricsToken = process.env.METRICS_TOKEN
  if (metricsToken && authHeader !== `Bearer ${metricsToken}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const [systemMetrics, services] = await Promise.all([
      getSystemMetrics(),
      checkAllServices(),
    ])

    // Add DB metrics
    const [totalUsers, totalJobs, activeJobs] = await Promise.all([
      prisma.user.count(),
      prisma.gradingJob.count(),
      prisma.gradingJob.count({ where: { status: { in: ['QUEUED', 'PROCESSING'] } } }),
    ])

    const baseMetrics = generatePrometheusMetrics(systemMetrics, services)

    const dbMetrics = `
# HELP teachai_users_total Total registered users
# TYPE teachai_users_total counter
teachai_users_total ${totalUsers}

# HELP teachai_grading_jobs_total Total grading jobs
# TYPE teachai_grading_jobs_total counter
teachai_grading_jobs_total ${totalJobs}

# HELP teachai_grading_jobs_active Currently active grading jobs
# TYPE teachai_grading_jobs_active gauge
teachai_grading_jobs_active ${activeJobs}
`

    return new Response(baseMetrics + dbMetrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return new Response('# Error collecting metrics\n', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
