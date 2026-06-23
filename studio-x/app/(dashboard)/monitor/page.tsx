"use client"

import * as React from "react"
import Link from "next/link"
import {
  PhoneCall,
  CheckCircle2,
  Clock,
  Timer,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  Wrench,
} from "lucide-react"
import { MonitorNav } from "@/components/monitor-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SeverityBadge } from "@/components/severity-badge"
import { HealthDot } from "@/components/health-dot"
import { FreeMinutesNudge } from "@/components/free-minutes-nudge"
import { cn } from "@/lib/utils"
import {
  DEPLOYMENTS, AGENTS, getDeployment, deploymentHref, listDeployments, STATUS_BADGE,
} from "@/lib/campaign-data"
import { allOpenIssues, deploymentHealth, fixHref } from "@/lib/diagnostics"
import { track, Events, recordRemediation, remediationKey } from "@/lib/analytics"

// ─── KPI sparkline data (wireframe) ──────────────────────────────────────────

const SPARK_DOWN = [42, 40, 44, 38, 30, 33, 36, 34, 28, 26]
const SPARK_FLAT = [60, 62, 61, 63, 64, 63, 65, 64, 66, 67]
const SPARK_UP = [20, 24, 30, 38, 44, 50, 58, 66, 74, 82]

const KPIS = [
  { label: "Answered Calls", value: "120 / 208", delta: "Down by 16%", down: true, icon: PhoneCall, series: SPARK_DOWN },
  { label: "Answer Rate (Avg.)", value: "95%", delta: "Up by 0.4%", down: false, icon: CheckCircle2, series: SPARK_FLAT },
  { label: "Call Duration (Avg.)", value: "5 min", delta: "Up by 4%", down: false, icon: Clock, series: SPARK_FLAT },
  { label: "Call Duration (Total)", value: "5,500 min", delta: "Up by 4%", down: false, icon: Timer, series: SPARK_UP },
]

// ─── Call-status distribution ────────────────────────────────────────────────

const STATUS_SEGMENTS = [
  { label: "Answered", pct: 20, stroke: "stroke-emerald-500", dot: "bg-emerald-500" },
  { label: "Failed", pct: 24, stroke: "stroke-rose-500", dot: "bg-rose-500" },
  { label: "Voicemail", pct: 15, stroke: "stroke-violet-500", dot: "bg-violet-500" },
  { label: "Transferred", pct: 10, stroke: "stroke-amber-500", dot: "bg-amber-500" },
  { label: "Unanswered", pct: 5, stroke: "stroke-sky-500", dot: "bg-sky-500" },
  { label: "Transfer Failed", pct: 1, stroke: "stroke-muted-foreground", dot: "bg-muted-foreground" },
]
const TOTAL_CALLS = 4000

const TOP_AGENTS = [
  { name: "Agent Alpha", sessions: 5432, success: 89 },
  { name: "Agent Beta", sessions: 880, success: 70 },
  { name: "Agent Gamma", sessions: 250, success: 44 },
]

export default function MonitorPage() {
  React.useEffect(() => {
    track(Events.monitor_viewed)
  }, [])

  const [campaignFilter, setCampaignFilter] = React.useState("all")

  // "You're live" confirmation — set when arriving straight from a deploy wizard
  // (?deployed=…). Read window.location.search (not useSearchParams) to avoid a
  // Suspense boundary — same pattern the deploy wizards use for ?agent=.
  const [deployed, setDeployed] = React.useState<{ name: string; channel: string; agent: string } | null>(null)
  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const name = p.get("deployed")
    if (name) setDeployed({ name, channel: p.get("channel") ?? "", agent: p.get("agent") ?? "" })
  }, [])

  // Persistent health surface — survives refresh (data-derived, unlike the
  // transient ?deployed banner). "Needs attention" = the single most severe open
  // issue; "Live deployments" = everything currently carrying traffic.
  const topIssue = React.useMemo(() => allOpenIssues()[0], [])
  const liveDeployments = React.useMemo(
    () => listDeployments().filter((d) => d.status === "active" || d.status === "in_progress"),
    [],
  )

  return (
    <div className="flex flex-col flex-1">
      <MonitorNav
        action={
          <Button variant="outline" size="icon" className="h-8 w-8" title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-5">
        {/* Usage nudge — surfaces the half-tier card prompt (and the paused state)
            on Monitor too, not just the Go Live home. Self-hides under threshold. */}
        <FreeMinutesNudge />

        {deployed && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06] px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {deployed.agent || "Your agent"} is live{deployed.channel ? ` on ${deployed.channel}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                New calls from <span className="font-medium text-foreground">{deployed.name}</span> appear here as they come in.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setDeployed(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Needs attention — the single most severe open issue, with a Fix
            deep-link. The remediation loop's entry point on Monitor. */}
        {topIssue ? (
          <Card className="border-destructive/30">
            <CardContent className="flex flex-wrap items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Needs attention</p>
                  <SeverityBadge severity={topIssue.issue.severity} />
                </div>
                <p className="mt-0.5 text-sm">{topIssue.issue.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{topIssue.issue.rootCause}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  On{" "}
                  <Link href={deploymentHref(topIssue.deployment)} className="font-medium text-foreground hover:underline">
                    {topIssue.deployment.name}
                  </Link>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link
                    href={fixHref(topIssue.issue.fixTarget)}
                    onClick={() => {
                      track(Events.remediation_link_clicked, {
                        rule_id: topIssue.issue.ruleId,
                        severity: topIssue.issue.severity,
                        level: topIssue.issue.fixTarget.level,
                        target_id: topIssue.issue.fixTarget.id,
                        section: topIssue.issue.fixTarget.section,
                        surface: "monitor",
                      })
                      recordRemediation(remediationKey(topIssue.issue.ruleId, topIssue.deployment.id))
                    }}
                  >
                    <Wrench className="h-3.5 w-3.5" /> Fix
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="gap-1.5">
                  <Link href="/monitor/diagnostics">All issues <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 p-4">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm font-medium">All systems healthy</p>
              <p className="text-xs text-muted-foreground">No open issues across your live deployments.</p>
            </CardContent>
          </Card>
        )}

        {/* Live deployments — persistent (survives refresh), unlike the celebratory
            ?deployed banner. Everything currently carrying traffic, with health. */}
        {liveDeployments.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Live deployments</p>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {liveDeployments.length} carrying traffic
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {liveDeployments.map((d) => (
                  <Link
                    key={d.id}
                    href={deploymentHref(d)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary/40"
                  >
                    <HealthDot status={deploymentHealth(d.id).status} />
                    {d.name}
                    <Badge variant={STATUS_BADGE[d.status].variant} className="text-xs">
                      {STATUS_BADGE[d.status].label}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select defaultValue="7d">
            <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {AGENTS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Call Types</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
            </SelectContent>
          </Select>
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All deployments</SelectItem>
              {DEPLOYMENTS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {campaignFilter !== "all" && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={getDeployment(campaignFilter) ? deploymentHref(getDeployment(campaignFilter)!) : "/deploy"}>Open deployment <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                  <k.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-2xl font-semibold tabular-nums">{k.value}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("inline-flex items-center gap-1 text-xs", k.down ? "text-rose-600" : "text-emerald-600")}>
                    {k.down ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {k.delta}
                  </span>
                  <Sparkline series={k.series} up={!k.down} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Donut + task success */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold">Call Status Distribution</p>
              <p className="text-xs text-muted-foreground mb-4">Breakdown of all calls&apos; status</p>
              <div className="flex items-center gap-6">
                <Donut segments={STATUS_SEGMENTS} centerLabel={TOTAL_CALLS.toLocaleString()} centerSub="Total calls" />
                <div className="flex-1 space-y-1.5">
                  {STATUS_SEGMENTS.map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                        {s.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold">Task Success Rate</p>
              <p className="text-xs text-muted-foreground mb-4">Percentage of successful calls out of total answered calls.</p>
              <AreaChart series={[40, 55, 70, 72, 68, 60, 48, 44, 46, 50]} />
            </CardContent>
          </Card>
        </div>

        {/* Top performing agents */}
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold">Top Performing Agents</p>
            <p className="text-xs text-muted-foreground mb-4">Agents ranked by session volume and performance.</p>
            <div className="space-y-2">
              {TOP_AGENTS.map((a, i) => {
                const max = Math.max(...TOP_AGENTS.map((x) => x.sessions))
                const pct = Math.round((a.sessions / max) * 100)
                return (
                  <div key={a.name} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {a.name} <span className="text-xs text-muted-foreground">{a.sessions.toLocaleString()} sessions</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground shrink-0 w-24 text-right">
                      {a.success}% success
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// ─── tiny SVG charts ─────────────────────────────────────────────────────────

function Sparkline({ series, up }: { series: number[]; up: boolean }) {
  const w = 72, h = 24
  const min = Math.min(...series), max = Math.max(...series)
  const range = max - min || 1
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-18" preserveAspectRatio="none" aria-hidden>
      <polyline
        points={pts}
        fill="none"
        strokeWidth={1.5}
        className={up ? "stroke-emerald-500" : "stroke-rose-500"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Donut({
  segments,
  centerLabel,
  centerSub,
}: {
  segments: { label: string; pct: number; stroke: string }[]
  centerLabel: string
  centerSub: string
}) {
  const r = 42
  const c = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.pct, 0) || 1
  let offset = 0
  return (
    <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth={14} className="stroke-muted" />
        {segments.map((s) => {
          const len = (s.pct / total) * c
          const seg = (
            <circle
              key={s.label}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              strokeWidth={14}
              className={s.stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return seg
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold tabular-nums leading-none">{centerLabel}</span>
        <span className="text-xs text-muted-foreground">{centerSub}</span>
      </div>
    </div>
  )
}

function AreaChart({ series }: { series: number[] }) {
  const w = 480, h = 140
  const min = 0, max = 100
  const range = max - min || 1
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * w},${h - ((v - min) / range) * h}`)
  const line = pts.join(" ")
  const area = `0,${h} ${line} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none" role="img" aria-label="Task success rate over time">
      <polygon points={area} className="fill-primary/10" />
      <polyline points={line} fill="none" strokeWidth={2} className="stroke-primary" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
