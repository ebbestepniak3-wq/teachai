// lib/rate-limit.ts – RC1: fixed memory leak + proper cleanup
import { NextRequest } from 'next/server'

interface RateLimitEntry { count: number; resetTime: number }
interface RateLimitConfig { max: number; windowMs: number }
interface RateLimitResult { success: boolean; remaining: number; reset: number }

const store = new Map<string, RateLimitEntry>()
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) store.delete(key)
  }
}

export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = { max: 100, windowMs: 15 * 60 * 1000 }
): RateLimitResult {
  cleanupExpired()

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const key = `rl:${ip}:${config.max}:${config.windowMs}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + config.windowMs })
    return { success: true, remaining: config.max - 1, reset: now + config.windowMs }
  }

  entry.count++
  return {
    success: entry.count <= config.max,
    remaining: Math.max(0, config.max - entry.count),
    reset: entry.resetTime,
  }
}

export const authRateLimit   = (r: NextRequest) => rateLimit(r, { max: 10, windowMs: 15 * 60 * 1000 })
export const uploadRateLimit = (r: NextRequest) => rateLimit(r, { max: 5,  windowMs: 60 * 1000 })
export const apiRateLimit    = (r: NextRequest) => rateLimit(r, { max: 60, windowMs: 60 * 1000 })
export const strictRateLimit = (r: NextRequest) => rateLimit(r, { max: 3,  windowMs: 10 * 60 * 1000 })
