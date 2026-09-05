"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Laptop, Smartphone, Monitor } from "lucide-react"

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
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

  const handlePasswordChange = async () => {
    const response = await fetch("/api/security/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new, confirmPassword: passwords.confirm }) })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      alert(result.error || "Unable to update password")
      return
    }
    setPasswords({ current: "", new: "", confirm: "" })
    alert("Password updated")
  }

  const handleEndSession = async (sessionId: string) => {
    try {
      const response = await fetch("/api/security/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) })
      if (!response.ok) throw new Error("Unable to end session")
      await loadSessions()
    } catch (error) {
      console.error("Error ending session:", error)
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
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Update your password to keep your account secure
          </p>
        </div>

        <div className="space-y-4 max-w-md">
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

          <Button onClick={handlePasswordChange} className="mt-2">
            Update Password
          </Button>
        </div>
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
