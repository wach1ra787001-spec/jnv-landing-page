"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight, ArrowLeft, Upload, Loader2, Trash2, X } from "lucide-react"
import { TradeNotes } from "@/components/trades/trade-notes"
import { TradingViewChart, type SingleBarData } from "@/components/tradingview-chart"
import { cn } from "@/lib/utils"
import { appToast } from "@/lib/toast-utils"

interface UserRule {
  id: string
  title: string
  rule?: string
  is_active: boolean
  isCustom?: boolean
}

interface Trade {
  id: string
  symbol: string
  direction: string
  entry_price: number
  exit_price: number
  quantity: number
  entry_time: string
  exit_time: string
  pnl: number
  pnl_percent: number
  status: string
  strategy: string
  setup_type: string
  user_id: string
  notes?: string
  screenshot_urls?: string[]
  [key: string]: any
}

export default function TradeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tradeId = params.id as string
  const [trade, setTrade] = useState<Trade | null>(null)
  const [loading, setLoading] = useState(true)
  const [signedScreenshotUrls, setSignedScreenshotUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
  const [confirmDeleteUrl, setConfirmDeleteUrl] = useState<string | null>(null)
  const [userRules, setUserRules] = useState<UserRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [followedRuleIds, setFollowedRuleIds] = useState<string[]>([])
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        const response = await fetch(`/api/trades/${tradeId}`)
        if (response.ok) {
          const data = await response.json()
          setTrade(data)
          setFollowedRuleIds(Array.isArray(data.followed_rule_ids) ? data.followed_rule_ids : [])
          try {
            if (data.playbook_id) {
              const playbookResponse = await fetch(`/api/playbooks/${data.playbook_id}`)
              if (playbookResponse.ok) {
                const playbook = await playbookResponse.json()
                const rulesColumn = playbook?.rules || {}
                const ruleItems = [
                  ...(Array.isArray(rulesColumn.entry) ? rulesColumn.entry : []),
                  ...(Array.isArray(rulesColumn.exit) ? rulesColumn.exit : []),
                  ...(Array.isArray(rulesColumn.custom) ? rulesColumn.custom : []),
                ].filter((rule): rule is string => typeof rule === 'string' && rule.trim().length > 0)
                  .map((text, index) => ({ id: `custom-${index}`, title: text, is_active: true, isCustom: true }))
                setUserRules(ruleItems)
              }
            }
          } finally {
            setRulesLoading(false)
          }
          
          // Generate signed URLs for private blob screenshots
          if (data.screenshot_urls && data.screenshot_urls.length > 0) {
            console.log('[v0] Generating signed URLs for', data.screenshot_urls.length, 'screenshots')
            try {
              const signResponse = await fetch('/api/blob/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls: data.screenshot_urls }),
              })
              
              if (signResponse.ok) {
                const signedData = await signResponse.json()
                console.log('[v0] Signed URLs generated successfully')
                setSignedScreenshotUrls(signedData.urls)
              } else {
                console.error('[v0] Failed to sign URLs, using original blob URLs')
                setSignedScreenshotUrls(data.screenshot_urls)
              }
            } catch (err) {
              console.error('[v0] Error signing URLs:', err)
              setSignedScreenshotUrls(data.screenshot_urls)
            }
          }
        } else {
          console.error("Trade not found")
        }
      } catch (error) {
        console.error("Error fetching trade:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrade()
  }, [tradeId])

  const handleAddScreenshot = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      const response = await fetch(`/api/trades/${tradeId}/screenshots`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSignedScreenshotUrls([...signedScreenshotUrls, ...data.urls])
        appToast.tradeSaved(trade?.symbol || 'Trade', '0', '0', true)
      } else {
        appToast.tradeSaveFailed()
      }
    } catch (error) {
      console.error('[v0] Error uploading screenshots:', error)
      appToast.tradeSaveFailed()
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRuleChange = async (ruleId: string, checked: boolean) => {
    const previous = followedRuleIds
    const next = checked ? [...new Set([...previous, ruleId])] : previous.filter((id) => id !== ruleId)
    setFollowedRuleIds(next)
    setSavingRuleId(ruleId)
    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followed_rule_ids: next }),
      })
      if (!response.ok) throw new Error('Failed to save rule status')
      setTrade((current) => current ? { ...current, followed_rule_ids: next, followed_rules: next.length > 0 } : current)
    } catch {
      setFollowedRuleIds(previous)
      appToast.tradeSaveFailed()
    } finally {
      setSavingRuleId(null)
    }
  }

  const handleDeleteScreenshot = async (url: string) => {
    setDeletingUrl(url)
    try {
      const response = await fetch(`/api/trades/${tradeId}/screenshots`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (response.ok) {
        setSignedScreenshotUrls(prev => prev.filter(u => u !== url))
        appToast.tradeSaved(trade?.symbol || 'Trade', '0', '0', true)
      } else {
        appToast.tradeSaveFailed()
      }
    } catch (error) {
      console.error('[v0] Error deleting screenshot:', error)
      appToast.tradeSaveFailed()
    } finally {
      setDeletingUrl(null)
      setConfirmDeleteUrl(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Card className="p-12 bg-card border border-border/50 text-center">
          <p className="text-muted-foreground">Loading trade...</p>
        </Card>
      </div>
    )
  }

  if (!trade) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Card className="p-12 bg-card border border-border/50 text-center">
          <p className="text-muted-foreground">Trade not found</p>
        </Card>
      </div>
    )
  }

  const isProfit = trade.pnl >= 0
  const entryDate = new Date(trade.entry_time)
  const exitDate = new Date(trade.exit_time)
  const duration = Math.round((exitDate.getTime() - entryDate.getTime()) / (1000 * 60))
  
  // Convert direction from DB format (long/short) to display format (BUY/SELL)
  const directionDisplay = trade.direction === 'long' ? 'BUY' : trade.direction === 'short' ? 'SELL' : trade.direction
  const isLong = trade.direction === 'long'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{trade.symbol}</h1>
            <p className="text-muted-foreground">{trade.strategy || 'No strategy recorded'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-3xl font-bold", isProfit ? "text-chart-1" : "text-chart-2")}>
            {isProfit ? '+' : ''}{trade.pnl.toFixed(2)}
          </p>
          <p className={cn("text-sm font-medium", isProfit ? "text-chart-1" : "text-chart-2")}>
            {isProfit ? '+' : ''}{trade.pnl_percent?.toFixed(2) || '0'}%
          </p>
        </div>
      </div>

      {/* Details rail + chart workspace */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(0,9fr)] lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Trade Details */}
          <Card className="flex-1 p-4 bg-card border border-border/50">
        <div className="flex flex-col divide-y divide-border/50">
          <div className="pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Direction</p>
            <div className="flex items-center gap-2 mt-2">
              {isLong ? (
                <ArrowUpRight className="w-4 h-4 text-chart-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-chart-2" />
              )}
              <p className="font-medium text-foreground">{directionDisplay}</p>
            </div>
          </div>
          <div className="py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entry Price</p>
            <p className="font-medium text-foreground mt-2">{trade.entry_price.toFixed(4)}</p>
          </div>
          <div className="py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exit Price</p>
            <p className="font-medium text-foreground mt-2">{trade.exit_price.toFixed(4)}</p>
          </div>
          <div className="pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quantity</p>
            <p className="font-medium text-foreground mt-2">{trade.quantity}</p>
          </div>
        </div>
      </Card>

          {/* Timeline */}
          <Card className="flex-1 p-4 bg-card border border-border/50">
        <div className="flex flex-col divide-y divide-border/50">
          <div className="pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entry Time</p>
            <p className="font-medium text-foreground mt-2">{entryDate.toLocaleString()}</p>
          </div>
          <div className="py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exit Time</p>
            <p className="font-medium text-foreground mt-2">{exitDate.toLocaleString()}</p>
          </div>
          <div className="py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</p>
            <p className="font-medium text-foreground mt-2">{duration} minutes</p>
          </div>
          <div className="pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
            <p className="font-medium text-foreground mt-2 capitalize">{trade.status}</p>
          </div>
        </div>
          </Card>
        </div>

        {/* TradingView Chart Card */}
        <Card className="min-w-0 p-4 bg-card border border-border/50 lg:min-h-[620px]">
        <h3 className="text-lg font-semibold text-foreground mb-4">Chart Analysis</h3>
        <TradingViewChart
          symbol={trade.symbol}
          interval="D"
          height={500}
          singleBar={(() => {
            const entryPrice = Number(trade.entry_price)
            const exitPrice  = Number(trade.exit_price)
            const open  = entryPrice
            const close = exitPrice
            const high  = Math.max(open, close) * 1.0005
            const low   = Math.min(open, close) * 0.9995
            // Use entry_time if available, otherwise today midnight UTC
            const t = trade.entry_time
              ? Math.floor(new Date(trade.entry_time).getTime() / 1000)
              : Math.floor(new Date().setUTCHours(0,0,0,0) / 1000)
            return { time: t, open, high, low, close } satisfies SingleBarData
          })()}
        />
        <p className="text-xs text-muted-foreground text-center pt-3 border-t border-border/50 mt-4">
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
        </Card>
      </div>

      {/* Rules followed */}
      <Card className="p-4 bg-card border border-border/50">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Rules Followed</h3>
            <p className="mt-1 text-sm text-muted-foreground">Review your active trading rules for this trade.</p>
          </div>
          <span className="text-xs text-muted-foreground">{savingRuleId ? 'Saving…' : `${followedRuleIds.length}/${userRules.length} checked`}</span>
        </div>
        <div className="mt-4 flex flex-col divide-y divide-border/50 rounded-md border border-border/50">
          {rulesLoading ? <p className="p-3 text-sm text-muted-foreground">Loading rules…</p> : userRules.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No active rules found.</p> : userRules.map((rule) => <label key={rule.id} className="flex cursor-pointer items-start gap-3 p-3"><input type="checkbox" checked={followedRuleIds.includes(rule.id)} onChange={(event) => handleRuleChange(rule.id, event.target.checked)} disabled={savingRuleId === rule.id} className="mt-0.5 size-4 shrink-0 accent-primary" /><span className="min-w-0"><span className="block text-sm font-medium text-foreground">{rule.title}</span>{rule.rule && <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{rule.rule}</span>}</span><span className={cn('ml-auto shrink-0 text-xs font-medium', followedRuleIds.includes(rule.id) ? 'text-emerald-500' : 'text-muted-foreground')}>{followedRuleIds.includes(rule.id) ? 'Followed' : 'Not followed'}</span></label>)}
        </div>
      </Card>

      {/* Screenshot Card */}
      <Card className="p-6 bg-card border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Trade Screenshots</h3>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleAddScreenshot}
            className="hidden"
            disabled={uploading}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Add Screenshots
              </>
            )}
          </Button>
        </div>
        {signedScreenshotUrls && signedScreenshotUrls.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {signedScreenshotUrls.map((url, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden border border-border/50 group">
                <img
                  src={url}
                  alt={`Trade screenshot ${idx + 1}`}
                  className="w-full h-40 object-cover"
                />
                {/* Hover overlay: View Full + Delete */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                  >
                    <Button size="sm" variant="secondary">View Full</Button>
                  </a>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmDeleteUrl(url)}
                    disabled={deletingUrl === url}
                  >
                    {deletingUrl === url ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Confirm delete overlay */}
                {confirmDeleteUrl === url && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 p-3">
                    <p className="text-white text-xs font-medium text-center">Delete this screenshot?</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteScreenshot(url)}
                        disabled={deletingUrl === url}
                        className="gap-1"
                      >
                        {deletingUrl === url ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDeleteUrl(null)}
                        className="gap-1 bg-transparent text-white border-white/40 hover:bg-white/10"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No screenshots available</p>
        )}
      </Card>

      {/* Trade Notes */}
      <Card className="p-6 bg-card border border-border/50">
        <TradeNotes tradeId={trade.id} />
      </Card>
    </div>
  )
}
