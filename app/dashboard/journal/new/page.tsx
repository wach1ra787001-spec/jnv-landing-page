'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Upload, X, Wallet, ChevronDown, Zap } from 'lucide-react'
import { appToast } from '@/lib/toast-utils'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAccount } from '@/components/dashboard/account-context'

interface Account {
  id: string
  account_name: string
  account_type: string
  currency: string
  initial_balance?: number
}

const DEFAULT_FORM = {
  symbol:        '',
  direction:     'buy' as 'buy' | 'sell',
  entry_price:   '',
  stop_loss:     '',
  take_profit:   '',
  lot_size:      '',
  open_time:     '',
  close_time:    '',
  exit_price:    '',
  status:        'closed' as 'open' | 'closed' | 'cancelled',
  pnl:           '',
  pnl_percent:   '',
  r_multiple:    '',
  risk_amount:   '',
  strategy:      '',
  emotion_before:'',
  notes:         '',
  account_id:    '',
  playbook_id:   '',
  followed_rule_ids: [] as string[],
  followed_rules: [] as string[],
}

const toDbDirection = (d: string) => d === 'buy' ? 'long' : 'short'

export default function AddNewTradePage() {
  const router = useRouter()
  const { selectedAccountId } = useAccount()
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [screenshots, setScreenshots] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [playbooks, setPlaybooks] = useState<any[]>([])
  const [loadingPlaybooks, setLoadingPlaybooks] = useState(true)

  useEffect(() => {
    fetchAccounts()
    fetchPlaybooks()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true)
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
        // Default to the account currently selected in the header, falling
        // back to the first account if nothing is selected yet.
        const defaultAccount = data.find((account: Account) => account.id === selectedAccountId) || data[0]
        if (defaultAccount) {
          setSelectedAccount(defaultAccount)
          handleChange('account_id', defaultAccount.id)
        }
      }
    } catch (error) {
      console.error('[v0] Error fetching accounts:', error)
    } finally {
      setLoadingAccounts(false)
    }
  }

  const fetchPlaybooks = async () => {
    try {
      setLoadingPlaybooks(true)
      const res = await fetch('/api/playbooks')
      if (res.ok) {
        const data = await res.json()
        setPlaybooks(data)
        const activePlaybook = data.find((playbook: any) => playbook.is_active)
        if (activePlaybook) setFormData((current) => current.playbook_id ? current : { ...current, playbook_id: activePlaybook.id, strategy: activePlaybook.title })
      }
    } catch (error) {
      console.error('[v0] Error fetching playbooks:', error)
    } finally {
      setLoadingPlaybooks(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    setScreenshots(prev => [...prev, ...files])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
    setScreenshots(prev => [...prev, ...files])
  }

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.symbol || !formData.entry_price || !formData.lot_size || !formData.account_id) {
      appToast.tradeSaveFailed()
      return
    }

    setIsSubmitting(true)
    try {
      // Upload screenshots if any
      const screenshotUrls: string[] = []
      for (const file of screenshots) {
        const formData_ = new FormData()
        formData_.append('file', file)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData_,
        })
        
        if (!uploadResponse.ok) {
          console.error('[v0] Screenshot upload failed')
          continue
        }
        
        const uploadData = await uploadResponse.json()
        if (uploadData.url) {
          screenshotUrls.push(uploadData.url)
        }
      }

      const tradeData = {
        ...formData,
        direction: toDbDirection(formData.direction),
        symbol: formData.symbol.toUpperCase().trim(),
        entry_price: parseFloat(formData.entry_price),
        exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
        stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
        take_profit: formData.take_profit ? parseFloat(formData.take_profit) : null,
        quantity: parseFloat(formData.lot_size),
        lot_size: parseFloat(formData.lot_size),
        entry_time: formData.open_time ? new Date(formData.open_time).toISOString() : new Date().toISOString(),
        exit_time: formData.close_time ? new Date(formData.close_time).toISOString() : new Date().toISOString(),
        pnl: formData.pnl ? parseFloat(formData.pnl) : 0,
        pnl_percent: formData.pnl_percent ? parseFloat(formData.pnl_percent) : 0,
        r_multiple: formData.r_multiple ? parseFloat(formData.r_multiple) : null,
        risk_amount: formData.risk_amount ? parseFloat(formData.risk_amount) : null,
        strategy: formData.strategy || null,
        setup_type: formData.strategy || null,
        source: 'manual',
        notes: formData.notes || null,
        emotion_before: formData.emotion_before || null,
        status: 'closed',
        screenshot_urls: screenshotUrls.length > 0 ? screenshotUrls : null,
        account_id: formData.account_id,
        playbook_id: formData.playbook_id || null,
  followed_rule_ids: formData.followed_rule_ids,
  followed_rules: formData.followed_rules,
  }

      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData),
      })

      if (response.ok) {
        const result = await response.json()
        appToast.tradeSaved(result.symbol, result.pnl?.toFixed(2), '', result.pnl >= 0)
        router.push('/dashboard/trade-history')
      } else {
        const errorData = await response.json()
        console.error('[v0] API error:', errorData.error || errorData.message)
        appToast.tradeSaveFailed()
      }
    } catch (error) {
      console.error('[v0] Error saving trade:', error)
      appToast.tradeSaveFailed()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAutoCalculate = () => {
    const entryPrice = parseFloat(formData.entry_price)
    const exitPrice = parseFloat(formData.exit_price)
    const lotSize = parseFloat(formData.lot_size)
    const stopLoss = parseFloat(formData.stop_loss)
    const takeProft = parseFloat(formData.take_profit)

    if (!entryPrice || !exitPrice || !lotSize) {
      appToast.error('Entry Price, Exit Price, and Lot Size are required for auto-calculation')
      return
    }

    if (!selectedAccount) {
      appToast.error('Please select an account for PnL % calculation')
      return
    }

    // Calculate P&L based on entry price, exit price, and lot size
    // For BUY positions: profit if exit price > entry price
    // For SELL positions: profit if exit price < entry price
    let priceChange: number
    if (formData.direction === 'buy') {
      priceChange = exitPrice - entryPrice
    } else {
      priceChange = entryPrice - exitPrice
    }
    const pnl = priceChange * lotSize * 10
    
    // Calculate P&L percentage based on account balance
    const accountBalance = selectedAccount?.initial_balance || 0
    const pnlPercent = accountBalance > 0 ? (pnl / accountBalance) * 100 : 0

    // Calculate Risk:Reward ratio
    let rrMultiple = 0
    if (stopLoss && takeProft) {
      const riskDistance = Math.abs(entryPrice - stopLoss)
      const rewardDistance = Math.abs(takeProft - entryPrice)
      rrMultiple = riskDistance > 0 ? rewardDistance / riskDistance : 0
    }

    // Update form with calculated values
    handleChange('pnl', pnl.toFixed(2))
    handleChange('pnl_percent', pnlPercent.toFixed(2))
    if (rrMultiple > 0) {
      handleChange('r_multiple', rrMultiple.toFixed(2))
    }

    appToast.success('P&L, P&L %, and R:R calculated!')
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/journal">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Trade</h1>
            <p className="text-sm text-muted-foreground">Enter your trade details below</p>
          </div>
        </div>

        {/* Account Selector - Top Right */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2"
              disabled={loadingAccounts}
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">
                {selectedAccount?.account_name || 'Select Account'}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {accounts.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No accounts found
              </div>
            ) : (
              accounts.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => {
                    setSelectedAccount(account)
                    handleChange('account_id', account.id)
                  }}
                  className={selectedAccount?.id === account.id ? 'bg-accent' : ''}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{account.account_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {account.account_type} • {account.currency}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trade Basics */}
        <Card className="p-6 bg-card border border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-4">Trade Basics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Symbol</label>
              <Input
                placeholder="EURUSD"
                value={formData.symbol}
                onChange={(e) => handleChange('symbol', e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Direction</label>
              <select
                value={formData.direction}
                onChange={(e) => handleChange('direction', e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
              >
                <option value="buy">BUY</option>
                <option value="sell">SELL</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Entry Price</label>
              <Input
                type="number"
                step="0.00001"
                placeholder="1.0500"
                value={formData.entry_price}
                onChange={(e) => handleChange('entry_price', e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Quantity (Lots)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="1.0"
                value={formData.lot_size}
                onChange={(e) => handleChange('lot_size', e.target.value)}
                className="mt-2"
                required
              />
            </div>
          </div>
        </Card>

        {/* Risk Management */}
        <Card className="p-6 bg-card border border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-4">Risk Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Stop Loss</label>
              <Input
                type="number"
                step="0.00001"
                placeholder="1.0400"
                value={formData.stop_loss}
                onChange={(e) => handleChange('stop_loss', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Take Profit</label>
              <Input
                type="number"
                step="0.00001"
                placeholder="1.0600"
                value={formData.take_profit}
                onChange={(e) => handleChange('take_profit', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Risk Amount</label>
              <Input
                type="number"
                step="0.01"
                placeholder="100"
                value={formData.risk_amount}
                onChange={(e) => handleChange('risk_amount', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        </Card>

        {/* Trade Timing */}
        <Card className="p-6 bg-card border border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-4">Trade Timing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Entry Time</label>
              <Input
                type="datetime-local"
                value={formData.open_time}
                onChange={(e) => handleChange('open_time', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Exit Time</label>
              <Input
                type="datetime-local"
                value={formData.close_time}
                onChange={(e) => handleChange('close_time', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        </Card>

        {/* Exit & P&L */}
        <Card className="p-6 bg-card border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Exit & Profit/Loss</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoCalculate}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Auto Calculate</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Exit Price</label>
              <Input
                type="number"
                step="0.00001"
                placeholder="1.0550"
                value={formData.exit_price}
                onChange={(e) => handleChange('exit_price', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">P&L</label>
              <Input
                type="number"
                step="0.01"
                placeholder="50.00"
                value={formData.pnl}
                onChange={(e) => handleChange('pnl', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">P&L %</label>
              <Input
                type="number"
                step="0.01"
                placeholder="2.50"
                value={formData.pnl_percent}
                onChange={(e) => handleChange('pnl_percent', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-foreground">R:R Multiple</label>
            <Input
              type="number"
              step="0.1"
              placeholder="2.0"
              value={formData.r_multiple}
              onChange={(e) => handleChange('r_multiple', e.target.value)}
              className="mt-2"
            />
          </div>
        </Card>

        {/* Strategy & Notes */}
        <Card className="p-6 bg-card border border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-4">Strategy & Notes</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Strategy</label>
              <select
                onChange={(e) => { const selected = playbooks.find((playbook) => playbook.id === e.target.value); handleChange('playbook_id', e.target.value); handleChange('strategy', selected?.title || '') ; handleChange('followed_rule_ids', []) }}
                className="mt-2 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                value={formData.playbook_id}
                disabled={loadingPlaybooks}
              >
                <option value="">Select a strategy or playbook</option>
                {playbooks.map((playbook) => (
                  <option key={playbook.id} value={playbook.id}>
                    {playbook.title}
                  </option>
                ))}
              </select>
              {playbooks.length === 0 && !loadingPlaybooks && (
                <p className="text-xs text-muted-foreground mt-2">No playbooks found. Create a playbook to select strategies.</p>
              )}
              {formData.playbook_id && (() => { const playbook = playbooks.find((item) => item.id === formData.playbook_id); const playbookRules = [...(playbook?.rules?.entry || []), ...(playbook?.rules?.exit || []), ...(playbook?.rules?.custom || [])].filter((rule: unknown): rule is string => typeof rule === 'string' && rule.trim().length > 0); return <div className="mt-4 rounded-lg border border-border/50 bg-muted/20 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium text-foreground">Rules to follow</p><span className="text-xs text-muted-foreground">{formData.followed_rule_ids.length}/{playbookRules.length} followed</span></div><div className="space-y-2">{playbookRules.map((label: string, index: number) => ({ id: `custom-${index}`, label })).map((rule) => <label key={rule.id} className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/40"><input type="checkbox" checked={formData.followed_rule_ids.includes(rule.id)} onChange={(e) => { const nextIds = e.target.checked ? [...formData.followed_rule_ids, rule.id] : formData.followed_rule_ids.filter((id: string) => id !== rule.id); const nextLabels = e.target.checked ? [...formData.followed_rules, rule.label] : formData.followed_rules.filter((label: string) => label !== rule.label); handleChange('followed_rule_ids', nextIds); handleChange('followed_rules', nextLabels) }} className="mt-0.5 size-4 accent-primary" /><span className="text-sm text-foreground">{rule.label}</span></label>)}</div></div> })()}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Emotion Before Trade</label>
              <select
                value={formData.emotion_before}
                onChange={(e) => handleChange('emotion_before', e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
              >
                <option value="">Select emotion</option>
                <option value="calm">Calm</option>
                <option value="confident">Confident</option>
                <option value="anxious">Anxious</option>
                <option value="excited">Excited</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <textarea
                placeholder="Add any notes about this trade..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground min-h-24"
              />
            </div>
          </div>
        </Card>

        {/* Screenshots */}
        <Card className="p-6 bg-card border border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-4">Trade Screenshots (Optional)</h2>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-border/50 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">Drop screenshots or click to browse</p>
            <p className="text-xs text-muted-foreground mb-3">PNG, JPG up to 10MB</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs cursor-pointer"
              onClick={() => document.getElementById('screenshot-input')?.click()}
            >
              Upload Screenshot
            </Button>
            <input
              id="screenshot-input"
              type="file"
              multiple
              accept="image/png,image/jpeg"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Screenshots Preview */}
          {screenshots.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium text-foreground">{screenshots.length} screenshot(s) added</p>
              <div className="space-y-2">
                {screenshots.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-background rounded border border-border/50"
                  >
                    <span className="text-xs text-foreground truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeScreenshot(idx)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <Link href="/dashboard/journal" className="flex-1">
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#0A1F44] hover:bg-[#071530] text-white"
          >
            {isSubmitting ? 'Saving...' : 'Save Trade'}
          </Button>
        </div>
      </form>
    </div>
  )
}
