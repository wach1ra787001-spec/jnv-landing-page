'use client'

import { useEffect, useState } from 'react'
import { useMT5Connections, useMT5Trades, useMT5AccountSnapshot } from '@/lib/mt5/client'
import { getMT5DashboardSummary, getRecentMT5Trades } from '@/lib/mt5/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowDownRight, ArrowUpRight, TrendingUp, Activity } from 'lucide-react'

export function MT5Dashboard() {
  const { connections, loading: connectionsLoading } = useMT5Connections()
  const [selectedConnection, setSelectedConnection] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [recentTrades, setRecentTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Get account snapshot for live data
  const { snapshot: accountSnapshot } = useMT5AccountSnapshot(
    selectedConnection?.id || ''
  )

  // Get trades data
  const { trades: allTrades } = useMT5Trades({
    connectionId: selectedConnection?.id,
    status: 'closed',
  })

  // Fetch dashboard summary and recent trades
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedConnection) return

      try {
        setLoading(true)
        const [summary, recent] = await Promise.all([
          getMT5DashboardSummary(selectedConnection.user_id, selectedConnection.id),
          getRecentMT5Trades(selectedConnection.user_id, 5, selectedConnection.id),
        ])

        setDashboardData(summary)
        setRecentTrades(recent)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedConnection])

  // Auto-select first connection if available
  useEffect(() => {
    if (!connectionsLoading && connections.length > 0 && !selectedConnection) {
      setSelectedConnection(connections[0])
    }
  }, [connections, connectionsLoading, selectedConnection])

  if (connectionsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!connections.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No MT5 connections found. Connect your account to get started.</p>
      </div>
    )
  }

  const isConnected = selectedConnection?.is_active
  const balance = accountSnapshot?.balance
  const equity = accountSnapshot?.equity
  const profit = accountSnapshot?.profit

  return (
    <div className="space-y-6">
      {/* Connection Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {connections.map((conn) => (
          <button
            key={conn.id}
            onClick={() => setSelectedConnection(conn)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg border transition-all ${
              selectedConnection?.id === conn.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary'
            }`}
          >
            <div className="font-medium text-sm">{conn.broker_name}</div>
            <div className="text-xs text-muted-foreground">{conn.account_login}</div>
          </button>
        ))}
      </div>

      {/* Connection Status */}
      {selectedConnection && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedConnection.broker_name}</CardTitle>
                <CardDescription>
                  Account: {selectedConnection.account_login}
                </CardDescription>
              </div>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {selectedConnection.last_heartbeat_at && (
              <p className="text-sm text-muted-foreground">
                Last heartbeat:{' '}
                {new Date(selectedConnection.last_heartbeat_at).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Account Overview */}
      {accountSnapshot && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${balance?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Equity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${equity?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  (profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {(profit || 0) >= 0 ? '+' : ''}${profit?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Summary */}
      {dashboardData && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Today's Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.today.trades_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData.today.wins} wins ({dashboardData.today.win_rate}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Today's P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  dashboardData.today.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {dashboardData.today.pnl >= 0 ? '+' : ''}${dashboardData.today.pnl.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Latest {recentTrades.length} closed trades</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : recentTrades.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No trades yet</p>
          ) : (
            <div className="space-y-3">
              {recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{trade.symbol}</span>
                      <Badge variant="outline" className="text-xs">
                        {trade.direction.toUpperCase()}
                      </Badge>
                      {trade.profit >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trade.entry_time).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold ${
                        trade.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {trade.volume} lots @ ${trade.entry_price.toFixed(5)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
