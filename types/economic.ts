export interface EconomicEvent {
  id: string
  event_name: string
  currency: string
  impact: 'high' | 'medium' | 'low' | 'holiday'
  event_time_utc: string
  forecast: string | null
  actual: string | null
  previous: string | null
  revised: string | null
  surprise_pct: number | null
  source: string
  source_id: string | null
  country: string | null
  is_released: boolean
  is_revised: boolean
  created_at: string
  updated_at: string
}

export interface FMPEvent {
  date: string // YYYY-MM-DD
  time?: string // HH:MM (optional, defaults to 08:30)
  event: string
  country: string
  impact: string // "High", "Medium", "Low"
  forecast?: string | null
  actual?: string | null
  previous?: string | null
  revised?: string | null
  changePercent?: string | null
}

export interface Trade {
  id: string
  entry_time: string
  exit_time?: string
  symbol: string
  pnl: number
  status: string
  user_id: string
}

export interface TradeWithNews extends Trade {
  nearest_event: EconomicEvent | null
  minutes_from_news: number | null
  is_near_high_impact: boolean
}

export interface CalendarSyncResult {
  fetched: number
  upserted: number
  errors: string[]
  from: string
  to: string
  source: string
}

export interface TradingEconomicsEvent {
  Category: string
  Currency: string
  Importance: string
  Date: string
  Forecast: string | null
  Actual: string | null
  Previous: string | null
  Revised: string | null
  Country: string
  CalendarId: string
}

export interface NewsImpactAnalysis {
  nearNews: {
    trades: TradeWithNews[]
    winRate: number
    avgPnl: number
  }
  normalTime: {
    trades: TradeWithNews[]
    winRate: number
    avgPnl: number
  }
}
