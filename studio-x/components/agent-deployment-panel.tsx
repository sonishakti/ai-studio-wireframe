"use client"

import * as React from "react"
import Link from "next/link"
import {
  Phone, Globe, MessageCircle, MessageSquare, Hash, Code2,
  ArrowRight, CheckCircle2, Clock, Sparkles, MoreHorizontal,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ─── channel deployment state per agent ─────────────────────────────────────
//
// Multi-channel by design — an agent can be deployed simultaneously on
// Telephony (inbound), Telephony (outbound campaigns), Web Widget, WhatsApp,
// SMS, Slack, and Direct API. The panel shows each row independently so
// users can see "where is this agent answering right now?" at a glance.

type ChannelKind =
  | "telephony-inbound" | "telephony-outbound" | "widget"
  | "whatsapp" | "sms" | "slack" | "api"

type ChannelState = {
  id: ChannelKind
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  /** Set up but not active */
  configured: boolean
  /** Currently routing traffic */
  active: boolean
  /** One-liner status when active */
  detail?: string
  setupHref: string
}

const INITIAL: ChannelState[] = [
  { id: "telephony-inbound",  label: "Telephony · Inbound",  icon: Phone,          color: "bg-blue-500",    configured: true,  active: true,  detail: "+1 (415) 555-0101 — Support Line", setupHref: "/deploy/telephony" },
  { id: "telephony-outbound", label: "Telephony · Outbound", icon: Phone,          color: "bg-blue-500",    configured: true,  active: true,  detail: "Q2 Win-Back campaign · 3,421 / 5,000 dialed", setupHref: "/telephony/campaigns" },
  { id: "widget",             label: "Web Widget",           icon: Globe,          color: "bg-violet-500",  configured: true,  active: false, detail: "acme.com — paused",                setupHref: "/deploy/widget" },
  { id: "whatsapp",           label: "WhatsApp",             icon: MessageCircle,  color: "bg-green-500",   configured: false, active: false,                                              setupHref: "/deploy/whatsapp" },
  { id: "sms",                label: "SMS",                  icon: MessageSquare,  color: "bg-emerald-500", configured: false, active: false,                                              setupHref: "/deploy/sms" },
  { id: "api",                label: "Direct API",           icon: Code2,          color: "bg-zinc-500",    configured: true,  active: true,  detail: "Embedded in iOS app · 12 active sessions", setupHref: "/deploy/api" },
  { id: "slack",              label: "Slack",                icon: Hash,           color: "bg-pink-500",    configured: false, active: false,                                              setupHref: "/deploy/slack" },
]

// ─── component ───────────────────────────────────────────────────────────────

export function AgentDeploymentPanel({ agentId }: { agentId: string }) {
  const [channels, setChannels] = React.useState(INITIAL)

  const toggle = (id: ChannelKind) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, active: !c.active }
          : c,
      ),
    )
    const c = channels.find((x) => x.id === id)
    if (c) {
      toast.success(c.active ? `${c.label} paused` : `${c.label} live`, {
        description: c.active
          ? "No new traffic will route here until you re-enable it."
          : "Calls and sessions now routing to this agent.",
      })
    }
  }

  const activeCount = channels.filter((c) => c.active).length
  const configuredCount = channels.filter((c) => c.configured).length

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header — summary */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Deployments</p>
              <p className="text-xs text-muted-foreground">
                {activeCount > 0 ? (
                  <>
                    <span className="text-emerald-600 font-medium">{activeCount} active</span>
                    {" · "}
                    {configuredCount - activeCount > 0 && <>{configuredCount - activeCount} paused · </>}
                    {channels.length - configuredCount} not set up
                  </>
                ) : (
                  "Not yet deployed — pick a channel below to take this agent live."
                )}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/deploy">Browse channels</Link>
          </Button>
        </div>

        {/* Channel rows */}
        <ul className="divide-y">
          {channels.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              {/* Icon */}
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-md text-white shrink-0", c.color)}>
                <c.icon className="h-3.5 w-3.5" />
              </div>

              {/* Label + detail */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{c.label}</p>
                  {c.active && (
                    <Badge variant="default" className="text-[9px] h-4 px-1.5 gap-0.5">
                      <span className="h-1 w-1 rounded-full bg-emerald-300" />
                      Live
                    </Badge>
                  )}
                  {c.configured && !c.active && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">Paused</Badge>
                  )}
                </div>
                {c.detail ? (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.detail}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Not set up yet</p>
                )}
              </div>

              {/* Action */}
              {c.configured ? (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={c.active}
                    onCheckedChange={() => toggle(c.id)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={c.setupHref}>Configure</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>View logs</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1" asChild>
                  <Link href={c.setupHref}>
                    Set up <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>

        {/* Footer tip */}
        <div className="px-4 py-3 border-t bg-muted/30 text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>
            Same agent, multiple channels. Inbound + outbound + chat can run simultaneously — each
            channel maintains its own session state.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
