"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { getAppOrigin, isProductionDomainHost } from "@/lib/domain-routing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [honeypot, setHoneypot] = useState("")
  const supabase = createClient()

  useEffect(() => {
    setStartedAt(Date.now())
  }, [])

  const handleOAuth = async (provider: "google" | "apple") => {
    setIsLoading(true)
    setError(null)
    const authOrigin = isProductionDomainHost(window.location.hostname)
      ? getAppOrigin(window.location.hostname)
      : window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${authOrigin}/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      setError("Unable to continue with that provider. Please try again.")
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (honeypot || startedAt === null || Date.now() - startedAt < 900) {
      setError("Please wait a moment and try again.")
      return
    }

    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    const appOrigin = isProductionDomainHost(window.location.hostname)
      ? getAppOrigin(window.location.hostname)
      : window.location.origin
    window.location.assign(`${appOrigin}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-8 gap-4">
          <div className="w-20 h-20 relative">
            <Image
              src="/logo-jnv.png"
              alt="JnV Journal Logo"
              width={80}
              height={80}
              className="rounded object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">JnV Journal</h1>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-card-foreground">Welcome back</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Sign in to access your trading dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <label htmlFor="website" className="sr-only">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" aria-hidden="true" />
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="trader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-input border-border text-foreground pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Button type="button" variant="outline" className="h-11 w-full justify-center gap-2 px-6" disabled={isLoading} onClick={() => handleOAuth("google")}>
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-wV4xTH63QeoIXgCwNBH44RRkGqYW7o.png"
                  alt=""
                  aria-hidden="true"
                  className="h-5 w-5 object-contain"
                />
                Continue with Google
              </Button>
              <Button type="button" variant="outline" className="h-11 w-full justify-center gap-2 px-6" disabled={isLoading} onClick={() => handleOAuth("apple")}>
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7IZzYpCJq3WKbN5Tv22PiYTJ2sTQ3h.png"
                  alt=""
                  aria-hidden="true"
                  className="h-5 w-5 object-contain"
                />
                Continue with Apple
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Link href="/auth/sign-up" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By signing in, you agree to our <Link href="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
