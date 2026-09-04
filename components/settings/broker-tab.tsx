"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"
import { BrokerLogo } from "@/components/broker-logo"
import { BrokerConnection } from "@/types/ctrader"
import { MT5ConnectionModal } from "@/components/mt5-connection-modal"
import { CSVImportWizard } from "@/components/settings/csv-import-wizard"
import { appToast } from "@/lib/toast-utils"

interface Broker {
  id: string
  name: string
  description: string
  source: string
  connected: boolean
  accountNumber: string | null
}

interface BrokerTabProps {
  onConnectMT5?: () => void
}

export function BrokerTab({ onConnectMT5 }: BrokerTabProps) {
  const router = useRouter()
  const [brokers, setBrokers] = useState<Broker[]>([
    {
      id: "mt5",
      name: "MetaTrader 5",
      description: "Connect your MT5 account for automatic trade imports",
      source: "mt5",
      connected: false,
      accountNumber: null,
    },
    {
      id: "mt4",
      name: "MetaTrader 4",
      description: "Connect your MT4 account for automatic trade imports",
      source: "mt4",
      connected: false,
      accountNumber: null,
    },
    {
      id: "tradingview",
      name: "TradingView",
      description: "Import trades and charts from TradingView",
      source: "tradingview",
      connected: false,
      accountNumber: null,
    },
    {
      id: "tradelocker",
      name: "TradeLocker",
      description: "Connect your TradeLocker account for automatic trade imports",
      source: "tradelocker",
      connected: false,
      accountNumber: null,
    },
    {
      id: "ctrader",
      name: "cTrader",
      description: "Connect your cTrader account for automatic trade imports",
      source: "ctrader",
      connected: false,
      accountNumber: null,
    },
    {
      id: "interactive",
      name: "Interactive Brokers",
      description: "Connect to Interactive Brokers for trade sync",
      source: "interactive_brokers",
      connected: false,
      accountNumber: null,
    },
    {
      id: "tradier",
      name: "Tradier",
      description: "Connect your Tradier account for automatic trade imports",
      source: "tradier",
      connected: false,
      accountNumber: null,
    },
    {
      id: "csv",
      name: "CSV Import",
      description: "Manually import trades via CSV file upload",
      source: "csv",
      connected: false,
      accountNumber: null,
    },
  ])
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [mt5ModalOpen, setMt5ModalOpen] = useState(false)
  const [csvExpanded, setCsvExpanded] = useState(false)
  const [tradeLockerOpen, setTradeLockerOpen] = useState(false)
  const [tradeLockerForm, setTradeLockerForm] = useState({ email: '', password: '', server: '' })
  const [tradeLockerAccounts, setTradeLockerAccounts] = useState<Array<{ id: number; name: string }>>([])
  const [tradeLockerError, setTradeLockerError] = useState<string | null>(null)
  const [tradeLockerAuthenticating, setTradeLockerAuthenticating] = useState(false)
  const [showTradeLockerPassword, setShowTradeLockerPassword] = useState(false)

  useEffect(() => {
    fetchConnectionStatus()
  }, [])

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch('/api/ctrader/status')
      if (response.ok) {
        const connection: BrokerConnection | null = await response.json()
        if (connection) {
          setBrokers((prev) =>
            prev.map((broker) =>
              broker.id === 'ctrader'
                ? {
                    ...broker,
                    connected: connection.is_connected,
                    accountNumber: connection.account_login
                      ? `${connection.broker_name} - ${connection.account_login}`
                      : null,
                  }
                : broker
            )
          )
        }
      }
      const tradeLockerResponse = await fetch('/api/tradelocker/status')
      if (tradeLockerResponse.ok) {
        const tradeLocker = await tradeLockerResponse.json()
        setBrokers((prev) => prev.map((broker) => broker.id === 'tradelocker' ? { ...broker, connected: Boolean(tradeLocker?.is_connected), accountNumber: tradeLocker?.selected_account_id ? String(tradeLocker.selected_account_id) : null } : broker))
      }
    } catch (error) {
      console.error('Failed to fetch connection status')
    }
  }

  const handleConnectClick = (brokerId: string) => {
    if (brokerId === "mt5") {
      setMt5ModalOpen(true)
      onConnectMT5?.()
    } else if (brokerId === "ctrader") {
      window.location.href = '/api/ctrader/auth'
    } else if (brokerId === "tradelocker") {
      setTradeLockerError(null)
      setTradeLockerOpen(true)
    }
  }

  const connectTradeLocker = async () => {
    setTradeLockerError(null)
    setTradeLockerAuthenticating(true)
    try {
      const response = await fetch('/api/tradelocker/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeLockerForm),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setTradeLockerError(result.error ? `${result.error}${result.diagnostic?.status ? ` (HTTP ${result.diagnostic.status}, ${result.diagnostic.environment}, server: ${result.diagnostic.server || 'not provided'})` : ''}` : 'TradeLocker connection failed')
        return
      }
      setTradeLockerAccounts(result.accounts || [])
      if (!result.accounts?.length) setTradeLockerError('No TradeLocker accounts were found for this login.')
    } catch {
      setTradeLockerError('Could not reach TradeLocker. Check your connection and try again.')
    } finally {
      setTradeLockerAuthenticating(false)
    }
  }

  const selectTradeLockerAccount = async (accountId: number) => {
    const response = await fetch('/api/tradelocker/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId }) })
    if (!response.ok) { setTradeLockerError('Could not select this account'); return }
    setBrokers((prev) => prev.map((broker) => broker.id === 'tradelocker' ? { ...broker, connected: true, accountNumber: String(accountId) } : broker))
    setTradeLockerOpen(false)
  }

  const handleMT5ConnectionSuccess = (accountDetails: any) => {
    setBrokers((prev) =>
      prev.map((broker) =>
        broker.id === 'mt5'
          ? {
              ...broker,
              connected: true,
              accountNumber: `${accountDetails.broker} - ${accountDetails.accountLogin}`,
            }
          : broker
      )
    )
  }

  const handleDisconnectClick = async (brokerId: string) => {
    if (brokerId !== 'ctrader' && brokerId !== 'tradelocker') return
    const brokerName = brokerId === 'ctrader' ? 'cTrader' : 'TradeLocker'
    if (!confirm(`Disconnect your ${brokerName} account? Previously imported trades will remain.`)) return

    try {
      const response = await fetch(`/api/${brokerId}/disconnect`, { method: 'POST' })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        setSyncError(result.error || `Failed to disconnect ${brokerName}`)
        return
      }
      await fetchConnectionStatus()
      setSyncError(null)
    } catch {
      setSyncError(`Failed to disconnect ${brokerName}`)
    }
  }

  const handleSyncClick = async () => {
    setSyncing(true)
    setSyncError(null)

    try {
      const response = await fetch('/api/ctrader/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        const result = await response.json()
        appToast.tradesImported(result.imported || 0)
        await fetchConnectionStatus()
      } else {
        const error = await response.json()
        setSyncError(error.error || 'Sync failed')
      }
    } catch (error) {
      setSyncError('Failed to sync trades')
    } finally {
      setSyncing(false)
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Broker Integrations</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your trading accounts to automatically import trades
        </p>
      </div>

      {syncError && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive">{syncError}</p>
        </div>
      )}

      <div className="space-y-3">
        {brokers.map((broker) => (
          <div key={broker.id} className="border border-border rounded-lg bg-background overflow-hidden">
            <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
              {/* Logo */}
              <div className="shrink-0">
                <BrokerLogo source={broker.source} size="lg" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">{broker.name}</h4>
                  {broker.connected && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-chart-1" />
                      Connected
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {broker.description}
                </p>
                {broker.accountNumber && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Account: {broker.accountNumber}
                  </p>
                )}
              </div>

              {/* Status Indicator */}
              <div className="shrink-0">
                {broker.id === 'csv' ? null : broker.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-chart-1" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0">
                {broker.id === 'csv' ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setCsvExpanded(v => !v)}
                    className="gap-1.5"
                  >
                    Upload a new file
                    {csvExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                ) : (
                  <>
                    {broker.connected && (broker.id === 'ctrader' || broker.id === 'tradelocker') && (
                      <Button variant="outline" size="sm" onClick={broker.id === 'tradelocker' ? async () => { setSyncing(true); setSyncError(null); const response = await fetch('/api/tradelocker/sync', { method: 'POST' }); const result = await response.json().catch(() => ({})); if (!response.ok) setSyncError(result.error || 'TradeLocker sync failed'); else { appToast.tradesImported(result.imported || 0); await fetchConnectionStatus(); } setSyncing(false) } : handleSyncClick} disabled={syncing}>
                        {syncing ? 'Syncing...' : 'Sync Now'}
                      </Button>
                    )}
                    <Button
                      variant={broker.connected ? "outline" : "default"}
                      size="sm"
                      onClick={() =>
                        broker.connected
                          ? handleDisconnectClick(broker.id)
                          : handleConnectClick(broker.id)
                      }
                    >
                      {broker.connected ? "Disconnect" : "Connect"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {broker.id === 'tradelocker' && tradeLockerOpen && (
              <form className="border-t border-border/50 bg-muted/20 p-4 space-y-3" onSubmit={(event) => { event.preventDefault(); void connectTradeLocker() }}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><Label htmlFor="tl-email">Email</Label><Input id="tl-email" type="email" required value={tradeLockerForm.email} onChange={(event) => setTradeLockerForm({ ...tradeLockerForm, email: event.target.value })} /></div>
                  <div><Label htmlFor="tl-password">Password</Label><div className="relative"><Input id="tl-password" type={showTradeLockerPassword ? "text" : "password"} required value={tradeLockerForm.password} onChange={(event) => setTradeLockerForm({ ...tradeLockerForm, password: event.target.value })} className="pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 size-10" onClick={() => setShowTradeLockerPassword((visible) => !visible)} aria-label={showTradeLockerPassword ? "Hide password" : "Show password"} aria-pressed={showTradeLockerPassword}>{showTradeLockerPassword ? <EyeOff data-icon="inline-start" /> : <Eye data-icon="inline-start" />}</Button></div></div>
                  <div><Label htmlFor="tl-server">Server</Label><Input id="tl-server" required placeholder="Broker server name" value={tradeLockerForm.server} onChange={(event) => setTradeLockerForm({ ...tradeLockerForm, server: event.target.value })} /></div>
                </div>
                {tradeLockerError && <p className="text-sm text-destructive">{tradeLockerError}</p>}
                {!tradeLockerAccounts.length ? <Button type="submit" disabled={tradeLockerAuthenticating}>{tradeLockerAuthenticating ? 'Authenticating...' : 'Authenticate'}</Button> : <div className="flex flex-wrap gap-2">{tradeLockerAccounts.map((account) => <Button type="button" key={account.id} onClick={() => void selectTradeLockerAccount(account.id)}>Use {account.name}</Button>)}</div>}
              </form>
            )}

            {/* CSV Wizard — expands inline under the CSV row */}
            {broker.id === 'csv' && csvExpanded && (
              <div className="border-t border-border/50 p-4 bg-muted/20">
                <CSVImportWizard />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Your broker credentials are securely encrypted and stored. We never have access to your trading account funds.
        </p>
      </div>

      <MT5ConnectionModal
        isOpen={mt5ModalOpen}
        onClose={() => setMt5ModalOpen(false)}
        onConnectionSuccess={handleMT5ConnectionSuccess}
      />
    </div>
  )
}
