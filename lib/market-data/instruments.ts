import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()
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
