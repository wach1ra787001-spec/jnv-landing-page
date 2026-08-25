"use client"

import { useEffect, useState } from "react"
import { Bell, X, Target, AlertCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "goal" | "rule" | "milestone"
  title: string
  message: string
  timestamp: string
  read: boolean
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return "Recently"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch(`/api/notifications?ts=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } })
      .then((response) => response.ok ? response.json() : { notifications: [] })
      .then((data) => { if (active) { setNotifications(Array.isArray(data.notifications) ? data.notifications : []); setLoading(false) } })
      .catch(() => { if (active) { setNotifications([]); setLoading(false) } })
    return () => { active = false }
  }, [])

  const unreadCount = notifications.filter((notification) => !notification.read).length
  const markAsRead = (id: string) => setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, read: true } : notification))
  const deleteNotification = (id: string) => setNotifications((current) => current.filter((notification) => notification.id !== id))
  const getIcon = (type: Notification["type"]) => type === "goal" ? <Target className="w-4 h-4 text-blue-500" /> : type === "rule" ? <AlertCircle className="w-4 h-4 text-yellow-500" /> : <Star className="w-4 h-4 text-green-500" />

  return <div className="relative">
    <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen((open) => !open)} aria-label="Notifications">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount}</span>}
    </Button>
    {isOpen && <><div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} /><Card className="absolute right-0 top-12 w-96 bg-card border-border shadow-lg z-50 p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border"><h3 className="font-semibold text-foreground">Notifications</h3><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)} aria-label="Close notifications"><X className="w-4 h-4" /></Button></div>
      <div className="max-h-96 overflow-y-auto divide-y divide-border">{loading ? <div className="p-8 text-center"><p className="text-muted-foreground text-sm">Loading notifications…</p></div> : notifications.length === 0 ? <div className="p-8 text-center"><p className="text-muted-foreground text-sm">No notifications yet</p></div> : notifications.map((notification) => <div key={notification.id} className={cn("p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3", !notification.read && "bg-primary/5")} onClick={() => markAsRead(notification.id)}><div className="mt-1">{getIcon(notification.type)}</div><div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-2 mb-1"><p className={cn("text-sm font-medium", !notification.read ? "text-foreground font-semibold" : "text-muted-foreground")}>{notification.title}</p><button className="text-muted-foreground hover:text-foreground" onClick={(event) => { event.stopPropagation(); deleteNotification(notification.id) }} aria-label={`Delete ${notification.title}`}><X className="w-3 h-3" /></button></div><p className="text-xs text-muted-foreground mb-2">{notification.message}</p><p className="text-xs text-muted-foreground">{formatTimestamp(notification.timestamp)}</p></div>{!notification.read && <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />}</div>)}</div>
      {notifications.length > 0 && <div className="p-3 border-t border-border"><Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setNotifications([])}>Clear All</Button></div>}
    </Card></>}
  </div>
}
