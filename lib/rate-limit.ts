import 'server-only'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export type Plan = 'basic' | 'premium' | 'elite'
type UsageKind = 'ai' | 'imports' | 'backtesting' | 'sync'
type ConcurrencyKind = 'ai' | 'backtesting'

export type RateLimitPolicy = {
  name: string
  requests: number
  window: `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`
}

export const PLAN_LIMITS: Record<Plan, Record<UsageKind, number>> = {
  basic: { ai: 100, imports: 10, backtesting: 20, sync: 30 },
  premium: { ai: 500, imports: 50, backtesting: 100, sync: 200 },
  elite: { ai: 2000, imports: 200, backtesting: 500, sync: 1000 },
}

export const CONCURRENCY_LIMITS: Record<Plan, Record<ConcurrencyKind, number>> = {
  basic: { ai: 1, backtesting: 1 },
  premium: { ai: 3, backtesting: 2 },
  elite: { ai: 5, backtesting: 4 },
}

export const PAYLOAD_LIMITS = {
  upload: 10 * 1024 * 1024,
  import: 25 * 1024 * 1024,
  ai: 256 * 1024,
  default: 1 * 1024 * 1024,
} as const

const redis = Redis.fromEnv()
const policies: Array<[string, RateLimitPolicy]> = [
  ['/api/auth/', { name: 'auth', requests: 10, window: '10 m' }],
  ['/api/ai/', { name: 'ai', requests: 20, window: '1 m' }],
  ['/api/email/', { name: 'email', requests: 5, window: '10 m' }],
  ['/api/import/', { name: 'import', requests: 5, window: '10 m' }],
  ['/api/upload/', { name: 'upload', requests: 20, window: '10 m' }],
  ['/api/admin/', { name: 'admin', requests: 30, window: '1 m' }],
  ['/api/backtest/', { name: 'backtesting', requests: 30, window: '1 m' }],
  ['/api/backtesting/', { name: 'backtesting', requests: 30, window: '1 m' }],
  ['/api/waitlist/', { name: 'waitlist', requests: 3, window: '1 h' }],
  ['/api/trades/', { name: 'trades', requests: 120, window: '1 m' }],
  ['/api/journal/', { name: 'journal', requests: 120, window: '1 m' }],
  ['/api/analytics/', { name: 'analytics', requests: 120, window: '1 m' }],
]
const fallbackPolicy: RateLimitPolicy = { name: 'api', requests: 120, window: '1 m' }
const limiters = new Map<string, Ratelimit>()
const monthlyLimiters = new Map<string, Ratelimit>()

function getPolicy(pathname: string) { return policies.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? fallbackPolicy }
function getLimiter(policy: RateLimitPolicy) {
  const existing = limiters.get(policy.name)
  if (existing) return existing
  const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(policy.requests, policy.window), prefix: `jnv:ratelimit:${policy.name}`, analytics: true })
  limiters.set(policy.name, limiter)
  return limiter
}
function getMonthlyLimiter(kind: UsageKind, limit: number) {
  const key = `${kind}:${limit}`
  const existing = monthlyLimiters.get(key)
  if (existing) return existing
  const limiter = new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(limit, '30 d'), prefix: `jnv:quota:${kind}`, analytics: true })
  monthlyLimiters.set(key, limiter)
  return limiter
}
function planFromTier(tier?: string | null): Plan {
  if (tier === 'elite') return 'elite'
  if (tier === 'premium' || tier === 'pro') return 'premium'
  return 'basic'
}
export function getPlanFromTier(tier?: string | null) { return planFromTier(tier) }
export function getRateLimitPolicy(pathname: string) { return getPolicy(pathname) }
export function getPayloadLimit(pathname: string) {
  if (pathname.startsWith('/api/upload/')) return PAYLOAD_LIMITS.upload
  if (pathname.startsWith('/api/import/')) return PAYLOAD_LIMITS.import
  if (pathname.startsWith('/api/ai/')) return PAYLOAD_LIMITS.ai
  return PAYLOAD_LIMITS.default
}
function usageKindForPath(pathname: string): UsageKind | null {
  if (pathname.startsWith('/api/ai/')) return 'ai'
  if (pathname.startsWith('/api/import/')) return 'imports'
  if (pathname.startsWith('/api/backtest')) return 'backtesting'
  if (pathname.startsWith('/api/mt5/') || pathname.startsWith('/api/ctrader/')) return 'sync'
  return null
}
export async function checkRateLimit({ pathname, ip, userId, plan = 'basic', method = 'GET' }: { pathname: string; ip: string; userId?: string | null; plan?: Plan; method?: string }) {
  const policy = getPolicy(pathname)
  const identity = userId ? `user:${userId}:ip:${ip}` : `ip:${ip}`
  const result = await getLimiter(policy).limit(identity)
  const kind = usageKindForPath(pathname)
  const quota = userId && kind && method !== 'GET'
    ? await getMonthlyLimiter(kind, PLAN_LIMITS[plan][kind]).limit(`user:${userId}:${new Date().toISOString().slice(0, 7)}`)
    : null
  return { ...result, policy, identity, quota, quotaKind: kind, plan }
}
export function getConcurrencyLimit(plan: Plan, kind: ConcurrencyKind) { return CONCURRENCY_LIMITS[plan][kind] }
export async function acquireConcurrency({ userId, plan, kind }: { userId: string; plan: Plan; kind: ConcurrencyKind }) {
  const key = `jnv:concurrency:${kind}:${userId}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 10 * 60)
  if (count > getConcurrencyLimit(plan, kind)) { await redis.decr(key); return { success: false, key } }
  return { success: true, key }
}
export async function releaseConcurrency(key: string) { await redis.decr(key) }
export { usageKindForPath }

export { redis }

export function getLimiterPolicyForPath(pathname: string) { return getPolicy(pathname) }
