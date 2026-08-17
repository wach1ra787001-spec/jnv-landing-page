'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface MT5ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (credentials: MT5Credentials) => Promise<void>
}

interface MT5Credentials {
  accountNumber: string
  serverName: string
  investorPassword: string
}

export function MT5ConnectionModal({ isOpen, onClose, onConnect }: MT5ConnectionModalProps) {
  const [credentials, setCredentials] = useState<MT5Credentials>({
    accountNumber: '',
    serverName: '',
    investorPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleConnect = async () => {
    setError(null)
    
    if (!credentials.accountNumber.trim()) {
      setError('Trading account number is required')
      return
    }
    if (!credentials.serverName.trim()) {
      setError('Server name is required')
      return
    }
    if (!credentials.investorPassword.trim()) {
      setError('Investor password is required')
      return
    }

    setIsLoading(true)
    try {
      await onConnect(credentials)
      setSuccess(true)
      setTimeout(() => {
        setCredentials({ accountNumber: '', serverName: '', investorPassword: '' })
        setSuccess(false)
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect MT5 account')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card border border-border/50 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="text-xl font-semibold text-foreground">Connect MT5 Account</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-sm font-medium text-foreground">Account connected successfully!</p>
              <p className="text-xs text-muted-foreground text-center">Your MT5 data will start syncing shortly</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Trading Account Number
                </label>
                <Input
                  placeholder="e.g., 123456789"
                  type="text"
                  value={credentials.accountNumber}
                  onChange={(e) => setCredentials({ ...credentials, accountNumber: e.target.value })}
                  disabled={isLoading}
                  className="bg-input border border-border/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Server Name
                </label>
                <Input
                  placeholder="e.g., ICMarkets-Demo"
                  type="text"
                  value={credentials.serverName}
                  onChange={(e) => setCredentials({ ...credentials, serverName: e.target.value })}
                  disabled={isLoading}
                  className="bg-input border border-border/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Investor Password
                </label>
                <Input
                  placeholder="••••••••"
                  type="password"
                  value={credentials.investorPassword}
                  onChange={(e) => setCredentials({ ...credentials, investorPassword: e.target.value })}
                  disabled={isLoading}
                  className="bg-input border border-border/50"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground pt-2">
                Your credentials are encrypted and only used to retrieve your trading data. We never store your password.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex gap-3 p-6 border-t border-border/50 bg-muted/30">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              className="flex-1 gap-2 bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
