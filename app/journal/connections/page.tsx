'use client'

import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Suspense } from 'react'
import CTraderCSVImport from '@/components/ctrader-csv-import'

export const dynamic = 'force-dynamic'

function ConnectionsContent() {
  const searchParams = useSearchParams()
  const connected = searchParams.get('connected') === 'true'
  const error = searchParams.get('error')

  const handleConnectCTrader = () => {
    window.location.assign('/api/ctrader/auth')
  }

  const errorMessages: Record<string, string> = {
    access_denied: 'Authorization was denied. Please try again.',
    invalid_state: 'Security check failed. Please try again.',
    token_failed: 'Failed to exchange authorization code for tokens. Check Vercel logs for details.',
    accounts_failed: 'Failed to fetch your cTrader accounts. Check Vercel logs for details.',
    no_accounts: 'No trading accounts found on your cTrader profile.',
    ctrader_not_configured: 'cTrader integration is not configured.',
    missing_code: 'Missing authorization code from cTrader. Please try again.',
    db_error: 'Failed to save connection to database. Please try again.',
    unexpected: 'An unexpected error occurred. Check Vercel logs for details.',
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Broker Connections</h1>
        <p className="text-muted-foreground">
          Connect your trading accounts to sync trades and data
        </p>
      </div>

      {/* Success Message */}
      {connected && (
        <Card className="p-4 border-green-500/30 bg-green-500/10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Connection Successful</h3>
              <p className="text-sm text-green-800">
                Your cTrader account has been connected and trades will sync automatically.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Connection Failed</h3>
              <p className="text-sm text-red-800">
                {errorMessages[error] || 'An unknown error occurred. Please try again.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Connection Status */}
      <Card className="p-6 bg-card border border-border/50">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Connect cTrader Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your cTrader account to verify trades and access account information
            </p>
            <Button onClick={handleConnectCTrader} className="w-full sm:w-auto">
              {connected ? 'Reconnect cTrader' : 'Connect cTrader'}
            </Button>
          </div>
        </div>
      </Card>

      {/* CSV Import */}
      <CTraderCSVImport />

      {/* Info Box */}
      <Card className="p-4 bg-muted/30 border border-border/50">
        <h4 className="font-semibold text-foreground mb-2">About Connections</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Your connection data is encrypted and stored securely</li>
          <li>• Trades sync automatically every hour</li>
          <li>• You can disconnect anytime from this page</li>
          <li>• Multiple accounts can be connected</li>
        </ul>
      </Card>
    </div>
  )
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConnectionsContent />
    </Suspense>
  )
}
