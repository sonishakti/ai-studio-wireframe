"use client"

import * as React from "react"
import { Radio, Search, Download, Filter, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { RealtimeNav } from "@/components/realtime-nav"

// ─── synthesize realtime session history ────────────────────────────────────
// RTC sessions are distinct from campaign calls — they're channel-based
// connections (Voice, Video, Live Streaming, Chat) joined by participants.
// This is the observability surface for the Realtime Services product.

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

const CURATED_SESSIONS: Session[] = [
  { id: "sess_001", channel: "support-room-1", service: "voice", participants: 2, peakBitrateKbps: 64, duration: 412, region: "us-west-2", outcome: "completed", startedAt: "2m ago" },
  { id: "sess_002", channel: "agent-demo-04", service: "agent", participants: 1, peakBitrateKbps: 32, duration: 188, region: "us-east-1", outcome: "completed", startedAt: "4m ago" },
  { id: "sess_003", channel: "live-event-uk", service: "live-streaming", participants: 142, peakBitrateKbps: 2400, duration: 3601, region: "eu-west-2", outcome: "completed", startedAt: "12m ago" },
  { id: "sess_004", channel: "video-call-002", service: "video", participants: 4, peakBitrateKbps: 1800, duration: 982, region: "us-west-2", outcome: "completed", startedAt: "18m ago" },
  { id: "sess_005", channel: "chat-room-99", service: "chat", participants: 12, peakBitrateKbps: 0, duration: 4200, region: "ap-south-1", outcome: "completed", startedAt: "32m ago" },
  { id: "sess_006", channel: "support-room-2", service: "voice", participants: 2, peakBitrateKbps: 64, duration: 28, region: "us-west-2", outcome: "dropped", startedAt: "44m ago" },
  { id: "sess_007", channel: "agent-test-12", service: "agent", participants: 1, peakBitrateKbps: 32, duration: 8, region: "us-east-1", outcome: "error", startedAt: "1 hr ago" },
  { id: "sess_008", channel: "video-call-003", service: "video", participants: 3, peakBitrateKbps: 2200, duration: 1840, region: "eu-west-2", outcome: "completed", startedAt: "2 hr ago" },
]

// Synthesize additional sessions so pagination is meaningful (v0.3.4 polish).
function genSessions(): Session[] {
  const services: Session["service"][] = ["voice", "video", "live-streaming", "chat", "agent"]
  const regions = ["us-west-2", "us-east-1", "eu-west-2", "ap-south-1", "ap-southeast-1"]
  const outcomes: Session["outcome"][] = ["completed", "completed", "completed", "dropped", "error"]
  const out: Session[] = []
  for (let i = 9; i <= 64; i++) {
    const svc = services[i % services.length]
    const oc = outcomes[(i * 3) % outcomes.length]
    out.push({
      id: `sess_${String(i).padStart(3, "0")}`,
      channel: `${svc === "live-streaming" ? "live" : svc}-room-${i}`,
      service: svc,
      participants: svc === "live-streaming" ? 40 + (i * 7) % 360 : svc === "chat" ? 4 + (i % 18) : 1 + (i % 4),
      peakBitrateKbps: svc === "chat" ? 0 : svc === "live-streaming" ? 1800 + (i * 53) % 900 : svc === "video" ? 1200 + (i * 37) % 1000 : svc === "voice" ? 64 : 32,
      duration: oc === "error" ? 4 + (i % 18) : 60 + (i * 97) % 3600,
      region: regions[i % regions.length],
      outcome: oc,
      startedAt: `${i} hr ago`,
    })
  }
  return out
}

const SESSIONS: Session[] = [...CURATED_SESSIONS, ...genSessions()]

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s.toString().padStart(2, "0")}s`
}

export default function SessionsPage() {
  const [query, setQuery] = React.useState("")
  const [service, setService] = React.useState<"all" | Session["service"]>("all")
  const [pageSize, setPageSize] = React.useState(25)
  const [page, setPage] = React.useState(1)

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return SESSIONS.filter((s) => {
      if (service !== "all" && s.service !== service) return false
      if (!q) return true
      return s.channel.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    })
  }, [query, service])

  // Reset to page 1 whenever the filtered set or page size changes.
  React.useEffect(() => { setPage(1) }, [query, service, pageSize])

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize)

  const totalSessions = SESSIONS.length
  const completedPct = Math.round(
    (SESSIONS.filter((s) => s.outcome === "completed").length / totalSessions) * 100,
  )

  return (
    <div className="flex flex-col flex-1">
      <RealtimeNav />

      <main className="flex-1 p-6 pt-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Every realtime channel session — voice, video, live streaming, chat, and Conversational AI.
          </p>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>

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
                {visible.map((s) => {
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

        {/* Pagination */}
        <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="h-8 w-18"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="tabular-nums">Page {safePage} of {pageCount}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setPage(1)} title="First page"><ChevronsLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} title="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} title="Next page"><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= pageCount} onClick={() => setPage(pageCount)} title="Last page"><ChevronsRight className="h-4 w-4" /></Button>
          </div>
        </div>
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
