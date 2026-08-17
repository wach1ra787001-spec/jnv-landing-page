"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle, Loader2 } from "lucide-react"

export function SignUpSuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const handleResendEmail = async () => {
    if (!email) {
      setResendError('Email not found. Please try signing up again.')
      return
    }

    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const response = await fetch('/api/resend-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        setResendError(data.error || 'Failed to resend email')
        return
      }

      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (error) {
      setResendError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl text-card-foreground">Check your email</CardTitle>
        <CardDescription className="text-muted-foreground">
          {"We've sent you a confirmation link to verify your account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
          <Mail className="w-5 h-5 text-primary" />
          <div className="text-sm text-muted-foreground">
            Click the link in your email to activate your account and start journaling your trades.
          </div>
        </div>

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {"Didn't receive the email?"}
          </p>
          <p className="text-xs text-muted-foreground">
            Check your spam folder or request a new verification link below
          </p>

          {resendSuccess && (
            <div className="p-2 text-xs text-green-600 bg-green-50 rounded-lg">
              Verification email sent successfully!
            </div>
          )}

          {resendError && (
            <div className="p-2 text-xs text-destructive bg-destructive/10 rounded-lg">
              {resendError}
            </div>
          )}

          <Button
            onClick={handleResendEmail}
            disabled={isResending || !email}
            className="w-full"
          >
            {isResending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isResending ? 'Sending...' : 'Resend Verification Email'}
          </Button>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">
            Back to Sign In
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
