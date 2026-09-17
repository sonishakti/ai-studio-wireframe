"use client"

import * as React from "react"
import Link from "next/link"
import { Search, ArrowUpRight, ShieldCheck } from "lucide-react"
import { MonitorNav } from "@/components/monitor-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { HealthDot } from "@/components/health-dot"
import { IssueCard } from "@/components/call-detail-sheet"
import { listDeployments, deploymentHref } from "@/lib/campaign-data"
import { allOpenIssues, deploymentHealth } from "@/lib/diagnostics"
import { track, Events } from "@/lib/analytics"

type SevFilter = "all" | "critical" | "warning"

export default function DiagnosticsPage() {
  const [query, setQuery] = React.useState("")
  const [sev, setSev] = React.useState<SevFilter>("all")
  const [pageSize, setPageSize] = React.useState(25)
  const [page, setPage] = React.useState(0)

  // Deep link (?sev=critical|warning) — the sidebar's needs-attention badge
  // lands here pre-filtered. window.location on mount, same idiom as the
  // wizard's param parsing (no Suspense bail-out).
  React.useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("sev")
    if (s === "critical" || s === "warning") setSev(s)
  }, [])

  const allIssues = React.useMemo(() => allOpenIssues(), [])

  // Deployment-level health roll-up for the summary strip. Only deployments that
  // are actually running: a draft, a paused batch and a scheduled one have no
  // health to report, and counting them is how a strip headed "Live" came to
  // report twelve.
  const summary = React.useMemo(() => {
    const statuses = listDeployments()
      .filter((d) => d.status === "active" || d.status === "in_progress")
      .map((d) => deploymentHealth(d.id).status)
    return {
      unhealthy: statuses.filter((s) => s === "unhealthy").length,
      degraded: statuses.filter((s) => s === "degraded").length,
      healthy: statuses.filter((s) => s === "healthy").length,
      noData: statuses.filter((s) => s === "no_data").length,
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

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pageCount - 1)
  const visible = rows.slice(current * pageSize, current * pageSize + pageSize)

  // A narrowed feed starts at its own first page, never on a page that no
  // longer exists.
  React.useEffect(() => { setPage(0) }, [sev, query, pageSize])

  return (
    <div className="flex flex-col flex-1">
      <MonitorNav />

      <main className="flex-1 p-6 pt-4 space-y-4">
        {/* Summary — deployment health roll-up. The remediation loop closes here:
            every issue routes to the config that fixes it, then re-checks. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm font-medium">Deployment health</p>
          <HealthDot status="unhealthy" label />
          <span className="-ml-1 text-sm tabular-nums">{summary.unhealthy} unhealthy</span>
          <HealthDot status="degraded" label />
          <span className="-ml-1 text-sm tabular-nums">{summary.degraded} degraded</span>
          <HealthDot status="healthy" label />
          <span className="-ml-1 text-sm tabular-nums">{summary.healthy} healthy</span>
          <HealthDot status="no_data" label />
          <span className="-ml-1 text-sm tabular-nums">{summary.noData} no data</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {rows.length} open issue{rows.length === 1 ? "" : "s"} from the last 7 days of calls, ranked by severity × frequency
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
          <ToggleGroup
            type="single"
            value={sev}
            onValueChange={(v) => v && setSev(v as SevFilter)}
            aria-label="Filter issues by severity"
            variant="outline"
            size="sm"
          >
            {([["all", "All"], ["critical", "Critical"], ["warning", "Warning"]] as const).map(([v, label]) => (
              <ToggleGroupItem key={v} value={v} aria-label={label}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Issue feed — same IssueCard as the call Diagnosis tab (rootCause +
            suggested fix + Fix deep-link + the confirm step). */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <p className="text-sm font-medium">All clear</p>
            <p className="text-xs text-muted-foreground">No open issues match. Your live deployments are healthy.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((a) => (
              <div key={`${a.deployment.id}:${a.issue.ruleId}`} className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <Link
                    href={deploymentHref(a.deployment)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <HealthDot status={deploymentHealth(a.deployment.id).status} />
                    {a.deployment.name}
                  </Link>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {a.count} occurrence{a.count === 1 ? "" : "s"}
                  </span>
                </div>
                <IssueCard issue={a.issue} surface="queue" deploymentId={a.deployment.id} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination + cross-link */}
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <Link href="/calls" className="inline-flex items-center gap-1 hover:text-foreground">
            Inspect individual calls <ArrowUpRight className="h-3 w-3 opacity-60" />
          </Link>
          <div className="flex items-center gap-3">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="tabular-nums">{rows.length} issues</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="sm" className="h-8"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline" size="sm" className="h-8"
                disabled={current >= pageCount - 1}
                onClick={() => setPage(current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
