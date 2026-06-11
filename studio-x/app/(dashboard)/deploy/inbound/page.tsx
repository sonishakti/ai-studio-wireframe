"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Search, MoreHorizontal, PhoneIncoming } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import { ChannelBadge } from "@/components/campaign-channel-badges"
import { DeployNav } from "@/components/deploy-nav"
import { listDeployments, STATUS_BADGE, type Deployment } from "@/lib/campaign-data"

// Inbound deployments — the agent ANSWERS on a channel. One agent ↔ one
// channel per deployment (2026-06-11). Peer of Batch Calls in the Deploy hub.
export default function InboundPage() {
  const [query, setQuery] = React.useState("")

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return listDeployments({ kind: "inbound" }).filter(
      (d) => !q || d.name.toLowerCase().includes(q) || d.agentName.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="flex flex-col flex-1">
      <DeployNav
        action={
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/deploy/inbound/new"><Plus className="h-4 w-4" /> New inbound</Link>
          </Button>
        }
      />

      <main className="flex-1 p-6 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search inbound deployments…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        {rows.length === 0 && !query ? (
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <PhoneIncoming className="h-7 w-7 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">No inbound deployments yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Put an agent on a phone number, web widget, or WhatsApp sender to start answering.
              </p>
              <Button size="sm" className="gap-1.5" asChild>
                <Link href="/deploy/inbound/new"><Plus className="h-4 w-4" /> New inbound deployment</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deployment</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Answers on</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="w-[48px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((d) => (
                    <InboundRow key={d.id} deployment={d} />
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                        No inbound deployments match your search.
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

function answersOn(d: Deployment): string {
  switch (d.channel.kind) {
    case "telephony": return d.channel.numbers.join(", ")
    case "whatsapp": return d.channel.sender
    case "sms": return d.channel.number
    case "web": return d.channel.domains.join(", ")
  }
}

function InboundRow({ deployment: d }: { deployment: Deployment }) {
  const s = STATUS_BADGE[d.status]
  return (
    <TableRow>
      <TableCell>
        <Link href={`/deploy/inbound/${d.id}`} className="font-medium hover:text-primary transition-colors">
          {d.name}
        </Link>
      </TableCell>
      <TableCell><ChannelBadge channel={d.channel} withLabel /></TableCell>
      <TableCell className="text-sm text-muted-foreground font-mono text-xs">{answersOn(d)}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{d.agentName}</TableCell>
      <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
      <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
        {d.ringsPerWeek ? `${d.ringsPerWeek.toLocaleString()}/wk` : "—"}
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
              <Link href={`/deploy/inbound/${d.id}`}>Open</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>{d.status === "active" ? "Pause" : "Resume"}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DestructiveActionDialog
              action="Delete"
              resource="deployment"
              resourceId={d.id}
              resourceName={d.name}
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
