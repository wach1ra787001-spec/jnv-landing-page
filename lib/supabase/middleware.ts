import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getAuthCookieOptions, isAppHost } from '@/lib/domain-routing'
import { acquireConcurrency, checkRateLimit, getPayloadLimit, getPlanFromTier } from '@/lib/rate-limit'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
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

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'

    try {
      let plan = getPlanFromTier(user?.app_metadata?.subscription_tier ?? user?.app_metadata?.plan)
      if (user?.id) {
        const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).maybeSingle()
        plan = getPlanFromTier(profile?.subscription_tier)
      }

      const contentLength = Number(request.headers.get('content-length') ?? 0)
      const payloadLimit = getPayloadLimit(request.nextUrl.pathname)
      if (contentLength > payloadLimit) {
        return NextResponse.json(
          { error: 'Request payload is too large.', limitBytes: payloadLimit },
          { status: 413 },
        )
      }

      const rateLimit = await checkRateLimit({
        pathname: request.nextUrl.pathname,
        ip,
        userId: user?.id,
        plan,
      })

      if (user?.id && request.method !== 'GET' && (request.nextUrl.pathname.startsWith('/api/ai/') || request.nextUrl.pathname.startsWith('/api/backtest'))) {
        const kind = request.nextUrl.pathname.startsWith('/api/ai/') ? 'ai' : 'backtesting'
        const concurrency = await acquireConcurrency({ userId: user.id, plan, kind })
        if (!concurrency.success) {
          return NextResponse.json({ error: `Too many concurrent ${kind} jobs.` }, { status: 429, headers: { 'Retry-After': '600' } })
        }
      }

      if (!rateLimit.success || rateLimit.quota?.success === false) {
        const retryAfter = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(rateLimit.reset),
              ...(rateLimit.quota ? {
                'X-Quota-Limit': String(rateLimit.quota.limit),
                'X-Quota-Remaining': String(rateLimit.quota.remaining),
                'X-Quota-Reset': String(rateLimit.quota.reset),
              } : {}),
            },
          },
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Rate limiting service temporarily unavailable.' },
        { status: 503, headers: { 'Retry-After': '30' } },
      )
    }
  }

  if (
    // if the user is not logged in and the app path, in this case, /protected, is accessed, redirect to the login page
    request.nextUrl.pathname.startsWith('/protected') &&
    !user
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  if (request.nextUrl.pathname === '/') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = isAppHost(request.nextUrl.hostname) ? '/dashboard' : '/auth/login'
    const redirectResponse = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
}
