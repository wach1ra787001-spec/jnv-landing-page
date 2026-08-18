'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, ArrowLeft, AlertCircle, X, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Trade {
  id: string
  symbol: string
  net_pnl?: number
  pnl: number
  commission: number
  swap: number
  exit_time: string
  status: string
  volume?: number
  entry_time?: string
}

interface DayData {
  date: number
  trades: Trade[]
  totalPnL: number
  tradeCount: number
  winCount: number
  winRate: number
  symbols: string[]
  isProfit: boolean
  isLoss: boolean
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MonthlyPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [trades, setTrades] = useState<Trade[]>([])
  const [dayMap, setDayMap] = useState<Map<number, DayData>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [monthlyStats, setMonthlyStats] = useState({
    totalPnL: 0,
    tradingDays: 0,
    totalTrades: 0,
    winDays: 0,
    lossDays: 0,
  })
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)
  const [tradeSort, setTradeSort] = useState<'time' | 'pnl' | 'volume'>('time')

  const sortedSelectedTrades = useMemo(() => {
    if (!selectedDay) return []
    return [...selectedDay.trades].sort((a, b) => {
      if (tradeSort === 'pnl') {
        const aPnl = a.net_pnl ?? (a.pnl - a.commission - a.swap)
        const bPnl = b.net_pnl ?? (b.pnl - b.commission - b.swap)
        return bPnl - aPnl
      }
      if (tradeSort === 'volume') return (b.volume ?? 0) - (a.volume ?? 0)
      return new Date(a.exit_time).getTime() - new Date(b.exit_time).getTime()
    })
  }, [selectedDay, tradeSort])

  // Cache to avoid redundant fetches
  const monthCacheRef = useRef<Record<string, Trade[]>>({})

  // Check if we can navigate forward (only allow current month or before)
  const canNavigateForward = () => {
    const today = new Date()
    return !(currentYear === today.getFullYear() && currentMonth === today.getMonth())
  }

  // Fetch trades for the current month
  useEffect(() => {
    fetchMonthTrades()
  }, [currentYear, currentMonth])

  const fetchMonthTrades = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get default account if not already set
      if (!accountId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('default_account_id')
          .eq('id', user.id)
          .single()

        const { data: defaultAccount } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        const acctId = profile?.default_account_id || defaultAccount?.id
        setAccountId(acctId)
      }

      // Check cache first
      const cacheKey = `${currentYear}-${currentMonth}`
      if (monthCacheRef.current[cacheKey]) {
        setTrades(monthCacheRef.current[cacheKey])
        return
      }

      // Calculate month boundaries
      const startOfMonth = new Date(currentYear, currentMonth, 1)
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
      
      const startIso = startOfMonth.toISOString()
      const endIso = endOfMonth.toISOString()

      let query = supabase
        .from('trades')
        .select('id, symbol, net_pnl, pnl, commission, swap, exit_time, entry_time, status')
        .eq('user_id', user.id)
        .eq('status', 'closed')
        .gte('exit_time', startIso)
        .lte('exit_time', endIso)
        .order('exit_time', { ascending: true })

      if (accountId) {
        query = query.eq('account_id', accountId)
      }

      const { data, error: queryError } = await query

      // If query fails or returns no data, try a broader query to debug
      if (queryError || !data) {
        console.warn('[v0] First query failed, trying broader query...')
        
        const { data: allTrades, error: allTradesError } = await supabase
          .from('trades')
          .select('id, symbol, net_pnl, pnl, commission, swap, exit_time, status, user_id')
          .eq('user_id', user.id)
          .order('exit_time', { ascending: false })
          .limit(50)
        
        console.log('[v0] All trades query:', { count: allTrades?.length, error: allTradesError })
        if (allTrades && allTrades.length > 0) {
          console.log('[v0] Sample trades:', allTrades.slice(0, 3))
        }
      }

      console.log('[v0] Query result:', { data, queryError })

      // If query fails or returns no data, try a broader query to debug
      if (queryError || !data) {
        console.warn('[v0] First query failed, trying broader query...')
        
        const { data: allTrades, error: allTradesError } = await supabase
          .from('trades')
          .select('id, symbol, net_pnl, pnl, commission, swap, exit_time, status, user_id')
          .eq('user_id', user.id)
          .order('exit_time', { ascending: false })
          .limit(50)
        
        console.log('[v0] All trades query:', { count: allTrades?.length, error: allTradesError })
        if (allTrades && allTrades.length > 0) {
          console.log('[v0] Sample trades:', allTrades.slice(0, 3))
        }
      }

      console.log('[v0] Query result:', { data, queryError })

      if (queryError) {
        console.error('[v0] Supabase query error:', queryError)
        console.error('[v0] Error message:', queryError.message)
        console.error('[v0] Error details:', JSON.stringify(queryError, null, 2))
        setError('Could not load trades. Please refresh.')
        return
      }

      console.log('[v0] Trades fetched:', data?.length || 0)

      console.log('[v0] Trades fetched:', data?.length || 0)

      // Cache the result
      monthCacheRef.current[cacheKey] = data || []
      setTrades(data || [])
    } catch (err) {
      console.error('[v0] Error fetching trades:', err)
      setError('Could not load trades. Please refresh.')
    } finally {
      setIsLoading(false)
    }
  }

  // Group trades by day and calculate stats
  useMemo(() => {
    const newDayMap = new Map<number, DayData>()
    let totalPnL = 0
    let totalTrades = 0
    const tradingDaysSet = new Set<number>()
    let winDays = 0
    let lossDays = 0

    trades.forEach((trade) => {
      const exitDate = new Date(trade.exit_time)
      const day = exitDate.getDate()

      // Calculate net P&L
      const netPnl = trade.net_pnl ?? (trade.pnl - trade.commission - trade.swap)
      const isWinningTrade = netPnl > 0

      const existing = newDayMap.get(day) || {
        date: day,
        trades: [],
        totalPnL: 0,
        tradeCount: 0,
        winCount: 0,
        winRate: 0,
        symbols: [],
        isProfit: false,
        isLoss: false,
      }

      existing.trades.push(trade)
      existing.totalPnL += netPnl
      existing.tradeCount++
      if (isWinningTrade) {
        existing.winCount++
      }
      existing.winRate = existing.tradeCount > 0 ? (existing.winCount / existing.tradeCount) * 100 : 0

      if (!existing.symbols.includes(trade.symbol)) {
        existing.symbols.push(trade.symbol)
      }

      // Update profit/loss flags
      existing.isProfit = existing.totalPnL > 0
      existing.isLoss = existing.totalPnL < 0

      newDayMap.set(day, existing)

      // Track stats
      totalPnL += netPnl
      totalTrades++
      tradingDaysSet.add(day)
    })

    // Count win/loss days
    newDayMap.forEach((day) => {
      if (day.isProfit) winDays++
      if (day.isLoss) lossDays++
    })

    setDayMap(newDayMap)
    setMonthlyStats({
      totalPnL,
      tradingDays: tradingDaysSet.size,
      totalTrades,
      winDays,
      lossDays,
    })
  }, [trades])

  // Navigation handlers
  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (!canNavigateForward()) return
    
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Calendar rendering
  const getDaysInMonth = (year: number, month: number) => 
    new Date(year, month + 1, 0).getDate()

  const getFirstDayOfMonth = (year: number, month: number) => 
    new Date(year, month, 1).getDay()

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const days = []

  // Previous month's padding days
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1)
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: prevMonthDays - i,
      isOtherMonth: true,
      dayData: null as DayData | null,
    })
  }

  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: i,
      isOtherMonth: false,
      dayData: dayMap.get(i) || null,
    })
  }

  // Next month's padding days
  for (let i = 1; days.length < 42; i++) {
    days.push({
      date: i,
      isOtherMonth: true,
      dayData: null as DayData | null,
    })
  }

  const monthYear = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const isProfit = monthlyStats.totalPnL > 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">📅 Monthly Performance</h1>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={previousMonth} className="min-w-[40px] min-h-[40px]">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="w-28 sm:w-40 text-center font-semibold text-foreground text-sm sm:text-base">
                {monthYear}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={nextMonth}
                disabled={!canNavigateForward()}
                className="min-w-[40px] min-h-[40px]"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div className="text-right">
              <div className="h-8 w-24 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
          ) : trades.length === 0 ? (
            <div className="text-right text-muted-foreground text-sm">
              No trades this month
            </div>
          ) : (
            <div className="text-right">
              <div className={cn('text-2xl sm:text-3xl font-bold', isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                {isProfit ? '+' : ''}{monthlyStats.totalPnL.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {monthlyStats.tradingDays} trading day{monthlyStats.tradingDays !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <Card className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </Card>
        )}

        {/* Calendar Card */}
        <Card className="p-3 sm:p-6 bg-card border-border mx-4 sm:mx-0">
          <div className="mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3 pl-4 sm:pl-0">Monthly stats:</h3>
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1 sm:py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {days.map((dayObj, idx) => {
                const dayData = dayObj.dayData
                const isPaddingDay = dayObj.isOtherMonth
                const showHover = hoveredDayIdx === idx

                return (
                  <div
                    key={idx}
                    className="relative"
                    onMouseEnter={() => dayData && dayData.trades.length > 0 && setHoveredDayIdx(idx)}
                    onMouseLeave={() => setHoveredDayIdx(null)}
                  >
                    <div
                      className={cn(
                        'relative rounded-lg border transition-all p-1 sm:p-2 min-h-[52px] cursor-pointer hover:ring-2 hover:ring-primary/50',
                        isPaddingDay
                          ? 'bg-muted border-muted opacity-30'
                          : dayData
                          ? dayData.totalPnL > 0
                            ? 'bg-green-200 dark:bg-green-800/70 border-green-500 dark:border-green-600'
                            : dayData.totalPnL < 0
                            ? 'bg-red-200 dark:bg-red-800/70 border-red-500 dark:border-red-600'
                            : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-900'
                          : 'bg-card border-border'
                      )}
                      onClick={() => !isPaddingDay && dayData && setSelectedDay(dayData)}
                      role={!isPaddingDay && dayData ? 'button' : undefined}
                      tabIndex={!isPaddingDay && dayData ? 0 : undefined}
                      onKeyDown={(event) => {
                        if (!isPaddingDay && dayData && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault()
                          setSelectedDay(dayData)
                        }
                      }}
                    >
                      <div className="h-full flex flex-col justify-between">
                        <div className="calendar-day-number text-foreground">{dayObj.date}</div>
                        {isLoading ? (
                          <div className="space-y-0.5">
                            <div className="h-2 w-10 bg-muted rounded animate-pulse" />
                            <div className="h-1.5 w-12 bg-muted rounded animate-pulse" />
                          </div>
                        ) : dayData && dayData.totalPnL !== 0 ? (
                          <div className="space-y-0.5">
                            {/* Mobile: Show PnL and Trade Count */}
                            <div
                              className={cn(
                                'text-xs sm:text-sm font-bold lg:hidden',
                                dayData.totalPnL > 0
                                  ? 'text-green-700 dark:text-green-300'
                                  : 'text-red-600 dark:text-red-400'
                              )}
                            >
                              {dayData.totalPnL > 0 ? '+' : ''}{dayData.totalPnL.toFixed(0)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground lg:hidden">
                              {dayData.tradeCount}T
                            </div>

                            {/* Large screens: Show PnL, Trade Count, and Win Rate */}
                            <div className="hidden lg:block space-y-1 text-xs font-semibold" style={{ color: '#0a0215' }}>
                              <div
                                className={cn(
                                  'font-bold',
                                  dayData.totalPnL > 0
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-red-600 dark:text-red-400'
                                )}
                              >
                                {dayData.totalPnL > 0 ? '+' : ''}${Math.abs(dayData.totalPnL).toFixed(0)}
                              </div>
                              <div className="font-semibold" style={{ color: '#0a0215' }}>
                                {dayData.tradeCount} trade{dayData.tradeCount > 1 ? 's' : ''}
                              </div>
                              <div className="font-semibold" style={{ color: '#0a0215' }}>
                                WR: {dayData.winRate.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Hover Card - Desktop Only */}
                    {showHover && dayData && dayData.trades.length > 0 && (
                      <div
                        className="absolute left-0 top-full mt-2 z-50 hidden lg:block"
                        style={{
                          minHeight: `${Math.max(260, dayData.trades.length * 40)}px`,
                        }}
                      >
                        <Card className="p-3 bg-card border border-border shadow-lg w-64">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-foreground">Trades for {dayObj.date}</h4>
                            <div className="space-y-1 max-h-96 overflow-y-auto">
                              {dayData.trades.map((trade, tradeIdx) => (
                                <div
                                  key={tradeIdx}
                                  className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                                >
                                  <span className="font-medium">{trade.symbol}</span>
                                  <span
                                    className={cn(
                                      'font-semibold',
                                      (trade.net_pnl || trade.pnl) >= 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                    )}
                                  >
                                    {(trade.net_pnl || trade.pnl) >= 0 ? '+' : ''}
                                    ${((trade.net_pnl || trade.pnl) || 0).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Stats Summary */}
        {!isLoading && trades.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-4 sm:mt-6 mx-4 sm:mx-0">
            <Card className="p-2 sm:p-3 bg-card border border-border/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1">Total Trades</p>
              <p className="text-base sm:text-lg font-bold text-foreground">{monthlyStats.totalTrades}</p>
            </Card>
            <Card className="p-2 sm:p-3 bg-card border border-border/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1">Trading Days</p>
              <p className="text-base sm:text-lg font-bold text-foreground">{monthlyStats.tradingDays}</p>
            </Card>
            <Card className="p-2 sm:p-3 bg-card border border-border/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1">Win Days</p>
              <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">{monthlyStats.winDays}</p>
            </Card>
            <Card className="p-2 sm:p-3 bg-card border border-border/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1">Loss Days</p>
              <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">{monthlyStats.lossDays}</p>
            </Card>
            <Card className="p-2 sm:p-3 bg-card border border-border/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1">Breakeven Days</p>
              <p className="text-base sm:text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {monthlyStats.tradingDays - monthlyStats.winDays - monthlyStats.lossDays}
              </p>
            </Card>
          </div>
        )}
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
          <aside
            className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="selected-day-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 id="selected-day-title" className="text-base font-bold text-foreground">
                  {new Date(currentYear, currentMonth, selectedDay.date).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{selectedDay.tradeCount} trades</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)} aria-label="Close day trades">
                <X className="h-5 w-5" />
              </Button>
            </header>

            <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-xs font-medium text-muted-foreground">
              {(['time', 'pnl', 'volume'] as const).map((sort) => (
                <button
                  key={sort}
                  type="button"
                  onClick={() => setTradeSort(sort)}
                  className={cn(
                    'rounded-md px-3 py-1.5 transition-colors',
                    tradeSort === sort ? 'bg-primary/15 text-primary' : 'hover:bg-muted hover:text-foreground',
                  )}
                >
                  {sort === 'pnl' ? 'P&L' : sort[0].toUpperCase() + sort.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              {sortedSelectedTrades.map((trade) => {
                const netPnl = trade.net_pnl ?? (trade.pnl - trade.commission - trade.swap)
                const exitTime = new Date(trade.exit_time)
                return (
                  <div key={trade.id} className="flex items-center gap-3 border-b border-border/60 py-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{trade.symbol}</p>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {netPnl >= 0 ? '+' : ''}{netPnl.toFixed(2)}R
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {trade.entry_time ? `${new Date(trade.entry_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} → ` : ''}
                        {exitTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · vol {trade.volume ?? '—'}
                      </p>
                    </div>
                    <p className={`text-sm font-bold ${netPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {netPnl >= 0 ? '+' : '-'}${Math.abs(netPnl).toFixed(2)}
                    </p>
                  </div>
                )
              })}
            </div>

            <footer className="border-t border-border px-5 py-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Win Rate <strong className="text-foreground">{selectedDay.winRate.toFixed(2)}%</strong> · <span className="text-emerald-500">{selectedDay.winCount}W</span> / <span className="text-red-500">{selectedDay.tradeCount - selectedDay.winCount}L</span></span>
                <strong className={selectedDay.totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                  {selectedDay.totalPnL >= 0 ? '+' : '-'}${Math.abs(selectedDay.totalPnL).toFixed(2)}
                </strong>
              </div>
            </footer>
          </aside>
        </div>
      )}
    </div>
  )
}
