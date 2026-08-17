export interface TradeNote {
  id: string
  user_id?: string
  trade_id?: string
  // from trades_with_journal
  symbol?: string
  direction?: 'long' | 'short'
  net_pnl?: number
  status?: string
  entry_time?: string
  created_at?: string
  // rich note fields (from trade_notes or mapped)
  title?: string
  note?: string        // body text (from trade_notes) or post_trade_notes
  body?: string
  outcome?: 'win' | 'loss' | 'general'
  pnl?: number
  note_date?: string
  tags?: string[]
  pair?: string
  trade_ref?: string
}

export interface NoteFormData {
  title: string
  pair: string
  trade_ref: string
  direction: '' | 'long' | 'short'
  outcome: 'general' | 'win' | 'loss'
  pnl: string
  note_date: string
  tags: string[]
  body: string
}
