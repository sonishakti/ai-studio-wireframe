"use client"

import * as React from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import { CampaignChannelBadges } from "@/components/campaign-channel-badges"
import { DeployNav } from "@/components/deploy-nav"
import { CAMPAIGNS, STATUS_BADGE, type Campaign } from "@/lib/campaign-data"
import { cn } from "@/lib/utils"

// Campaigns organized by the channel a deployment runs on. Inbound/Outbound are
// the two voice (telephony) directions; WhatsApp and Web are the other channels.
// A campaign can appear under several tabs (omnichannel). Empty tabs offer a
// configure CTA so a channel can be set up from here.
type ChannelTab = "all" | "inbound" | "outbound" | "whatsapp" | "web"

const CHANNEL_TABS: {
  key: ChannelTab
  label: string
  match: (c: Campaign) => boolean
  configureHref?: string
  configureLabel?: string
}[] = [
  { key: "all", label: "All", match: () => true },
  {
    key: "inbound", label: "Inbound",
    match: (c) => c.channels.some((ch) => ch.kind === "telephony" && ch.direction === "in"),
    configureHref: "/campaigns/new?type=inbound", configureLabel: "Set up an inbound campaign",
  },
  {
    key: "outbound", label: "Outbound",
    match: (c) => c.channels.some((ch) => ch.kind === "telephony" && ch.direction === "out"),
    configureHref: "/campaigns/new?type=outbound", configureLabel: "Set up an outbound campaign",
  },
  {
    key: "whatsapp", label: "WhatsApp",
    match: (c) => c.channels.some((ch) => ch.kind === "whatsapp"),
    configureHref: "/campaigns/new", configureLabel: "Add a WhatsApp channel",
  },
  {
    key: "web", label: "Web",
    match: (c) => c.channels.some((ch) => ch.kind === "web"),
    configureHref: "/campaigns/new?type=inbound", configureLabel: "Add a web chat widget",
  },
]

export default function CampaignsPage() {
  const [tab, setTab] = React.useState<ChannelTab>("all")
  const [query, setQuery] = React.useState("")

  const activeTab = CHANNEL_TABS.find((t) => t.key === tab)!
  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return CAMPAIGNS.filter((c) => {
      if (!activeTab.match(c)) return false
      if (q && !c.name.toLowerCase().includes(q) && !(c.agentName ?? "").toLowerCase().includes(q)) return false
      return true
    })
  }, [activeTab, query])

  return (
    <div className="flex flex-col flex-1">
      <DeployNav />
      {/* Header + channel tabs */}
      <div className="border-b bg-background px-6">
        <div className="flex items-center justify-between gap-3 pt-4">
          <h1 className="text-xl font-semibold tracking-tight">Campaigns</h1>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/campaigns/new"><Plus className="h-4 w-4" /> New campaign</Link>
          </Button>
        </div>
        <nav className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto">
          {CHANNEL_TABS.map((t) => {
            const count = CAMPAIGNS.filter(t.match).length
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  tab === t.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <main className="flex-1 p-6 pt-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search campaigns…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
        </div>

        {rows.length === 0 && activeTab.configureHref && !query ? (
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <p className="text-sm font-medium">No {activeTab.label} deployments yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Configure this channel to start running {activeTab.label.toLowerCase()} conversations.
              </p>
              <Button size="sm" className="gap-1.5" asChild>
                <Link href={activeTab.configureHref}><Plus className="h-4 w-4" /> {activeTab.configureLabel}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="w-[48px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <CampaignRow key={c.id} campaign={c} />
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                        No campaigns match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function CampaignRow({ campaign: c }: { campaign: Campaign }) {
  const s = STATUS_BADGE[c.status]
  const TypeIcon = c.type === "inbound" ? PhoneIncoming : PhoneOutgoing
  const pct =
    c.progress && c.progress.total > 0
      ? Math.round((c.progress.completed / c.progress.total) * 100)
      : null

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/campaigns/${c.id}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {c.name}
        </Link>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <TypeIcon className="h-3 w-3" />
          {c.type === "inbound" ? "Inbound" : "Outbound"}
        </span>
      </TableCell>
      <TableCell>
        <CampaignChannelBadges channels={c.channels} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {c.agentName ?? <span className="italic">Dynamic</span>}
      </TableCell>
      <TableCell>
        <Badge variant={s.variant}>{s.label}</Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm">
        {c.metrics.calls > 0 ? c.metrics.calls.toLocaleString() : "—"}
      </TableCell>
      <TableCell className="min-w-[140px]">
        {pct !== null ? (
          <>
            <Progress value={pct} className="h-1.5 w-28" />
            <p className="text-xs text-muted-foreground tabular-nums mt-1">
              {c.progress!.completed.toLocaleString()} / {c.progress!.total.toLocaleString()}
            </p>
          </>
        ) : c.type === "inbound" && c.ringsPerWeek !== undefined ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {c.ringsPerWeek.toLocaleString()}/wk
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/campaigns/${c.id}`}>Open</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {c.status === "in_progress" || c.status === "active" ? "Pause" : "Resume"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DestructiveActionDialog
              action="Delete"
              resource="campaign"
              resourceId={c.id}
              resourceName={c.name}
            >
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => e.preventDefault()}
              >
                Delete
              </DropdownMenuItem>
            </DestructiveActionDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
