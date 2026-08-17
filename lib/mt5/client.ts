'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState, useCallback } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Hook to fetch MT5 connections for the current user
 */
export function useMT5Connections() {
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const { data, error } = await supabase
          .from('mt5_connections')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setConnections(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch connections')
      } finally {
        setLoading(false)
      }
    }

    fetchConnections()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('mt5_connections')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mt5_connections' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConnections((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setConnections((prev) =>
              prev.map((conn) => (conn.id === payload.new.id ? payload.new : conn))
            )
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return { connections, loading, error }
}

/**
 * Hook to fetch MT5 processed trades for the current user
 */
export function useMT5Trades(filters?: { connectionId?: string; status?: string }) {
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        let query = supabase
          .from('mt5_processed_trades')
          .select('*, mt5_connections(broker_name, account_login)')

        if (filters?.connectionId) {
          query = query.eq('connection_id', filters.connectionId)
        }

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        const { data, error } = await query.order('entry_time', { ascending: false })

        if (error) throw error
        setTrades(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trades')
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('mt5_trades')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mt5_processed_trades' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTrades((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setTrades((prev) =>
              prev.map((trade) => (trade.id === payload.new.id ? payload.new : trade))
            )
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [filters?.connectionId, filters?.status])

  return { trades, loading, error }
}

/**
 * Hook to fetch live account data for an MT5 connection
 */
export function useMT5AccountSnapshot(connectionId: string) {
  const [snapshot, setSnapshot] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const { data, error } = await supabase
          .from('mt5_account_snapshots')
          .select('*')
          .eq('connection_id', connectionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        setSnapshot(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch account snapshot')
      } finally {
        setLoading(false)
      }
    }

    if (connectionId) {
      fetchSnapshot()

      // Poll for updates every 5 seconds
      const interval = setInterval(fetchSnapshot, 5000)
      return () => clearInterval(interval)
    }
  }, [connectionId])

  return { snapshot, loading, error }
}

/**
 * Disconnect an MT5 account
 */
export async function disconnectMT5Account(connectionId: string) {
  try {
    const { error } = await supabase
      .from('mt5_connections')
      .update({ is_active: false })
      .eq('id', connectionId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to disconnect',
    }
  }
}

/**
 * Fetch trade OHLC data for replay
 */
export async function getTradeOHLC(
  tradeId: string,
  symbol: string,
  timeframe: string
) {
  try {
    const { data, error } = await supabase
      .from('mt5_trade_ohlc')
      .select('candles')
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error
    return data?.[0]?.candles || []
  } catch (err) {
    console.error('Error fetching OHLC:', err)
    return []
  }
}

/**
 * Get symbol specs (metadata)
 */
export async function getSymbolSpec(symbol: string) {
  try {
    const { data, error } = await supabase
      .from('mt5_symbol_specs')
      .select('*')
      .eq('symbol', symbol)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (err) {
    console.error('Error fetching symbol spec:', err)
    return null
  }
}
