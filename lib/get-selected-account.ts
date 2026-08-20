import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Cookie that stores the user's explicitly selected trading account.
 * This takes priority over `profiles.default_account_id` so that switching
 * accounts from the header selector is reflected immediately across every
 * page, without waiting on a database round trip to "stick".
 */
export const SELECTED_ACCOUNT_COOKIE = "jnv_selected_account"

export interface AccountSummary {
  id: string
  account_name: string
  account_type: string
  currency: string
}

/**
 * Resolves which trading account should be treated as "active" for a request.
 *
 * Priority:
 *   1. Explicit cookie override (most recent selection made via the account selector)
 *   2. `profiles.default_account_id`
 *   3. Most recently created account
 *
 * The candidate is always verified against the user's real accounts, so a
 * stale cookie or profile value can never resolve to another user's account.
 */
export async function resolveActiveAccountId(
  supabase: SupabaseClient,
  userId: string,
  cookieAccountId?: string | null,
): Promise<string | null> {
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const accountList = accounts || []
  if (accountList.length === 0) return null

  const validIds = new Set(accountList.map((account) => account.id as string))

  if (cookieAccountId && validIds.has(cookieAccountId)) {
    return cookieAccountId
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_account_id")
    .eq("id", userId)
    .single()

  if (profile?.default_account_id && validIds.has(profile.default_account_id)) {
    return profile.default_account_id
  }

  return accountList[0].id as string
}

/**
 * Server-only helper for Server Components and Route Handlers. Reads the
 * selected-account cookie and resolves the active account id for the user.
 * This is the single source of truth for "which account is active" —
 * every account-scoped page/route should call this instead of re-deriving
 * `profiles.default_account_id` / first-account logic itself.
 */
export async function getSelectedAccountId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const cookieStore = await cookies()
  const cookieAccountId = cookieStore.get(SELECTED_ACCOUNT_COOKIE)?.value ?? null
  return resolveActiveAccountId(supabase, userId, cookieAccountId)
}

/**
 * Fetches the lightweight account list used by the account selector and by
 * server pages that need to resolve an active account.
 */
export async function getUserAccounts(supabase: SupabaseClient, userId: string): Promise<AccountSummary[]> {
  const { data } = await supabase
    .from("accounts")
    .select("id, account_name, account_type, currency")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return data || []
}
