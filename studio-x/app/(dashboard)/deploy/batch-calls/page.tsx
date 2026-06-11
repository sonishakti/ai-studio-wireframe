"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Search, MoreHorizontal, PhoneOutgoing, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import { DeployNav } from "@/components/deploy-nav"
import { listDeployments, STATUS_BADGE, type Deployment } from "@/lib/campaign-data"

// Batch Calls — outbound CSV dialing (the renamed "Campaigns"). Each batch is
// one agent on one telephony channel, dialing an uploaded contact list whose
// columns become the {{vars}} available to the batch's prompt.
export default function BatchCallsPage() {
  const [query, setQuery] = React.useState("")

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return listDeployments({ kind: "batch" }).filter(
      (d) => !q || d.name.toLowerCase().includes(q) || d.agentName.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="flex flex-col flex-1">
      <DeployNav
        action={
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/deploy/batch-calls/new"><Plus className="h-4 w-4" /> New batch</Link>
          </Button>
        }
      />

      <main className="flex-1 p-6 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search batches…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        {rows.length === 0 && !query ? (
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <PhoneOutgoing className="h-7 w-7 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">No batch calls yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Upload a contact CSV and your agent dials the list — columns become
                prompt variables automatically.
              </p>
              <Button size="sm" className="gap-1.5" asChild>
                <Link href="/deploy/batch-calls/new"><Plus className="h-4 w-4" /> New batch</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="w-[48px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((d) => (
                    <BatchRow key={d.id} deployment={d} />
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                        No batches match your search.
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

function BatchRow({ deployment: d }: { deployment: Deployment }) {
  const s = STATUS_BADGE[d.status]
  const pct =
    d.progress && d.progress.total > 0
      ? Math.round((d.progress.completed / d.progress.total) * 100)
      : null

  return (
    <TableRow>
      <TableCell>
        <Link href={`/deploy/batch-calls/${d.id}`} className="font-medium hover:text-primary transition-colors">
          {d.name}
        </Link>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{d.agentName}</TableCell>
      <TableCell>
        {d.contacts ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileSpreadsheet className="h-3 w-3" />
            {d.contacts.rowCount.toLocaleString()} rows · {d.contacts.columns.length} vars
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
      <TableCell className="text-right tabular-nums text-sm">
        {d.metrics.calls > 0 ? d.metrics.calls.toLocaleString() : "—"}
      </TableCell>
      <TableCell className="min-w-[140px]">
        {pct !== null ? (
          <>
            <Progress value={pct} className="h-1.5 w-28" />
            <p className="text-xs text-muted-foreground tabular-nums mt-1">
              {d.progress!.completed.toLocaleString()} / {d.progress!.total.toLocaleString()}
            </p>
          </>
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
              <Link href={`/deploy/batch-calls/${d.id}`}>Open</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {d.status === "in_progress" || d.status === "active" ? "Pause" : "Resume"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DestructiveActionDialog
              action="Delete"
              resource="batch"
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
