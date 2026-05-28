"use client"

import * as React from "react"
import { use } from "react"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  PhoneIncoming,
  PhoneOutgoing,
  Pause,
  Play,
  Plus,
  TrendingUp,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import { CampaignChannelBadges } from "@/components/campaign-channel-badges"
import {
  getCampaign,
  formatDuration,
  STATUS_BADGE,
  CHANNEL_LABEL,
  type Campaign,
  type ChannelKind,
} from "@/lib/campaign-data"

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const campaign = getCampaign(id)
  if (!campaign) notFound()

  const router = useRouter()
  const TypeIcon = campaign.type === "inbound" ? PhoneIncoming : PhoneOutgoing
  const status = STATUS_BADGE[campaign.status]
  const isRunning = campaign.status === "active" || campaign.status === "in_progress"

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title={campaign.name}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/campaigns")} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> All campaigns
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isRunning ? "Pause" : "Resume"}
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-5">
        {/* Header summary row */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <TypeIcon className="h-3 w-3" />
            {campaign.type === "inbound" ? "Inbound" : "Outbound"}
          </Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="text-sm text-muted-foreground">
            Agent: <span className="text-foreground">{campaign.agentName ?? "Dynamic"}</span>
          </span>
          <span className="text-muted-foreground">·</span>
          <CampaignChannelBadges channels={campaign.channels} withLabels />
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="configuration" className="mt-4">
            <ConfigurationTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <AnalyticsTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="calls" className="mt-4">
            <CallsTab campaign={campaign} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// ─── Overview ────────────────────────────────────────────────────────────────

function OverviewTab({ campaign }: { campaign: Campaign }) {
  const pct =
    campaign.progress && campaign.progress.total > 0
      ? Math.round((campaign.progress.completed / campaign.progress.total) * 100)
      : null

  const kpis = [
    {
      label: "Calls",
      value: campaign.metrics.calls.toLocaleString(),
      sub: campaign.type === "inbound" ? "Incoming this period" : "Dialed this period",
    },
    {
      label: "Success rate",
      value: campaign.metrics.successRate > 0 ? `${campaign.metrics.successRate}%` : "—",
      sub: campaign.type === "inbound" ? "Resolved without transfer" : "Connected & qualified",
    },
    {
      label: "Avg handle time",
      value: formatDuration(campaign.metrics.avgHandleTimeSec),
      sub: "Per conversation",
    },
    {
      label: "Channels",
      value: String(campaign.channels.length),
      sub: campaign.channels.map((c) => CHANNEL_LABEL[c.kind]).join(" · "),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {k.label}
              </p>
              <p className="text-2xl font-semibold tabular-nums">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {pct !== null && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Dialing progress</p>
              <p className="text-sm tabular-nums text-muted-foreground">
                {campaign.progress!.completed.toLocaleString()} / {campaign.progress!.total.toLocaleString()}
              </p>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              Started {campaign.startDate}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Configuration ───────────────────────────────────────────────────────────

function ConfigurationTab({ campaign }: { campaign: Campaign }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Channels and assignment for this campaign.</p>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add channel
        </Button>
      </div>

      <div className="space-y-3">
        {campaign.channels.map((ch, i) => (
          <Card key={`${ch.kind}-${i}`}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{CHANNEL_LABEL[ch.kind]}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ch.direction === "in" ? "Inbound" : "Outbound"}</Badge>
                  <DestructiveActionDialog
                    action="Remove"
                    resource="channel"
                    resourceId={`${campaign.id}:${ch.kind}`}
                    description="Removing this channel stops traffic to it immediately. You can re-add it later from this page."
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => e.preventDefault()}
                    >
                      Remove
                    </Button>
                  </DestructiveActionDialog>
                </div>
              </div>
              <ChannelConfigSummary kind={ch.kind} channel={ch} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ChannelConfigSummary({
  kind,
  channel,
}: {
  kind: ChannelKind
  channel: Campaign["channels"][number]
}) {
  switch (kind) {
    case "telephony":
      return (
        <p className="text-sm text-muted-foreground">
          Numbers:{" "}
          <span className="font-mono text-foreground">
            {(channel as { numbers: string[] }).numbers.join(", ")}
          </span>
        </p>
      )
    case "whatsapp":
      return (
        <p className="text-sm text-muted-foreground">
          Sender:{" "}
          <span className="font-mono text-foreground">{(channel as { sender: string }).sender}</span>
        </p>
      )
    case "sms":
      return (
        <p className="text-sm text-muted-foreground">
          Number:{" "}
          <span className="font-mono text-foreground">{(channel as { number: string }).number}</span>
        </p>
      )
    case "web":
      return (
        <p className="text-sm text-muted-foreground">
          Domains:{" "}
          <span className="font-mono text-foreground">
            {(channel as { domains: string[] }).domains.join(", ")}
          </span>
        </p>
      )
  }
}

// ─── Analytics ───────────────────────────────────────────────────────────────

function AnalyticsTab({ campaign }: { campaign: Campaign }) {
  const channelBreakdown = campaign.channels.map((ch) => ({
    kind: ch.kind,
    label: CHANNEL_LABEL[ch.kind],
    // Fake split — distributed roughly equally with a bit of variance
    calls: Math.round(campaign.metrics.calls / campaign.channels.length),
  }))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Volume (last 7d)
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {campaign.metrics.calls.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12% vs prior 7d
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {campaign.type === "inbound" ? "Resolution rate" : "Connect rate"}
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {campaign.metrics.successRate}%
            </p>
            <p className="text-xs text-muted-foreground">Across all channels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg latency
            </p>
            <p className="text-2xl font-semibold tabular-nums">412ms</p>
            <p className="text-xs text-muted-foreground">First-token, voice channels</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold">By channel</p>
            <p className="text-xs text-muted-foreground">
              How traffic split across the modalities in this campaign.
            </p>
          </div>
          <div className="space-y-2">
            {channelBreakdown.map((row) => {
              const max = Math.max(...channelBreakdown.map((r) => r.calls), 1)
              const pct = Math.round((row.calls / max) * 100)
              return (
                <div key={row.kind} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{row.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {row.calls.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Latency, transfer rate, and per-day call distribution charts will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Calls ───────────────────────────────────────────────────────────────────

interface MockCall {
  id: string
  direction: "in" | "out"
  channel: ChannelKind
  contact: string
  duration: number
  outcome: "resolved" | "transferred" | "no_answer" | "completed"
  at: string
}

function CallsTab({ campaign }: { campaign: Campaign }) {
  const calls: MockCall[] = React.useMemo(() => generateCalls(campaign), [campaign])
  const [query, setQuery] = React.useState("")
  const [channelFilter, setChannelFilter] = React.useState<ChannelKind | "all">("all")

  const filtered = calls.filter((c) => {
    if (channelFilter !== "all" && c.channel !== channelFilter) return false
    if (query && !c.contact.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setChannelFilter("all")}
            className={
              "rounded px-2.5 h-7 text-xs font-medium transition-colors " +
              (channelFilter === "all"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            All channels
          </button>
          {campaign.channels.map((ch) => (
            <button
              key={ch.kind}
              type="button"
              onClick={() => setChannelFilter(ch.kind)}
              className={
                "rounded px-2.5 h-7 text-xs font-medium transition-colors " +
                (channelFilter === ch.kind
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {CHANNEL_LABEL[ch.kind]}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Input
            placeholder="Search contact…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Direction</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.direction === "in" ? (
                      <PhoneIncoming className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <PhoneOutgoing className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {CHANNEL_LABEL[c.channel]}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{c.contact}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {formatDuration(c.duration)}
                  </TableCell>
                  <TableCell>
                    <OutcomeBadge outcome={c.outcome} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {c.at}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    No calls match.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CallsLegacyHint />
    </div>
  )
}

function OutcomeBadge({ outcome }: { outcome: MockCall["outcome"] }) {
  switch (outcome) {
    case "resolved":
      return <Badge variant="default">Resolved</Badge>
    case "transferred":
      return <Badge variant="secondary">Transferred</Badge>
    case "no_answer":
      return <Badge variant="outline">No answer</Badge>
    case "completed":
      return <Badge variant="outline">Completed</Badge>
  }
}

function CallsLegacyHint() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Looking for cross-campaign call history?</span>
      <Link href="/campaigns" className="text-primary hover:underline">
        Open all campaigns
      </Link>
    </div>
  )
}

function generateCalls(campaign: Campaign): MockCall[] {
  if (campaign.metrics.calls === 0) return []
  const samples: MockCall[] = []
  const channels = campaign.channels
  const count = Math.min(12, Math.max(3, Math.round(campaign.metrics.calls / 200)))
  const contacts = [
    "+1 (415) 555-2199",
    "+1 (415) 555-3340",
    "+1 (628) 555-1077",
    "+44 7700 900123",
    "+1 (212) 555-8801",
    "+1 (650) 555-4422",
  ]
  const outcomes: MockCall["outcome"][] =
    campaign.type === "inbound" ? ["resolved", "transferred", "no_answer"] : ["completed", "no_answer"]

  for (let i = 0; i < count; i++) {
    const ch = channels[i % channels.length]
    samples.push({
      id: `call_${campaign.id}_${i}`,
      direction: campaign.type === "inbound" ? "in" : "out",
      channel: ch.kind,
      contact: contacts[i % contacts.length],
      duration: 30 + Math.round(Math.random() * 240),
      outcome: outcomes[i % outcomes.length],
      at: `${(i + 1) * 3}m ago`,
    })
  }
  return samples
}
