// lib/cache/index.ts – caching layer with Redis (Upstash) and memory fallback

import { logger } from '@/lib/logger'

// In-memory fallback cache (for dev or when Redis is unavailable)
const memCache = new Map<string, { value: string; expiresAt: number }>()

function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt
}

function cleanMemCache() {
  for (const [key, entry] of memCache.entries()) {
    if (isExpired(entry.expiresAt)) memCache.delete(key)
  }
}

export interface CacheClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  increment(key: string, ttlSeconds: number): Promise<number>
}

// Upstash Redis client
async function getRedisClient(): Promise<CacheClient | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  const request = async (command: string, ...args: any[]): Promise<any> => {
    const res = await fetch(`${url}/${command}/${args.map(encodeURIComponent).join('/')}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`Redis error: ${res.status}`)
    const data = await res.json()
    return data.result
  }

  return {
    async get(key) { return request('get', key) },
    async set(key, value, ttl) { await request('setex', key, ttl, value) },
    async del(key) { await request('del', key) },
    async exists(key) { return (await request('exists', key)) > 0 },
    async increment(key, ttl) {
      const val = await request('incr', key)
      await request('expire', key, ttl)
      return val
    },
  }
}

// Memory fallback
const memoryCacheClient: CacheClient = {
  async get(key) {
    const entry = memCache.get(key)
    if (!entry || isExpired(entry.expiresAt)) {
      memCache.delete(key)
      return null
    }
    return entry.value
  },
  async set(key, value, ttl) {
    cleanMemCache()
    memCache.set(key, { value, expiresAt: Date.now() + ttl * 1000 })
  },
  async del(key) { memCache.delete(key) },
  async exists(key) {
    const entry = memCache.get(key)
    return !!entry && !isExpired(entry.expiresAt)
  },
  async increment(key, ttl) {
    const entry = memCache.get(key)
    const current = entry && !isExpired(entry.expiresAt) ? parseInt(entry.value) : 0
    const next = current + 1
    memCache.set(key, { value: String(next), expiresAt: Date.now() + ttl * 1000 })
    return next
  },
}

let cacheClientInstance: CacheClient | null = null

export async function getCache(): Promise<CacheClient> {
  if (!cacheClientInstance) {
    const redis = await getRedisClient().catch(() => null)
    cacheClientInstance = redis || memoryCacheClient
  }
  return cacheClientInstance
}

// Convenience helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const cache = await getCache()
    const val = await cache.get(key)
    return val ? JSON.parse(val) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const cache = await getCache()
    await cache.set(key, JSON.stringify(value), ttlSeconds)
  } catch (err) {
    logger.warn('Cache set failed', { key, err })
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const cache = await getCache()
    await cache.del(key)
  } catch {}
}

// Rate limiting via cache
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  try {
    const cache = await getCache()
    const count = await cache.increment(`ratelimit:${key}`, windowSeconds)
    const remaining = Math.max(0, limit - count)
    return { allowed: count <= limit, remaining, resetIn: windowSeconds }
  } catch {
    return { allowed: true, remaining: limit, resetIn: windowSeconds }
  }
}
