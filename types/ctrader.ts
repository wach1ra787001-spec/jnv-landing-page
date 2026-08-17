export interface CTraderAccount {
  ctidTraderAccountId: number
  login: string
  name: string
  brokerName: string
  isLive: boolean
  balance: number
  currency: string
  equity?: number
  usedMargin?: number
  freeMargin?: number
}

export interface CTraderDeal {
  dealId: number
  positionId: number
  orderId: number
  symbol: string
  tradeSide: 'BUY' | 'SELL'
  volume: number
  filledVolume: number
  executionPrice: number
  createTimestamp: number
  executionTimestamp: number
  commission: number
  swap: number
  label?: string
  comment?: string
  closePositionDetail?: {
    entryPrice: number
    closePrice: number
    grossProfit: number
    balance: number
    closingDealId: number
  }
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface BrokerConnection {
  id: string
  user_id: string
  broker: string
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  ctrader_account_id: number | null
  account_login: string | null
  account_name: string | null
  broker_name: string | null
  is_live: boolean
  is_connected: boolean
  last_synced_at: string | null
  last_sync_error: string | null
  sync_from_date: string | null
  created_at: string
  updated_at: string
}

export interface SyncResult {
  imported: number
  updated: number
  errors: Array<{ dealId: number; error: string }>
}
