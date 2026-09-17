"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  BarChart3,
  PhoneForwarded,
} from "lucide-react"
import { MonitorNav } from "@/components/monitor-nav"
import { CallCaptureSheet } from "@/components/call-capture-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SeverityBadge } from "@/components/severity-badge"
import { HealthDot } from "@/components/health-dot"
import { FreeMinutesNudge } from "@/components/free-minutes-nudge"
import { MetricCard } from "@/components/metric-section"
import { Sparkline } from "@/components/sparkline"
import { MetricWatchSheet, WatchButton } from "@/components/metric-watch-sheet"
import { DesignFocus } from "@/components/design-focus"
import {
  DEPLOYMENTS, AGENTS, getDeployment, deploymentHref, listDeployments, STATUS_BADGE,
  type DeploymentKind,
} from "@/lib/campaign-data"
import { allOpenIssues, deploymentHealth, fixHref } from "@/lib/diagnostics"
import { track, Events, recordRemediation, remediationKey } from "@/lib/analytics"
import {
  ANSWER_SPEED, METRIC_DEFS, formatMetric, monitorSummary,
  type MetricKey, type MonitorRange,
} from "@/lib/monitor-metrics"
import {
  SAME_WINDOW, WINDOW_PHRASE, describeWatch, evaluateWatches, listWatches,
  type Watch, type WatchIncident,
} from "@/lib/monitor-watches"

// ─── Words ───────────────────────────────────────────────────────────────────

const RANGE_LABEL: Record<MonitorRange, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
}

/** The window a delta compares against. 90 days spans the whole series, so it
 *  has no earlier period and the tile says so. */
const PRIOR_PHRASE: Record<MonitorRange, string> = {
  "24h": "the previous 24 hours",
  "7d": "the previous 7 days",
  "30d": "the previous 30 days",
  "90d": "",
}

/** The four tiles that carry a number, in reading order. */
const METRIC_ORDER: MetricKey[] = ["total_calls", "answered_calls", "answer_rate", "handle_time"]

const isRange = (v: string | null): v is MonitorRange =>
  v === "24h" || v === "7d" || v === "30d" || v === "90d"

/** Small counts read as words in a sentence. Anything larger keeps its digits. */
const WORD = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"]

/** How much of the filtered set is behind the number. Silent when every
 *  deployment in view has carried a call: there is nothing to qualify. */
function coverageLine(coverage: { counted: number; total: number }): string | undefined {
  const quiet = coverage.total - coverage.counted
  if (quiet <= 0) return undefined
  const word = WORD[quiet] ?? String(quiet)
  return `Counts ${coverage.counted} of ${coverage.total} deployments. ${word} took no calls.`
}

/** The delta line under a tile: a rate moves in points, everything else in
 *  percent, and a window with nothing before it says that instead. */
function deltaLine(key: MetricKey, value: number | null, prior: number | null, range: MonitorRange): string | undefined {
  if (value === null) return undefined
  if (prior === null || !PRIOR_PHRASE[range]) return "No prior period to compare"
  const against = PRIOR_PHRASE[range]
  if (key === "answer_rate") {
    const points = Math.round(value) - Math.round(prior)
    if (points === 0) return `No change from ${against}`
    return `${points > 0 ? "Up" : "Down"} ${Math.abs(points)} point${Math.abs(points) === 1 ? "" : "s"} from ${against}`
  }
  if (prior === 0) return `No change from ${against}`
  const pct = Math.round(((value - prior) / prior) * 100)
  if (pct === 0) return `No change from ${against}`
  return `${pct > 0 ? "Up" : "Down"} ${Math.abs(pct)}% from ${against}`
}

/** The headline on the Needs attention card, in both of its states. */
function incidentTitle(inc: WatchIncident): string {
  const def = METRIC_DEFS[inc.watch.metricKey]
  const be = def.count ? "are" : "is"
  if (inc.state === "resolved") {
    if (inc.watch.comparison === "no_calls") return `${def.label} ${be} coming in again`
    const side = inc.watch.comparison === "below" ? "above" : "below"
    const limit =
      inc.watch.basis === "previous"
        ? "the period before"
        : formatMetric(inc.watch.metricKey, inc.watch.threshold)
    return `${def.label} ${be} back ${side} ${limit}`
  }
  if (inc.watch.comparison === "no_calls") return `${def.label} dropped to zero`
  const verb = inc.watch.comparison === "below" ? "dropped" : "rose"
  return `${def.label} ${verb} ${describeWatch(inc.watch)}`
}

/** "412 over the last hour on Collections Outreach." */
function incidentLine(inc: WatchIncident): string {
  return `${formatMetric(inc.watch.metricKey, inc.value)} ${WINDOW_PHRASE[inc.watch.frequency]} on ${inc.deployment.name}.`
}

export default function MonitorPage() {
  React.useEffect(() => {
    track(Events.monitor_viewed)
  }, [])

  // ── Filters. All four are controlled and all four feed one derivation, so
  // every number on this page comes out of the same window.
  const [range, setRange] = React.useState<MonitorRange>("7d")
  const [kind, setKind] = React.useState<DeploymentKind | "all">("all")
  const [agentId, setAgentId] = React.useState("all")
  const [deploymentId, setDeploymentId] = React.useState("all")
  const [tick, setTick] = React.useState(0)
  const reload = React.useCallback(() => setTick((t) => t + 1), [])

  // ?range= survives a refresh and travels in a shared link — window.location on
  // mount, the same idiom the ?deployed banner below uses (no Suspense bail-out).
  React.useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("range")
    if (isRange(r)) setRange(r)
  }, [])

  const changeRange = (next: MonitorRange) => {
    setRange(next)
    const url = new URL(window.location.href)
    url.searchParams.set("range", next)
    window.history.replaceState(null, "", url.toString())
  }

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
  // transient ?deployed banner). "Needs attention" = the breach if a watch has
  // one, otherwise the single most severe open issue.
  const topIssue = React.useMemo(() => allOpenIssues()[0], [])
  const liveDeployments = React.useMemo(
    () => listDeployments().filter((d) => d.status === "active" || d.status === "in_progress"),
    [],
  )

  // Every number on the page, from one window. Refresh re-runs it.
  const summary = React.useMemo(() => {
    void tick
    return monitorSummary({ range, kind, agentId, deploymentId })
  }, [range, kind, agentId, deploymentId, tick])

  // Watches live in localStorage, which is empty on the server: reading them in
  // an effect keeps the first client render identical to the server's.
  // evaluateWatches ADVANCES each watch's state, so it runs once per tick.
  const [watches, setWatches] = React.useState<Watch[]>([])
  const [incident, setIncident] = React.useState<WatchIncident | null>(null)
  React.useEffect(() => {
    setWatches(listWatches())
    setIncident(evaluateWatches()[0] ?? null)
  }, [tick])

  // The watch's scope is whatever the deployment filter names; with the filter on
  // all deployments the sheet asks for one.
  const scope = deploymentId === "all" ? null : deploymentId
  const watchOn = (key: MetricKey): Watch | undefined =>
    scope ? watches.find((w) => w.metricKey === key && w.deploymentId === scope) : undefined

  const [watchMetric, setWatchMetric] = React.useState<MetricKey | null>(null)

  // Real traffic signal — sum of calls across every deployment. A brand-new
  // account (auto-provisioned Aria, zero traffic) has 0 here, so we must NOT
  // show fabricated KPIs / charts. Gate the whole analytics block on it.
  const totalCalls = React.useMemo(
    () => DEPLOYMENTS.reduce((sum, d) => sum + d.metrics.calls, 0),
    [],
  )
  const hasTraffic = totalCalls > 0
  const answeredPct = summary.calls > 0 ? (summary.answered / summary.calls) * 100 : 0

  return (
    <div className="flex flex-col flex-1">
      {/* A review link (?focus=…) opens at the control it names. */}
      <DesignFocus />
      <MonitorNav
        action={
          <>
            {/* Capture config lives HERE (owner 2026-07-17): what calls
                record is a monitoring concern, not a builder step. */}
            <CallCaptureSheet />
            <Button
              variant="outline" size="icon" className="h-8 w-8" title="Refresh"
              onClick={reload}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="sr-only">Refresh</span>
            </Button>
          </>
        }
      />

      <main className="flex-1 p-6 space-y-5">
        {/* Usage nudge — surfaces the half-tier card prompt (and the paused state)
            on Monitor too, not just the Go Live home. Self-hides under threshold. */}
        <FreeMinutesNudge />

        {deployed && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-success/40 bg-success/[0.06] px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
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

        {/* Needs attention — a watch that has something to say outranks the
            diagnosed queue, because the user asked for that one by name. */}
        {incident ? (
          incident.state === "open" ? (
            <Card className="border-destructive/30">
              <CardContent className="flex flex-wrap items-start gap-3 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Needs attention</p>
                  <p className="mt-0.5 text-sm">{incidentTitle(incident)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{incidentLine(incident)}</p>
                  {incident.cause ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Top cause {SAME_WINDOW[incident.watch.frequency]}: {incident.cause.issue.title}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {incident.cause ? (
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <Link
                        href={fixHref(incident.cause.issue.fixTarget)}
                        onClick={() => {
                          const cause = incident.cause!
                          track(Events.alert_fix_opened, {
                            metric: incident.watch.metricKey,
                            deployment_id: incident.deployment.id,
                            rule_id: cause.issue.ruleId,
                          })
                          track(Events.remediation_link_clicked, {
                            rule_id: cause.issue.ruleId,
                            severity: cause.issue.severity,
                            level: cause.issue.fixTarget.level,
                            target_id: cause.issue.fixTarget.id,
                            section: cause.issue.fixTarget.section,
                            surface: "monitor",
                          })
                          recordRemediation(remediationKey(cause.issue.ruleId, incident.deployment.id))
                        }}
                      >
                        <Wrench className="h-3.5 w-3.5" /> Fix
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <Link href={`/calls?deployment=${incident.deployment.id}`}>
                        <PhoneForwarded className="h-3.5 w-3.5" /> See the calls
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-success/40">
              <CardContent className="flex flex-wrap items-start gap-3 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{incidentTitle(incident)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{incidentLine(incident)}</p>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setIncident(null)}>
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )
        ) : topIssue ? (
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

        {!hasTraffic ? (
          /* First-run — zero traffic. Don't fabricate KPIs/charts; point forward. */
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No calls yet</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Once your live deployments start carrying traffic, answer rates, call
                distribution, and per-agent performance will show up here.
              </p>
              <Button asChild size="sm" className="mt-1 gap-1.5">
                <Link href="/deploy">Go to deployments <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
        <>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={range} onValueChange={(v) => changeRange(v as MonitorRange)}>
            <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(RANGE_LABEL) as MonitorRange[]).map((r) => (
                <SelectItem key={r} value={r}>{RANGE_LABEL[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {AGENTS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={kind} onValueChange={(v) => setKind(v as DeploymentKind | "all")}>
            <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All call types</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="batch">Outbound</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deploymentId} onValueChange={setDeploymentId}>
            <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All deployments</SelectItem>
              {DEPLOYMENTS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {deploymentId !== "all" && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={getDeployment(deploymentId) ? deploymentHref(getDeployment(deploymentId)!) : "/deploy"}>Open deployment <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          )}
        </div>

        {/* The tiles. Four numbers the contract returns, then the one it does
            not: each says where it came from, and carries its own watch. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METRIC_ORDER.map((key) => {
            const def = METRIC_DEFS[key]
            const value = summary.values[key]
            const series = summary.series[key]
            const outboundGap = key === "answer_rate" && value === null
            const mute = value === null || summary.calls === 0
            const muteValue = outboundGap
              ? "Not available for inbound calls"
              : key === "handle_time" && summary.calls > 0
                ? "No answered calls yet"
                : "No calls yet"
            return (
              <MetricCard
                key={key}
                label={def.label}
                definition={def.definition}
                value={mute ? muteValue : formatMetric(key, value as number)}
                mute={mute}
                delta={mute ? undefined : deltaLine(key, value, summary.prior[key], range)}
                deltaPositive={
                  !mute && summary.prior[key] !== null && (value as number) >= (summary.prior[key] as number)
                }
                sub={key === "total_calls" && !mute ? coverageLine(summary.coverage) : undefined}
                chart={!mute && series.length > 1 ? <Sparkline data={series} height={40} /> : undefined}
                action={
                  mute ? undefined : (
                    <WatchButton
                      watch={watchOn(key)}
                      focusId={key === "answered_calls" ? "watch-answered-calls" : undefined}
                      onClick={() => setWatchMetric(key)}
                    />
                  )
                }
              />
            )
          })}

          {/* The fifth row: a call records when it started and when it ended,
              and nothing in between. It keeps its place and shows no number. */}
          <MetricCard
            label={ANSWER_SPEED.label}
            definition={ANSWER_SPEED.definition}
            value="Requires Engine"
            mute
          />
        </div>

        {/* Call outcomes — two segments, both counts, summing to the call total. */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Call outcomes</p>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatMetric("total_calls", summary.calls)} calls
              </span>
            </div>
            {summary.calls === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No calls yet</p>
            ) : (
              <>
                <div
                  className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`Answered ${summary.answered}, no answer ${summary.noAnswer}`}
                >
                  <div className="bg-primary" style={{ width: `${answeredPct}%` }} />
                  <div className="bg-muted-foreground/30" style={{ width: `${100 - answeredPct}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Answered
                    <span className="tabular-nums text-muted-foreground">
                      {formatMetric("answered_calls", summary.answered)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    No answer
                    <span className="tabular-nums text-muted-foreground">
                      {formatMetric("total_calls", summary.noAnswer)}
                    </span>
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        </>
        )}
      </main>

      {watchMetric ? (
        <MetricWatchSheet
          open
          onOpenChange={(o) => { if (!o) setWatchMetric(null) }}
          metricKey={watchMetric}
          deploymentId={scope}
          summary={summary}
          onSaved={reload}
        />
      ) : null}
    </div>
  )
}
