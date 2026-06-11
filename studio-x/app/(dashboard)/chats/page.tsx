"use client"

import * as React from "react"
import Link from "next/link"
import { MessageCircle, MessageSquare, Globe, Search, Download } from "lucide-react"
import { MonitorNav } from "@/components/monitor-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { DEPLOYMENTS, getDeployment, deploymentHref } from "@/lib/campaign-data"
import { cn } from "@/lib/utils"
import { track, Events } from "@/lib/analytics"

// ─── text-channel conversation history ──────────────────────────────────────
// The text counterpart to Call History — WhatsApp / SMS / web-widget chats.

type ChatChannel = "whatsapp" | "sms" | "web"
type ChatStatus = "Resolved" | "Transferred" | "Abandoned" | "Active"

interface ChatMsg { role: "Customer" | "Agent"; text: string }
interface ChatRow {
  id: string
  channel: ChatChannel
  direction: "in" | "out"
  contact: string
  agent: string
  campaignId: string
  campaignName: string
  messages: number
  status: ChatStatus
  lastActivity: string
  transcript: ChatMsg[]
}

const CHANNEL_META: Record<ChatChannel, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  sms: { label: "SMS", icon: MessageSquare },
  web: { label: "Web widget", icon: Globe },
}
const STATUS_VARIANT: Record<ChatStatus, "default" | "secondary" | "outline" | "destructive"> = {
  Resolved: "default", Transferred: "secondary", Active: "outline", Abandoned: "destructive",
}
const CONTACTS = ["+1 (555) 234-5678", "+1 (628) 555-1077", "+44 7700 900123", "web-visitor-4821", "+1 (212) 555-8801"]
const STATUSES: ChatStatus[] = ["Resolved", "Transferred", "Active", "Abandoned"]

function generate(): ChatRow[] {
  const rows: ChatRow[] = []
  let n = 1
  for (const c of DEPLOYMENTS) {
    // only text-capable channels
    const textChannels = [c.channel].filter((ch) => ch.kind === "whatsapp" || ch.kind === "sms" || ch.kind === "web")
    if (textChannels.length === 0) continue
    for (const ch of textChannels) {
      const status = STATUSES[n % STATUSES.length]
      rows.push({
        id: `CHAT${(2000 + n).toString(36).toUpperCase()}`,
        channel: ch.kind as ChatChannel,
        direction: c.kind === "inbound" ? "in" : "out",
        contact: CONTACTS[n % CONTACTS.length],
        agent: c.agentName ?? "Dynamic Agent",
        campaignId: c.id,
        campaignName: c.name,
        messages: 3 + (n % 9),
        status,
        lastActivity: `${(n % 23) + 1}h ago`,
        transcript: [
          { role: "Customer", text: "Hi, I have a question about my recent order." },
          { role: "Agent", text: `Happy to help! Can you share your order number?` },
          { role: "Customer", text: "It's #48213." },
          { role: "Agent", text: status === "Transferred" ? "Let me bring in a specialist to help with that." : "Thanks — your order ships tomorrow. Anything else?" },
        ],
      })
      n++
    }
  }
  return rows
}

const CHATS = generate()

export default function ChatHistoryPage() {
  const [query, setQuery] = React.useState("")
  const [channel, setChannel] = React.useState<"all" | ChatChannel>("all")
  const [selected, setSelected] = React.useState<ChatRow | null>(null)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    track(Events.chats_viewed)
  }, [])

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return CHATS.filter((c) => {
      if (channel !== "all" && c.channel !== channel) return false
      if (q && !c.contact.toLowerCase().includes(q) && !c.campaignName.toLowerCase().includes(q) && !c.agent.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, channel])

  return (
    <div className="flex flex-col flex-1">
      <MonitorNav action={<Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>} />

      <main className="flex-1 p-6 pt-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by contact, campaign or agent…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8 h-9 text-sm" />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
            {([["all", "All"], ["whatsapp", "WhatsApp"], ["sms", "SMS"], ["web", "Web"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setChannel(v)}
                className={"rounded px-2.5 h-7 text-xs font-medium transition-colors " + (channel === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => {
                  const M = CHANNEL_META[c.channel]
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => { setSelected(c); setOpen(true) }}>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <M.icon className="h-3.5 w-3.5 text-muted-foreground" /> {M.label}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.contact}</TableCell>
                      <TableCell className="text-sm">{c.agent}</TableCell>
                      <TableCell>
                        <Link href={getDeployment(c.campaignId) ? deploymentHref(getDeployment(c.campaignId)!) : "/deploy"} onClick={(e) => e.stopPropagation()} className="text-sm text-primary hover:underline">{c.campaignName}</Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{c.messages}</TableCell>
                      <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{c.lastActivity}</TableCell>
                    </TableRow>
                  )
                })}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No conversations match.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Chat detail sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-[480px] w-full overflow-y-auto p-0">
          <SheetHeader className="px-5 py-4 border-b border-border">
            <SheetTitle>Conversation</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-2.5 text-sm">
                <Row label="Conversation ID" value={selected.id} />
                <Row label="Channel" value={CHANNEL_META[selected.channel].label} />
                <Row label="Contact" value={selected.contact} />
                <Row label="Agent" value={selected.agent} />
                <Row label="Campaign" value={selected.campaignName} />
                <Row label="Status" value={selected.status} />
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-semibold">Transcript</p>
                <div className="space-y-2">
                  {selected.transcript.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === "Customer" ? "justify-start" : "justify-end")}>
                      <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", m.role === "Customer" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground")}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  )
}
