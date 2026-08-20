'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { ArrowUpDown } from 'lucide-react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { SetupPerformanceResult } from '@/lib/models-analysis-utils'

interface SetupPerformanceCardProps {
  data: SetupPerformanceResult
}

const SERIES_COLORS = ['#3d52d5', '#10b981', '#f59e0b', '#8b5cf6']
const MAX_OVERLAY = 4

const AXES: { key: 'winRate' | 'avgR' | 'profitFactor' | 'expectancy' | 'consistency' | 'frequency'; label: string }[] = [
  { key: 'winRate', label: 'Win Rate' },
  { key: 'avgR', label: 'Avg R' },
  { key: 'profitFactor', label: 'Profit Factor' },
  { key: 'expectancy', label: 'Expectancy' },
  { key: 'consistency', label: 'Consistency' },
  { key: 'frequency', label: 'Frequency' },
]

type SortKey = 'name' | 'tradeCount' | 'winRate' | 'avgR' | 'profitFactor' | 'expectancy' | 'avgHoldMinutes'

export function SetupPerformanceCard({ data }: SetupPerformanceCardProps) {
  const { setups } = data
  const [selected, setSelected] = useState<string[]>(() => setups.slice(0, 3).map(s => s.setupId))
  const [sortKey, setSortKey] = useState<SortKey>('tradeCount')
  const [sortDesc, setSortDesc] = useState(true)

  const activeSetups = useMemo(
    () => selected.map(id => setups.find(s => s.setupId === id)).filter((s): s is (typeof setups)[number] => !!s),
    [selected, setups]
  )

  const radarData = useMemo(
    () =>
      AXES.map(axis => {
        const point: Record<string, string | number> = { axis: axis.label }
        for (const setup of activeSetups) {
          point[setup.setupId] = Math.round(setup.normalized[axis.key])
        }
        return point
      }),
    [activeSetups]
  )

  const sortedTable = useMemo(() => {
    const rows = [...setups]
    rows.sort((a, b) => {
      let av: number | string
      let bv: number | string
      if (sortKey === 'name') {
        av = a.name
        bv = b.name
      } else if (sortKey === 'tradeCount') {
        av = a.tradeCount
        bv = b.tradeCount
      } else if (sortKey === 'avgHoldMinutes') {
        av = a.raw.avgHoldMinutes ?? -Infinity
        bv = b.raw.avgHoldMinutes ?? -Infinity
      } else {
        av = a.raw[sortKey]
        bv = b.raw[sortKey]
      }
      if (typeof av === 'string' || typeof bv === 'string') {
        const cmp = String(av).localeCompare(String(bv))
        return sortDesc ? -cmp : cmp
      }
      return sortDesc ? bv - av : av - bv
    })
    return rows
  }, [setups, sortKey, sortDesc])

  function toggleSetup(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id)
      if (prev.length >= MAX_OVERLAY) return prev
      return [...prev, id]
    })
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDesc(d => !d)
    } else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  return (
    <Card className="p-6 bg-card border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-1">Setup Performance</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Normalized comparison across setups — shape shows profile, table shows exact numbers
      </p>

      {setups.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No setup data available</p>
      ) : (
        <>
          {/* Setup selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {setups.map((setup, i) => {
              const isSelected = selected.includes(setup.setupId)
              const colorIndex = selected.indexOf(setup.setupId)
              return (
                <button
                  key={setup.setupId}
                  onClick={() => toggleSetup(setup.setupId)}
                  disabled={!isSelected && selected.length >= MAX_OVERLAY}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'border-transparent text-white'
                      : 'border-border/60 text-muted-foreground hover:text-foreground'
                  }`}
                  style={isSelected ? { backgroundColor: SERIES_COLORS[colorIndex % SERIES_COLORS.length] } : undefined}
                >
                  {setup.name}
                  {setup.lowSample && <span className="ml-1 opacity-70">(low n)</span>}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mb-6">
            Select up to {MAX_OVERLAY} setups to overlay. Values are percentile-normalized 0-100 within your history.
          </p>

          {/* Radar chart */}
          {activeSetups.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickCount={5} />
                {activeSetups.map((setup, i) => (
                  <Radar
                    key={setup.setupId}
                    name={setup.name}
                    dataKey={setup.setupId}
                    stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                    fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                    fillOpacity={setup.lowSample ? 0.08 : 0.18}
                    strokeWidth={2}
                    strokeDasharray={setup.lowSample ? '4 3' : undefined}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-8">Select at least one setup to compare</p>
          )}

          {/* Companion scorecard table */}
          <div className="mt-8 overflow-x-auto">
            <h4 className="text-sm font-semibold text-foreground mb-3">Scorecard</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  {[
                    { key: 'name' as SortKey, label: 'Setup' },
                    { key: 'tradeCount' as SortKey, label: 'Trades' },
                    { key: 'winRate' as SortKey, label: 'Win Rate' },
                    { key: 'avgR' as SortKey, label: 'Avg R' },
                    { key: 'profitFactor' as SortKey, label: 'PF' },
                    { key: 'expectancy' as SortKey, label: 'Expectancy' },
                    { key: 'avgHoldMinutes' as SortKey, label: 'Avg Hold' },
                  ].map(col => (
                    <th key={col.key} className="py-2 pr-4 font-medium">
                      <button
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {col.label}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTable.map(setup => (
                  <tr key={setup.setupId} className="border-b border-border/30">
                    <td className="py-2 pr-4 font-medium text-foreground">
                      {setup.name}
                      {setup.lowSample && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">low sample</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 tabular-nums text-muted-foreground">{setup.tradeCount}</td>
                    <td className="py-2 pr-4 tabular-nums text-foreground">{setup.raw.winRate.toFixed(0)}%</td>
                    <td className="py-2 pr-4 tabular-nums text-foreground">{setup.raw.avgR.toFixed(2)}R</td>
                    <td className="py-2 pr-4 tabular-nums text-foreground">{setup.raw.profitFactor.toFixed(2)}</td>
                    <td className="py-2 pr-4 tabular-nums text-foreground">{setup.raw.expectancy.toFixed(2)}</td>
                    <td className="py-2 pr-4 tabular-nums text-muted-foreground">
                      {setup.raw.avgHoldMinutes !== null ? `${Math.round(setup.raw.avgHoldMinutes)}m` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
