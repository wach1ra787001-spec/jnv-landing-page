// Supabase types
export type TradeStatus = 'open' | 'closed' | 'cancelled'
export type TradeDirection = 'long' | 'short'
export type TradeSource = 'manual' | 'mt5' | 'ctrader'

export interface Database {
  public: {
    Tables: {
      trades: {
        Row: Trade
        Insert: Omit<Trade, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Trade, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      trade_metrics: {
        Row: TradeMetric
        Insert: Omit<TradeMetric, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TradeMetric, 'id' | 'created_at'>>
      }
      trade_notes: {
        Row: TradeNote
        Insert: Omit<TradeNote, 'id' | 'created_at'>
        Update: Partial<Omit<TradeNote, 'id' | 'created_at'>>
      }
    }
  }
}

export interface Trade {
  id: string
  user_id: string
  symbol: string
  direction: TradeDirection
  entry_price: number
  exit_price: number | null
  quantity: number
  entry_time: string
  exit_time: string | null
  pnl: number | null
  pnl_percent: number | null
  stop_loss: number | null
  take_profit: number | null
  r_multiple: number | null
  risk_amount: number | null
  setup_type: string | null
  strategy: string | null
  status: TradeStatus
  source: TradeSource
  notes: string | null
  emotion_before: string | null
  screenshot_urls: string[] | null
  created_at: string
  updated_at: string
  mt5_ticket?: string | null
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface TradeMetric {
  id: string
  user_id: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  total_pnl: number
  win_rate: number
  average_win: number
  average_loss: number
  largest_win: number
  largest_loss: number
  created_at: string
  updated_at: string
}

export interface TradeNote {
  id: string
  user_id: string
  trade_id: string
  note: string
  created_at: string
  updated_at?: string
}
