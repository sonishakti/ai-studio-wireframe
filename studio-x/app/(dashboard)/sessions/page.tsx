"use client"

import * as React from "react"
import {
  Search, Download, Radio, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
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
import { track, Events } from "@/lib/analytics"

// Agent sessions = one AI conversation run (Conversational AI Engine join→leave).
// This is AGENT observability and lives in the Monitor hub. It is NOT the RTC
// session-quality telemetry of Voice/Video/Live/Chat — that's human↔human comms
// surfaced as *usage* (Realtime Services → /billing/usage) or Agora Analytics.

type SessionStatus = "Completed" | "Failed"
interface AgentSession {
  id: string
  agent: string
  startTime: string
  durationLabel: string
  status: SessionStatus
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
function seg(n: number, len = 4): string {
  let s = ""
  for (let i = 0; i < len; i++) s += CHARS[(n * 7 + i * 13) % CHARS.length]
  return s
}

function genSessions(): AgentSession[] {
  const agents = ["Customer Support Agent", "Sales Sam", "Support Bot v2", "Sales Qualifier", "—"]
  const dates = [
    "Nov 15, 2025, 04:00 PM", "Nov 10, 2025, 09:00 PM", "Oct 20, 2025, 09:00 AM",
    "Oct 15, 2025, 10:00 AM", "Oct 06, 2025, 02:00 PM",
  ]
  const out: AgentSession[] = []
  for (let i = 1; i <= 64; i++) {
    const status: SessionStatus = (i * 5) % 7 === 0 ? "Failed" : "Completed"
    const mins = status === "Failed" ? 0 : (i % 5) + 1
    out.push({
      id: `${seg(i)}-${seg(i + 1)}-${seg(i + 2)}-${seg(i + 3, 5)}`,
      agent: agents[i % agents.length],
      startTime: dates[i % dates.length],
      durationLabel: status === "Failed" ? "≤ 0s" : `≤ ${mins}m`,
      status,
    })
  }
  return out
}

const SESSIONS = genSessions()

export default function SessionsPage() {
  const [query, setQuery] = React.useState("")
  const [agent, setAgent] = React.useState("all")
  const [pageSize, setPageSize] = React.useState(25)
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    track(Events.sessions_viewed)
  }, [])

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return SESSIONS.filter((s) => {
      if (agent !== "all" && s.agent !== agent) return false
      if (q && !s.id.toLowerCase().includes(q) && !s.agent.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, agent])

  React.useEffect(() => { setPage(1) }, [query, agent, pageSize])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="flex flex-col flex-1">
      <MonitorNav action={<Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>} />

      <main className="flex-1 p-6 pt-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Every agent conversation session across test and live calls.
        </p>

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
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Session ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.id}</TableCell>
                    <TableCell className="text-sm">{s.agent}</TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{s.startTime}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{s.durationLabel}</TableCell>
                    <TableCell><Badge variant={s.status === "Failed" ? "destructive" : "default"}>{s.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
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
