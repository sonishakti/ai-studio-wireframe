"use client"

// D1 batch-lab — VARIANT 3 · "Timeline / flow" (the pipeline mental model).
// ───────────────────────────────────────────────────────────────────────────
// The batch is drawn as calls actually MOVE, left→right:
//   Total → Queued → Dialing → Connected → [outcomes fan out]
// The whole point of this variant: "queued, not dropped" becomes SPATIAL — you
// can SEE calls stacked at the Queued node instead of reading a scary counter.
// That is exactly the paced-vs-failed distinction the feature exists to sell
// (spec R1/R2/R8): a capped batch is working, and the flow shows it working.
//
// Style contract (hard): only @/components/ui/*, lucide, design tokens (no hex,
// no arbitrary [Npx]/[0.0x]), tabular-nums on every count. The flow is plain
// flex/grid boxes + arrow glyphs — NOT a hand-rolled <svg> diagram. Mock/static.

import * as React from "react"
import {
  ArrowRight,
  CornerDownLeft,
  X,
  Pause,
  Play,
  Plus,
  CalendarClock,
  Clock,
  Gauge,
  PhoneOutgoing,
  Layers,
  Wrench,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
// R9 — the A6 "at-the-wall" add-lines unlock is the SAME sheet used on Billing,
// so the paced moment and the money surface can never diverge.
import { AddLinesSheet } from "@/components/concurrency-card"
import {
  PACING_META,
  DISPOSITION_META,
  batchEta,
  CONCURRENCY,
  spendStats,
  type CallDisposition,
} from "@/lib/campaign-data"
import type { BatchVariantProps } from "./spec"

// ─── Tone → token classes ────────────────────────────────────────────────────
// PACING_META/DISPOSITION_META speak in semantic tones; these maps are the ONE
// place that turns a tone into token classes, so "Paced" stays primary (working)
// and never leaks a warning color. No literal colors anywhere below.
type Tone = "success" | "primary" | "muted" | "warning" | "destructive"

const TONE_TEXT: Record<Tone, string> = {
  success: "text-success",
  primary: "text-primary",
  muted: "text-muted-foreground",
  warning: "text-warning",
  destructive: "text-destructive",
}
const TONE_DOT: Record<Tone, string> = {
  success: "bg-success",
  primary: "bg-primary",
  muted: "bg-muted-foreground",
  warning: "bg-warning",
  destructive: "bg-destructive",
}
const TONE_CHIP: Record<Tone, string> = {
  success: "border-success/40 bg-success/10 text-success",
  primary: "border-primary/40 bg-primary/10 text-primary",
  muted: "border-border bg-muted text-muted-foreground",
  warning: "border-warning/40 bg-warning/10 text-warning",
  destructive: "border-destructive/40 bg-destructive/10 text-destructive",
}
const TONE_BANNER: Record<Tone, string> = {
  success: "border-success/40 bg-success/5",
  primary: "border-primary/40 bg-primary/5",
  muted: "border-border bg-muted/40",
  warning: "border-warning/40 bg-warning/5",
  destructive: "border-destructive/40 bg-destructive/5",
}
const TONE_RING: Record<Tone, string> = {
  success: "ring-1 ring-success/40 border-success/50",
  primary: "ring-1 ring-primary/40 border-primary/50",
  muted: "border-border",
  warning: "ring-1 ring-warning/40 border-warning/50",
  destructive: "ring-1 ring-destructive/40 border-destructive/50",
}
const TONE_FILL: Record<Tone, string> = {
  success: "bg-success",
  primary: "bg-primary",
  muted: "bg-muted-foreground",
  warning: "bg-warning",
  destructive: "bg-destructive",
}

// DISPOSITION_META.kind → tone. Retries are warning (in a loop, not lost),
// bad outcomes are destructive, good is success, everything else muted.
const KIND_TONE: Record<"good" | "neutral" | "retry" | "bad", Tone> = {
  good: "success",
  neutral: "muted",
  retry: "warning",
  bad: "destructive",
}

const n = (v: number) => v.toLocaleString()

function fmtEta(min: number): string {
  if (min < 60) return `~${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `~${h}h ${m}m` : `~${h}h`
}

// ─── One flow node (a box in the pipeline) ───────────────────────────────────
function FlowNode({
  label,
  count,
  tone = "muted",
  sub,
  emphasize,
  dimmed,
  wide,
  footer,
}: {
  label: string
  count: number
  tone?: Tone
  sub?: React.ReactNode
  /** Colored ring to pull the eye to THIS node (queue when paced, carrier when degraded). */
  emphasize?: Tone
  dimmed?: boolean
  wide?: boolean
  footer?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border bg-card px-3 py-2.5",
        wide ? "w-full" : "w-28 shrink-0",
        emphasize ? TONE_RING[emphasize] : "border-border",
        dimmed && "opacity-40",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[tone])} aria-hidden />
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-xl font-semibold leading-none tabular-nums", TONE_TEXT[tone])}>
        {n(count)}
      </span>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      {footer}
    </div>
  )
}

// Spine connector — an arrow glyph, deliberately not an SVG path.
function Arrow() {
  return (
    <div className="flex shrink-0 items-center px-0.5 text-muted-foreground" aria-hidden>
      <ArrowRight className="h-4 w-4" />
    </div>
  )
}

// A thin token gauge (CPS / lines). role=meter for the numeric pair above it.
function MiniGauge({
  icon: Icon,
  label,
  value,
  pct,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  pct: number
  tone: Tone
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label}
        </span>
        <span className="text-xs font-medium tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", TONE_FILL[tone])}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  )
}

export function Variant3({ scenario }: BatchVariantProps) {
  const d = scenario.deployment
  const rt = d.batchRuntime
  const [sheetOpen, setSheetOpen] = React.useState(false)
  // Pause/Resume is an affordance demo (mock backend): clicking it confirms the
  // intent inline rather than rewriting the seeded flow — the counts stay
  // truthful to the fixture. aria-live announces the confirmation.
  const [note, setNote] = React.useState<string | null>(null)

  // Batch scenarios (B0–B3) always carry runtime; guard for the type only.
  if (!rt) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No batch runtime for this deployment.
        </CardContent>
      </Card>
    )
  }

  // ── Derive the state once; every section reads these. ──────────────────────
  const meta = PACING_META[rt.pacing]
  // An auto-pause triggered by carrier failures is NOT a benign user pause — it
  // reads as degraded (needs attention), the opposite pole from "paced".
  const autoPaused =
    rt.pacing === "paused" && /(automatic|carrier|sip|trunk|fail)/i.test(rt.reason)
  const attention = rt.pacing === "degraded" || autoPaused
  const tone: Tone = attention ? "destructive" : meta.tone
  const running = rt.pacing === "dialing" || rt.pacing === "paced" || rt.pacing === "draining"
  const paced = rt.pacing === "paced"
  const scheduled = rt.pacing === "scheduled"
  const done = rt.pacing === "done"

  const total = d.progress?.total ?? 0
  const completed = d.progress?.completed ?? 0
  const remaining = Math.max(0, total - completed)
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const disp = rt.dispositions
  // "Connected" = calls that reached the far end (a person or a machine). It is a
  // superset of "Completed" (script finished) — annotated so the two don't read
  // as a double-count.
  const connected = (disp.completed ?? 0) + (disp.voicemail ?? 0)

  const eta = batchEta(d)
  const spend = spendStats()
  const capHeadroom = spend.capUsd != null ? Math.max(0, spend.capUsd - spend.spentUsd) : null

  // Canonical outcome set — always rendered (0-count nodes dim) so the pipeline
  // keeps the SAME shape across every scenario; you learn the flow once.
  const FAN: CallDisposition[] = [
    "completed",
    "voicemail",
    "no-answer",
    "busy",
    "disconnected",
    "wrong-number",
    "carrier-failed",
  ]

  const banner = TONE_BANNER[tone]

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-5 p-5">
        {/* ── Header: what this batch is + overall progress ─────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <PhoneOutgoing className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <h2 className="truncate text-base font-semibold tracking-tight">{d.name}</h2>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {d.agentName} · {d.contacts?.fileName ?? "batch"} ·{" "}
              {d.channel.kind === "telephony" ? d.channel.numbers[0] : d.channel.kind}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">
              {n(completed)} <span className="text-muted-foreground">/ {n(total)}</span>
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">{pct}% dialed</p>
          </div>
        </div>

        {/* Overall progress rail — tone follows the state (primary while working,
            destructive when it needs attention), so the bar itself signals mood. */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", TONE_FILL[attention ? "destructive" : running ? "primary" : "muted"])}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* ── Pacing banner: the prominent labeled chip + one-line reason ──
            This is the whole thesis. "Paced" is a primary/working chip, never a
            warning (R2). Degraded flips the same slot to destructive (R6). */}
        <div className={cn("rounded-lg border px-4 py-3", banner)}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold",
                  TONE_CHIP[tone],
                )}
              >
                <span
                  className={cn("h-2 w-2 rounded-full", TONE_DOT[tone], running && "animate-pulse")}
                  aria-hidden
                />
                {attention && rt.pacing === "paused" ? "Auto-paused" : meta.label}
              </span>
              {attention && (
                <p className="text-sm font-medium text-destructive">This batch needs attention.</p>
              )}
              {/* R8 — the reason is shown verbatim, on EVERY state incl. zero-progress. */}
              <p className="text-sm text-foreground">{rt.reason}</p>
            </div>
            {/* R6 — degraded links the fix directly. */}
            {attention && (
              <Button variant="link" size="sm" className="h-auto shrink-0 gap-1 p-0 text-xs text-destructive">
                <Wrench className="h-3.5 w-3.5" />
                Review trunk CPS
              </Button>
            )}
          </div>
        </div>

        {/* ── THE FLOW — Total → Queued → Dialing → Connected → outcomes ───
            Scrolls horizontally on narrow screens; the pipeline never wraps so
            the left→right story stays intact. Scheduled dims it under an overlay. */}
        <div className="relative">
          <div className="overflow-x-auto pb-1">
            <div className={cn("flex min-w-max items-stretch gap-2", scheduled && "opacity-40")}>
              {/* 1 — the whole list */}
              <FlowNode label="Total" count={total} tone="muted" sub="in list" />
              <Arrow />

              {/* 2 — QUEUED. When paced this is the hero: calls are WAITING for a
                  free line, not failing. Emphasized + the add-lines unlock sits
                  right here (R9), where the bottleneck actually is. */}
              <FlowNode
                label="Queued"
                count={rt.queued}
                tone={paced ? "primary" : attention ? "destructive" : "muted"}
                emphasize={paced ? "primary" : undefined}
                sub={
                  rt.maxQueueSec > 0 ? (
                    <span className="tabular-nums">longest wait {Math.round(rt.maxQueueSec / 60)}m</span>
                  ) : (
                    "none waiting"
                  )
                }
                footer={
                  paced ? (
                    <Button
                      size="sm"
                      className="mt-0.5 h-7 w-full gap-1 text-xs"
                      onClick={() => setSheetOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add lines
                    </Button>
                  ) : undefined
                }
              />
              <Arrow />

              {/* 3 — DIALING now. linesInUse/linesTotal makes the ceiling literal:
                  10/10 is WHY the queue is building — the cause is visible. */}
              <FlowNode
                label="Dialing"
                count={rt.linesInUse}
                tone={running ? "primary" : "muted"}
                sub={
                  <span className="tabular-nums">
                    {rt.linesInUse}/{rt.linesTotal} lines
                  </span>
                }
              />
              <Arrow />

              {/* 4 — CONNECTED (reached a person/machine) — the pivot the
                  outcomes fan from. Superset of Completed; labeled so. */}
              <FlowNode label="Connected" count={connected} tone="primary" sub="answered" />
              <Arrow />

              {/* 5 — OUTCOMES fan out. Same 7 nodes every time; retries loop back,
                  exits are terminal (✕), carrier-failed inflates when degraded. */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" aria-hidden />
                    Outcomes
                  </span>
                  {/* R4 — live retry attempt counter, front and center. */}
                  {rt.retry.retrying > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-warning tabular-nums">
                      <CornerDownLeft className="h-3.5 w-3.5" />
                      {n(rt.retry.retrying)} retrying · attempt ≤{rt.retry.max}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {FAN.map((key) => {
                    const dm = DISPOSITION_META[key]
                    const count = disp[key] ?? 0
                    const isRetry = key === "no-answer" || key === "busy"
                    const isExit = key === "disconnected" || key === "wrong-number"
                    const isCarrier = key === "carrier-failed"
                    // R6 — in a degraded batch the carrier-failed node inflates
                    // (spans the row) and turns destructive: the flow shows WHERE
                    // it's breaking, not just THAT it broke.
                    const carrierHot = isCarrier && attention && count > 0
                    const nodeTone: Tone = carrierHot ? "destructive" : KIND_TONE[dm.kind]

                    return (
                      <div key={key} className={carrierHot ? "col-span-2" : undefined}>
                        <FlowNode
                          wide
                          label={dm.label}
                          count={count}
                          tone={nodeTone}
                          dimmed={count === 0}
                          emphasize={carrierHot ? "destructive" : undefined}
                          sub={
                            isRetry ? (
                              <span className="inline-flex items-center gap-1 text-warning">
                                <CornerDownLeft className="h-3 w-3" />
                                retry, attempt ≤{rt.retry.max}
                              </span>
                            ) : isExit ? (
                              <span className="inline-flex items-center gap-1 text-destructive">
                                <X className="h-3 w-3" />
                                flagged, not retried
                              </span>
                            ) : carrierHot ? (
                              <span className="font-medium text-destructive">
                                SIP 503 — breaking here
                              </span>
                            ) : undefined
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled — no "failed" framing on an unstarted batch (R8). The flow
              is dimmed under a plain "starts <when>" overlay stating the reason. */}
          {scheduled && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-sm rounded-lg border border-border bg-card/95 px-5 py-4 text-center shadow-sm">
                <CalendarClock className="mx-auto mb-2 h-5 w-5 text-muted-foreground" aria-hidden />
                <p className="text-sm font-semibold">Starts {d.startDate}</p>
                <p className="mt-1 text-xs text-muted-foreground">{rt.reason}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Foot: live ETA · CPS gauge · lines gauge · Pause/Resume ──────
            R7 (ETA from pace×queue) + R3 (concurrency gauge lives ON the view). */}
        <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center">
          {/* ETA / terminal summary */}
          <div className="flex items-center gap-2 sm:w-40">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-semibold tabular-nums">
                {eta ? fmtEta(eta.minutes) : done ? "Finished" : scheduled ? d.startDate : "—"}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {eta
                  ? `${n(remaining)} left at this pace`
                  : done
                    ? "batch complete"
                    : scheduled
                      ? "waiting for window"
                      : "not dialing"}
              </p>
            </div>
          </div>

          {/* Gauges — CPS achieved vs target, and lines in use vs total. */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <MiniGauge
              icon={Gauge}
              label="CPS"
              value={`${rt.cps.actual.toFixed(1)} / ${rt.cps.target.toFixed(1)}`}
              pct={rt.cps.target > 0 ? (rt.cps.actual / rt.cps.target) * 100 : 0}
              tone={attention ? "destructive" : running ? "primary" : "muted"}
            />
            <MiniGauge
              icon={PhoneOutgoing}
              label="Lines"
              value={`${rt.linesInUse} / ${rt.linesTotal}`}
              pct={rt.linesTotal > 0 ? (rt.linesInUse / rt.linesTotal) * 100 : 0}
              // At the ceiling the lines gauge goes primary — full is DESIGNED,
              // not an error (mirrors the paced chip).
              tone={rt.linesInUse >= rt.linesTotal && rt.linesInUse > 0 ? "primary" : "muted"}
            />
          </div>

          {/* Pause / Resume — the control state follows the flow. Resume from a
              degraded/auto-pause is INFORMED: the fix note rides alongside. */}
          {!done && !scheduled && (
            <div className="shrink-0">
              {running ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setNote("Pausing — in-flight calls finish; the queue holds, nothing drops.")}
                >
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="gap-1.5"
                  variant={attention ? "outline" : "default"}
                  onClick={() =>
                    setNote(
                      attention
                        ? "Resuming — check the trunk's CPS limit first, or failures will spike again."
                        : "Resuming — calls dial as lines free up.",
                    )
                  }
                >
                  <Play className="h-3.5 w-3.5" />
                  Resume
                </Button>
              )}
            </div>
          )}
        </div>

        {note && (
          <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
            {note}
          </p>
        )}

        {/* Done — honest completion: connected vs flagged, straight from the
            reason line (R5/partial-completion). Kept terse; the fan above already
            carries the full disposition breakdown. */}
        {done && (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="text-sm font-medium">Completed — partial</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{rt.reason}</p>
          </div>
        )}
      </CardContent>

      {/* R9 — the shared add-lines sheet. Free tier here (no cap) → null headroom. */}
      <AddLinesSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        purchased={CONCURRENCY.purchased}
        queued={rt.queued}
        totalLines={rt.linesTotal}
        capHeadroomUsd={capHeadroom}
        onCommit={() => {
          setSheetOpen(false)
          setNote("Lines added — the queue clears faster; nothing was dropped.")
        }}
      />
    </Card>
  )
}
