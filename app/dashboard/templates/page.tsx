"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Share2, Plus, Search, X, Check } from "lucide-react"
import { CreatePlaybookForm } from "@/components/dashboard/create-playbook-form"
import { cn } from "@/lib/utils"

interface Playbook {
  id: string
  name: string
  description: string
  author: string
  avatar: string
  winRate: number
  trades: number
  pnl: number
  likes: number
  liked: boolean
  month: string
  timeframe: string
  strategy: string
  comments: number
  publicSlug?: string | null
}

const mockPlaybooks: Playbook[] = [
  {
    id: "1",
    name: "Fractal Model Trading",
    description: "Advanced fractal pattern recognition with price action analysis. Ideal for forex pairs with high liquidity.",
    author: "TTrades",
    avatar: "TT",
    winRate: 76,
    trades: 145,
    pnl: 8450,
    likes: 342,
    liked: false,
    month: "March",
    timeframe: "1H-4H",
    strategy: "Pattern Recognition",
    comments: 28,
  },
  {
    id: "2",
    name: "Support & Resistance Scalping",
    description: "Quick trades around key support and resistance levels. Perfect for day trading with tight stops.",
    author: "ProTrader92",
    avatar: "PT",
    winRate: 68,
    trades: 89,
    pnl: 5230,
    likes: 215,
    liked: true,
    month: "February",
    timeframe: "15m-1H",
    strategy: "S/R Levels",
    comments: 16,
  },
  {
    id: "3",
    name: "Moving Average Crossover Pro",
    description: "Trend following system using triple MA crossover. Great for longer timeframe swing trades.",
    author: "SwingMaster",
    avatar: "SM",
    winRate: 62,
    trades: 112,
    pnl: 3890,
    likes: 189,
    liked: false,
    month: "January",
    timeframe: "4H-Daily",
    strategy: "Moving Averages",
    comments: 12,
  },
  {
    id: "4",
    name: "Fibonacci Retracement System",
    description: "Uses Fibonacci levels combined with volume analysis for precise entry points. Low drawdown approach.",
    author: "FibonacciKing",
    avatar: "FK",
    winRate: 71,
    trades: 98,
    pnl: 6120,
    likes: 287,
    liked: false,
    month: "March",
    timeframe: "30m-2H",
    strategy: "Fibonacci",
    comments: 21,
  },
  {
    id: "5",
    name: "MACD Divergence Hunter",
    description: "Catch reversals using MACD divergences with confirmation from RSI. Great for momentum trading.",
    author: "MomentumBot",
    avatar: "MB",
    winRate: 65,
    trades: 134,
    pnl: 4560,
    likes: 198,
    liked: false,
    month: "February",
    timeframe: "1H-4H",
    strategy: "Oscillators",
    comments: 18,
  },
  {
    id: "6",
    name: "Bollinger Band Squeeze",
    description: "Volatility contraction plays using Bollinger Bands. Ideal for breakout trades with high reward ratios.",
    author: "VolTrader",
    avatar: "VT",
    winRate: 73,
    trades: 76,
    pnl: 7890,
    likes: 312,
    liked: false,
    month: "March",
    timeframe: "4H-Daily",
    strategy: "Volatility",
    comments: 25,
  },
]

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "best-wr">("popular")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/playbooks?public=true')
      .then(res => res.ok ? res.json() : [])
      .then(rows => setPlaybooks(rows.map((p: any) => ({
        id: p.id, name: p.title, description: typeof p.description === 'string' ? p.description : '', author: 'Community trader', avatar: 'CT',
        winRate: Number(p.win_rate ?? 0), trades: Number(p.trades_taken ?? 0), pnl: Number(p.pnl ?? 0), likes: Number(p.likes_count ?? 0), liked: false,
        month: new Date(p.created_at).toLocaleString('en-US', { month: 'long' }), timeframe: p.strategy_type || 'Flexible', strategy: p.strategy_type || 'General', comments: Number(p.comments_count ?? 0), publicSlug: p.public_slug,
      }))))
      .finally(() => setLoading(false))
  }, [])
  const [showCreateForm, setShowCreateForm] = useState(false)

  const filteredPlaybooks = playbooks
    .filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.strategy.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "popular") return b.likes - a.likes
      if (sortBy === "newest") return b.pnl - a.pnl
      if (sortBy === "best-wr") return b.winRate - a.winRate
      return 0
    })

  const toggleLike = async (id: string) => {
    const res = await fetch(`/api/playbooks/${id}/engagement`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'like' }) })
    if (!res.ok) return
    const { liked } = await res.json()
    setPlaybooks(playbooks.map(p => p.id === id ? { ...p, liked, likes: p.likes + (liked ? 1 : -1) } : p))
  }

  const sharePlaybook = async (playbook: Playbook) => {
    if (!playbook.publicSlug) return
    const url = `${window.location.origin}/playbooks/${playbook.publicSlug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: playbook.name, text: `Check out ${playbook.name}`, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
      await fetch(`/api/playbooks/${playbook.id}/engagement`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'share' }) })
      setPlaybooks((current) => current.map((item) => item.id === playbook.id ? { ...item } : item))
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') console.error('[v0] Failed to share playbook:', error)
    }
  }

  if (loading) {
    return <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">Loading public playbooks...</div>
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6 flex flex-col items-center">
        <CreatePlaybookForm
          onSubmit={(data) => {
            console.log("New playbook created:", data)
            setShowCreateForm(false)
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Trading Templates & Playbooks</h1>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Create Playbook
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground">Most popular playbooks based on recent success, likes, and community feedback.</p>

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search playbooks by name, author, or strategy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["popular", "newest", "best-wr"] as const).map((sort) => (
            <Button
              key={sort}
              variant={sortBy === sort ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy(sort)}
            >
              {sort === "popular"
                ? "Most Popular"
                : sort === "newest"
                ? "Newest"
                : "Best Win Rate"}
            </Button>
          ))}
        </div>
      </div>

      {/* Playbooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlaybooks.map((playbook) => (
          <Card key={playbook.id} className="p-6 bg-card border-border hover:border-primary transition-colors flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold text-sm">
                  {playbook.avatar}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{playbook.name}</h3>
                  <p className="text-xs text-muted-foreground">by {playbook.author}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{playbook.description}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4 py-4 border-y border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                <p className="font-bold text-sm text-green-600 dark:text-green-400">{playbook.winRate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Trades</p>
                <p className="font-bold text-sm text-foreground">{playbook.trades}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">P&L</p>
                <p className="font-bold text-sm text-green-600 dark:text-green-400">${(playbook.pnl / 1000).toFixed(1)}k</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Month</p>
                <p className="font-bold text-sm text-foreground">{playbook.month}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {playbook.timeframe}
              </span>
              <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {playbook.strategy}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-border mt-auto">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => toggleLike(playbook.id)}
              >
                <Heart className={cn("w-4 h-4", playbook.liked && "fill-current text-red-500")} />
                <span className="text-xs">{playbook.likes}</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{playbook.comments}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => sharePlaybook(playbook)}
                disabled={!playbook.publicSlug}
                aria-label={`Share ${playbook.name}`}
                title={playbook.publicSlug ? 'Copy unique playbook link' : 'Share link unavailable'}
              >
                <Share2 className="w-4 h-4" />
                <span className="text-xs">Share</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
