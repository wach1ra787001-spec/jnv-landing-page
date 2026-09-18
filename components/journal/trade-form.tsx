'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Upload, X, Wallet, ChevronDown, Zap, Loader2 } from 'lucide-react'
import { appToast } from '@/lib/toast-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAccount } from '@/components/dashboard/account-context'

export interface TradeFormValues {
  symbol: string
  direction: 'buy' | 'sell'
  entry_price: string
  stop_loss: string
  take_profit: string
  lot_size: string
  open_time: string
  close_time: string
  exit_price: string
  status: 'open' | 'closed' | 'cancelled'
  pnl: string
  pnl_percent: string
  r_multiple: string
  risk_amount: string
  strategy: string
  emotion_before: string
  notes: string
  account_id: string
  playbook_id: string
  followed_rule_ids: string[]
  followed_rules: string[]
  // Carried through from imported (CSV/broker) trades so P&L analytics stay
  // accurate once the trade is journaled and actually saved to the database.
  net_pnl: string
  commission: string
  swap: string
  external_ref: string
  import_source: string
}

export const DEFAULT_TRADE_FORM_VALUES: TradeFormValues = {
  symbol: '',
  direction: 'buy',
  entry_price: '',
  stop_loss: '',
  take_profit: '',
  lot_size: '',
  open_time: '',
  close_time: '',
  exit_price: '',
  status: 'closed',
  pnl: '',
  pnl_percent: '',
  r_multiple: '',
  risk_amount: '',
  strategy: '',
  emotion_before: '',
  notes: '',
  account_id: '',
  playbook_id: '',
  followed_rule_ids: [],
  followed_rules: [],
  net_pnl: '',
  commission: '',
  swap: '',
  external_ref: '',
  import_source: '',
}

interface Account {
  id: string
  account_name: string
  account_type: string
  currency: string
  initial_balance?: number
}

const toDbDirection = (d: string) => (d === 'buy' ? 'long' : 'short')

interface TradeFormProps {
  mode: 'create' | 'edit'
  tradeId?: string
  initialValues?: Partial<TradeFormValues>
  initialScreenshotUrls?: string[]
  requireStrategy?: boolean
  infoBanner?: string
  onCancel: () => void
  onSaved: (result: any) => void
}

export function TradeForm({
  mode,
  tradeId,
  initialValues,
  initialScreenshotUrls,
  requireStrategy = false,
  infoBanner,
  onCancel,
  onSaved,
}: TradeFormProps) {
  const { selectedAccountId } = useAccount()
  const [formData, setFormData] = useState<TradeFormValues>({ ...DEFAULT_TRADE_FORM_VALUES, ...initialValues })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newScreenshots, setNewScreenshots] = useState<File[]>([])
  const [existingScreenshotUrls, setExistingScreenshotUrls] = useState<string[]>(initialScreenshotUrls || [])
  const [isDragging, setIsDragging] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [playbooks, setPlaybooks] = useState<any[]>([])
  const [loadingPlaybooks, setLoadingPlaybooks] = useState(true)

  useEffect(() => {
    fetchAccounts()
    fetchPlaybooks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true)
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
        if (mode === 'edit') {
          const currentAccount = data.find((account: Account) => account.id === (initialValues?.account_id))
          if (currentAccount) setSelectedAccount(currentAccount)
        } else {
          const defaultAccount = data.find((account: Account) => account.id === selectedAccountId) || data[0]
          if (defaultAccount) {
            setSelectedAccount(defaultAccount)
            handleChange('account_id', defaultAccount.id)
          }
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
        if (mode === 'create') {
          const activePlaybook = data.find((playbook: any) => playbook.is_active)
          if (activePlaybook) {
            setFormData((current) =>
              current.playbook_id ? current : { ...current, playbook_id: activePlaybook.id, strategy: activePlaybook.title },
            )
          }
        } else if (!formData.playbook_id && formData.strategy) {
          const matching = data.find((playbook: any) => playbook.title === formData.strategy)
          if (matching) setFormData((current) => ({ ...current, playbook_id: matching.id }))
        }
      }
    } catch (error) {
      console.error('[v0] Error fetching playbooks:', error)
    } finally {
      setLoadingPlaybooks(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    setNewScreenshots((prev) => [...prev, ...files])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
    setNewScreenshots((prev) => [...prev, ...files])
  }

  const removeNewScreenshot = (index: number) => {
    setNewScreenshots((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingScreenshot = (index: number) => {
    setExistingScreenshotUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.symbol || !formData.entry_price || !formData.lot_size || (mode === 'create' && !formData.account_id) || (requireStrategy && !formData.playbook_id)) {
      appToast.error(
        'Strategy required',
        requireStrategy ? 'Select the strategy or playbook used for this trade before saving.' : 'Complete the required trade fields.',
      )
      return
    }

    setIsSubmitting(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of newScreenshots) {
        const uploadForm = new FormData()
        uploadForm.append('file', file)

        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: uploadForm })
        if (!uploadResponse.ok) {
          console.error('[v0] Screenshot upload failed')
          continue
        }
        const uploadData = await uploadResponse.json()
        if (uploadData.url) uploadedUrls.push(uploadData.url)
      }

      const finalScreenshotUrls = [...existingScreenshotUrls, ...uploadedUrls]
      const playbook = playbooks.find((item) => item.id === formData.playbook_id)
      const playbookRulesSnapshot = (() => {
        if (!playbook) return null
        const rules = [...(playbook.rules?.entry || []), ...(playbook.rules?.exit || []), ...(playbook.rules?.custom || [])]
        return rules.flatMap((rule: unknown, index: number) => {
          const item = rule && typeof rule === 'object' ? rule as { id?: unknown; title?: unknown; description?: unknown; name?: unknown; text?: unknown } : null
          const title = item ? (typeof item.title === 'string' ? item.title : typeof item.name === 'string' ? item.name : typeof item.text === 'string' ? item.text : '') : String(rule ?? '')
          const description = item && typeof item.description === 'string' ? item.description : ''
          const label = title.trim() && description.trim() ? `${title.trim()}: ${description.trim()}` : (title.trim() || description.trim())
          if (!label) return []
          const id = item && typeof item.id === 'string' ? item.id : `custom-${index}`
          return [{ id, label, followed: formData.followed_rule_ids.includes(id) || formData.followed_rule_ids.includes(`custom-${index}`) }]
        })
      })()

      if (mode === 'create') {
        const pnlValue = formData.pnl ? parseFloat(formData.pnl) : 0
        const commissionValue = formData.commission ? parseFloat(formData.commission) : 0
        const swapValue = formData.swap ? parseFloat(formData.swap) : 0
        // Net P&L drives dashboard KPIs, account balance, and every analytics
        // view. Use the imported value if we have one (CSV/broker import),
        // otherwise derive it from gross P&L minus commission/swap so it's
        // never left null for manually journaled trades.
        const netPnlValue = formData.net_pnl ? parseFloat(formData.net_pnl) : (pnlValue - commissionValue - swapValue)

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
          pnl: pnlValue,
          pnl_percent: formData.pnl_percent ? parseFloat(formData.pnl_percent) : 0,
          net_pnl: netPnlValue,
          commission: commissionValue,
          swap: swapValue,
          external_ref: formData.external_ref || null,
          r_multiple: formData.r_multiple ? parseFloat(formData.r_multiple) : null,
          risk_amount: formData.risk_amount ? parseFloat(formData.risk_amount) : null,
          strategy: formData.strategy || null,
          setup_type: formData.strategy || null,
          source: formData.import_source || 'manual',
          notes: formData.notes || null,
          emotion_before: formData.emotion_before || null,
          status: 'closed',
          screenshot_urls: finalScreenshotUrls.length > 0 ? finalScreenshotUrls : null,
          account_id: formData.account_id,
          playbook_name: playbook?.title || null,
          playbook_version: playbook?.version || 1,
          playbook_rules_snapshot: playbookRulesSnapshot,
        }

        const response = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tradeData),
        })

        if (response.ok) {
          const result = await response.json()
          onSaved(result)
        } else {
          const errorData = await response.json()
          console.error('[v0] API error:', errorData.error || errorData.message)
          appToast.tradeSaveFailed()
        }
      } else {
        const editedPnl = formData.pnl ? parseFloat(formData.pnl) : 0
        const tradeData = {
          symbol: formData.symbol.toUpperCase().trim(),
          direction: toDbDirection(formData.direction),
          entry_price: parseFloat(formData.entry_price),
          exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
          stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
          take_profit: formData.take_profit ? parseFloat(formData.take_profit) : null,
          quantity: parseFloat(formData.lot_size),
          entry_time: formData.open_time ? new Date(formData.open_time).toISOString() : new Date().toISOString(),
          exit_time: formData.close_time ? new Date(formData.close_time).toISOString() : new Date().toISOString(),
          pnl: editedPnl,
          pnl_percent: formData.pnl_percent ? parseFloat(formData.pnl_percent) : 0,
          // net_pnl is a generated database column; it recalculates from
          // the editable P&L inputs after this update.
          r_multiple: formData.r_multiple ? parseFloat(formData.r_multiple) : null,
          risk_amount: formData.risk_amount ? parseFloat(formData.risk_amount) : null,
          strategy: formData.strategy || null,
          setup_type: formData.strategy || null,
          notes: formData.notes || null,
          emotion_before: formData.emotion_before || null,
          status: 'closed',
          screenshot_urls: finalScreenshotUrls,
          followed_rule_ids: formData.followed_rule_ids,
          followed_rules: formData.followed_rules,
          playbook_name: playbook?.title || formData.strategy || null,
          playbook_version: playbook?.version || null,
          playbook_rules_snapshot: playbookRulesSnapshot,
        }

        const response = await fetch(`/api/trades/${tradeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tradeData),
        })

        if (response.ok) {
          const result = await response.json()
          onSaved(result)
        } else {
          const errorData = await response.json()
          console.error('[v0] API error:', errorData.error || errorData.message)
          appToast.tradeSaveFailed()
        }
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

    if (!Number.isFinite(entryPrice) || !Number.isFinite(exitPrice) || !Number.isFinite(lotSize) || lotSize <= 0) {
      appToast.error('Entry Price, Exit Price, and Lot Size are required for auto-calculation')
      return
    }

    if (!selectedAccount) {
      appToast.error('Please select an account for PnL % calculation')
      return
    }

    let priceChange: number
    if (formData.direction === 'buy') {
      priceChange = exitPrice - entryPrice
    } else {
      priceChange = entryPrice - exitPrice
    }
    const normalizedSymbol = formData.symbol.toUpperCase().replace(/[\s/_-]/g, '')
    const isGold = normalizedSymbol.includes('XAU') || normalizedSymbol.includes('GOLD')
    const isIndex = /^(NAS100|US30|SPX500|GER40|UK100|JPN225|USTEC|US100)/.test(normalizedSymbol)
    const contractSize = isGold ? 100 : isIndex ? 1 : 100_000
    const pnl = priceChange * lotSize * contractSize

    const accountBalance = selectedAccount?.initial_balance || 0
    const pnlPercent = accountBalance > 0 ? (pnl / accountBalance) * 100 : 0

    let rrMultiple = 0
    if (stopLoss && takeProft) {
      const riskDistance = Math.abs(entryPrice - stopLoss)
      const rewardDistance = Math.abs(takeProft - entryPrice)
      rrMultiple = riskDistance > 0 ? rewardDistance / riskDistance : 0
    }

    handleChange('pnl', pnl.toFixed(2))
    handleChange('pnl_percent', pnlPercent.toFixed(2))
    if (rrMultiple > 0) {
      handleChange('r_multiple', rrMultiple.toFixed(2))
    }

    appToast.success('P&L, P&L %, and R:R calculated!')
  }

  const strategyMatchesPlaybook = !formData.strategy || playbooks.some((playbook) => playbook.id === formData.playbook_id)

  return (
    <div className="flex flex-col gap-8 pb-8">
      {infoBanner && (
        <Card className="border-primary/30 bg-primary/5 p-4 text-sm text-foreground">{infoBanner}</Card>
      )}

      {/* Account selector / display - top right */}
      <div className="flex items-center justify-end">
        {mode === 'create' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={loadingAccounts}>
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">{selectedAccount?.account_name || 'Select Account'}</span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {accounts.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">No accounts found</div>
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
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            <Wallet className="w-4 h-4" />
            {selectedAccount?.account_name || 'Account'}
          </div>
        )}
      </div>

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
            <Button type="button" variant="outline" size="sm" onClick={handleAutoCalculate} className="gap-2">
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
                onChange={(e) => {
                  const selected = playbooks.find((playbook) => playbook.id === e.target.value)
                  handleChange('playbook_id', e.target.value)
                  handleChange('strategy', selected?.title || '')
                  handleChange('followed_rule_ids', [])
                }}
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
              {!strategyMatchesPlaybook && (
                <p className="text-xs text-muted-foreground mt-2">Currently set to &quot;{formData.strategy}&quot; (not linked to a playbook).</p>
              )}
              {formData.playbook_id &&
                (() => {
                  const playbook = playbooks.find((item) => item.id === formData.playbook_id)
                  const playbookRules = [
                    ...(playbook?.rules?.entry || []).map((rule: unknown, index: number) => ({ rule, source: 'entry', index })),
                    ...(playbook?.rules?.exit || []).map((rule: unknown, index: number) => ({ rule, source: 'exit', index })),
                    ...(playbook?.rules?.custom || []).map((rule: unknown, index: number) => ({ rule, source: 'custom', index })),
                  ].flatMap(({ rule, source, index }) => {
                    if (typeof rule === 'string' || typeof rule === 'number') {
                      const label = String(rule).trim()
                      return label ? [{ id: `${source}-${index}`, label }] : []
                    }
                    if (!rule || typeof rule !== 'object') return []
                    const item = rule as { id?: unknown; title?: unknown; description?: unknown; name?: unknown; text?: unknown }
                    const title = typeof item.title === 'string' ? item.title.trim() : typeof item.name === 'string' ? item.name.trim() : typeof item.text === 'string' ? item.text.trim() : ''
                    const description = typeof item.description === 'string' ? item.description.trim() : ''
                    const label = title && description ? `${title}: ${description}` : title || description
                    return label ? [{ id: typeof item.id === 'string' ? item.id : `${source}-${index}`, label }] : []
                  })
                  return (
                    <div className="mt-4 rounded-lg border border-border/50 bg-muted/20 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Rules to follow</p>
                        <span className="text-xs text-muted-foreground">
                          {formData.followed_rule_ids.length}/{playbookRules.length} followed
                        </span>
                      </div>
                      <div className="space-y-2">
                        {playbookRules.map((rule) => (
                            <label key={rule.id} className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/40">
                              <input
                                type="checkbox"
                                checked={formData.followed_rule_ids.includes(rule.id)}
                                onChange={(e) => {
                                  const nextIds = e.target.checked
                                    ? [...formData.followed_rule_ids, rule.id]
                                    : formData.followed_rule_ids.filter((id: string) => id !== rule.id)
                                  const nextLabels = e.target.checked
                                    ? [...formData.followed_rules, rule.label]
                                    : formData.followed_rules.filter((label: string) => label !== rule.label)
                                  handleChange('followed_rule_ids', nextIds)
                                  handleChange('followed_rules', nextLabels)
                                }}
                                className="mt-0.5 size-4 accent-primary"
                              />
                              <span className="text-sm text-foreground">{rule.label}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )
                })()}
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
              isDragging ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50'
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

          {(existingScreenshotUrls.length > 0 || newScreenshots.length > 0) && (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium text-foreground">
                {existingScreenshotUrls.length + newScreenshots.length} screenshot(s) attached
              </p>
              <div className="space-y-2">
                {existingScreenshotUrls.map((url, idx) => (
                  <div key={`existing-${idx}`} className="flex items-center justify-between p-2 bg-background rounded border border-border/50">
                    <span className="text-xs text-foreground truncate">Screenshot {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeExistingScreenshot(idx)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {newScreenshots.map((file, idx) => (
                  <div key={`new-${idx}`} className="flex items-center justify-between p-2 bg-background rounded border border-border/50">
                    <span className="text-xs text-foreground truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeNewScreenshot(idx)}
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
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1 bg-[#0A1F44] hover:bg-[#071530] text-white gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : mode === 'edit' ? (
              'Save Changes'
            ) : (
              'Save Trade'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
