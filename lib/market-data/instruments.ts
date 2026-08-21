import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export type MarketDataInstrument = {
  symbol: string
  provider: string
  dataset: string
  provider_symbol: string
  provider_stype_in: string
  schema: string
  enabled: boolean
}

export async function resolveMarketDataInstrument(symbol: string) {
  const normalized = symbol.replace(/[\/\-\s]/g, '').toUpperCase()
  // This is server-only reference data. Use the service-role client so the
  // OHLC route does not depend on a browser auth cookie or authenticated RLS
  // context (which made production curl/preview checks appear unmapped).
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('market_data_instruments')
    .select('symbol, provider, dataset, provider_symbol, provider_stype_in, schema, enabled')
    .eq('symbol', normalized)
    .eq('enabled', true)
    .maybeSingle()

  if (error) throw new Error(`Instrument mapping lookup failed: ${error.message}`)
  return (data as MarketDataInstrument | null) ?? null
}

export function normalizeMarketSymbol(symbol: string) {
  return symbol.replace(/[\/\-\s]/g, '').toUpperCase()
}
