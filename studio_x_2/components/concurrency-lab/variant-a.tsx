"use client"

import * as React from "react"
import {
  CheckCircle2,
  ListEnd,
  ListMinus,
  ListPlus,
  Minus,
  Plus,
  ShieldCheck,
  Timer,
} from "lucide-react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  SheetFooter, SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { spendStats } from "@/lib/campaign-data"
import {
  INCLUDED_LINES, LINE_PRICE_USD,
  type ConcurrencyScenario, type ConcurrencyVariantProps,
} from "./spec"

/**
 * VariantA — "Line-item stepper card" (Vapi-style), A6 concurrency lab.
 * ─────────────────────────────────────────────────────────────────────
 * A Billing-overview sibling of the Usage & spend card (X1): live gauge on
 * top, wall behavior disclosed in the middle, a quiet Add-lines write path
 * in a Sheet at the bottom. Money rules inherited from X1:
 *  • included vs purchased are SEPARATE numbers, never merged (R1)
 *  • every $ figure derives from LINE_PRICE_USD / PAYG rate — no free-floating
 *    dollar copy (R-honesty)
 *  • purchase applies instantly ("live now") and prorates for the days left
 *    this cycle; reductions credit the unused days back — both said in copy
 *    BEFORE confirm (R2, R7)
 *  • more lines ≠ a higher spend cap — the sheet reconciles concurrency with
 *    X1's cap by showing time-to-cap at full utilization (R6)
 *  • at the wall the banner quantifies the fix, informational tone only (R5)
 */

/** $/min PAYG rate — the same constant X1 anchors to (docs pricing: managed
 *  mode bundles ASR+LLM+TTS at $0.10/min). Time-to-cap = headroom ÷ (lines ×
 *  rate × 60). */
const PAYG_RATE_USD_PER_MIN = 0.1

/** C3/C4 fixture size — the spec labels say "10 free + 5 purchased" and
 *  "drop 5 purchased lines", so 5 is spec-derived, not invented. */
const SCENARIO_PURCHASED_LINES = 5

/** C2's whitespace moment: "+5 lines ≈ your 248-contact batch finishes ~35
 *  min sooner." Both figures come from the spec's must; avgCallMin is tuned
 *  so the honest queue equation — contacts × avgMin × (1/lines − 1/(lines+Δ))
 *  — lands at ~35 min for 10→15 lines. Never quote a savings the math
 *  doesn't produce. */
const WALL_BATCH = { contacts: 248, avgCallMin: 4.2 }
const WALL_SUGGESTED_ADD = 5

function usd(n: number, cents = true) {
  return cents ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString()}`
}

/** Time-to-cap reads in the unit people plan in: minutes under 90, hours after. */
function fmtToCap(hours: number) {
  if (!Number.isFinite(hours) || hours < 0) return "—"
  const mins = Math.round(hours * 60)
  return mins < 90 ? `~${mins} min` : `~${(Math.round(hours * 10) / 10).toFixed(1)} h`
}

const s = (n: number) => (n === 1 ? "" : "s")

type LineConfirm = { kind: "added" | "reduced"; lines: number; amountUsd: number }
type SheetMode = "add" | "reduce"

/** Everything scenario-dependent seeds from here so C3 mounts already in the
 *  "live now" success state and C4 mounts with the reduce sheet open —
 *  the judged moments render without interaction. */
function scenarioSeed(sc: ConcurrencyScenario) {
  const daysTotal = sc.usage.periodDaysTotal
  const daysLeft = daysTotal - sc.usage.periodDaysElapsed
  const owned =
    sc.id === "purchased" || sc.id === "downgrade" ? SCENARIO_PURCHASED_LINES : 0
  return {
    purchased: owned,
    confirm:
      sc.id === "purchased"
        ? ({
            kind: "added",
            lines: SCENARIO_PURCHASED_LINES,
            amountUsd:
              SCENARIO_PURCHASED_LINES * LINE_PRICE_USD * (daysLeft / daysTotal),
          } as LineConfirm)
        : null,
    sheetOpen: sc.id === "downgrade",
    sheetMode: (sc.id === "downgrade" ? "reduce" : "add") as SheetMode,
    sheetSeed: sc.id === "downgrade" ? SCENARIO_PURCHASED_LINES : 1,
  }
}

export function VariantA({ scenario }: ConcurrencyVariantProps) {
  // Mock-local overlay: the wireframe's stand-in for the purchase mutation.
  const [purchased, setPurchased] = React.useState(() => scenarioSeed(scenario).purchased)
  const [confirm, setConfirm] = React.useState<LineConfirm | null>(
    () => scenarioSeed(scenario).confirm,
  )
  const [keptQueuing, setKeptQueuing] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(() => scenarioSeed(scenario).sheetOpen)
  const [sheetMode, setSheetMode] = React.useState<SheetMode>(
    () => scenarioSeed(scenario).sheetMode,
  )
  const [sheetSeed, setSheetSeed] = React.useState(() => scenarioSeed(scenario).sheetSeed)

  // The lab switches scenarios on the same mounted variant — reset during
  // render (React's reset-on-prop-change pattern), no effect needed.
  const [seenScenarioId, setSeenScenarioId] = React.useState(scenario.id)
  if (seenScenarioId !== scenario.id) {
    const seed = scenarioSeed(scenario)
    setSeenScenarioId(scenario.id)
    setPurchased(seed.purchased)
    setConfirm(seed.confirm)
    setKeptQueuing(false)
    setSheetOpen(seed.sheetOpen)
    setSheetMode(seed.sheetMode)
    setSheetSeed(seed.sheetSeed)
  }

  const usage = scenario.usage
  const spend = spendStats(usage)
  const cap = spend.capUsd ?? usage.defaultSpendCapUsd
  const headroomUsd = Math.max(0, cap - spend.spentUsd)

  const total = INCLUDED_LINES + purchased
  // The gauge can never show more in use than exists — capacity is the ceiling.
  const liveUsed = Math.min(scenario.liveUsed, total)
  const freeLines = total - liveUsed
  const utilPct = Math.round((liveUsed / total) * 100)
  const atWall = liveUsed >= total
  // Warm-but-not-critical band: information register, no banner, no alarm (C1).
  const runningWarm = !atWall && utilPct >= 70

  const daysTotal = usage.periodDaysTotal
  const daysLeft = daysTotal - usage.periodDaysElapsed
  const monthlyLineItem = purchased * LINE_PRICE_USD

  // C2 whitespace math — the honest queue equation, rounded once for display.
  const wallMinutesSooner = Math.round(
    WALL_BATCH.contacts *
      WALL_BATCH.avgCallMin *
      (1 / total - 1 / (total + WALL_SUGGESTED_ADD)),
  )
  const wallNewTotal = total + WALL_SUGGESTED_ADD
  const wallBurnPerHour = wallNewTotal * PAYG_RATE_USD_PER_MIN * 60
  const wallTimeToCap = fmtToCap(headroomUsd / wallBurnPerHour)

  const meterLabelId = React.useId()

  function openSheet(mode: SheetMode, seed: number) {
    setSheetMode(mode)
    setSheetSeed(seed)
    setSheetOpen(true)
  }

  function handleConfirm(kind: LineConfirm["kind"], lines: number, amountUsd: number) {
    setPurchased((p) => (kind === "added" ? p + lines : Math.max(0, p - lines)))
    setConfirm({ kind, lines, amountUsd })
    setKeptQueuing(false)
    setSheetOpen(false)
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm">Concurrency</CardTitle>
        <CardDescription className="text-xs mt-0.5">
          How many calls can run at once · {usage.periodLabel}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Banners lead the card (X1 idiom): the moment that needs reading ── */}
        {confirm?.kind === "added" && (
          <StateBanner tone="success" icon={CheckCircle2}>
            <p className="text-sm font-medium tabular-nums">
              {confirm.lines} purchased line{s(confirm.lines)} live now — capacity is{" "}
              {total} lines.
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {INCLUDED_LINES} included free + {purchased} purchased. Prorated{" "}
              {usd(confirm.amountUsd)} for the {daysLeft} days left this cycle, then{" "}
              {usd(monthlyLineItem, false)}/mo. Your {usd(cap, false)}/mo spend cap is
              unchanged.
            </p>
          </StateBanner>
        )}

        {confirm?.kind === "reduced" && (
          // Success tone on purpose — a reduction is a working feature, not a
          // failure. No penalty language anywhere (R7).
          <StateBanner tone="success" icon={CheckCircle2}>
            <p className="text-sm font-medium tabular-nums">
              {confirm.lines} purchased line{s(confirm.lines)} removed —{" "}
              {usd(confirm.amountUsd)} comes back as prorated credit.
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              Credit for the {daysLeft} unused days lands on this cycle&apos;s invoice.
              Capacity is now {total} lines ({INCLUDED_LINES} included free +{" "}
              {purchased} purchased). Add lines back anytime — changes are instant both
              ways.
            </p>
          </StateBanner>
        )}

        {atWall && (
          // C2 — the at-the-wall purchase moment. Primary (informational) tone,
          // never warning/destructive: queueing is designed behavior, not an
          // incident. The CTA quantifies the fix; "keep queuing" is a
          // first-class choice (mirrors X1's "keep paused").
          <StateBanner tone="primary" icon={Timer}>
            <p className="text-sm font-medium tabular-nums">
              All {total} lines are busy — new batch calls are queuing. Nothing drops
              or fails.
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              +{WALL_SUGGESTED_ADD} lines ≈ your {WALL_BATCH.contacts}-contact batch
              finishes ~{wallMinutesSooner} min sooner. More lines won&apos;t raise your{" "}
              {usd(cap, false)}/mo spend cap — at full utilization, {wallNewTotal} lines
              burn {usd(wallBurnPerHour, false)}/h and would reach your remaining{" "}
              {usd(headroomUsd)} in {wallTimeToCap}, where new calls pause as configured.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {keptQueuing ? (
                <span className="inline-flex items-center text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-success" />
                  Staying at {total} lines — the queue drains as lines free up.
                </span>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={() => openSheet("add", WALL_SUGGESTED_ADD)}
                  >
                    Add {WALL_SUGGESTED_ADD} lines
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setKeptQueuing(true)}
                  >
                    Keep queuing
                  </Button>
                </>
              )}
            </div>
          </StateBanner>
        )}

        {/* ── Top: live gauge + the never-merged split line (R1, R3, R8) ────── */}
        <div>
          <div className="flex items-baseline gap-2">
            <span
              id={meterLabelId}
              className="text-2xl font-semibold tracking-tight tabular-nums"
            >
              {liveUsed} of {total} lines in use
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden="true" className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              live
            </span>
          </div>
          {/* The split line: base vs purchased stay separate numbers, always. */}
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {INCLUDED_LINES} included free · {purchased} purchased at{" "}
            {usd(LINE_PRICE_USD, false)}/line/mo
          </p>
        </div>

        <div>
          <div
            role="meter"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={liveUsed}
            aria-valuetext={`${liveUsed} of ${total} lines in use`}
            aria-labelledby={meterLabelId}
            className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full"
          >
            {/* Two slices with a visible seam — the included/purchased split is
                structural, not just copy (R1). Fill stays primary even at the
                wall: full utilization is throughput, not danger. */}
            <div
              className={cn(
                "relative h-full overflow-hidden rounded-l-full bg-muted",
                purchased === 0 && "rounded-r-full",
              )}
              style={{ flexGrow: INCLUDED_LINES, flexBasis: 0 }}
            >
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (Math.min(liveUsed, INCLUDED_LINES) / INCLUDED_LINES) * 100)}%`,
                }}
              />
            </div>
            {purchased > 0 && (
              <div
                className="relative h-full overflow-hidden rounded-r-full bg-muted"
                style={{ flexGrow: purchased, flexBasis: 0 }}
              >
                <div
                  className="h-full bg-primary/70 transition-all"
                  style={{
                    width: `${Math.min(100, (Math.max(0, liveUsed - INCLUDED_LINES) / purchased) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span>
              {freeLines} line{s(freeLines)} free right now
            </span>
            <span>{utilPct}% utilization</span>
          </div>
          {runningWarm && (
            // C1 — evidence, not urgency: plain utilization math in the muted
            // register, and the wall behavior restated as the safety net.
            <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
              Running warm — {utilPct}% of capacity in use while your batch runs. If
              runs often sit this high, extra lines shorten them; either way, calls
              queue at the wall rather than fail.
            </p>
          )}
        </div>

        {/* ── Middle: wall behavior disclosed BEFORE it ever happens (R4) ───── */}
        <p className="inline-flex items-start gap-1.5 text-xs text-muted-foreground">
          <ListEnd className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            When every line is busy, new batch calls queue — nothing drops or fails.
            The queue drains automatically as lines free up.
          </span>
        </p>

        {/* ── Bottom: the quiet write-path row (X1 idiom) ───────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground tabular-nums">
            {purchased > 0 ? (
              <>
                Line item: {purchased} × {usd(LINE_PRICE_USD, false)} ={" "}
                {usd(monthlyLineItem, false)}/mo
              </>
            ) : (
              <>No line item yet — included lines are {usd(0, false)}/mo</>
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => openSheet("add", 1)}
            >
              <ListPlus className="h-3.5 w-3.5" /> Add lines
            </Button>
            {purchased > 0 && (
              // The documented downgrade path is discoverable whenever there is
              // anything to reduce — not buried in support docs (R7 whitespace).
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => openSheet("reduce", 1)}
              >
                <ListMinus className="h-3.5 w-3.5" /> Reduce
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Line changes apply instantly — no restart, nothing interrupted. Purchases
          prorate for the days left this cycle; reductions credit the unused days back.
        </p>
      </CardContent>

      <LineSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        seed={sheetSeed}
        purchased={purchased}
        liveUsed={liveUsed}
        total={total}
        daysLeft={daysLeft}
        daysTotal={daysTotal}
        capUsd={cap}
        headroomUsd={headroomUsd}
        onConfirm={handleConfirm}
      />
    </Card>
  )
}

// ─── Contextual state banner — local copy of X1's idiom (not exported from
//     usage-spend-card; the winning variant folds in and dedupes). ────────────

function StateBanner({
  tone,
  icon: Icon,
  children,
}: {
  tone: "primary" | "success" | "warning" | "destructive"
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  const tones = {
    primary: "border-primary/30 bg-primary/[0.04]",
    success: "border-success/40 bg-success/[0.06]",
    warning: "border-warning/40 bg-warning/[0.06]",
    destructive: "border-destructive/40 bg-destructive/5",
  } as const
  const iconTones = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
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
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}

// ─── Line sheet — the considered write path (stepper → live math →
//     cap reconciliation → confirm). Same Sheet skeleton as X1's spend
//     controls; "add" and "reduce" are the same surface so the downgrade
//     path is structurally equal to the purchase path (R7). ─────────────────

function LineSheet({
  open,
  onOpenChange,
  mode,
  seed,
  purchased,
  liveUsed,
  total,
  daysLeft,
  daysTotal,
  capUsd,
  headroomUsd,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: SheetMode
  seed: number
  purchased: number
  liveUsed: number
  total: number
  daysLeft: number
  daysTotal: number
  capUsd: number
  headroomUsd: number
  onConfirm: (kind: LineConfirm["kind"], lines: number, amountUsd: number) => void
}) {
  const [countInput, setCountInput] = React.useState(String(seed))

  // Re-seed the draft each open with the caller's intent (wall CTA seeds 5).
  React.useEffect(() => {
    if (open) setCountInput(String(seed))
  }, [open, seed, mode])

  const n = Number(countInput)
  const maxReduce = purchased
  const valid =
    Number.isFinite(n) && n >= 1 && (mode === "add" || n <= maxReduce)

  const monthly = (Number.isFinite(n) ? n : 0) * LINE_PRICE_USD
  // Retell-parity proration: charge (or credit) only the days left this cycle.
  const prorated = monthly * (daysLeft / daysTotal)
  const newTotal = mode === "add" ? total + n : total - n
  const newPurchased = mode === "add" ? purchased + n : purchased - n

  // R6 — spend-cap reconciliation: lines change how FAST minutes can burn,
  // never the ceiling. Burn/hour = lines × $0.10/min × 60.
  const burnPerHour = Math.max(1, newTotal) * PAYG_RATE_USD_PER_MIN * 60
  const timeToCap = fmtToCap(headroomUsd / burnPerHour)

  // Reduction honesty: if fewer lines than are busy right now, nothing is cut —
  // capacity steps down as calls finish.
  const reduceBelowLive = mode === "reduce" && valid && newTotal < liveUsed

  function step(delta: number) {
    const cur = Number.isFinite(n) && n >= 1 ? n : 0
    const next = Math.max(1, cur + delta)
    setCountInput(String(mode === "reduce" ? Math.min(maxReduce, next) : next))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "add" ? "Add lines" : "Reduce lines"}</SheetTitle>
          <SheetDescription>
            {mode === "add"
              ? "Purchased lines go live the moment you confirm — prorated for the rest of this cycle."
              : "Drop purchased lines anytime — unused days come back as prorated credit. No penalty."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6">
          {/* Utilization sits beside the buy control — never sell blind (R3). */}
          <p className="text-xs text-muted-foreground tabular-nums">
            Live right now: {liveUsed} of {total} lines in use ·{" "}
            {INCLUDED_LINES} included free + {purchased} purchased.
          </p>

          {/* Beat 1 — the stepper */}
          <div className="space-y-2">
            <Label htmlFor="line-count">
              {mode === "add" ? "Lines to add" : "Lines to remove"}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="One fewer line"
                disabled={!Number.isFinite(n) || n <= 1}
                onClick={() => step(-1)}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Input
                id="line-count"
                inputMode="numeric"
                className="h-8 w-16 text-center tabular-nums"
                value={countInput}
                onChange={(e) => setCountInput(e.target.value.replace(/[^\d]/g, ""))}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="One more line"
                disabled={mode === "reduce" && Number.isFinite(n) && n >= maxReduce}
                onClick={() => step(1)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                at {usd(LINE_PRICE_USD, false)}/line/mo
              </span>
            </div>
            {mode === "reduce" && Number.isFinite(n) && n > maxReduce && (
              <p role="alert" className="text-xs text-warning tabular-nums">
                Only {maxReduce} purchased line{s(maxReduce)} can be removed — the{" "}
                {INCLUDED_LINES} included lines are yours free, always.
              </p>
            )}
          </div>

          {/* Beat 2 — live math: every figure traces to lines × $8 (R-honesty) */}
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs tabular-nums space-y-1.5">
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">
                {mode === "add" ? "New monthly line item" : "Off next cycle's bill"}
              </span>
              <span className="font-medium text-foreground">
                {valid ? (
                  <>
                    {n} × {usd(LINE_PRICE_USD, false)} ={" "}
                    {mode === "reduce" && "−"}
                    {usd(monthly, false)}/mo
                  </>
                ) : (
                  "—"
                )}
              </span>
            </p>
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">
                {mode === "add"
                  ? `Charged today — prorated, ${daysLeft} of ${daysTotal} days left`
                  : `Credit to this invoice — ${daysLeft} unused days`}
              </span>
              <span className="font-medium text-foreground">
                {valid ? usd(prorated) : "—"}
              </span>
            </p>
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">New capacity</span>
              <span className="font-medium text-foreground">
                {valid ? (
                  <>
                    {INCLUDED_LINES} free + {newPurchased} purchased = {newTotal} lines
                  </>
                ) : (
                  "—"
                )}
              </span>
            </p>
            {reduceBelowLive && (
              <p className="text-muted-foreground">
                {liveUsed} lines are on calls right now — nothing is cut; capacity
                steps down as those calls finish.
              </p>
            )}
          </div>

          {/* Beat 3 — plain terms. Add mode: the spend-cap reconciliation (R6,
              whitespace — no competitor says this). Reduce mode: the downgrade
              terms said plainly (R7, whitespace). */}
          {mode === "add" ? (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1">
              <p className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Your spend cap doesn&apos;t move
              </p>
              <p>
                · More lines ≠ a higher cap — your {usd(capUsd, false)}/mo cap still
                holds the invoice.
              </p>
              <p className="tabular-nums">
                · Lines change how fast minutes can burn: at full utilization,{" "}
                {valid ? newTotal : total} lines ≈ {usd(burnPerHour, false)}/h.
              </p>
              <p className="tabular-nums">
                · At that pace you&apos;d reach your remaining {usd(headroomUsd)} of cap
                headroom in {timeToCap} — then new calls pause, exactly as configured.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Plain terms:</p>
              <p>· Takes effect immediately — no fees, no lock-in, no penalty.</p>
              <p>· Unused days come back as credit on this cycle&apos;s invoice.</p>
              <p>· Calls in progress always finish; nothing is interrupted.</p>
              <p>· Add lines back anytime — that&apos;s instant too.</p>
            </div>
          )}
        </div>

        <SheetFooter className="px-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          {/* The commitment is on the button — amount included, no surprise. */}
          <Button
            disabled={!valid}
            className="tabular-nums"
            onClick={() =>
              onConfirm(mode === "add" ? "added" : "reduced", n, prorated)
            }
          >
            {mode === "add"
              ? `Add ${valid ? n : ""} line${valid ? s(n) : "s"} · ${valid ? usd(prorated) : "—"} today`
              : `Remove ${valid ? n : ""} line${valid ? s(n) : "s"} · ${valid ? usd(prorated) : "—"} credit`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
