"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Search, Download, Radio, ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react"
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
import { MonitorNav } from "@/components/monitor-nav"
import { AGENTS } from "@/lib/campaign-data"
import { SESSIONS, CHANNEL_LABEL, LATENCY_TARGET_MS } from "@/lib/session-trace"
import { cn } from "@/lib/utils"
import { track, Events } from "@/lib/analytics"

// Agent sessions = one AI conversation run (Conversational AI Engine join→leave).
// This is AGENT observability and lives in the Monitor hub. It is NOT the RTC
// session-quality telemetry of Voice/Video/Live/Chat — that's human↔human comms
// surfaced as *usage* (Realtime Services → /billing/usage) or Agora Analytics.

// Sessions + their channel now come from `lib/session-trace` so the list and
// the detail route (`/sessions/[id]`) can never disagree about a run.

export default function SessionsPage() {
  const [query, setQuery] = React.useState("")
  const [agent, setAgent] = React.useState("all")
  const [channel, setChannel] = React.useState("all")
  const [pageSize, setPageSize] = React.useState(25)
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    track(Events.sessions_viewed)
  }, [])

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return SESSIONS.filter((s) => {
      if (agent !== "all" && s.agent !== agent) return false
      if (channel !== "all" && s.channel !== channel) return false
      if (q && !s.id.toLowerCase().includes(q) && !s.agent.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, agent, channel])

  React.useEffect(() => { setPage(1) }, [query, agent, channel, pageSize])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="flex flex-col flex-1">
      <MonitorNav
        subtitle="Every agent conversation session across test and live calls."
        action={
          <Button
            variant="outline" size="sm" className="gap-1.5"
            disabled={SESSIONS.length === 0}
            onClick={() => toast.info("Mock: exporting sessions to CSV…")}
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      <main className="flex-1 p-6 pt-4 space-y-4">
        {SESSIONS.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
            <Radio className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium">No sessions yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Talk to Aria or put a deployment live, and every conversation run shows up here.
            </p>
            <Button asChild size="sm" className="mt-1 gap-1.5">
              <Link href="/deploy">Go to deployments <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        ) : (
        <>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Agent Session ID, or Agent Name" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8 h-9 text-sm" />
          </div>
          <Select value={agent} onValueChange={setAgent}>
            <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {AGENTS.map((a) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {/* Sessions are no longer telephony-only (Q3 roadmap: "session details
              beyond telephony") — the channel filter is how that becomes visible. */}
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              {Object.entries(CHANNEL_LABEL).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Session ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">p95 response</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((s) => (
                  // The row is the affordance — a session had no detail view at
                  // all before (Q3 roadmap P1, 2026-07).
                  <TableRow key={s.id} className="cursor-pointer">
                    <TableCell className="font-mono text-xs">
                      <Link href={`/sessions/${s.id}`} className="hover:underline underline-offset-4">
                        {s.id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{s.agent}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">{CHANNEL_LABEL[s.channel]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{s.startTime}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{s.durationLabel}</TableCell>
                    <TableCell className="text-right">
                      {s.p95Ms > 0 ? (
                        <span className={cn(
                          "tabular-nums text-sm",
                          s.p95Ms > LATENCY_TARGET_MS && "font-medium text-warning",
                        )}>
                          {s.p95Ms.toLocaleString()} ms
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Badge variant={s.status === "Failed" ? "destructive" : "default"} className="w-fit">
                          {s.status}
                        </Badge>
                        {s.endReason && (
                          <span className="text-xs text-muted-foreground">{s.endReason}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      <Radio className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                      No sessions match.
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
            <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
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
        </>
        )}
      </main>
    </div>
  )
}
