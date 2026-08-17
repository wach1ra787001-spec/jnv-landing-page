'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordSentPage() {
  const router = useRouter()
  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    // Auto-redirect after 10 seconds if user doesn't interact
    const timer = setTimeout(() => {
      router.push('/auth/login')
    }, 10000)

    return () => clearTimeout(timer)
  }, [router])

  useEffect(() => {
    if (resendCountdown <= 0) return

    const timer = setTimeout(() => {
      setResendCountdown(resendCountdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [resendCountdown])

  const handleResend = async () => {
    // Redirect back to forgot password form
    router.push('/auth/forgot-password')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a password reset link to your email address. Click the link in the email to reset your password.
            </p>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">What to do next:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 text-left">
              <li>1. Open your email inbox</li>
              <li>2. Look for an email from us</li>
              <li>3. Click the password reset link</li>
              <li>4. Enter your new password</li>
            </ol>
          </div>

          <div className="space-y-2 pt-4">
            <p className="text-xs text-muted-foreground">
              Don&apos;t see the email? Check your spam or junk folder.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleResend}
            disabled={resendCountdown > 0}
            className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg transition-colors"
          >
            {resendCountdown > 0
              ? `Resend Email in ${resendCountdown}s`
              : 'Didn\'t receive the email? Resend'}
          </Button>

          <Link href="/auth/login">
            <Button
              variant="outline"
              className="w-full h-10 border border-border hover:bg-muted font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          The reset link will expire in 24 hours for security reasons.
        </p>
      </div>
    </div>
  )
}
