"use client"

import * as React from "react"
import { Bell, CheckCheck } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { NOTIFICATIONS } from "@/lib/notifications-data"


const TYPE_COLORS: Record<string, string> = {
  campaign: "bg-primary/10 text-primary",
  error: "bg-destructive/10 text-destructive",
  usage: "bg-warning/10 text-warning",
  product: "bg-success/10 text-success",
}

function NotificationList({ items }: { items: typeof NOTIFICATIONS }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
        <Bell className="h-8 w-8" />
        <p className="text-sm">No notifications</p>
      </div>
    )
  }
  return (
    <div className="divide-y">
      {items.map((n) => (
        <div
          key={n.id}
          className={`flex gap-3 px-4 py-4 ${!n.read ? "bg-muted/30" : ""}`}
        >
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              TYPE_COLORS[n.type] ?? "bg-muted"
            }`}
          >
            <Bell className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${!n.read ? "font-medium" : "text-muted-foreground"}`}>
              {n.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
            <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
          </div>
          {!n.read && (
            <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
      ))}
    </div>
  )
}

export default function NotificationsPage() {
  const [items, setItems] = React.useState(NOTIFICATIONS)
  const unread = items.filter((n) => !n.read)
  const all = items

  const markAllRead = () => {
    if (unread.length === 0) return
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success("All notifications marked as read")
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Notifications" }]}
        title="Notifications"
        description="Stay up to date with your agents, campaigns, and account."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={markAllRead}
            disabled={unread.length === 0}
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        }
      />

      <main className="flex-1 p-6">
        <Tabs defaultValue="unread">
          <TabsList>
            <TabsTrigger value="unread">
              Unread
              {unread.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">
                  {unread.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="unread" className="mt-3">
            <Card>
              <CardContent className="p-0">
                <NotificationList items={unread} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="all" className="mt-3">
            <Card>
              <CardContent className="p-0">
                <NotificationList items={all} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
