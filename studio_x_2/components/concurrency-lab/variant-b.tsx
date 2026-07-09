"use client"

import * as React from "react"
import {
  CheckCircle2,
  ListOrdered,
  Minus,
  Plus,
  ShieldCheck,
  Timer,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { spendStats } from "@/lib/campaign-data"
import {
  INCLUDED_LINES,
  LINE_PRICE_USD,
  type ConcurrencyVariantProps,
} from "@/components/concurrency-lab/spec"

/**
 * VariantB — "Limits panel with live gauge" (Retell-style, A6 concurrency lab).
 * Full-width panel that REPLACES the small "Concurrent channels" quota card on
 * Billing › Usage › Quotas. Left = evidence (live gauge + 24h utilization +
 * included/purchased split + queue disclosure). Right = the write path
 * (inline stepper — no sheet — with live prorated math, a quiet reduce path,
 * and the spend-cap reconciliation).
 *
 * Requirement mapping (spec.ts R1–R8):
 *  R1 included vs purchased never merged → split gauge groups + two labeled
 *     counts; the post-purchase total is always "N included + M purchased".
 *  R2 instant apply → success banner says "live now" + prorated charge.
 *  R3 gauge sits in the same panel, left of the buy control.
 *  R4 queue-at-the-wall disclosure renders in EVERY scenario, under the gauge.
 *  R5 wall banner LEADS with the quantified fix, primary tone (info, no alarm).
 *  R6 more lines ≠ higher cap; time-to-cap at 100% utilization, live with qty.
 *  R7 reduce path always documented; when purchased > 0 it's actionable with
 *     prorated-credit math and no penalty tone.
 *  R8 tokens only; role="meter" + labels; sparkline is currentColor.
 */

// $/min PAYG rate — same constant X1 (usage-spend-card) traces every $ to.
const PAYG_RATE = 0.1

// Mock batch backlog driving the wall math: 330 queued × 3.2 min avg makes
// "+5 lines" land at ≈35 min sooner from 10 lines — the spec's example figure.
const MOCK_QUEUED_CALLS = 330
const MOCK_AVG_CALL_MIN = 3.2

// Fixed 24h hourly-utilization mock (%) — evidence for the "busy" case must be
// history, not urgency copy. Two 100% peaks are the whole argument.
const UTILIZATION_24H = [
  18, 12, 10, 8, 14, 22, 35, 48, 62, 78, 100, 92,
  74, 66, 58, 70, 88, 100, 84, 60, 42, 30, 24, 20,
]

function usd(n: number, cents = true) {
  return cents ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString()}`
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

// Time-to-cap reads in minutes near the wall, hours further out.
function fmtDuration(mins: number) {
  return mins >= 90 ? `~${(mins / 60).toFixed(1)} h` : `~${Math.round(mins)} min`
}

// Minutes for the mock backlog to drain at N concurrent lines.
function backlogMinutes(lines: number) {
  return (MOCK_QUEUED_CALLS * MOCK_AVG_CALL_MIN) / lines
}

// ─── Scenario → mock-local UI state ─────────────────────────────────────────
// 'purchased' renders the moment AFTER buying (banner pre-seeded); 'downgrade'
// opens the reduce path. Everything else derives at render time.

type UiState = {
  scenarioId: string
  purchased: number
  addQty: number
  justAdded: { qty: number; chargeUsd: number } | null
  justReduced: { qty: number; creditUsd: number } | null
  reduceOpen: boolean
  reduceQty: number
}

function initialUi(id: string, proratePerLine: number): UiState {
  const purchased = id === "purchased" || id === "downgrade" ? 5 : 0
  return {
    scenarioId: id,
    purchased,
    // At the wall the stepper pre-loads the quantified suggestion (+5).
    addQty: id === "wall" ? 5 : 1,
    justAdded:
      id === "purchased"
        ? { qty: 5, chargeUsd: round2(5 * proratePerLine) }
        : null,
    justReduced: null,
    reduceOpen: id === "downgrade",
    reduceQty: purchased,
  }
}

export function VariantB({ scenario }: ConcurrencyVariantProps) {
  const usage = scenario.usage
  const spend = spendStats(usage)

  const remainingDays = usage.periodDaysTotal - usage.periodDaysElapsed
  // Retell-parity proration: charge only the remaining slice of this cycle.
  const proratePerLine = (LINE_PRICE_USD * remainingDays) / usage.periodDaysTotal

  const [ui, setUi] = React.useState<UiState>(() =>
    initialUi(scenario.id, proratePerLine),
  )
  // Reset when the harness swaps scenarios (adjust-state-during-render pattern).
  if (ui.scenarioId !== scenario.id) {
    setUi(initialUi(scenario.id, proratePerLine))
  }

  const total = INCLUDED_LINES + ui.purchased
  const liveUsed = Math.min(scenario.liveUsed, total)
  const atWall = liveUsed >= total
  const busy = !atWall && liveUsed / total >= 0.75

  // R6 — reconciliation previews the total the stepper is contemplating: even
  // then, the cap holds. headroom / (lines × $0.10/min) = minutes to cap_hit.
  const capUsd = spend.capUsd ?? usage.defaultSpendCapUsd
  const headroomUsd = Math.max(0, capUsd - spend.spentUsd)
  const previewTotal = total + ui.addQty
  const minsToCapAtFull = headroomUsd / (previewTotal * PAYG_RATE)

  // R5 — the fix, quantified from the mock backlog, live with the stepper qty.
  const minsSooner = Math.round(backlogMinutes(total) - backlogMinutes(total + ui.addQty))

  const chargeNowUsd = round2(ui.addQty * proratePerLine)
  const creditUsd = round2(ui.reduceQty * proratePerLine)

  const peaks = UTILIZATION_24H.filter((v) => v >= 100).length
  const gaugeLabelId = React.useId()

  function addLines() {
    setUi((prev) => ({
      ...prev,
      purchased: prev.purchased + prev.addQty,
      justAdded: { qty: prev.addQty, chargeUsd: round2(prev.addQty * proratePerLine) },
      justReduced: null,
      reduceQty: prev.purchased + prev.addQty,
      addQty: 1,
    }))
  }

  function reduceLines() {
    setUi((prev) => {
      const qty = Math.min(prev.reduceQty, prev.purchased)
      return {
        ...prev,
        purchased: prev.purchased - qty,
        justReduced: { qty, creditUsd: round2(qty * proratePerLine) },
        justAdded: null,
        reduceOpen: false,
        reduceQty: Math.max(1, prev.purchased - qty),
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm">Concurrent lines</CardTitle>
        <CardDescription className="text-xs mt-0.5">
          How many calls this project can run at once · {spend.periodLabel}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
        {/* ══ LEFT — evidence: banner, live gauge, 24h history, disclosure ══ */}
        <div className="space-y-4">
          {/* R5 — at the wall the FIX leads, primary tone: information, not alarm */}
          {atWall && (
            <PanelBanner tone="primary" icon={Timer}>
              <p className="text-sm font-medium tabular-nums">
                +{ui.addQty} lines ≈ this batch finishes ~{minsSooner} min sooner.
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                All {total} lines are in use, so new batch calls are queueing —
                nothing drops or fails. ~{MOCK_QUEUED_CALLS} calls waiting at
                ~{MOCK_AVG_CALL_MIN} min each; lines added on the right go live
                instantly.
              </p>
            </PanelBanner>
          )}

          {/* R2 — instant apply: "live now" + the prorated charge, in one breath */}
          {ui.justAdded && (
            <PanelBanner tone="success" icon={CheckCircle2}>
              <p className="text-sm font-medium tabular-nums">
                {ui.justAdded.qty} added {ui.justAdded.qty === 1 ? "line is" : "lines are"} live
                now — {total} total ({INCLUDED_LINES} included + {ui.purchased} purchased).
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                ~{usd(ui.justAdded.chargeUsd)} prorated for the {remainingDays} days
                left this cycle, then {usd(ui.purchased * LINE_PRICE_USD, false)}/mo.
                Reduce anytime for a prorated credit.
              </p>
            </PanelBanner>
          )}

          {/* R7 — the downgrade confirmation mirrors the purchase one: no penalty tone */}
          {ui.justReduced && (
            <PanelBanner tone="success" icon={CheckCircle2}>
              <p className="text-sm font-medium tabular-nums">
                {ui.justReduced.qty} purchased {ui.justReduced.qty === 1 ? "line" : "lines"} removed
                — {total} total ({INCLUDED_LINES} included + {ui.purchased} purchased).
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                ~{usd(ui.justReduced.creditUsd)} credit for the {remainingDays} unused
                days lands on your next invoice. Nothing else changes.
              </p>
            </PanelBanner>
          )}

          {/* Live number — doubles as the meter's accessible label (R8) */}
          <div>
            <p id={gaugeLabelId} className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {liveUsed} of {total}
              </span>
              <span className="text-xs text-muted-foreground">lines in use right now</span>
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                live
              </span>
            </p>
            {busy && (
              // Evidence, not urgency: the 24h history makes the case, copy stays flat.
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                A batch is running. If the last 24 h is typical (utilization peaked
                at 100% {peaks}×), extra lines shorten batch runs.
              </p>
            )}
          </div>

          {/* Gauge — one cell per line; included and purchased stay visually
              separate groups (R1), a single meter for assistive tech (R8) */}
          <div>
            <div
              role="meter"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={liveUsed}
              aria-labelledby={gaugeLabelId}
              className="flex h-3 w-full items-stretch gap-1"
            >
              {Array.from({ length: INCLUDED_LINES }).map((_, i) => (
                <span
                  key={`inc-${i}`}
                  aria-hidden="true"
                  className={cn(
                    "flex-1 rounded-sm transition-colors",
                    i < liveUsed ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
              {ui.purchased > 0 && (
                <span aria-hidden="true" className="w-px shrink-0 self-stretch bg-foreground/30" />
              )}
              {Array.from({ length: ui.purchased }).map((_, i) => (
                <span
                  key={`pur-${i}`}
                  aria-hidden="true"
                  className={cn(
                    "flex-1 rounded-sm border transition-colors",
                    INCLUDED_LINES + i < liveUsed
                      ? "bg-primary/70 border-primary/70"
                      : "bg-primary/10 border-primary/30",
                  )}
                />
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
              <span>{INCLUDED_LINES} included with your plan</span>
              <span>
                {ui.purchased} purchased · {usd(LINE_PRICE_USD, false)}/line/mo
              </span>
            </div>
          </div>

          {/* 24h utilization history — inline SVG bars, currentColor only (R8) */}
          <div>
            <svg
              viewBox="0 0 96 24"
              preserveAspectRatio="none"
              role="img"
              aria-label={`Hourly utilization over the last 24 hours; peaked at 100% ${peaks} times.`}
              className="h-7 w-full text-primary/50"
            >
              {UTILIZATION_24H.map((v, i) => {
                const h = Math.max(1, Math.round((v / 100) * 24))
                return (
                  <rect
                    key={i}
                    x={i * 4}
                    y={24 - h}
                    width={3}
                    height={h}
                    rx={0.5}
                    fill="currentColor"
                  />
                )
              })}
            </svg>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              Last 24 h utilization · peaked at 100% {peaks}×
            </p>
          </div>

          {/* R4 — the wall behavior is on the table BEFORE it ever happens */}
          <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5">
            <ListOrdered className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">When all lines are busy:</span>{" "}
              new batch calls queue and dial as lines free up — nothing drops or
              fails, and live calls always finish.
            </p>
          </div>
        </div>

        {/* ══ RIGHT — the write path: inline stepper, cap truth, reduce path ══ */}
        <div className="space-y-4 lg:border-l lg:pl-6">
          {/* Add lines — inline, next to the gauge it prices against (R3) */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Add lines</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {usd(LINE_PRICE_USD, false)}/line/mo · applies instantly, prorated
              for the {remainingDays} days left this cycle.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7"
                aria-label="Remove one line from the order"
                disabled={ui.addQty <= 1}
                onClick={() => setUi((p) => ({ ...p, addQty: Math.max(1, p.addQty - 1) }))}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                {ui.addQty}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7"
                aria-label="Add one line to the order"
                disabled={ui.addQty >= 20}
                onClick={() => setUi((p) => ({ ...p, addQty: Math.min(20, p.addQty + 1) }))}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                → {previewTotal} total lines
              </span>
            </div>
            {/* Live math: what it costs NOW and what it costs monthly — no surprises */}
            <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
              ~{usd(chargeNowUsd)} now ·{" "}
              {usd(ui.addQty * LINE_PRICE_USD, false)}/mo from your next cycle
            </p>
            <Button type="button" size="sm" className="w-full tabular-nums" onClick={addLines}>
              Add {ui.addQty} {ui.addQty === 1 ? "line" : "lines"} — ~{usd(chargeNowUsd)} now
            </Button>
          </div>

          {/* R6 — spend-cap reconciliation: buying capacity is not raising the
              ceiling. Time-to-cap keeps the two numbers honest side by side. */}
          <div className="flex items-start gap-2 border-t pt-3">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground tabular-nums">
              More lines never raise your {usd(capUsd, false)}/mo spend cap. Even
              at 100% utilization on {previewTotal} lines, you&apos;d reach the cap
              in {fmtDuration(minsToCapAtFull)} — then new calls pause, and live
              calls finish.
            </p>
          </div>

          {/* R7 — the reduce path is always in view; quiet, never a wall of shame */}
          <div className="border-t pt-3">
            {ui.purchased === 0 ? (
              <p className="text-xs text-muted-foreground">
                Purchased lines can be reduced anytime — you get a prorated credit
                for the unused days.
              </p>
            ) : !ui.reduceOpen ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() =>
                  setUi((p) => ({ ...p, reduceOpen: true, reduceQty: p.purchased }))
                }
              >
                Reduce lines — prorated credit, no penalty
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Reduce purchased lines</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Reduce one fewer line"
                    disabled={ui.reduceQty <= 1}
                    onClick={() =>
                      setUi((p) => ({ ...p, reduceQty: Math.max(1, p.reduceQty - 1) }))
                    }
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                    {ui.reduceQty}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Reduce one more line"
                    disabled={ui.reduceQty >= ui.purchased}
                    onClick={() =>
                      setUi((p) => ({
                        ...p,
                        reduceQty: Math.min(p.purchased, p.reduceQty + 1),
                      }))
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    of {ui.purchased} purchased
                  </span>
                </div>
                {/* The terms, plainly — the whitespace no competitor documents */}
                <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                  ~{usd(creditUsd)} credit for the {remainingDays} unused days;{" "}
                  {usd(ui.reduceQty * LINE_PRICE_USD, false)}/mo comes off your next
                  invoice. Your {INCLUDED_LINES} included lines are untouched, and a
                  line mid-call finishes its call first.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="tabular-nums"
                    onClick={reduceLines}
                  >
                    Remove {ui.reduceQty} {ui.reduceQty === 1 ? "line" : "lines"} —
                    ~{usd(creditUsd)} credit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => setUi((p) => ({ ...p, reduceOpen: false }))}
                  >
                    Keep them
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Panel banner — X1's StateBanner idiom, trimmed to the two tones used ────
// primary = information (the wall is a fact, not a failure); success = confirm.

function PanelBanner({
  tone,
  icon: Icon,
  children,
}: {
  tone: "primary" | "success"
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  const tones = {
    primary: "border-primary/30 bg-primary/[0.04]",
    success: "border-success/40 bg-success/[0.06]",
  } as const
  const iconTones = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
  } as const
  return (
    <div className={cn("rounded-lg border px-4 py-3.5", tones[tone])}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            iconTones[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">{children}</div>
      </div>
    </div>
  )
}
