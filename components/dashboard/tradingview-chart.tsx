'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

interface Candle {
  time: string | number
  open: number
  high: number
  low: number
  close: number
}

interface TradeMarker {
  time: string | number
  position: 'aboveBar' | 'belowBar'
  color: string
  shape: 'arrowUp' | 'arrowDown'
  text: string
}

interface TradingViewChartProps {
  candles: Candle[]
  entryMarker?: TradeMarker
  exitMarker?: TradeMarker
  height?: number
}

export function TradingViewChart({
  candles,
  entryMarker,
  exitMarker,
  height = 400,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(200, 200, 200, 0.9)',
      },
      width: containerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      grid: {
        vertLines: {
          color: 'rgba(42, 46, 57, 0.5)',
        },
        hLines: {
          color: 'rgba(42, 46, 57, 0.5)',
        },
      },
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    // Add candlestick data
    candlestickSeries.setData(candles)

    // Add trade markers
    const markers: TradeMarker[] = []

    if (entryMarker) {
      markers.push(entryMarker)
    }

    if (exitMarker) {
      markers.push(exitMarker)
    }

    if (markers.length > 0) {
      candlestickSeries.setMarkers(markers)
    }

    // Connect entry and exit with dashed line if both exist
    if (entryMarker && exitMarker) {
      const priceLine = chart.addLineSeries({
        color: 'rgba(128, 128, 128, 0.5)',
        lineStyle: 2, // Dashed
        lineWidth: 1,
      })

      const entryPrice =
        candles.find((c) => c.time === entryMarker.time)?.close || 0
      const exitPrice =
        candles.find((c) => c.time === exitMarker.time)?.close || 0

      priceLine.setData([
        { time: entryMarker.time, value: entryPrice },
        { time: exitMarker.time, value: exitPrice },
      ])
    }

    // Fit content and handle resize
    chart.timeScale().fitContent()

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [candles, entryMarker, exitMarker, height])

  return (
    <div
      ref={containerRef}
      className="w-full bg-card rounded-lg overflow-hidden border border-border/50"
      style={{ height: `${height}px` }}
    />
  )
}
