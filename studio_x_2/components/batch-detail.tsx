"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft, Radio, CalendarClock, OctagonAlert, CheckCircle2, PhoneForwarded,
  RefreshCw, Wrench, ChevronDown, Users, Clock, Gauge, Repeat,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { track, Events } from "@/lib/analytics"
import { HealthDot } from "@/components/health-dot"
import { StateBanner } from "@/components/usage-spend-card"
import { AddLinesSheet } from "@/components/concurrency-card"
import { deploymentHealth } from "@/lib/diagnostics"
import {
  PACING_META, DISPOSITION_META, batchEta, spendStats, PLAN_USAGE,
  type Deployment, type BatchPacing, type CallDisposition,
} from "@/lib/campaign-data"

/**
 * BatchDetail — the batch deployment view (D1, judge winner V2 "reassurance-
 * first" + V1 telemetry grafts; LEARNINGS §20 2026-07-09). Replaces the
 * /deploy/batch-calls/[id] redirect.
 *
 * THE JOB: a slow, throttled batch must read as WORKING, not FAILED. The
 * verdict is one leading sentence (StateBanner) that flips primary↔destructive
 * — "paced" is working-as-designed (never warning tone), "degraded" is a
 * genuine circuit-breaker stop. Every zero-progress moment shows its reason
 * verbatim; the full disposition set is visible (not success/fail binary);
 * the A6 add-lines unlock appears exactly at the wall.
 */

const DISPOSITION_TONE: Record<"good" | "neutral" | "retry" | "bad", string> = {
  good: "bg-success",
  neutral: "bg-muted-foreground",
  retry: "bg-warning",
  bad: "bg-destructive",
}

export function BatchDetail({ deployment: d }: { deployment: Deployment }) {
  const rt = d.batchRuntime
  const pacing: BatchPacing = rt?.pacing ?? "dialing"
  const meta = PACING_META[pacing]
  const eta = batchEta(d)
  const completed = d.progress?.completed ?? 0
  const total = d.progress?.total ?? 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const spend = spendStats(PLAN_USAGE)
  const capHeadroom = spend.capUsd != null ? Math.max(0, spend.capUsd - spend.spentUsd) : null

  // Verdict tone — data-driven from PACING_META (paused = warning, degraded =
  // destructive, paced/dialing = primary). No hardcoded cause.
  const tone = ({
    success: "success", primary: "primary", muted: "primary", warning: "warning", destructive: "destructive",
  } as const)[meta.tone]

  React.useEffect(() => {
    track(Events.batch_detail_viewed, { pacing })
    track(Events.batch_banner_shown, { tone })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isZeroProgress = completed === 0
  const isPaced = pacing === "paced" || pacing === "dialing"
  const needsAttention = pacing === "degraded"

  // Verdict headline — one sentence, the whole point of the view.
  const headline =
    pacing === "paced"
      ? `Working — dialing at capacity. ${rt!.queued.toLocaleString()} queued, none dropped.${eta ? ` ~${eta.minutes} min to finish.` : ""}`
      : pacing === "dialing"
        ? `Working — ${rt?.linesInUse ?? 0} of ${rt?.linesTotal ?? 0} lines dialing.${eta ? ` ~${eta.minutes} min to finish.` : ""}`
        : pacing === "scheduled"
          ? "Scheduled — nothing dials yet."
          : pacing === "degraded"
            ? "Auto-paused — this batch needs attention."
            : pacing === "done"
              ? "Completed."
              : "Paused."

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Page chrome (V1 graft) — reads as a route, not a card */}
      <div className="border-b border-border px-6 py-3">
        <Link href="/monitor" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Monitor
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight">{d.name}</h1>
            {/* Echo the Monitor HealthDot so list and detail agree (fix). */}
            <HealthDot status={deploymentHealth(d.id).status} />
          </div>
          <p className="text-xs text-muted-foreground">
            Batch calls · {d.agentName} · {d.contacts?.rowCount.toLocaleString()} contacts
          </p>
        </div>
        <Badge variant={meta.tone === "destructive" ? "destructive" : meta.tone === "warning" ? "outline" : "secondary"} className="shrink-0">
          {meta.label}
        </Badge>
      </div>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-5">
          {/* ── The verdict: one sentence, tone-flipped ─────────────────── */}
          <StateBanner tone={tone} icon={bannerIcon(pacing)}>
            <p className="text-sm font-medium">{headline}</p>
            {/* Every zero-progress / attention moment shows its reason verbatim (R8) */}
            {rt?.reason && (
              <p className="text-xs text-muted-foreground">{rt.reason}</p>
            )}
            {needsAttention && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" className="gap-1.5" asChild onClick={() => track(Events.batch_fix_trunk_clicked, {})}>
                  <Link href="/integrations?tab=channels"><Wrench className="h-3.5 w-3.5" /> Check the trunk</Link>
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => track(Events.batch_resume_anyway_clicked, {})}>
                  <RefreshCw className="h-3.5 w-3.5" /> Resume anyway
                </Button>
              </div>
            )}
            {isPaced && rt && rt.queued > 0 && (
              <div className="mt-2">
                <AddLinesSheetLauncher capHeadroom={capHeadroom} />
              </div>
            )}
          </StateBanner>

          {/* Scheduled collapses to one card (V1 graft) — no fake telemetry */}
          {pacing === "scheduled" ? (
            <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
              <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium">Nothing dialed yet</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{rt?.reason}</p>
            </div>
          ) : (
            <>
              {/* ── Progress + the live telemetry tiles ─────────────────── */}
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight tabular-nums">
                      {completed.toLocaleString()}
                      <span className="text-base font-normal text-muted-foreground"> / {total.toLocaleString()} dialed</span>
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">{pct}% complete</p>
                  </div>
                  {eta && (
                    <p className="text-right text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3.5 w-3.5" />~{eta.minutes} min left
                    </p>
                  )}
                </div>
                <Progress value={pct} className="mt-3 h-2" />

                {rt && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Tile icon={PhoneForwarded} label="Queued" value={rt.queued.toLocaleString()} sub={rt.maxQueueSec > 0 ? `${rt.maxQueueSec}s longest wait` : undefined} />
                    <Tile icon={Repeat} label="Retrying" value={rt.retry.retrying.toLocaleString()} sub={`up to ${rt.retry.max} attempts`} />
                    <Tile icon={Gauge} label="Dial rate" value={`${rt.cps.actual.toFixed(1)}/s`} sub={`target ${rt.cps.target}/s`} />
                    <Tile icon={Users} label="Lines" value={`${rt.linesInUse}/${rt.linesTotal}`} sub={rt.linesInUse >= rt.linesTotal ? "at capacity" : "with headroom"} />
                  </div>
                )}

                {/* Concurrency meter (V1 graft) — the 10/10 saturation, legible */}
                {rt && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs text-muted-foreground">
                      Concurrency · {rt.linesInUse} of {rt.linesTotal} lines dialing
                    </p>
                    <div
                      role="meter"
                      aria-valuemin={0}
                      aria-valuemax={rt.linesTotal}
                      aria-valuenow={rt.linesInUse}
                      aria-label="Concurrent lines in use"
                      className="h-2 w-full overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className={cn("h-full rounded-full", rt.linesInUse >= rt.linesTotal ? "bg-primary" : "bg-success")}
                        style={{ width: `${rt.linesTotal > 0 ? Math.min(100, (rt.linesInUse / rt.linesTotal) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Full disposition breakdown (R5) — expanded on live batches ── */}
              {rt && Object.keys(rt.dispositions).length > 0 && (
                <DispositionBreakdown dispositions={rt.dispositions} openByDefault={pacing !== "done" ? true : true} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function bannerIcon(p: BatchPacing) {
  if (p === "degraded") return OctagonAlert
  if (p === "scheduled") return CalendarClock
  if (p === "done") return CheckCircle2
  return Radio
}

function Tile({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground tabular-nums">{sub}</p>}
    </div>
  )
}

/** The A6 unlock at the batch wall — headroom threaded from the X1 spend cap. */
function AddLinesSheetLauncher({ capHeadroom }: { capHeadroom: number | null }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button
        size="sm"
        onClick={() => { setOpen(true); track(Events.batch_add_lines_clicked, { cap_headroom_usd: capHeadroom }) }}
      >
        Add lines to clear the queue faster
      </Button>
      <AddLinesSheet
        open={open}
        onOpenChange={setOpen}
        purchased={0}
        queued={0}
        totalLines={10}
        capHeadroomUsd={capHeadroom}
        onCommit={() => setOpen(false)}
      />
    </>
  )
}

function DispositionBreakdown({
  dispositions,
  openByDefault,
}: {
  dispositions: Partial<Record<CallDisposition, number>>
  openByDefault: boolean
}) {
  const [open, setOpen] = React.useState(openByDefault)
  const entries = (Object.entries(dispositions) as [CallDisposition, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
  // Scale bars to the TOTAL (fix) so segment length = true proportion.
  const total = entries.reduce((s, [, n]) => s + n, 0)

  return (
    <Collapsible
      open={open}
      onOpenChange={(o) => { setOpen(o); if (o) track(Events.disposition_breakdown_expanded, {}) }}
      className="rounded-lg border border-border bg-card"
    >
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between px-5 py-3 text-left">
          <span className="text-sm font-medium">Call outcomes</span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {total.toLocaleString()} calls
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {/* One stacked bar — proportion at a glance, 2px surface gaps */}
        <div className="flex h-2 w-full gap-0.5 overflow-hidden px-5">
          {entries.map(([disp, n]) => (
            <div
              key={disp}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", DISPOSITION_TONE[DISPOSITION_META[disp].kind])}
              style={{ width: `${(n / total) * 100}%` }}
            />
          ))}
        </div>
        <div className="space-y-1 p-5 pt-3">
          {entries.map(([disp, n]) => (
            <div key={disp} className="flex items-center gap-2 text-sm">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", DISPOSITION_TONE[DISPOSITION_META[disp].kind])} />
              <span className="flex-1">{DISPOSITION_META[disp].label}</span>
              <span className="tabular-nums text-muted-foreground">
                {n.toLocaleString()} · {Math.round((n / total) * 100)}%
              </span>
            </div>
          ))}
          <p className="pt-2 text-xs text-muted-foreground">
            Busy and no-answer re-enter the retry cadence; disconnected and wrong numbers are
            flagged and skipped, not retried.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
