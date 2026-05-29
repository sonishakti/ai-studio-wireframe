"use client"

import * as React from "react"
import { Radio, Search, Download, Filter, CheckCircle2, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// ─── synthesize realtime session history ────────────────────────────────────
// RTC sessions are distinct from telephony calls — they're channel-based
// connections (Voice, Video, Live Streaming, Chat) joined by participants.

type Session = {
  id: string
  channel: string
  service: "voice" | "video" | "live-streaming" | "chat" | "agent"
  participants: number
  peakBitrateKbps: number
  duration: number
  region: string
  outcome: "completed" | "dropped" | "error"
  startedAt: string
}

const SERVICE_LABEL: Record<Session["service"], string> = {
  voice: "Voice",
  video: "Video",
  "live-streaming": "Live Streaming",
  chat: "Chat",
  agent: "Conv. AI",
}

const OUTCOME_BADGE: Record<Session["outcome"], { variant: "default" | "secondary" | "destructive"; label: string }> = {
  completed: { variant: "default", label: "Completed" },
  dropped: { variant: "secondary", label: "Dropped" },
  error: { variant: "destructive", label: "Error" },
}

const SESSIONS: Session[] = [
  { id: "sess_001", channel: "support-room-1", service: "voice", participants: 2, peakBitrateKbps: 64, duration: 412, region: "us-west-2", outcome: "completed", startedAt: "2m ago" },
  { id: "sess_002", channel: "agent-demo-04", service: "agent", participants: 1, peakBitrateKbps: 32, duration: 188, region: "us-east-1", outcome: "completed", startedAt: "4m ago" },
  { id: "sess_003", channel: "live-event-uk", service: "live-streaming", participants: 142, peakBitrateKbps: 2400, duration: 3601, region: "eu-west-2", outcome: "completed", startedAt: "12m ago" },
  { id: "sess_004", channel: "video-call-002", service: "video", participants: 4, peakBitrateKbps: 1800, duration: 982, region: "us-west-2", outcome: "completed", startedAt: "18m ago" },
  { id: "sess_005", channel: "chat-room-99", service: "chat", participants: 12, peakBitrateKbps: 0, duration: 4200, region: "ap-south-1", outcome: "completed", startedAt: "32m ago" },
  { id: "sess_006", channel: "support-room-2", service: "voice", participants: 2, peakBitrateKbps: 64, duration: 28, region: "us-west-2", outcome: "dropped", startedAt: "44m ago" },
  { id: "sess_007", channel: "agent-test-12", service: "agent", participants: 1, peakBitrateKbps: 32, duration: 8, region: "us-east-1", outcome: "error", startedAt: "1 hr ago" },
  { id: "sess_008", channel: "video-call-003", service: "video", participants: 3, peakBitrateKbps: 2200, duration: 1840, region: "eu-west-2", outcome: "completed", startedAt: "2 hr ago" },
]

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s.toString().padStart(2, "0")}s`
}

export default function SessionHistoryPage() {
  const [query, setQuery] = React.useState("")
  const [service, setService] = React.useState<"all" | Session["service"]>("all")

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return SESSIONS.filter((s) => {
      if (service !== "all" && s.service !== service) return false
      if (!q) return true
      return s.channel.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    })
  }, [query, service])

  const totalSessions = SESSIONS.length
  const completedPct = Math.round(
    (SESSIONS.filter((s) => s.outcome === "completed").length / totalSessions) * 100,
  )

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Session History"
        description="Every realtime channel session — voice, video, live streaming, chat, and Conversational AI."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      <main className="flex-1 p-6 pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4 space-y-0.5">
              <p className="text-xs text-muted-foreground">Total sessions</p>
              <p className="text-xl font-semibold tabular-nums">{totalSessions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-0.5">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-xl font-semibold tabular-nums text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> {completedPct}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-0.5">
              <p className="text-xs text-muted-foreground">Concurrent peak</p>
              <p className="text-xl font-semibold tabular-nums">142</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-0.5">
              <p className="text-xs text-muted-foreground">Errors (24h)</p>
              <p className="text-xl font-semibold tabular-nums text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> 1
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
            <FilterChip active={service === "all"} onClick={() => setService("all")}>
              All
            </FilterChip>
            <FilterChip active={service === "agent"} onClick={() => setService("agent")}>
              Conv. AI
            </FilterChip>
            <FilterChip active={service === "voice"} onClick={() => setService("voice")}>
              Voice
            </FilterChip>
            <FilterChip active={service === "video"} onClick={() => setService("video")}>
              Video
            </FilterChip>
            <FilterChip active={service === "live-streaming"} onClick={() => setService("live-streaming")}>
              Live
            </FilterChip>
            <FilterChip active={service === "chat"} onClick={() => setService("chat")}>
              Chat
            </FilterChip>
          </div>

          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search channel, session id…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Participants</TableHead>
                  <TableHead className="text-right">Peak bitrate</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => {
                  const o = OUTCOME_BADGE[s.outcome]
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.id}</TableCell>
                      <TableCell className="text-sm">{s.channel}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{SERVICE_LABEL[s.service]}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{s.participants}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {s.peakBitrateKbps > 0 ? `${s.peakBitrateKbps} kbps` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatDuration(s.duration)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{s.region}</TableCell>
                      <TableCell>
                        <Badge variant={o.variant}>{o.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {s.startedAt}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                      <Radio className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                      No sessions match your filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function FilterChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded px-2.5 h-7 text-xs font-medium transition-colors " +
        (active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  )
}
