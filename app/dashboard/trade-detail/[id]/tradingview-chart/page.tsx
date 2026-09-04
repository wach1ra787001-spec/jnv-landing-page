'use client'

import { useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TradingViewChart } from '@/components/tradingview-chart'
import { formatSymbolForTradingView, type TradingViewInterval } from '@/lib/tradingview/utils'

export default function TradingViewChartPage() {
  const params = useParams<{ id: string }>()
  const [symbol, setSymbol] = useState('EURUSD')
  const [interval, setInterval] = useState<TradingViewInterval>('60')
  const [isLoading, setIsLoading] = useState(false)

  const handleSymbolChange = (value: string) => {
    if (value.trim()) {
      setSymbol(formatSymbolForTradingView(value.toUpperCase()))
    }
  }

  const handleIntervalChange = (value: string) => {
    setInterval(value as TradingViewInterval)
  }

  const presetSymbols = [
    { label: 'EUR/USD', value: 'EURUSD' },
    { label: 'GBP/USD', value: 'GBPUSD' },
    { label: 'USD/JPY', value: 'USDJPY' },
    { label: 'BTC/USD', value: 'BTCUSD' },
  ]

  const intervals: Array<{ label: string; value: TradingViewInterval }> = [
    { label: '1 min', value: '1' },
    { label: '5 min', value: '5' },
    { label: '15 min', value: '15' },
    { label: '30 min', value: '30' },
    { label: '1 hour', value: '60' },
    { label: '2 hours', value: '120' },
    { label: '4 hours', value: '240' },
    { label: '1 day', value: '1D' },
    { label: '1 week', value: '1W' },
    { label: '1 month', value: '1M' },
  ]

  return (
    <div className="w-full h-full p-6 space-y-6 flex flex-col">
      {/* Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Symbol Input */}
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              placeholder="e.g., EURUSD"
              className="font-mono"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {presetSymbols.map((sym) => (
                <Button
                  key={sym.value}
                  variant={symbol === sym.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSymbol(sym.value)}
                >
                  {sym.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Interval Select */}
          <div className="space-y-2">
            <Label htmlFor="interval">Timeframe</Label>
            <Select value={interval} onValueChange={handleIntervalChange}>
              <SelectTrigger id="interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervals.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Spacer for alignment */}
          <div />
          <div />
        </div>
      </Card>

      {/* Chart Container */}
      <Card className="p-0 overflow-hidden flex-1">
        <Suspense fallback={<div className="h-[calc(100vh-200px)] bg-muted animate-pulse" />}>
          <div className="h-[calc(100vh-200px)] w-full">
            <TradingViewChart
              symbol={symbol}
              interval={interval}
              height="100%"
              theme="auto"
              tradeHistoryId={params.id}
            />
          </div>
        </Suspense>
      </Card>

      {/* TradingView attribution — required by the free commercial license */}
      <p className="text-xs text-muted-foreground text-center">
        Built with{' '}
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
        >
          TradingView
        </a>
      </p>
    </div>
  )
}
