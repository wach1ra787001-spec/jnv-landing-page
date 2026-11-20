
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getAuthCookieOptions, isAppHost } from '@/lib/domain-routing'
import {
  checkRateLimit,
  getPayloadLimit,
  getPlanFromTier,
  redis,
} from '@/lib/rate-limit'

type MiddlewareProfile = {
  subscription_tier: string | null
  role: string | null
}

const PROFILE_CACHE_TTL = 30

async function getCachedMiddlewareProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<MiddlewareProfile> {
  const cacheKey = `jnv:middleware-profile:${userId}`

  // 1. Try Redis first.
  try {
    const cachedProfile = await redis.get<MiddlewareProfile>(cacheKey)

    if (cachedProfile) {
      return cachedProfile
    }
  } catch {
    // Redis unavailable: fall back to Supabase.
  }

  // 2. Query Supabase only when the cache misses.
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_tier, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  const profile: MiddlewareProfile = {
    subscription_tier: data?.subscription_tier ?? null,
    role: data?.role ?? null,
  }

  // 3. Cache the result.
  try {
    await redis.set(cacheKey, profile, {
      ex: PROFILE_CACHE_TTL,
    })
  } catch {
    // Redis cache failure must not block the request.
  }

  return profile
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create a new Supabase client for every request.
  const cookieOptions = getAuthCookieOptions(request.nextUrl.hostname)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Verify the JWT using Supabase's cached signing keys.
  // With ES256, routine verification does not require fetching auth.users.
  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims()

  const claims = claimsError ? null : claimsData?.claims

  const userId =
    typeof claims?.sub === 'string'
      ? claims.sub
      : null

  // API request protection.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')

    const ip =
      forwardedFor?.split(',')[0]?.trim() ||
      realIp ||
      'unknown'

    try {
      let plan = getPlanFromTier(null)
      let isAdmin = false

      if (userId) {
        const profile = await getCachedMiddlewareProfile(
          supabase,
          userId,
        )

        plan = getPlanFromTier(profile.subscription_tier)

        isAdmin =
          profile.role === 'admin' ||
          profile.role === 'super_admin'
      }

      // Enforce request payload limits.
      const contentLength = Number(
        request.headers.get('content-length') ?? 0,
      )

      const payloadLimit = getPayloadLimit(
        request.nextUrl.pathname,
      )

      if (contentLength > payloadLimit) {
        return NextResponse.json(
          {
            error: 'Request payload is too large.',
            limitBytes: payloadLimit,
          },
          { status: 413 },
        )
      }

      // Preserve the existing backtest GET exemption.
      const isBacktestRead =
        request.method === 'GET' &&
        request.nextUrl.pathname.startsWith('/api/backtest/')

      const rateLimit =
        isAdmin || isBacktestRead
          ? null
          : await checkRateLimit({
              pathname: request.nextUrl.pathname,
              ip,
              userId,
              plan,
              method: request.method,
            })

      if (
        rateLimit &&
        (!rateLimit.success || rateLimit.quota?.success === false)
      ) {
        const quota = rateLimit.quota
        const quotaExceeded = quota?.success === false

        const resetAt = quotaExceeded
          ? quota.reset
          : rateLimit.reset

        const retryAfter = Math.max(
          1,
          Math.ceil((resetAt - Date.now()) / 1000),
        )

        return NextResponse.json(
          {
            error: quotaExceeded
              ? `Backtesting quota reached for your ${rateLimit.plan} plan.`
              : 'Too many requests. Please try again later.',
            code: quotaExceeded
              ? 'MONTHLY_QUOTA_EXCEEDED'
              : 'RATE_LIMITED',
            limit: quotaExceeded
              ? quota!.limit
              : rateLimit.limit,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(
                quotaExceeded ? quota!.limit : rateLimit.limit,
              ),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(resetAt),

              ...(rateLimit.quota
                ? {
                    'X-Quota-Limit': String(rateLimit.quota.limit),
                    'X-Quota-Remaining': String(
                      rateLimit.quota.remaining,
                    ),
                    'X-Quota-Reset': String(
                      rateLimit.quota.reset,
                    ),
                  }
                : {}),
            },
          },
        )
      }
    } catch (error) {
      console.error('[Middleware] API protection error:', error)

      return NextResponse.json(
        {
          error: 'Rate limiting service temporarily unavailable.',
        },
        {
          status: 503,
          headers: {
            'Retry-After': '30',
          },
        },
      )
    }
  }

  // Protect authenticated routes.
  if (
    request.nextUrl.pathname.startsWith('/protected') &&
    !userId
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'

    const redirectResponse = NextResponse.redirect(url)

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    return redirectResponse
  }

  // Root-domain routing.
  if (request.nextUrl.pathname === '/') {
    const redirectUrl = request.nextUrl.clone()

    redirectUrl.pathname = isAppHost(request.nextUrl.hostname)
      ? '/dashboard'
      : '/auth/login'

    const redirectResponse = NextResponse.redirect(redirectUrl)

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    return redirectResponse
  }

  return supabaseResponse
}
