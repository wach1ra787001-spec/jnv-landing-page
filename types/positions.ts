export interface OpenPosition {
  id: string
  user_id: string
  broker_connection_id: string | null
  account_id: string
  position_id: string
  source: 'mt5' | 'mt4' | 'ctrader' | 'tradingview' | 'manual'
  symbol: string
  asset_class: string | null
  direction: 'long' | 'short'
  volume: number
  entry_price: number
  current_price: number | null
  floating_pnl: number | null
  floating_pnl_pct: number | null
  stop_loss: number | null
  take_profit: number | null
  planned_rr: number | null
  risk_amount: number | null
  distance_to_sl_pips: number | null
  distance_to_tp_pips: number | null
  swap: number
  commission: number
  mt5_ticket: string | null
  mt5_magic: number | null
  ctrader_position_id: number | null
  broker_comment: string | null
  strategy: string | null
  tags: string[]
  opened_at: string
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface OpenPositionEnriched extends OpenPosition {
  minutes_open: number
  time_open_display: string
  net_floating_pnl: number
  is_in_profit: boolean
  broker_name: string | null
  account_login: string | null
}
