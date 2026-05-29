"use client"

import * as React from "react"
import Link from "next/link"
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Search,
  Filter,
  Download,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { CAMPAIGNS, formatDuration, CHANNEL_LABEL } from "@/lib/campaign-data"

// ─── synthesize cross-campaign call history ─────────────────────────────────

type CallRow = {
  id: string
  campaignId: string
  campaignName: string
  direction: "in" | "out"
  channel: "telephony" | "whatsapp" | "sms" | "web"
  from: string
  to: string
  duration: number
  outcome: "resolved" | "transferred" | "no_answer" | "completed" | "failed"
  startedAt: string
}

function generateCalls(): CallRow[] {
  const contacts = [
    "+1 (415) 555-2199",
    "+1 (628) 555-1077",
    "+44 7700 900123",
    "+1 (212) 555-8801",
    "+1 (650) 555-4422",
    "+1 (415) 555-3340",
  ]
  const outcomes: CallRow["outcome"][] = ["resolved", "transferred", "no_answer", "completed", "failed"]
  const rows: CallRow[] = []
  let idCounter = 1
  for (const c of CAMPAIGNS) {
    if (c.metrics.calls === 0) continue
    const sampleSize = Math.min(8, Math.max(2, Math.round(c.metrics.calls / 300)))
    for (let i = 0; i < sampleSize; i++) {
      const ch = c.channels[i % c.channels.length]
      rows.push({
        id: `call_${idCounter++}`,
        campaignId: c.id,
        campaignName: c.name,
        direction: c.type === "inbound" ? "in" : "out",
        channel: ch.kind,
        from: c.type === "inbound" ? contacts[i % contacts.length] : "+1 (415) 555-0240",
        to: c.type === "inbound" ? "+1 (415) 555-0101" : contacts[i % contacts.length],
        duration: 30 + Math.round(Math.random() * 280),
        outcome: outcomes[i % outcomes.length],
        startedAt: `${(i + 1) * 7} min ago`,
      })
    }
  }
  return rows
}

const CALLS = generateCalls()

const OUTCOME_BADGE: Record<CallRow["outcome"], { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
  resolved: { variant: "default", label: "Resolved" },
  transferred: { variant: "secondary", label: "Transferred" },
  no_answer: { variant: "outline", label: "No answer" },
  completed: { variant: "outline", label: "Completed" },
  failed: { variant: "destructive", label: "Failed" },
}

export default function CallHistoryPage() {
  const [query, setQuery] = React.useState("")
  const [direction, setDirection] = React.useState<"all" | "in" | "out">("all")

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return CALLS.filter((c) => {
      if (direction !== "all" && c.direction !== direction) return false
      if (!q) return true
      return (
        c.campaignName.toLowerCase().includes(q) ||
        c.from.toLowerCase().includes(q) ||
        c.to.toLowerCase().includes(q)
      )
    })
  }, [query, direction])

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Call History"
        description="Every call across every campaign — searchable, filterable, exportable."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      <main className="flex-1 p-6 pt-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
            <FilterChip active={direction === "all"} onClick={() => setDirection("all")}>
              All <span className="text-muted-foreground tabular-nums">{CALLS.length}</span>
            </FilterChip>
            <FilterChip active={direction === "in"} onClick={() => setDirection("in")}>
              <PhoneIncoming className="h-3.5 w-3.5" /> Inbound
            </FilterChip>
            <FilterChip active={direction === "out"} onClick={() => setDirection("out")}>
              <PhoneOutgoing className="h-3.5 w-3.5" /> Outbound
            </FilterChip>
          </div>

          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search number, campaign…"
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
                  <TableHead className="w-[36px]"></TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => {
                  const o = OUTCOME_BADGE[c.outcome]
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        {c.direction === "in" ? (
                          <PhoneIncoming className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <PhoneOutgoing className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.from}</TableCell>
                      <TableCell className="font-mono text-xs">{c.to}</TableCell>
                      <TableCell>
                        <Link
                          href={`/campaigns/${c.campaignId}`}
                          className="text-sm hover:text-primary transition-colors"
                        >
                          {c.campaignName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {CHANNEL_LABEL[c.channel]}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatDuration(c.duration)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={o.variant}>{o.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {c.startedAt}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      <PhoneCall className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                      No calls match your filter.
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
