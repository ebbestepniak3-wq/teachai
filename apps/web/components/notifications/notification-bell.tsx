'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatDateTime } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

const typeIcons: Record<string, string> = {
  GRADING_DONE: '✅',
  GRADING_FAILED: '❌',
  SUBSCRIPTION_RENEWED: '💳',
  SUBSCRIPTION_EXPIRED: '⚠️',
  QUOTA_WARNING: '⚡',
  SECURITY_ALERT: '🔐',
  SYSTEM: '📢',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.data.notifications)
      setUnreadCount(data.data.unreadCount)
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function markAllRead() {
    setLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  async function deleteAll() {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      setNotifications([])
      setUnreadCount(0)
    } catch {}
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(!open)}
        className="relative"
        aria-label={`Benachrichtigungen${unreadCount > 0 ? ` (${unreadCount} ungelesen)` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Benachrichtigungen</p>
                {unreadCount > 0 && (
                  <Badge variant="brand" className="text-[10px]">{unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="icon-sm" onClick={markAllRead} title="Alle gelesen">
                    <CheckCheck className="h-3.5 w-3.5" />
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button variant="ghost" size="icon-sm" onClick={deleteAll} title="Alle löschen"
                    className="text-muted-foreground/50 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">Keine Benachrichtigungen</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex gap-3 border-b border-border p-4 transition-colors hover:bg-accent/50 cursor-pointer last:border-0',
                      !n.isRead && 'bg-brand-500/5'
                    )}
                    onClick={async () => {
                      if (!n.isRead) {
                        await fetch('/api/notifications', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ids: [n.id] }),
                        })
                        setNotifications((prev) =>
                          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
                        )
                        setUnreadCount((c) => Math.max(0, c - 1))
                      }
                      if (n.link) window.location.href = n.link
                    }}
                  >
                    <div className="shrink-0 text-lg">{typeIcons[n.type] || '📢'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-xs font-medium', !n.isRead && 'text-foreground')}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
