"use client"

import * as React from "react"
import Link from "next/link"
import {
  PhoneIncoming, PhoneOutgoing, Search, Filter, Download, X, Columns3, Stethoscope,
} from "lucide-react"
import { MonitorNav } from "@/components/monitor-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DEPLOYMENTS, formatDuration, getDeployment, deploymentHref } from "@/lib/campaign-data"
import { CallDetailSheet, type CallDetail } from "@/components/call-detail-sheet"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"

// ─── synthesize cross-campaign call history ─────────────────────────────────

type CallStatus = "Not Connected" | "Answered" | "Not Transferred" | "Voicemail" | "Transferred"
type Outcome = "Successful" | "Failed" | "Cannot Predict"

interface CallRow {
  id: string
  direction: "in" | "out"
  timestamp: string
  agent: string
  campaignId: string
  campaignName: string
  from: string
  to: string
  durationSec: number
  status: CallStatus
  outcome: Outcome
}

const CONTACTS = ["+1 (555) 234-5678", "+1 (555) 857-2958", "+1 (555) 485-2957", "+1 (555) 284-9284", "+1 (555) 804-1903", "+44 7700 900123"]
const STATUSES: CallStatus[] = ["Answered", "Voicemail", "Not Connected", "Transferred", "Not Transferred"]
const OUTCOMES: Outcome[] = ["Successful", "Failed", "Cannot Predict"]

function generate(): CallRow[] {
  const rows: CallRow[] = []
  let n = 1
  // Call History is TELEPHONY only. It used to loop every deployment and stamp
  // a phone number on each row, so a web-widget deployment appeared here as a
  // phone call with a fabricated From number — not an ambiguity, invented data
  // (focus group 2026-07-29, S1). Web/WhatsApp/SMS runs surface in Sessions,
  // which is channel-aware.
  for (const c of DEPLOYMENTS.filter((d) => d.channel.kind === "telephony")) {
    const size = c.metrics.calls === 0 ? 1 : Math.min(6, Math.max(2, Math.round(c.metrics.calls / 400)))
    for (let i = 0; i < size; i++) {
      const status = STATUSES[(n + i) % STATUSES.length]
      const outcome = status === "Answered" || status === "Transferred" ? "Successful" : status === "Voicemail" || status === "Not Connected" ? "Failed" : OUTCOMES[(n + i) % 3]
      rows.push({
        id: `CALL${(1000 + n).toString(36).toUpperCase()}`,
        direction: c.kind === "inbound" ? "in" : "out",
        timestamp: `${10 + (n % 18)}/12/2025 ${(9 + (i % 9)).toString().padStart(2, "0")}:00`,
        agent: c.agentName ?? "Dynamic Agent",
        campaignId: c.id,
        campaignName: c.name,
        from: c.kind === "inbound" ? CONTACTS[(n + i) % CONTACTS.length] : "+1 (555) 555-0240",
        to: c.kind === "inbound" ? "+1 (555) 555-0101" : CONTACTS[(n + i) % CONTACTS.length],
        durationSec: status === "Not Connected" ? 0 : 30 + ((n * 37 + i * 53) % 280),
        status,
        outcome,
      })
      n++
    }
  }
  return rows
}

const CALLS = generate()

const STATUS_VARIANT: Record<CallStatus, "default" | "secondary" | "outline"> = {
  Answered: "default", Transferred: "default", Voicemail: "secondary", "Not Connected": "outline", "Not Transferred": "outline",
}
const OUTCOME_VARIANT: Record<Outcome, "default" | "destructive" | "secondary"> = {
  Successful: "default", Failed: "destructive", "Cannot Predict": "secondary",
}

function transcriptFor(c: CallRow): CallDetail["transcript"] {
  return [
    { speaker: "Agent", text: `Hi, this is ${c.agent} calling on behalf of ACME Corp regarding ${c.campaignName}. Am I speaking with the account holder?` },
    { speaker: "Customer", text: "Yes, this is them." },
    { speaker: "Agent", text: "Great — I'm following up on your recent interest. Do you have a quick moment?" },
    { speaker: "Customer", text: c.outcome === "Successful" ? "Sure, go ahead." : "Not right now, thanks." },
  ]
}

// Static table columns — the single source of truth for the empty-row colSpan
// (header list below must stay in sync with this count).
const BASE_COLUMNS = [
  "Direction", "Timestamp", "Agent", "Deployment", "From", "To", "Duration", "Call Status", "Call Outcome",
] as const

// Optional "structured output" columns the user can surface via Customise View.
const OPTIONAL_COLUMNS = [
  { key: "sentiment", label: "Sentiment" },
  { key: "intent", label: "Intent" },
  { key: "language", label: "Language" },
] as const
type OptColKey = (typeof OPTIONAL_COLUMNS)[number]["key"]

function structuredValue(c: CallRow, key: OptColKey): string {
  if (key === "sentiment") return c.outcome === "Successful" ? "Positive" : c.outcome === "Failed" ? "Negative" : "Neutral"
  if (key === "intent") return c.direction === "in" ? "Support request" : "Sales follow-up"
  return c.from.startsWith("+44") || c.to.startsWith("+44") ? "English (UK)" : "English (US)"
}

export default function CallHistoryPage() {
  const [query, setQuery] = React.useState("")
  const [direction, setDirection] = React.useState<"all" | "in" | "out">("all")
  const [outcomes, setOutcomes] = React.useState<Set<Outcome>>(new Set())
  const [statuses, setStatuses] = React.useState<Set<CallStatus>>(new Set())
  const [pageSize, setPageSize] = React.useState(25)
  const [selected, setSelected] = React.useState<CallDetail | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [cols, setCols] = React.useState<Set<OptColKey>>(new Set())

  React.useEffect(() => {
    track(Events.calls_viewed)
  }, [])

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return CALLS.filter((c) => {
      if (direction !== "all" && c.direction !== direction) return false
      if (outcomes.size > 0 && !outcomes.has(c.outcome)) return false
      if (statuses.size > 0 && !statuses.has(c.status)) return false
      if (q && !c.campaignName.toLowerCase().includes(q) && !c.from.toLowerCase().includes(q) && !c.to.toLowerCase().includes(q) && !c.agent.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, direction, outcomes, statuses])

  const visible = rows.slice(0, pageSize)
  const hasFilters = direction !== "all" || outcomes.size > 0 || statuses.size > 0

  const toggle = <T,>(set: Set<T>, setter: (s: Set<T>) => void, v: T) => {
    const next = new Set(set)
    next.has(v) ? next.delete(v) : next.add(v)
    setter(next)
  }

  const openCall = React.useCallback((c: CallRow) => {
    setSelected({
      id: c.id, type: c.direction === "in" ? "Inbound" : "Outbound", from: c.from, to: c.to,
      campaign: c.campaignName, agent: c.agent, timestamp: c.timestamp, durationSec: c.durationSec,
      outcome: c.outcome, transcript: transcriptFor(c),
      deploymentId: c.campaignId, agentId: getDeployment(c.campaignId)?.agentId,
    })
    setSheetOpen(true)
    // Reflect the open call in the URL so it survives refresh and can be shared.
    const url = new URL(window.location.href)
    url.searchParams.set("call", c.id)
    window.history.replaceState(null, "", url.toString())
  }, [])

  // Deep-link: open the call named in ?call= on first load (bookmark / shared link).
  React.useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("call")
    if (!id) return
    const c = CALLS.find((x) => x.id === id)
    if (c) openCall(c)
  }, [openCall])

  const closeSheet = (o: boolean) => {
    setSheetOpen(o)
    if (!o) {
      const url = new URL(window.location.href)
      url.searchParams.delete("call")
      window.history.replaceState(null, "", url.toString())
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <MonitorNav
        action={
          <Button
            variant="outline" size="sm" className="gap-1.5"
            disabled={rows.length === 0}
            onClick={() => toast.info(`Mock: exporting ${rows.length} call${rows.length === 1 ? "" : "s"} to CSV…`)}
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      <main className="flex-1 p-6 pt-4 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by agent, deployment or phone number…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8 h-9 text-sm" />
          </div>

          {/* Direction quick filter */}
          <ToggleGroup
            type="single"
            value={direction}
            onValueChange={(v) => v && setDirection(v as "all" | "in" | "out")}
            aria-label="Filter calls by direction"
            variant="outline"
            size="sm"
          >
            {([["all", "All"], ["in", "Inbound"], ["out", "Outbound"]] as const).map(([v, label]) => (
              <ToggleGroupItem key={v} value={v} aria-label={label}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Filter dropdown — dimensions from the reference */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5"><Filter className="h-3.5 w-3.5" /> Filter</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Call Outcome</DropdownMenuLabel>
              {OUTCOMES.map((o) => (
                <DropdownMenuCheckboxItem key={o} checked={outcomes.has(o)} onCheckedChange={() => toggle(outcomes, setOutcomes, o)} onSelect={(e) => e.preventDefault()}>
                  {o}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Call Status</DropdownMenuLabel>
              {STATUSES.map((s) => (
                <DropdownMenuCheckboxItem key={s} checked={statuses.has(s)} onCheckedChange={() => toggle(statuses, setStatuses, s)} onSelect={(e) => e.preventDefault()}>
                  {s}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Customise View — surface structured-output data points as columns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5"><Columns3 className="h-3.5 w-3.5" /> Customise View</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>View Structured Outputs</DropdownMenuLabel>
              <p className="px-2 pb-1.5 text-xs text-muted-foreground">Added data points show up as columns in the table.</p>
              {OPTIONAL_COLUMNS.map((col) => (
                <DropdownMenuCheckboxItem key={col.key} checked={cols.has(col.key)} onCheckedChange={() => toggle(cols, setCols, col.key)} onSelect={(e) => e.preventDefault()}>
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {direction !== "all" && <FilterChip onClear={() => setDirection("all")}>{direction === "in" ? "Inbound" : "Outbound"}</FilterChip>}
            {[...outcomes].map((o) => <FilterChip key={o} onClear={() => toggle(outcomes, setOutcomes, o)}>Outcome: {o}</FilterChip>)}
            {[...statuses].map((s) => <FilterChip key={s} onClear={() => toggle(statuses, setStatuses, s)}>Status: {s}</FilterChip>)}
            <button onClick={() => { setDirection("all"); setOutcomes(new Set()); setStatuses(new Set()) }} className="text-xs text-muted-foreground hover:text-foreground underline">
              Reset
            </button>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Deployment</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Call Status</TableHead>
                  <TableHead>Call Outcome</TableHead>
                  {OPTIONAL_COLUMNS.filter((col) => cols.has(col.key)).map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open call ${c.id}`}
                    onClick={() => openCall(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        openCall(c)
                      }
                    }}
                  >
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        {c.direction === "in" ? <PhoneIncoming className="h-3.5 w-3.5 text-muted-foreground" /> : <PhoneOutgoing className="h-3.5 w-3.5 text-muted-foreground" />}
                        {c.direction === "in" ? "Inbound" : "Outbound"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{c.timestamp}</TableCell>
                    <TableCell className="text-sm">{c.agent}</TableCell>
                    <TableCell>
                      {c.campaignName === "Dynamic Agent" ? <span className="text-muted-foreground">N/A</span> : (
                        <Link href={deploymentHref(getDeployment(c.campaignId) ?? { id: c.campaignId, kind: "inbound" })} onClick={(e) => e.stopPropagation()} className="text-sm text-primary hover:underline">{c.campaignName}</Link>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.from}</TableCell>
                    <TableCell className="font-mono text-xs">{c.to}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{formatDuration(c.durationSec)}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={OUTCOME_VARIANT[c.outcome]}>{c.outcome}</Badge>
                        {c.outcome === "Failed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 gap-1 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); openCall(c) }}
                            title="Diagnose why this call failed"
                          >
                            <Stethoscope className="h-3 w-3" /> Why?
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    {OPTIONAL_COLUMNS.filter((col) => cols.has(col.key)).map((col) => (
                      <TableCell key={col.key} className="text-sm text-muted-foreground">{structuredValue(c, col.key)}</TableCell>
                    ))}
                  </TableRow>
                ))}
                {visible.length === 0 && (
                  <TableRow><TableCell colSpan={BASE_COLUMNS.length + cols.size} className="text-center text-sm text-muted-foreground py-8">No calls match your filters.</TableCell></TableRow>
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
          <span className="tabular-nums">{rows.length} calls</span>
        </div>
      </main>

      <CallDetailSheet call={selected} open={sheetOpen} onOpenChange={closeSheet} />
    </div>
  )
}

function FilterChip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 pl-2.5 pr-1.5 py-1 text-xs">
      {children}
      <button onClick={onClear} className="text-muted-foreground hover:text-foreground" title="Remove"><X className="h-3 w-3" /></button>
    </span>
  )
}
