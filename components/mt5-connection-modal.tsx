'use client'

import { useState } from 'react'
import { X, Copy, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MT5ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConnectionSuccess?: (accountDetails: AccountDetails) => void
}

interface AccountDetails {
  accountLogin: string
  accountName: string
  broker: string
  server: string
  currency: string
  leverage: number
  company: string
}

export function MT5ConnectionModal({
  isOpen,
  onClose,
  onConnectionSuccess,
}: MT5ConnectionModalProps) {
  const [step, setStep] = useState<'token' | 'waiting' | 'connected'>('token')
  const [connectionToken, setConnectionToken] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')

  const BRIDGE_URL = 'https://bridge.jnvtradingjournal.com'
  const HEARTBEAT = '10 seconds'

  const generateToken = () => {
    // Simulated token generation - backend will handle this
    const token = `JNV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    setConnectionToken(token)
    setStep('waiting')
    setError('')
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(connectionToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleValidateConnection = async () => {
    if (!tokenInput.trim()) {
      setError('Please enter the connection token')
      return
    }

    setIsValidating(true)
    setError('')

    try {
      // Simulate API call to validate connection
      // In real implementation, this would verify the token with the backend
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulated successful connection with account details
      const mockDetails: AccountDetails = {
        accountLogin: '12345678',
        accountName: 'John Doe',
        broker: 'IC Markets',
        server: 'ICMarketsSC-Live01',
        currency: 'USD',
        leverage: 500,
        company: 'IC Markets',
      }

      setAccountDetails(mockDetails)
      setStep('connected')
      onConnectionSuccess?.(mockDetails)
    } catch (err) {
      setError('Failed to validate connection. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleReset = () => {
    setStep('token')
    setConnectionToken('')
    setTokenInput('')
    setAccountDetails(null)
    setError('')
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-300">
        <div
          className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 shadow-2xl backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/70 hover:text-white" />
          </button>

          {step === 'token' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Connect MetaTrader 5
                </h2>
                <p className="text-sm text-white/60">
                  Generate a connection token and enter it in your MT5 EA
                </p>
              </div>

              <div className="space-y-4">
                {!connectionToken ? (
                  <Button
                    onClick={generateToken}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 rounded-lg transition-all duration-200"
                  >
                    Generate Connection Token
                  </Button>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                        Connection Token
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
                          <code className="flex-1 text-sm font-mono text-white/90 tracking-wider">
                            {connectionToken}
                          </code>
                          <button
                            onClick={handleCopyToken}
                            className="p-2 hover:bg-white/10 rounded transition-colors"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-white/60" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                        Bridge URL
                      </label>
                      <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
                        <p className="text-sm font-mono text-white/80">{BRIDGE_URL}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                        Heartbeat
                      </label>
                      <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
                        <p className="text-sm font-mono text-white/80">{HEARTBEAT}</p>
                      </div>
                    </div>

                    <div className="pt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-xs text-blue-200">
                        ℹ️ Copy the connection token above and paste it into your MetaTrader 5 EA
                        to establish the connection.
                      </p>
                    </div>

                    <Button
                      onClick={() => setStep('waiting')}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2 rounded-lg transition-all duration-200"
                    >
                      I&apos;ve Entered the Token in MT5
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 'waiting' && (
            <div className="space-y-6 animate-in fade-in duration-300 text-center">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Waiting for Connection...</h2>
                <p className="text-sm text-white/60">
                  The system is listening for your EA connection
                </p>
              </div>

              <div className="flex justify-center">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse" />
                  <div className="relative flex items-center justify-center w-24 h-24 bg-white/5 border border-white/20 rounded-full">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-left">
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                  <p className="text-xs text-white/70">
                    <span className="font-semibold text-white">Token:</span> {connectionToken}
                  </p>
                </div>
                <div className="text-xs text-white/50 space-y-1">
                  <p>• Make sure your EA is running</p>
                  <p>• Check that the token is correctly entered</p>
                  <p>• Verify your internet connection</p>
                </div>
              </div>

              <Button
                onClick={handleValidateConnection}
                disabled={isValidating}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'I See the Connection in My EA'
                )}
              </Button>

              <button
                onClick={handleReset}
                className="text-xs text-white/50 hover:text-white/70 transition-colors"
              >
                Start Over
              </button>
            </div>
          )}

          {step === 'connected' && accountDetails && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 border border-green-500/50 rounded-full mb-3">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Connected!</h2>
                <p className="text-sm text-white/60">Your MT5 account is now linked</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
                  <DetailRow label="Broker" value={accountDetails.broker} />
                  <DetailRow label="Server" value={accountDetails.server} />
                  <DetailRow label="Account" value={accountDetails.accountLogin} />
                  <DetailRow label="Name" value={accountDetails.accountName} />
                  <DetailRow label="Currency" value={accountDetails.currency} />
                  <DetailRow label="Leverage" value={`1:${accountDetails.leverage}`} />
                  <DetailRow label="Company" value={accountDetails.company} />
                </div>
              </div>

              <div className="pt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-200">
                  ✓ Your MT5 trades will be automatically synced to your journal
                </p>
              </div>

              <Button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2 rounded-lg transition-all duration-200"
              >
                Close
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-200">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-medium text-white/70">{label}</span>
      <span className="text-sm font-semibold text-white/90">{value}</span>
    </div>
  )
}
