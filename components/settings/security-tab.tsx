"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Laptop, Smartphone, Monitor } from "lucide-react"

interface SecurityEvent {
  id: string
  event_type: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface Session {
  id: string
  device_name: string
  browser: string
  os: string
  city: string
  country: string
  last_seen_at: string
  logged_in_at: string
  logged_out_at: string | null
  is_current: boolean
  session_id: string
}

const getDeviceIcon = (deviceName: string, os: string) => {
  if (os?.includes("Android") || os?.includes("iOS")) return Smartphone
  if (os?.includes("Windows") || os?.includes("Mac") || os?.includes("Linux")) return Laptop
  return Monitor
}

const formatTimeAgo = (dateString: string | null) => {
  if (!dateString) return "Never"
  
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return date.toLocaleDateString()
}

export function SecurityTab() {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })
  const [sessions, setSessions] = useState<Session[]>([])
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    loadSessions()
    loadEvents()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/security/sessions", { cache: "no-store" })
      if (!response.ok) throw new Error("Unable to load sessions")
      setSessions(await response.json())
    } catch (error) {
      console.error("Error in loadSessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await fetch("/api/security/events", { cache: "no-store" })
      if (!response.ok) throw new Error("Unable to load security activity")
      setEvents(await response.json())
    } catch (error) {
      console.error("Error loading security activity:", error)
    }
  }

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordStatus(null)
    setPasswordError(null)
    setSavingPassword(true)
    try {
      const response = await fetch("/api/security/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new, confirmPassword: passwords.confirm }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setPasswordError(result.error || "Unable to update password")
        return
      }
      setPasswords({ current: "", new: "", confirm: "" })
      setPasswordStatus("Password updated successfully.")
    } catch {
      setPasswordError("Unable to update password. Please try again.")
    } finally {
      setSavingPassword(false)
    }
  }

  const handleEndSession = async (sessionId: string) => {
    try {
      setActionError(null)
      const response = await fetch("/api/security/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) })
      if (!response.ok) throw new Error("Unable to end session")
      await loadSessions()
    } catch (error) {
      console.error("Error ending session:", error)
      setActionError("Unable to end that session. Please try again.")
    }
  }

  const handleLogoutOtherDevices = async () => {
    try {
      const response = await fetch("/api/security/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allOther: true }) })
      if (!response.ok) throw new Error("Unable to end other sessions")
      await loadSessions()
    } catch (error) {
      console.error("Error logging out other devices:", error)
    }
  }

  const activeSessions = sessions.filter(s => !s.logged_out_at)
  const historySessions = sessions.filter(s => s.logged_out_at)

  return (
    <div className="space-y-8">
      {/* Change Password Section */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl md:max-w-md space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Update your password to keep your account secure
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              placeholder="Enter current password"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              placeholder="Enter new password"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              placeholder="Confirm new password"
              className="bg-background"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" className="mt-2" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update Password"}
            </Button>
            {passwordStatus && <p className="text-sm text-chart-1" role="status">{passwordStatus}</p>}
            {passwordError && <p className="text-sm text-destructive" role="alert">{passwordError}</p>}
          </div>
        </form>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h4 className="text-sm font-semibold text-foreground whitespace-nowrap">Security Activity</h4>
          <div className="flex-1 h-px bg-border" />
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent security activity.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{event.event_type.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{event.user_agent || "Unknown device"}{event.ip_address ? ` • ${event.ip_address}` : ""}</p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={event.created_at}>{formatTimeAgo(event.created_at)}</time>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Sessions Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h4 className="text-sm font-semibold text-foreground whitespace-nowrap">
            Active Sessions
          </h4>
          <div className="flex-1 h-px bg-border" />
          {activeSessions.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogoutOtherDevices}
            >
              Log Out Other Devices
            </Button>
          )}
        </div>

        {actionError && <p className="text-sm text-destructive" role="alert">{actionError}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        ) : activeSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions</p>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session.device_name, session.os)
              return (
                <div key={session.id} className="border border-border rounded-lg p-4 bg-background">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <DeviceIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {session.device_name}
                            {session.browser && ` • ${session.browser}`}
                          </p>
                          {session.is_current && (
                            <span className="text-xs bg-chart-1/20 text-chart-1 px-2 py-1 rounded">
                              Current Device
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {session.os}
                          {session.city && ` • ${session.city}, ${session.country}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last active: {formatTimeAgo(session.last_seen_at)}
                        </p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleEndSession(session.id)}
                      >
                        End
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Session History Section */}
      {historySessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-semibold text-foreground whitespace-nowrap">
              Session History
            </h4>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            {historySessions.slice(0, 5).map((session) => {
              const DeviceIcon = getDeviceIcon(session.device_name, session.os)
              return (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                  <div className="flex items-center gap-2">
                    <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{session.device_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.os}
                        {session.city && ` • ${session.city}`}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(session.logged_out_at)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
