import { Bot, PhoneCall, ArrowRight, Zap, Plus } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ActivationChecklist } from "@/components/activation-checklist"

const QUICK_ACTIONS = [
  { label: "Create Agent", href: "/agents", icon: Bot, description: "Build a new voice AI agent" },
  { label: "Add Phone Number", href: "/telephony/phone-numbers", icon: PhoneCall, description: "Import a DID number" },
  { label: "Start Campaign", href: "/telephony/campaigns/create", icon: Zap, description: "Launch an outbound campaign" },
]

const RECENT_AGENTS = [
  { name: "Support Bot v2", status: "live", calls: 1243, lastActive: "2 min ago" },
  { name: "Sales Qualifier", status: "draft", calls: 0, lastActive: "Yesterday" },
  { name: "Appointment Setter", status: "live", calls: 327, lastActive: "5 min ago" },
]

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Home" }]}
        title="Good morning 👋"
        description="Here's what's happening in your project."
        actions={
          <Button asChild>
            <Link href="/agents">
              <Plus className="h-4 w-4" /> New Agent
            </Link>
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Activation checklist — auto-hides when complete or dismissed */}
        <ActivationChecklist />

        {/* Metrics row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Active Agents", value: "3", delta: "+1 this week" },
            { label: "Calls Today", value: "842", delta: "+12% vs yesterday" },
            { label: "Avg Handle Time", value: "2m 14s", delta: "-8s vs last week" },
            { label: "Completion Rate", value: "87%", delta: "+3pp vs last week" },
          ].map((m) => (
            <Card key={m.label}>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs">{m.label}</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-semibold tracking-tight">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.delta}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick actions */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  <a.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-none">{a.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.description}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent agents */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Recent Agents</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                <Link href="/agents">View all <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-0">
              {RECENT_AGENTS.map((agent, i) => (
                <div
                  key={agent.name}
                  className={`flex items-center gap-4 py-3 text-sm ${
                    i < RECENT_AGENTS.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-none truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{agent.lastActive}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium tabular-nums">{agent.calls.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">calls</p>
                  </div>
                  <Badge
                    variant={agent.status === "live" ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {agent.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
