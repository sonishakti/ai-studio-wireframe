import { Bell, Check, CheckCheck } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const NOTIFICATIONS = [
  {
    id: "n_01",
    title: "Campaign Q2 Win-Back reached 50% completion",
    body: "3,421 of 6,842 contacts have been reached. Estimated completion: May 28, 2026.",
    type: "campaign",
    read: false,
    time: "2 min ago",
  },
  {
    id: "n_02",
    title: "Agent 'Support Bot v2' encountered 12 errors",
    body: "Repeated timeouts on OpenAI API. Check your vendor credentials and rate limits.",
    type: "error",
    read: false,
    time: "18 min ago",
  },
  {
    id: "n_03",
    title: "You've used 80% of your free minute allowance",
    body: "You have 40 minutes remaining this month. Upgrade to Pro for unlimited minutes.",
    type: "usage",
    read: false,
    time: "1 hour ago",
  },
  {
    id: "n_04",
    title: "New extension available: Sentiment Analysis",
    body: "DeepAffects Sentiment Analysis is now available in the Extensions Marketplace.",
    type: "product",
    read: true,
    time: "Yesterday",
  },
  {
    id: "n_05",
    title: "Campaign Renewal Reminder completed",
    body: "2,800 contacts reached. Success rate: 31%. View the full report in Monitor.",
    type: "campaign",
    read: true,
    time: "May 22, 2026",
  },
]

const TYPE_COLORS: Record<string, string> = {
  campaign: "bg-blue-500/10 text-blue-600",
  error: "bg-destructive/10 text-destructive",
  usage: "bg-amber-500/10 text-amber-600",
  product: "bg-emerald-500/10 text-emerald-600",
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
  const unread = NOTIFICATIONS.filter((n) => !n.read)
  const all = NOTIFICATIONS

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Notifications" }]}
        title="Notifications"
        description="Stay up to date with your agents, campaigns, and account."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
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
