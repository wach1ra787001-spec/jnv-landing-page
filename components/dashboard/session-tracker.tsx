"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const SESSION_KEY = "jnv:browser-session-id"

function getBrowserDetails() {
  const userAgent = navigator.userAgent
  const platform = navigator.platform || "Unknown OS"
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent)
  const browser = /Edg\//.test(userAgent) ? "Microsoft Edge" : /Chrome\//.test(userAgent) ? "Google Chrome" : /Firefox\//.test(userAgent) ? "Mozilla Firefox" : /Safari\//.test(userAgent) ? "Safari" : "Browser"
  const os = /Windows/i.test(platform) ? "Windows" : /Mac/i.test(platform) ? "macOS" : /Android/i.test(platform) ? "Android" : /iPhone|iPad|iPod/i.test(userAgent) ? "iOS" : /Linux/i.test(platform) ? "Linux" : platform

  return {
    sessionId: sessionStorage.getItem(SESSION_KEY) ?? (() => {
      const id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
      return id
    })(),
    deviceName: isMobile ? "Mobile device" : "Desktop computer",
    browser,
    os,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    language: navigator.language || null,
    screen: `${window.screen.width}x${window.screen.height}`,
    referrer: document.referrer || null,
  }
}

export function SessionTracker() {
  useEffect(() => {
    const browserDetails = getBrowserDetails()
    const supabase = createClient()
    let stopped = false

    const register = async () => {
      try {
        await fetch("/api/security/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(browserDetails),
          keepalive: true,
        })
      } catch {
        // Session telemetry should never interrupt dashboard use.
      }
    }

    const checkSession = async () => {
      try {
        const response = await fetch(`/api/security/sessions?sessionId=${encodeURIComponent(browserDetails.sessionId)}`, { cache: "no-store" })
        if (!response.ok || stopped) return
        const result = await response.json()
        if (result.ended) {
          stopped = true
          await supabase.auth.signOut()
          window.location.assign("/auth/login?reason=session-ended")
        }
      } catch {
        // A temporary network failure should not sign the user out.
      }
    }

    void register()
    const interval = window.setInterval(() => void checkSession(), 15000)
    return () => {
      stopped = true
      window.clearInterval(interval)
    }
  }, [])

  return null
}
