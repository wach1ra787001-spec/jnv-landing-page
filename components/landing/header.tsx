'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="font-mono text-sm font-bold text-primary-foreground">JNV</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            JNV <span className="text-primary">| PRO</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 lg:flex">
          <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="#analytics" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Analytics
          </Link>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="outline" size="sm" asChild className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary font-medium">
            <Link href="/onboarding/choose-plan">View Pricing</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">Start Free Trial</Link>
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-border/50 bg-background lg:hidden">
          <div className="flex flex-col gap-4 px-6 py-6">
            <Link 
              href="#features" 
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#analytics" 
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Analytics
            </Link>
            <div className="flex flex-col gap-3 pt-4">
              <Button variant="outline" asChild className="w-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary font-medium">
                <Link href="/onboarding/choose-plan" onClick={() => setMobileMenuOpen(false)}>View Pricing</Link>
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/auth/sign-up">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
