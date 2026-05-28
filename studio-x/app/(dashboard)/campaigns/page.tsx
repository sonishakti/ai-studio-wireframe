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
import { CampaignsNav } from "@/components/campaigns-nav"
import { CampaignChannelBadges } from "@/components/campaign-channel-badges"
import { CAMPAIGNS, STATUS_BADGE, type Campaign, type CampaignType } from "@/lib/campaign-data"

type Filter = "all" | CampaignType

export default function CampaignsPage() {
  const [filter, setFilter] = React.useState<Filter>("all")
  const [query, setQuery] = React.useState("")

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return CAMPAIGNS.filter((c) => {
      if (filter !== "all" && c.type !== filter) return false
      if (q && !c.name.toLowerCase().includes(q) && !(c.agentName ?? "").toLowerCase().includes(q)) return false
      return true
    })
  }, [filter, query])

  return (
    <div className="flex flex-col flex-1">
      <CampaignsNav />

      <main className="flex-1 p-6 pt-4">
        {/* Filter chips + search + new */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              All
              <span className="ml-1 text-xs text-muted-foreground tabular-nums">{CAMPAIGNS.length}</span>
            </FilterChip>
            <FilterChip active={filter === "inbound"} onClick={() => setFilter("inbound")}>
              <PhoneIncoming className="h-3.5 w-3.5" />
              Inbound
            </FilterChip>
            <FilterChip active={filter === "outbound"} onClick={() => setFilter("outbound")}>
              <PhoneOutgoing className="h-3.5 w-3.5" />
              Outbound
            </FilterChip>
          </div>

          <div className="relative flex-1 max-w-xs ml-auto">
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
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/campaigns/new">
              <Plus className="h-4 w-4" /> New campaign
            </Link>
          </Button>
        </div>

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
                      No campaigns match your filter.
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

// ─── Subcomponents ───────────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded px-2.5 h-7 text-xs font-medium transition-colors " +
        (active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  )
}

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
