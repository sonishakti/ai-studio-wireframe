import { Code2, ExternalLink, Key, Webhook, Wrench, ScrollText, Lock } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const DEVELOPER_SECTIONS = [
  {
    title: "RESTful API",
    description: "HTTP API for managing agents, campaigns, credentials, and more.",
    href: "/developer/restful-api",
    icon: Code2,
    badge: "v2",
  },
  {
    title: "Webhooks",
    description: "Receive real-time events for calls, agent status changes, and errors.",
    href: "/developer/webhooks",
    icon: Webhook,
    badge: null,
  },
  {
    title: "Audit Logs",
    description: "Track every API call, config change, and user action in your project.",
    href: "/developer/audit-logs",
    icon: ScrollText,
    badge: null,
  },
  {
    title: "SDK Toolkit",
    description: "Download SDKs, sample apps, and integration guides.",
    href: "/developer/toolkit",
    icon: Wrench,
    badge: null,
  },
  {
    title: "Service Accounts",
    description: "Server-to-server credentials. Keep these out of client code.",
    href: "/developer/aa-credentials",
    icon: Key,
    badge: null,
  },
  {
    title: "Licensing",
    description: "Manage feature licenses and usage entitlements.",
    href: "/developer/licensing",
    icon: Lock,
    badge: null,
  },
]

export default function DeveloperPage() {
  return (
    <main className="flex-1 p-6 space-y-5">
      <div className="flex items-center justify-end">
        <Button variant="outline" className="gap-1.5" asChild>
          <a href="https://docs.agora.io" target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Open full docs
          </a>
        </Button>
      </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEVELOPER_SECTIONS.map((s) => (
            <Card key={s.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {s.badge && <Badge variant="secondary">{s.badge}</Badge>}
                </div>
                <CardTitle className="text-sm mt-2">{s.title}</CardTitle>
                <CardDescription className="text-xs">{s.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={s.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>
    </main>
  )
}
