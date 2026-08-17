'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/currency'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChartDataPoint {
  date: string
  pnl: number
  tradePnl: number
}

interface PnLChartProps {
  userId: string
  currency: string
  height?: number
  className?: string
  accountId?: string | null
}

const CustomTooltip = ({
  active,
  payload,
  isPositive,
  currency,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: ChartDataPoint }>
  isPositive: boolean
  currency: string
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const borderColor = isPositive ? '#16a34a' : '#dc2626'

    return (
      <div
        className="bg-white dark:bg-slate-950 px-4 py-3 rounded-lg shadow-lg text-sm border"
        style={{ borderColor }}
      >
        <p className="font-medium text-foreground mb-1">{data.date}</p>
        <p
          className={cn(
            'font-bold',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}
        >
          Cumulative: {formatCurrency(data.pnl, currency)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          This trade: {formatCurrency(data.tradePnl, currency)}
        </p>
      </div>
    )
  }
  return null
}

export function PnLChart({
  userId,
  currency,
  height = 350,
  className = '',
  accountId,
}: PnLChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('1M')
  const [stats, setStats] = useState({
    totalPnL: 0,
    peakPnL: 0,
    maxDrawdown: 0,
  })

  useEffect(() => {
    fetchAndProcessTrades()
  }, [userId, period, accountId])

  const fetchAndProcessTrades = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      let query = supabase
        .from('trades')
        .select('exit_time, net_pnl, pnl, commission, swap')
        .eq('user_id', userId)
        .eq('status', 'closed')
        .order('exit_time', { ascending: true })

      if (accountId) {
        query = query.eq('account_id', accountId)
      }

      const { data: trades, error: tradeError } = await query

      if (tradeError) throw tradeError

      if (!trades || trades.length === 0) {
        setChartData([])
        setStats({ totalPnL: 0, peakPnL: 0, maxDrawdown: 0 })
        setLoading(false)
        return
      }

      // Filter by period
      const now = new Date()
      const filteredTrades = trades.filter((trade) => {
        const tradeDate = new Date(trade.exit_time)
        const daysAgo = Math.floor(
          (now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        switch (period) {
          case '1W':
            return daysAgo <= 7
          case '1M':
            return daysAgo <= 30
          case '3M':
            return daysAgo <= 90
          case '6M':
            return daysAgo <= 180
          case '1Y':
            return daysAgo <= 365
          case 'All':
            return true
          default:
            return true
        }
      })

      // Transform into cumulative P&L
      let cumulative = 0
      const data: ChartDataPoint[] = filteredTrades.map((trade) => {
        const netPnL =
          trade.net_pnl ?? (trade.pnl - (trade.commission || 0) - (trade.swap || 0))
        cumulative += netPnL
        return {
          date: new Date(trade.exit_time).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          pnl: parseFloat(cumulative.toFixed(2)),
          tradePnl: netPnL,
        }
      })

      // Calculate stats
      const totalPnL = data.length > 0 ? data[data.length - 1].pnl : 0
      const peakPnL = Math.max(...data.map((d) => d.pnl), 0)

      // Calculate max drawdown
      let peak = -Infinity
      let maxDD = 0
      data.forEach((point) => {
        if (point.pnl > peak) peak = point.pnl
        const drawdown = peak - point.pnl
        if (drawdown > maxDD) maxDD = drawdown
      })

      setChartData(data)
      setStats({
        totalPnL,
        peakPnL,
        maxDrawdown: -maxDD,
      })
    } catch (err) {
      console.error('[v0] Error fetching P&L data:', err)
      setError('Could not load P&L data')
    } finally {
      setLoading(false)
    }
  }

  const latestPnL = chartData.length > 0 ? chartData[chartData.length - 1].pnl : 0
  const isPositive = latestPnL > 0
  const isNegative = latestPnL < 0

  // Determine colors
  let lineColor = '#94a3b8'
  let topColor = 'rgba(148, 163, 184, 0.35)'
  let bottomColor = 'rgba(148, 163, 184, 0.0)'

  if (isPositive) {
    lineColor = '#16a34a'
    topColor = 'rgba(22, 163, 74, 0.35)'
    bottomColor = 'rgba(22, 163, 74, 0.0)'
  } else if (isNegative) {
    lineColor = '#dc2626'
    topColor = 'rgba(220, 38, 38, 0.35)'
    bottomColor = 'rgba(220, 38, 38, 0.0)'
  }

  // Calculate Y axis domain
  const minPnL = Math.min(...chartData.map((d) => d.pnl), 0)
  const maxPnL = Math.max(...chartData.map((d) => d.pnl), 0)
  const yDomain = [minPnL * 1.1, maxPnL * 1.1]

  // Handle flat line case
  if (chartData.length > 0 && minPnL === maxPnL) {
    yDomain[0] = minPnL - 100
    yDomain[1] = maxPnL + 100
  }

  const periodButtons = ['1W', '1M', '3M', '6M', '1Y', 'All']

  if (loading) {
    return (
      <Card className="p-6 bg-card border border-border/50">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 bg-card border border-border/50 flex items-center justify-center" style={{ height }}>
        <div className="text-center text-sm text-red-600">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => fetchAndProcessTrades()}
          >
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="p-6 bg-card border border-border/50 flex flex-col items-center justify-center gap-3" style={{ height }}>
        <TrendingDown className="w-10 h-10 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium text-foreground">Your P&L curve will appear here</p>
          <p className="text-sm text-muted-foreground">
            Close your first trade to see your performance
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-3 sm:p-6 bg-card border border-border/50 mx-4 sm:mx-0', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">P&L Tracking</h3>
        <div className="flex gap-1 overflow-x-auto flex-nowrap pb-1">
          {periodButtons.map((btn) => (
            <Button
              key={btn}
              variant={period === btn ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(btn)}
              className={cn(
                'text-xs flex-shrink-0',
                period === btn
                  ? 'bg-slate-900 dark:bg-slate-900 text-white'
                  : 'bg-transparent'
              )}
            >
              {btn}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="rounded-lg bg-muted p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total P&L</p>
          <p
            className={cn(
              'text-lg sm:text-xl font-bold',
              stats.totalPnL >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {formatCurrency(stats.totalPnL, currency)}
          </p>
        </div>
        <div className="rounded-lg bg-muted p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Peak P&L</p>
          <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(stats.peakPnL, currency)}
          </p>
        </div>
        <div className="rounded-lg bg-muted p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Max Drawdown</p>
          <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(stats.maxDrawdown, currency)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full overflow-hidden">
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={topColor.split(',')[0] + ','} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={bottomColor.split(',')[0] + ','} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                angle={chartData.length > 10 ? -45 : 0}
                textAnchor={chartData.length > 10 ? 'end' : 'middle'}
                height={chartData.length > 10 ? 60 : 30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                width={50}
                domain={yDomain}
                tickFormatter={(value) => formatCurrency(value, currency)}
              />
              <Tooltip
                content={({ active, payload }) => (
                  <CustomTooltip
                    active={active}
                    payload={payload as Array<{ value: number; payload: ChartDataPoint }>}
                    isPositive={isPositive}
                    currency={currency}
                  />
                )}
              />
              <ReferenceLine
                y={0}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke={lineColor}
                fill="url(#pnlGradient)"
                strokeWidth={2}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}
