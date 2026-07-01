// lib/queue/grading-queue.ts – in-process queue with retry logic

import { logger } from '@/lib/logger'
import type { QueueJob } from '@/lib/grading/types'

const MAX_CONCURRENT = 3
const MAX_ATTEMPTS = 3
const RETRY_DELAYS_MS = [5_000, 15_000, 60_000] // 5s, 15s, 60s

class GradingQueue {
  private queue: QueueJob[] = []
  private processing: Set<string> = new Set()
  private processing_count = 0

  enqueue(job: QueueJob): void {
    const existing = this.queue.find((j) => j.jobId === job.jobId)
    if (existing || this.processing.has(job.jobId)) {
      logger.warn('Job already in queue', { jobId: job.jobId })
      return
    }
    this.queue.push(job)
    this.queue.sort((a, b) => b.priority - a.priority) // higher priority first
    logger.info('Job enqueued', { jobId: job.jobId, queueLength: this.queue.length })
  }

  dequeue(): QueueJob | null {
    if (this.processing_count >= MAX_CONCURRENT) return null
    const job = this.queue.shift()
    if (job) {
      this.processing.add(job.jobId)
      this.processing_count++
    }
    return job || null
  }

  complete(jobId: string): void {
    this.processing.delete(jobId)
    this.processing_count = Math.max(0, this.processing_count - 1)
    logger.info('Job completed', { jobId, remaining: this.queue.length })
  }

  fail(jobId: string, error: string): void {
    this.processing.delete(jobId)
    this.processing_count = Math.max(0, this.processing_count - 1)
    logger.error('Job failed', { jobId, error })
  }

  requeue(job: QueueJob, delayMs: number): void {
    setTimeout(() => {
      this.enqueue({ ...job, attempts: job.attempts + 1 })
    }, delayMs)
  }

  getStatus(): { queueLength: number; processing: number; slots: number } {
    return {
      queueLength: this.queue.length,
      processing: this.processing_count,
      slots: MAX_CONCURRENT - this.processing_count,
    }
  }

  isProcessing(jobId: string): boolean {
    return this.processing.has(jobId)
  }
}

// Singleton queue instance
export const gradingQueue = new GradingQueue()

// Execute a grading job with retry
export async function executeGradingJob(
  jobId: string,
  executeFn: () => Promise<{ success: boolean; error?: string }>
): Promise<void> {
  const job = { jobId, userId: '', uploadId: '', priority: 0, createdAt: Date.now(), attempts: 0, maxAttempts: MAX_ATTEMPTS }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      logger.info('Executing grading job', { jobId, attempt: attempt + 1 })
      const result = await executeFn()

      if (result.success) {
        return
      }

      // Retryable error?
      const isRetryable = !result.error?.includes('API-Authentifizierung')
      if (!isRetryable || attempt >= MAX_ATTEMPTS - 1) {
        throw new Error(result.error || 'Job failed')
      }

      const delay = RETRY_DELAYS_MS[attempt] || 60_000
      logger.warn(`Grading job retry in ${delay}ms`, { jobId, attempt, error: result.error })
      await sleep(delay)
    } catch (error: any) {
      if (attempt >= MAX_ATTEMPTS - 1) {
        logger.error('Grading job exhausted retries', { jobId, error: error.message })
        throw error
      }
      const delay = RETRY_DELAYS_MS[attempt] || 60_000
      await sleep(delay)
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// API monitoring data
export interface ApiUsageRecord {
  timestamp: number
  jobId: string
  tokensUsed: number
  cost: number
  durationMs: number
  success: boolean
}

class ApiMonitor {
  private records: ApiUsageRecord[] = []
  private readonly maxRecords = 1000

  record(data: ApiUsageRecord): void {
    this.records.push(data)
    if (this.records.length > this.maxRecords) {
      this.records.shift()
    }
  }

  getStats(lastNMinutes = 60): {
    totalCalls: number
    successRate: number
    avgDurationMs: number
    totalTokens: number
    totalCost: number
    errorCount: number
  } {
    const since = Date.now() - lastNMinutes * 60 * 1000
    const recent = this.records.filter((r) => r.timestamp > since)

    if (recent.length === 0) {
      return { totalCalls: 0, successRate: 100, avgDurationMs: 0, totalTokens: 0, totalCost: 0, errorCount: 0 }
    }

    const successful = recent.filter((r) => r.success)
    return {
      totalCalls: recent.length,
      successRate: Math.round((successful.length / recent.length) * 100),
      avgDurationMs: Math.round(recent.reduce((s, r) => s + r.durationMs, 0) / recent.length),
      totalTokens: recent.reduce((s, r) => s + r.tokensUsed, 0),
      totalCost: Math.round(recent.reduce((s, r) => s + r.cost, 0) * 100) / 100,
      errorCount: recent.length - successful.length,
    }
  }
}

export const apiMonitor = new ApiMonitor()
