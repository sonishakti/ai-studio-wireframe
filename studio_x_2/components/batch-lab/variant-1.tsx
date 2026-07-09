"use client"

// D1 batch-detail — VARIANT 1 · "Ops console" (dense, telemetry-forward).
// The one job (spec.ts): a slow-but-THROTTLED batch reads as WORKING, not FAILED.
// "Paced" is a first-class, neutral state — visibly DISTINCT from "degraded".
// Everything below is DERIVED from scenario.deployment.batchRuntime + progress;
// nothing is hand-fed per scenario. Mock/static — no timers.

import * as React from "react"
import {
  Activity,
  AlertOctagon,
  ArrowLeft,
  ArrowUpRight,
  Clock,
  Gauge,
  ListChecks,
  PhoneOutgoing,
  Play,
  RefreshCw,
  Timer,
  Wrench,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
// A6 shared moment (R9): the at-the-wall "Add lines" write path lives in
// concurrency-card — reused verbatim so paced-here and the wall-there agree.
import { AddLinesSheet } from "@/components/concurrency-card"
import { type BatchVariantProps } from "./spec"
// PACING_META / DISPOSITION_META / batchEta + the disposition + pacing types are
// the shared runtime vocabulary — they live in the data lib, not the spec.
import {
  PACING_META, DISPOSITION_META, batchEta, CONCURRENCY,
  type CallDisposition, type BatchPacing,
} from "@/lib/campaign-data"

// PACING_META.tone → the actual token class. "paced" resolves to primary here —
// that neutrality (never bg-warning) is the whole feature (R2). One map so the
// header badge and any other tone consumer can never drift.
const TONE_BADGE: Record<
  (typeof PACING_META)[BatchPacing]["tone"],
  "default" | "secondary" | "outline" | "destructive" | "warning"
> = {
  primary: "default",   // Paced / Wrapping up — reads as working, not alarm
  success: "default",
  muted: "secondary",
  warning: "warning",
  destructive: "destructive",
}

// DISPOSITION_META.kind → the stacked-bar / legend token background. good=success,
// retry=warning (in-flight, not a failure), bad=destructive, neutral=muted.
// One source so the bar segment and its legend swatch always match (R5).
const KIND_BG: Record<(typeof DISPOSITION_META)[CallDisposition]["kind"], string> = {
  good: "bg-success",
  retry: "bg-warning",
  bad: "bg-destructive",
  neutral: "bg-muted-foreground",
}

const nf = new Intl.NumberFormat("en-US")

// ETA minutes → "1h 12m" / "34m". Kept local so the KPI cell reads cleanly.
function fmtEta(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function Variant1({ scenario }: BatchVariantProps) {
  const d = scenario.deployment
  const rt = d.batchRuntime
  const [linesOpen, setLinesOpen] = React.useState(false)

  // Every scenario in this lab seeds batchRuntime; guard anyway so the file is
  // safe against any deployment. No runtime → nothing to show.
  if (!rt) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No batch runtime for this deployment.
      </div>
    )
  }

  const meta = PACING_META[rt.pacing]
  const completed = d.progress?.completed ?? 0
  const total = d.progress?.total ?? 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const eta = batchEta(d)
  const isPaced = rt.pacing === "paced"
  const isScheduled = rt.pacing === "scheduled"
  const isDone = rt.pacing === "done"
  // "degraded" the tone is carried by both real pacings that need attention:
  // an active carrier-failure spike ("degraded") OR a circuit-breaker "paused".
  // The seed for B2 is `paused` with a SIP-503 reason — both route here (R6).
  const needsAttention = rt.pacing === "degraded" || rt.pacing === "paused"

  return (
    <div className="flex flex-col">
      {/* ── Header row — always names the pacing + its reason verbatim (R8) ── */}
      <header className="border-b border-border px-6 py-4">
        {/* Back to Monitor — this detail view links back to the Observe idiom
            (monitor/page.tsx) the winner replaces the redirect for. */}
        <a
          href="/monitor"
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Monitor
        </a>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">{d.name}</h1>
              {/* R2: Paced is primary/neutral, NEVER warning. */}
              <Badge variant={TONE_BADGE[meta.tone]} className="gap-1">
                {isPaced && <Activity className="h-3 w-3" aria-hidden />}
                {needsAttention && <AlertOctagon className="h-3 w-3" aria-hidden />}
                {meta.label}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <PhoneOutgoing className="mr-1 inline h-3 w-3 align-[-1px]" aria-hidden />
              {d.agentName}
              <span className="mx-1.5 text-border">·</span>
              {d.channel.kind === "telephony" ? d.channel.numbers[0] : d.channel.kind}
              <span className="mx-1.5 text-border">·</span>
              {d.contacts?.fileName ?? "contacts"}
            </p>
          </div>

          {/* Live controls — a running ops surface keeps a refresh + resume within
              reach; resume only makes sense on a stopped batch. */}
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Refresh
            </Button>
            {needsAttention && (
              <Button size="sm" className="gap-1.5">
                <Play className="h-3.5 w-3.5" aria-hidden />
                Resume
              </Button>
            )}
          </div>
        </div>

        {/* Reason line — ALWAYS visible, verbatim from the runtime (R8). It is
            the sentence that makes "paced" legible as working, and "degraded"
            legible as broken. Tone-tinted so the eye reads state before words. */}
        <p
          className={cn(
            "mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
            needsAttention
              ? "border-destructive/30 bg-destructive/[0.06] text-foreground"
              : "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {needsAttention ? (
            <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          ) : (
            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <span>{rt.reason}</span>
        </p>
      </header>

      {/* ── SCHEDULED — the whole body collapses. No fabricated metrics on a
          batch that hasn't dialed (spec B1 must): reason + "starts when". ── */}
      {isScheduled ? (
        <div className="px-6 py-10">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Clock className="h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">Nothing has dialed yet</p>
              <p className="max-w-md text-xs text-muted-foreground">{rt.reason}</p>
              <p className="mt-1 text-sm tabular-nums">
                Starts <span className="font-medium">{d.startDate}</span>
                <span className="mx-1.5 text-border">·</span>
                <span className="text-muted-foreground">{nf.format(total)} contacts queued</span>
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-5 px-6 py-5">
          {/* ── DEGRADED / PAUSED banner — destructive, names the cause, links
              the fix + resume. Visibly a different class of thing from paced. ── */}
          {needsAttention && (
            <Card className="border-destructive/40 bg-destructive/[0.04]">
              <CardContent className="flex flex-wrap items-start gap-3 p-4">
                <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{meta.label} — carrier failures spiked</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{rt.reason}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/* R6: link the FIX (trunk CPS/connect), then an informed Resume. */}
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href="/realtime-services">
                      <Wrench className="h-3.5 w-3.5" aria-hidden />
                      Check the trunk
                    </a>
                  </Button>
                  <Button size="sm" className="gap-1.5">
                    <Play className="h-3.5 w-3.5" aria-hidden />
                    Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── DONE — the completed-partial summary leads (spec B3 must): honest
              connected-vs-flagged, not a blanket success. ── */}
          {isDone && (
            <Card>
              <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {nf.format(rt.dispositions.completed ?? 0)}
                    <span className="text-base font-normal text-muted-foreground">
                      {" / "}{nf.format(total)} connected
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Completed {d.startDate ? `· started ${d.startDate}` : ""}
                  </p>
                </div>
                <Separator orientation="vertical" className="hidden h-10 sm:block" />
                <p className="max-w-md text-sm text-muted-foreground">{rt.reason}</p>
              </CardContent>
            </Card>
          )}

          {/* ── KPI strip — the live breakdown (R1): not one "Sent" counter but
              completed/queued/dialing/eta/cps/retrying side by side. ── */}
          <KpiStrip
            completed={completed}
            total={total}
            pct={pct}
            queued={rt.queued}
            linesInUse={rt.linesInUse}
            linesTotal={rt.linesTotal}
            eta={eta ? fmtEta(eta.minutes) : "—"}
            cpsActual={rt.cps.actual}
            cpsTarget={rt.cps.target}
            retrying={rt.retry.retrying}
            retryMax={rt.retry.max}
          />

          {/* ── Concurrency gauge — ON the batch view (R3), role=meter. ── */}
          <ConcurrencyGauge inUse={rt.linesInUse} total={rt.linesTotal} maxQueueSec={rt.maxQueueSec} />

          {/* ── PACED add-lines — the A6 at-the-wall unlock (R9). Only when paced:
              the queue is building because every line is busy, so more lines is
              the real lever. Reuses AddLinesSheet so it matches the wall exactly. ── */}
          {isPaced && (
            <Card className="border-primary/30 bg-primary/[0.03]">
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <Gauge className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Queue building — {nf.format(rt.queued)} calls waiting for a free line
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All {rt.linesTotal} lines are dialing. Calls queue, they don&apos;t drop.
                    Add lines to clear the queue faster.
                  </p>
                </div>
                <Button size="sm" className="shrink-0 gap-1.5" onClick={() => setLinesOpen(true)}>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  Add lines
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Disposition breakdown — stacked bar + legend, full set (R5). ── */}
          <DispositionBreakdown dispositions={rt.dispositions} />

          {/* ── Recent calls — a mock table driven by the disposition tallies. ── */}
          <RecentCalls dispositions={rt.dispositions} retryMax={rt.retry.max} avgSec={d.metrics.avgHandleTimeSec} />
        </div>
      )}

      {/* A6 sheet — the identical write path used at the account wall (R9). Queue
          and totals come straight from this batch's runtime. */}
      <AddLinesSheet
        open={linesOpen}
        onOpenChange={setLinesOpen}
        purchased={CONCURRENCY.purchased}
        queued={rt.queued}
        totalLines={rt.linesTotal}
        capHeadroomUsd={null}
        onCommit={() => setLinesOpen(false)}
      />
    </div>
  )
}

// ─── KPI strip ────────────────────────────────────────────────────────────────
// Dense, tabular-nums, monospaced numerals so columns of digits line up — the
// ops-console idiom. Each cell is one telemetry channel; the whole strip is R1.

function KpiStrip(props: {
  completed: number; total: number; pct: number
  queued: number; linesInUse: number; linesTotal: number
  eta: string; cpsActual: number; cpsTarget: number
  retrying: number; retryMax: number
}) {
  const items: { icon: React.ElementType; label: string; value: React.ReactNode; sub?: string }[] = [
    {
      icon: ListChecks,
      label: "Completed",
      value: <>{nf.format(props.completed)}<span className="text-muted-foreground"> / {nf.format(props.total)}</span></>,
      sub: `${props.pct}%`,
    },
    { icon: Clock, label: "Queued", value: nf.format(props.queued), sub: "waiting for a line" },
    {
      icon: PhoneOutgoing,
      label: "Dialing",
      value: <>{props.linesInUse}<span className="text-muted-foreground"> / {props.linesTotal}</span></>,
      sub: "lines in use",
    },
    { icon: Timer, label: "ETA", value: props.eta, sub: "at current pace" },
    {
      icon: Gauge,
      label: "CPS",
      value: <>{props.cpsActual.toFixed(1)}<span className="text-muted-foreground"> / {props.cpsTarget.toFixed(1)}</span></>,
      sub: "actual / target",
    },
    { icon: RefreshCw, label: "Retrying", value: nf.format(props.retrying), sub: `attempt ≤${props.retryMax}` },
  ]

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => (
        <div key={it.label} className="bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <it.icon className="h-3.5 w-3.5" aria-hidden />
            {it.label}
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums leading-none">{it.value}</div>
          {it.sub && <div className="mt-1 text-xs tabular-nums text-muted-foreground">{it.sub}</div>}
        </div>
      ))}
    </div>
  )
}

// ─── Concurrency gauge (R3) ─────────────────────────────────────────────────
// role=meter, mirrors concurrency-card's a11y contract (aria-valuemin/max/now +
// aria-labelledby). Lives ON the batch view, not buried in account analytics.

function ConcurrencyGauge({ inUse, total, maxQueueSec }: { inUse: number; total: number; maxQueueSec: number }) {
  const labelId = React.useId()
  const pct = total > 0 ? Math.min(100, Math.round((inUse / total) * 100)) : 0
  const atWall = inUse >= total && total > 0
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <p id={labelId} className="text-xs font-medium tabular-nums">
            Concurrency — {inUse} of {total} lines dialing
          </p>
          <span className="text-xs tabular-nums text-muted-foreground">
            longest wait {maxQueueSec}s
          </span>
        </div>
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={Math.min(inUse, total)}
          aria-labelledby={labelId}
          className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted"
        >
          {/* At-the-wall uses primary (working-as-designed), never a warning red —
              a full gauge is the paced state, not a fault. */}
          <div
            className={cn("h-full rounded-full transition-all", atWall ? "bg-primary" : "bg-success")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {atWall
            ? "Every line busy — additional calls queue until one frees up."
            : "Headroom available — new calls dial immediately."}
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Disposition breakdown (R5) ─────────────────────────────────────────────
// Horizontal stacked bar + legend. Each segment is a token bg with a 2px SURFACE
// gap between it and the next (border-2 border-card) so adjacent colors never
// bleed — the ops-console "clearly delineated" look. good/retry/bad/neutral map
// to success/warning/destructive/muted-foreground via KIND_BG.

function DispositionBreakdown({ dispositions }: { dispositions: Partial<Record<CallDisposition, number>> }) {
  // Order by kind so the bar reads good → neutral → retry → bad, left to right.
  const KIND_ORDER: Record<string, number> = { good: 0, neutral: 1, retry: 2, bad: 3 }
  const rows = (Object.entries(dispositions) as [CallDisposition, number][])
    .filter(([, n]) => n > 0)
    .sort(([a], [b]) => KIND_ORDER[DISPOSITION_META[a].kind] - KIND_ORDER[DISPOSITION_META[b].kind])
  const total = rows.reduce((s, [, n]) => s + n, 0)

  if (total === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">No dispositions yet.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Disposition breakdown</p>
          <span className="text-xs tabular-nums text-muted-foreground">{nf.format(total)} calls</span>
        </div>

        {/* The bar. Segments carry a 2px surface-colored gap (border-2 border-card)
            so the token backgrounds stay visually separated without a hardcoded
            color. flex-basis is the share; a min width keeps tiny slices visible. */}
        <div className="flex h-7 w-full overflow-hidden rounded-md" role="img"
          aria-label={rows.map(([k, n]) => `${DISPOSITION_META[k].label} ${n}`).join(", ")}>
          {rows.map(([k, n], i) => {
            const share = (n / total) * 100
            return (
              <div
                key={k}
                className={cn(
                  KIND_BG[DISPOSITION_META[k].kind],
                  "h-full min-w-[2px]",
                  i > 0 && "border-l-2 border-card",
                )}
                style={{ flexBasis: `${share}%` }}
                title={`${DISPOSITION_META[k].label}: ${nf.format(n)}`}
              />
            )
          })}
        </div>

        {/* Legend — swatch (same KIND_BG token) + label + count. */}
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
          {rows.map(([k, n]) => (
            <div key={k} className="flex items-center justify-between gap-2 text-sm">
              <span className="inline-flex min-w-0 items-center gap-2">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", KIND_BG[DISPOSITION_META[k].kind])} aria-hidden />
                <span className="truncate text-muted-foreground">{DISPOSITION_META[k].label}</span>
              </span>
              <span className="tabular-nums">{nf.format(n)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Recent calls (R5, in the list) ─────────────────────────────────────────
// A mock 10-row feed DERIVED from the disposition tallies: each row's disposition
// is drawn from the weighted mix, so the table always mirrors the batch above it
// (a degraded batch shows carrier-failed rows; a paced one shows completed/queued).
// Numbers/durations are deterministic (seeded by index) — no timers, no Math.random.

function RecentCalls({
  dispositions, retryMax, avgSec,
}: {
  dispositions: Partial<Record<CallDisposition, number>>
  retryMax: number
  avgSec: number
}) {
  // Build a weighted pool from the tallies, then walk it deterministically so the
  // 10 rows reflect the real mix without pulling a live event stream.
  const pool = (Object.entries(dispositions) as [CallDisposition, number][]).filter(([, n]) => n > 0)
  const poolTotal = pool.reduce((s, [, n]) => s + n, 0)

  const rows = React.useMemo(() => {
    if (poolTotal === 0) return []
    return Array.from({ length: 10 }, (_, i) => {
      // Deterministic pick: spread the 10 rows across the cumulative distribution.
      const target = ((i + 0.5) / 10) * poolTotal
      let acc = 0
      let disp: CallDisposition = pool[0][0]
      for (const [k, n] of pool) {
        acc += n
        if (target <= acc) { disp = k; break }
      }
      const kind = DISPOSITION_META[disp].kind
      // Attempt count: retry-kind rows are mid-cadence; bad/good are first pass.
      const attempt = kind === "retry" ? ((i % retryMax) + 1) : 1
      // Duration: connected/good calls run near avg; unanswered/failed are short.
      const dur = kind === "good" ? avgSec - 20 + (i % 5) * 9 : kind === "neutral" ? 24 + (i % 4) * 7 : (i % 3) * 4
      return {
        number: `+1 (415) 555-${(1200 + i * 37).toString().slice(-4)}`,
        disp,
        attempt,
        dur,
      }
    })
    // pool derives from dispositions; recomputing on that identity is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolTotal, retryMax, avgSec])

  if (rows.length === 0) return null

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">Recent calls</p>
          <a href="/calls" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            All calls <ArrowUpRight className="h-3 w-3" aria-hidden />
          </a>
        </div>
        <Separator />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Disposition</TableHead>
              <TableHead className="text-right">Attempt</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs tabular-nums">{r.number}</TableCell>
                <TableCell>
                  <DispositionBadge disp={r.disp} />
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {r.attempt}/{retryMax}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {r.dur > 0 ? `${Math.floor(r.dur / 60)}m ${(r.dur % 60).toString().padStart(2, "0")}s` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Per-row disposition pill — kind → badge variant. retry uses `warning` (in
// cadence, not a failure), bad uses `destructive`, good uses default (primary),
// neutral uses secondary. Same good/neutral/retry/bad taxonomy as the bar.
function DispositionBadge({ disp }: { disp: CallDisposition }) {
  const kind = DISPOSITION_META[disp].kind
  const variant =
    kind === "good" ? "default"
    : kind === "bad" ? "destructive"
    : kind === "retry" ? "warning"
    : "secondary"
  return <Badge variant={variant}>{DISPOSITION_META[disp].label}</Badge>
}
