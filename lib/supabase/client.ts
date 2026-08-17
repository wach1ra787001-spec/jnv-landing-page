import { createBrowserClient } from '@supabase/ssr'
import { getAuthCookieOptions } from '@/lib/domain-routing'

export function createClient() {
  const cookieOptions = typeof window !== 'undefined'
    ? getAuthCookieOptions(window.location.hostname)
    : undefined

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookieOptions ? { cookieOptions } : undefined,
  )
}
