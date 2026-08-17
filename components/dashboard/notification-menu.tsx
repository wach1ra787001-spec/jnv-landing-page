"use client"

import { useState } from "react"
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

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "milestone",
    title: "Milestone Achieved!",
    message: "You've reached 20 consecutive profitable days! 🎉",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "rule",
    title: "Rule Breach Alert",
    message: 'You took 4 trades today. Your "Max 3 Trades Per Day" rule was broken.',
    timestamp: "4 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "goal",
    title: "Goal Progress",
    message: "Monthly Profit Target: You're at 87% progress ($1,750 / $2,000). Keep going!",
    timestamp: "1 day ago",
    read: true,
  },
  {
    id: "4",
    type: "milestone",
    title: "Win Rate Milestone",
    message: "Your win rate reached 70%! You've achieved your target.",
    timestamp: "2 days ago",
    read: true,
  },
]

export function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "goal":
        return <Target className="w-4 h-4 text-blue-500" />
      case "rule":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "milestone":
        return <Star className="w-4 h-4 text-green-500" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Menu */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <Card className="absolute right-0 top-12 w-96 bg-card border-border shadow-lg z-50 p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {/* Icon */}
                    <div className="mt-1">{getIcon(notification.type)}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={cn(
                          "text-sm font-medium",
                          !notification.read ? "text-foreground font-semibold" : "text-muted-foreground"
                        )}>
                          {notification.title}
                        </p>
                        <button
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setNotifications([])}
                >
                  Clear All
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
