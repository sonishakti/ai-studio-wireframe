"use client"

import * as React from "react"
import Link from "next/link"
import { Search, Wrench, ArrowUpRight } from "lucide-react"
import { MonitorNav } from "@/components/monitor-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SeverityBadge } from "@/components/severity-badge"
import { HealthDot } from "@/components/health-dot"
import { listDeployments, deploymentHref } from "@/lib/campaign-data"
import { allOpenIssues, deploymentHealth, fixHref } from "@/lib/diagnostics"
import { track, Events } from "@/lib/analytics"

type SevFilter = "all" | "critical" | "warning"

export default function DiagnosticsPage() {
  const [query, setQuery] = React.useState("")
  const [sev, setSev] = React.useState<SevFilter>("all")
  const [pageSize, setPageSize] = React.useState(25)

  const allIssues = React.useMemo(() => allOpenIssues(), [])

  // Deployment-level health roll-up for the summary strip.
  const summary = React.useMemo(() => {
    const statuses = listDeployments().map((d) => deploymentHealth(d.id).status)
    return {
      unhealthy: statuses.filter((s) => s === "unhealthy").length,
      degraded: statuses.filter((s) => s === "degraded").length,
      healthy: statuses.filter((s) => s === "healthy").length,
    }
  }, [])

  React.useEffect(() => {
    track(Events.diagnostics_queue_viewed, { unhealthy: summary.unhealthy, degraded: summary.degraded })
  }, [summary.unhealthy, summary.degraded])

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return allIssues.filter((a) => {
      if (sev !== "all" && a.issue.severity !== sev) return false
      if (q && !a.issue.title.toLowerCase().includes(q) && !a.deployment.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [allIssues, sev, query])

  const visible = rows.slice(0, pageSize)

  return (
    <div className="flex flex-col flex-1">
      <MonitorNav />

      <main className="flex-1 p-6 pt-4 space-y-4">
        {/* Summary — deployment health roll-up. The remediation loop closes here:
            every row routes to the agent/deployment config that fixes it. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm font-medium">Live deployment health</p>
          <HealthDot status="unhealthy" label />
          <span className="-ml-1 text-sm tabular-nums">{summary.unhealthy} unhealthy</span>
          <HealthDot status="degraded" label />
          <span className="-ml-1 text-sm tabular-nums">{summary.degraded} degraded</span>
          <HealthDot status="healthy" label />
          <span className="-ml-1 text-sm tabular-nums">{summary.healthy} healthy</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {rows.length} open issue{rows.length === 1 ? "" : "s"}, ranked by severity × frequency
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search issues or deployments…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
            {([["all", "All"], ["critical", "Critical"], ["warning", "Warning"]] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setSev(v)}
                className={
                  "rounded px-2.5 h-7 text-xs font-medium transition-colors " +
                  (sev === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Deployment</TableHead>
                  <TableHead className="text-right">Occurrences</TableHead>
                  <TableHead className="text-right">Fix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((a) => (
                  <TableRow key={`${a.deployment.id}:${a.issue.ruleId}`}>
                    <TableCell><SeverityBadge severity={a.issue.severity} /></TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{a.issue.title}</p>
                      <p className="text-xs text-muted-foreground">{a.issue.suggestedFix}</p>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={deploymentHref(a.deployment)}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <HealthDot status={deploymentHealth(a.deployment.id).status} />
                        {a.deployment.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{a.count}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <Link
                          href={fixHref(a.issue.fixTarget)}
                          onClick={() =>
                            track(Events.remediation_link_clicked, {
                              rule_id: a.issue.ruleId,
                              severity: a.issue.severity,
                              level: a.issue.fixTarget.level,
                              target_id: a.issue.fixTarget.id,
                              section: a.issue.fixTarget.section,
                              surface: "queue",
                            })
                          }
                        >
                          <Wrench className="h-3.5 w-3.5" /> Fix
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      All clear — no open issues match.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination + cross-link */}
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <Link href="/calls" className="inline-flex items-center gap-1 hover:text-foreground">
            Inspect individual calls <ArrowUpRight className="h-3 w-3 opacity-60" />
          </Link>
          <div className="flex items-center gap-3">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-18"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="tabular-nums">{rows.length} issues</span>
          </div>
        </div>
      </main>
    </div>
  )
}
