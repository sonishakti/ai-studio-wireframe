"use client"

import * as React from "react"
import { use } from "react"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  PhoneIncoming,
  PhoneOutgoing,
  Pause,
  Play,
  Plus,
  TrendingUp,
  RefreshCw,
  Download,
  PhoneCall,
  Voicemail,
  Clock,
  ExternalLink,
  Bot,
  PhoneForwarded,
  Mic,
  MessageCircle,
  MessageSquare,
  Globe,
  Radio,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import { CampaignChannelBadges } from "@/components/campaign-channel-badges"
import {
  getCampaign,
  formatDuration,
  STATUS_BADGE,
  CHANNEL_LABEL,
  PHONE_NUMBERS,
  AGENTS,
  type Campaign,
  type ChannelKind,
} from "@/lib/campaign-data"
import { cn } from "@/lib/utils"

// ─── shared helpers ──────────────────────────────────────────────────────────

function fmtHM(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function DetailDonut({ segments }: { segments: { label: string; pct: number; stroke: string }[] }) {
  const r = 38
  const c = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.pct, 0) || 100
  let offset = 0
  return (
    <div className="relative shrink-0" style={{ width: 110, height: 110 }}>
      <svg viewBox="0 0 110 110" className="-rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" strokeWidth={13} className="stroke-muted" />
        {segments.map((s) => {
          const len = (s.pct / total) * c
          const seg = (
            <circle key={s.label} cx="55" cy="55" r={r} fill="none" strokeWidth={13} className={s.stroke}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />
          )
          offset += len
          return seg
        })}
      </svg>
    </div>
  )
}

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
            {campaign.type === "outbound" && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Redial drafted", { description: "A new campaign was started from these contacts (mock)." })}>
                  <RefreshCw className="h-3.5 w-3.5" /> Redial as New Campaign
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Results exported (mock)")}>
                  <Download className="h-3.5 w-3.5" /> Download Results
                </Button>
              </>
            )}
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
            Agent:{" "}
            {campaign.agentId ? (
              <Link href={`/agents/${campaign.agentId}/edit`} className="text-primary hover:underline">
                {campaign.agentName}
              </Link>
            ) : (
              <span className="text-foreground">Dynamic</span>
            )}
          </span>
          <span className="text-muted-foreground">·</span>
          <CampaignChannelBadges channels={campaign.channels} withLabels />
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="configuration" className="mt-4">
            <ConfigurationTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="monitor" className="mt-4">
            <MonitorTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="calls" className="mt-4">
            <CallsTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="chats" className="mt-4">
            <ChatsTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="sessions" className="mt-4">
            <SessionsTab campaign={campaign} />
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

  // Derived call results (outbound dialing breakdown — Figma 1284)
  const m = campaign.metrics
  const answered = Math.round(m.calls * (m.successRate / 100))
  const voicemail = Math.round(m.calls * 0.05)
  const unanswered = Math.max(0, m.calls - answered - voicemail)
  const totalDurationSec = m.calls * m.avgHandleTimeSec
  const results = [
    { label: "Total Calls", value: m.calls.toLocaleString(), icon: PhoneCall },
    { label: "Total Answered", value: answered.toLocaleString(), icon: PhoneIncoming },
    { label: "Total Unanswered", value: unanswered.toLocaleString(), icon: PhoneOutgoing },
    { label: "Voicemail", value: voicemail.toLocaleString(), icon: Voicemail },
    { label: "Total Call Duration", value: fmtHM(totalDurationSec), icon: Clock },
  ]
  const segs = m.calls > 0
    ? [
        { label: "Answered", pct: Math.round((answered / m.calls) * 100), stroke: "stroke-emerald-500", dot: "bg-emerald-500" },
        { label: "Voicemail", pct: Math.round((voicemail / m.calls) * 100), stroke: "stroke-amber-500", dot: "bg-amber-500" },
        { label: "Not answered", pct: Math.round((unanswered / m.calls) * 100), stroke: "stroke-muted-foreground", dot: "bg-muted-foreground" },
      ]
    : []

  return (
    <div className="space-y-5">
      {campaign.type === "outbound" && m.calls > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-3">Call Status Distribution</p>
              <div className="flex items-center gap-4">
                <DetailDonut segments={segs} />
                <div className="flex-1 space-y-1.5">
                  {segs.map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", s.dot)} />{s.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
            {results.map((r) => (
              <Card key={r.label}>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{r.label}</p>
                    <r.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-semibold tabular-nums">{r.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
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
      )}

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

function ConfigCard({
  icon: Icon, title, desc, action, children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
            </div>
          </div>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function SettingToggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
    </div>
  )
}

const CHANNEL_ICONS: Record<ChannelKind, React.ComponentType<{ className?: string }>> = {
  telephony: PhoneCall,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  web: Globe,
}

// The campaign's editable settings — the "reconfigure a live deployment" surface
// (Figma 1158-132607). Channels link out to the phone-number manager.
function ConfigurationTab({ campaign }: { campaign: Campaign }) {
  const isInbound = campaign.type === "inbound"
  const hasTelephony = campaign.channels.some((c) => c.kind === "telephony")
  const [agentId, setAgentId] = React.useState(campaign.agentId ?? "dynamic")
  const [greeting, setGreeting] = React.useState(
    isInbound ? `Thanks for calling ${campaign.name} — how can I help today?` : "",
  )
  const [endOfConv, setEndOfConv] = React.useState(true)
  const [silenceHangup, setSilenceHangup] = React.useState(true)
  const [transfer, setTransfer] = React.useState(isInbound)
  const [storeTranscripts, setStoreTranscripts] = React.useState(true)
  const [storeRecording, setStoreRecording] = React.useState(true)

  return (
    <div className="space-y-5">
      {/* Agent assignment + jump to the agent */}
      <ConfigCard
        icon={Bot}
        title="Agent"
        desc={isInbound
          ? "One agent answers every conversation on this inbound campaign."
          : "Optional — leave dynamic to pick an agent per batch."}
      >
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label>Assigned agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {!isInbound && <SelectItem value="dynamic">Dynamic (per batch)</SelectItem>}
                {AGENTS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {agentId !== "dynamic" && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={`/agents/${agentId}/edit`}>Open agent <ExternalLink className="h-3.5 w-3.5" /></Link>
            </Button>
          )}
        </div>
      </ConfigCard>

      {/* Channels & numbers — telephony rows jump to the phone-number manager */}
      <ConfigCard
        icon={Radio}
        title="Channels & numbers"
        desc="The surfaces this campaign runs on."
        action={<Button variant="outline" size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add channel</Button>}
      >
        <div className="space-y-3">
          {campaign.channels.map((ch, i) => {
            const ChIcon = CHANNEL_ICONS[ch.kind]
            return (
              <div key={`${ch.kind}-${i}`} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <ChIcon className="h-3.5 w-3.5 text-muted-foreground" /> {CHANNEL_LABEL[ch.kind]}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ch.direction === "in" ? "Inbound" : "Outbound"}</Badge>
                    <DestructiveActionDialog
                      action="Remove"
                      resource="channel"
                      resourceId={`${campaign.id}:${ch.kind}`}
                      description="Removing this channel stops traffic to it immediately. You can re-add it later from this page."
                    >
                      <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={(e) => e.preventDefault()}>
                        Remove
                      </Button>
                    </DestructiveActionDialog>
                  </div>
                </div>
                {ch.kind === "telephony" ? (
                  <div className="space-y-1">
                    {(ch as { numbers: string[] }).numbers.map((num) => {
                      const pn = PHONE_NUMBERS.find((p) => p.number === num)
                      return (
                        <div key={num} className="flex items-center justify-between text-sm">
                          <span className="font-mono text-muted-foreground">{num}</span>
                          <Link
                            href={pn ? `/campaigns/phone-numbers/${pn.id}` : "/campaigns/phone-numbers"}
                            className="text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                          >
                            Manage number <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <ChannelConfigSummary kind={ch.kind} channel={ch} />
                )}
              </div>
            )
          })}
        </div>
      </ConfigCard>

      {/* Call handling (telephony only) */}
      {hasTelephony && (
        <ConfigCard icon={PhoneForwarded} title="Call handling" desc="How the agent runs each call.">
          {isInbound && (
            <div className="space-y-1.5">
              <Label>Greeting</Label>
              <Textarea value={greeting} onChange={(e) => setGreeting(e.target.value)} rows={2} />
              <p className="text-xs text-muted-foreground">What the agent says when it answers.</p>
            </div>
          )}
          <SettingToggle label="End of conversation" desc="Hang up when the conversation concludes naturally." checked={endOfConv} onChange={setEndOfConv} />
          <SettingToggle label="Silence hangup" desc="End the call after prolonged silence." checked={silenceHangup} onChange={setSilenceHangup} />
          <SettingToggle label="Transfer to human" desc="Hand off to a human agent when needed or asked for." checked={transfer} onChange={setTransfer} />
        </ConfigCard>
      )}

      {/* Transcripts & recording */}
      <ConfigCard icon={Mic} title="Transcripts & Recording" desc="What gets saved for review.">
        <SettingToggle label="Store transcripts" checked={storeTranscripts} onChange={setStoreTranscripts} />
        <SettingToggle label="Store recordings" checked={storeRecording} onChange={setStoreRecording} />
      </ConfigCard>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => toast.success("Configuration saved (mock)")}>Save changes</Button>
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

function MonitorTab({ campaign }: { campaign: Campaign }) {
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

      <CrossLink href="/calls" label="View in Call History" />
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

function CrossLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Looking across all campaigns?</span>
      <Link href={href} className="text-primary hover:underline inline-flex items-center gap-1">
        {label} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}

function EmptyTab({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Card>
      <CardContent className="p-10 text-center space-y-2">
        <Icon className="h-6 w-6 text-muted-foreground mx-auto" />
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">{desc}</p>
      </CardContent>
    </Card>
  )
}

// ─── Chats (scoped to this campaign's text channels) ─────────────────────────

interface ScopedChat { id: string; channel: ChannelKind; contact: string; messages: number; status: string; at: string }

function generateChats(campaign: Campaign): ScopedChat[] {
  const text = campaign.channels.filter((c) => c.kind === "whatsapp" || c.kind === "sms" || c.kind === "web")
  if (text.length === 0) return []
  const contacts = ["+1 (628) 555-1077", "+44 7700 900123", "web-visitor-4821", "+1 (212) 555-8801", "+1 (650) 555-4422"]
  const statuses = ["Resolved", "Transferred", "Active", "Abandoned"]
  const n = Math.min(10, Math.max(3, Math.round((campaign.metrics.calls || 600) / 300)))
  const rows: ScopedChat[] = []
  for (let i = 0; i < n; i++) {
    const ch = text[i % text.length]
    rows.push({ id: `chat_${campaign.id}_${i}`, channel: ch.kind, contact: contacts[i % contacts.length], messages: 3 + (i % 9), status: statuses[i % statuses.length], at: `${(i + 1) * 7}m ago` })
  }
  return rows
}

function ChatsTab({ campaign }: { campaign: Campaign }) {
  const rows = generateChats(campaign)
  if (rows.length === 0) {
    return <EmptyTab icon={MessageCircle} title="No text conversations" desc="This campaign has no WhatsApp, SMS, or web chat channel. Add one in Configuration to see conversations here." />
  }
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Messages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">{CHANNEL_LABEL[r.channel]}</TableCell>
                  <TableCell className="font-mono text-xs">{r.contact}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{r.messages}</TableCell>
                  <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{r.at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CrossLink href="/chats" label="View in Chat History" />
    </div>
  )
}

// ─── Sessions (scoped — voice/RTC sessions for this campaign) ────────────────

interface ScopedSession { id: string; durationSec: number; region: string; outcome: string; at: string }

function generateSessions(campaign: Campaign): ScopedSession[] {
  if (!campaign.channels.some((c) => c.kind === "telephony")) return []
  const regions = ["us-west-2", "us-east-1", "eu-west-2"]
  const outcomes = ["Completed", "Completed", "Dropped"]
  const n = Math.min(10, Math.max(3, Math.round((campaign.metrics.calls || 600) / 300)))
  const rows: ScopedSession[] = []
  for (let i = 0; i < n; i++) {
    rows.push({ id: `AX${(1000 + i).toString(36).toUpperCase()}-${campaign.id.slice(-2)}`, durationSec: 30 + ((i * 47) % 600), region: regions[i % regions.length], outcome: outcomes[i % outcomes.length], at: `${i + 1}h ago` })
  }
  return rows
}

function SessionsTab({ campaign }: { campaign: Campaign }) {
  const rows = generateSessions(campaign)
  if (rows.length === 0) {
    return <EmptyTab icon={Radio} title="No voice sessions" desc="Sessions appear for telephony campaigns. This campaign has no voice channel." />
  }
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead className="text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{formatDuration(r.durationSec)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.region}</TableCell>
                  <TableCell><Badge variant={r.outcome === "Dropped" ? "secondary" : "default"}>{r.outcome}</Badge></TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{r.at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CrossLink href="/realtime-services/sessions" label="View in Session History" />
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
