// lib/monitoring/index.ts – application monitoring and metrics

import { logger } from '@/lib/logger'

export interface SystemMetrics {
  timestamp: string
  uptime: number
  memory: {
    used: number
    total: number
    percent: number
  }
  process: {
    pid: number
    version: string
    platform: string
  }
  requests: {
    total: number
    successful: number
    failed: number
    avgResponseMs: number
  }
}

export interface ServiceStatus {
  name: string
  status: 'ok' | 'degraded' | 'down'
  latencyMs?: number
  message?: string
  lastChecked: string
}

// Request metrics collector
class MetricsCollector {
  private requests: Array<{ timestamp: number; responseMs: number; success: boolean }> = []
  private readonly maxRecords = 10000

  record(responseMs: number, success: boolean) {
    this.requests.push({ timestamp: Date.now(), responseMs, success })
    if (this.requests.length > this.maxRecords) this.requests.shift()
  }

  getStats(windowMs = 60 * 1000) {
    const since = Date.now() - windowMs
    const recent = this.requests.filter((r) => r.timestamp > since)
    const total = recent.length
    const failed = recent.filter((r) => !r.success).length
    const avgResponseMs = total > 0
      ? Math.round(recent.reduce((s, r) => s + r.responseMs, 0) / total)
      : 0

    return { total, successful: total - failed, failed, avgResponseMs }
  }

  clear() {
    this.requests = []
  }
}

export const metrics = new MetricsCollector()

export function getSystemMetrics(): SystemMetrics {
  const mem = process.memoryUsage()
  const totalMem = mem.heapTotal + mem.external
  const usedMem = mem.heapUsed

  return {
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024),
      percent: Math.round((usedMem / totalMem) * 100),
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
    },
    requests: metrics.getStats(60 * 1000),
  }
}

export async function checkAllServices(): Promise<ServiceStatus[]> {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkClaudeApi(),
    checkSupabase(),
    checkStripe(),
    checkRedis(),
    checkEmail(),
  ])

  return checks.map((result) =>
    result.status === 'fulfilled' ? result.value : {
      name: 'Unknown',
      status: 'down' as const,
      message: result.reason?.message || 'Check failed',
      lastChecked: new Date().toISOString(),
    }
  )
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    return {
      name: 'PostgreSQL',
      status: 'ok',
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
    }
  } catch (error: any) {
    return {
      name: 'PostgreSQL',
      status: 'down',
      message: error.message,
      lastChecked: new Date().toISOString(),
    }
  }
}

async function checkClaudeApi(): Promise<ServiceStatus> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { name: 'Claude API', status: 'degraded', message: 'API key not configured', lastChecked: new Date().toISOString() }
  }
  const start = Date.now()
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(5000),
    })
    return {
      name: 'Claude API',
      status: res.ok ? 'ok' : 'degraded',
      latencyMs: Date.now() - start,
      message: res.ok ? undefined : `HTTP ${res.status}`,
      lastChecked: new Date().toISOString(),
    }
  } catch {
    return { name: 'Claude API', status: 'degraded', message: 'Timeout or network error', lastChecked: new Date().toISOString() }
  }
}

async function checkSupabase(): Promise<ServiceStatus> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { name: 'Supabase Storage', status: 'degraded', message: 'Not configured', lastChecked: new Date().toISOString() }
  }
  const start = Date.now()
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
      signal: AbortSignal.timeout(5000),
    })
    return {
      name: 'Supabase Storage',
      status: res.status < 500 ? 'ok' : 'degraded',
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
    }
  } catch {
    return { name: 'Supabase Storage', status: 'degraded', message: 'Unreachable', lastChecked: new Date().toISOString() }
  }
}

async function checkStripe(): Promise<ServiceStatus> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { name: 'Stripe', status: 'degraded', message: 'Not configured', lastChecked: new Date().toISOString() }
  }
  const start = Date.now()
  try {
    const res = await fetch('https://api.stripe.com/v1/products?limit=1', {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      signal: AbortSignal.timeout(5000),
    })
    return {
      name: 'Stripe',
      status: res.ok ? 'ok' : 'degraded',
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
    }
  } catch {
    return { name: 'Stripe', status: 'degraded', message: 'Unreachable', lastChecked: new Date().toISOString() }
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return { name: 'Redis Cache', status: 'degraded', message: 'Not configured (using memory)', lastChecked: new Date().toISOString() }
  }
  const start = Date.now()
  try {
    const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    })
    return {
      name: 'Redis Cache',
      status: res.ok ? 'ok' : 'degraded',
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
    }
  } catch {
    return { name: 'Redis Cache', status: 'degraded', message: 'Unreachable', lastChecked: new Date().toISOString() }
  }
}

async function checkEmail(): Promise<ServiceStatus> {
  if (!process.env.RESEND_API_KEY) {
    return { name: 'E-Mail Service', status: 'degraded', message: 'Resend not configured', lastChecked: new Date().toISOString() }
  }
  return { name: 'E-Mail Service', status: 'ok', message: 'Configured', lastChecked: new Date().toISOString() }
}

// Prometheus metrics format
export function generatePrometheusMetrics(
  systemMetrics: SystemMetrics,
  services: ServiceStatus[]
): string {
  const m = systemMetrics
  const serviceLines = services.map((s) => {
    const val = s.status === 'ok' ? 1 : s.status === 'degraded' ? 0.5 : 0
    return `teachai_service_up{service="${s.name}"} ${val}`
  }).join('\n')

  return `# HELP teachai_uptime_seconds Process uptime in seconds
# TYPE teachai_uptime_seconds gauge
teachai_uptime_seconds ${m.uptime}

# HELP teachai_memory_used_mb Memory used in MB
# TYPE teachai_memory_used_mb gauge
teachai_memory_used_mb ${m.memory.used}

# HELP teachai_memory_percent Memory usage percent
# TYPE teachai_memory_percent gauge
teachai_memory_percent ${m.memory.percent}

# HELP teachai_requests_total Total HTTP requests (last 60s)
# TYPE teachai_requests_total counter
teachai_requests_total ${m.requests.total}

# HELP teachai_request_errors_total Failed requests (last 60s)
# TYPE teachai_request_errors_total counter
teachai_request_errors_total ${m.requests.failed}

# HELP teachai_response_time_ms Average response time in ms
# TYPE teachai_response_time_ms gauge
teachai_response_time_ms ${m.requests.avgResponseMs}

# HELP teachai_service_up Service health (1=ok, 0.5=degraded, 0=down)
# TYPE teachai_service_up gauge
${serviceLines}
`
}
