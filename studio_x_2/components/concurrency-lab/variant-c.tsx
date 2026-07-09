"use client"

import * as React from "react"
import {
  Activity,
  CheckCircle2,
  Hourglass,
  Info,
  Minus,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { PlanUsage } from "@/lib/campaign-data"
import {
  INCLUDED_LINES,
  LINE_PRICE_USD,
  type ConcurrencyVariantProps,
} from "./spec"

/**
 * Variant C — "At-the-wall-first".
 * ──────────────────────────────────────────────────────────────────────────
 * The whitespace bet (spec header): no competitor ships a purchase moment at
 * the point where the limit HURTS. So the primary surface here is not a
 * Billing page — it's `ConcurrencyMoment`, a compact block designed to embed
 * (a) under the wizard's "Max concurrent" select when the user picks the max,
 * and (b) as a Monitor banner when a live batch paces at the wall.
 *
 * Rules this variant must never break:
 *  • R1 — included vs purchased are separate numbers everywhere, incl. a seam
 *    tick inside the gauge. Totals always carry their split.
 *  • R4/R5 — the wall is described as QUEUE (nothing drops), and the fix is
 *    quantified in time saved, labeled an estimate with its formula shown.
 *  • R6 — cap reconciliation is explicit: lines buy speed, not a higher bill;
 *    time-to-cap at full utilization is shown so speed is priced honestly.
 *  • R2/R7 — buy and reduce both apply instantly; both directions prorate,
 *    and the credit copy carries no penalty tone.
 * All state is mock-local; keyed by scenario.id so the judge's scenario
 * switcher resets the purchase state cleanly.
 */

// ─── Honest-math constants (wireframe mocks, each labeled in the UI) ─────────

/** $/min PAYG rate — same constant X1 (usage-spend-card) traces every $ to. */
const PAYG_RATE = 0.1
/** Mock batch backlog for the wall scenario — shown in the estimate footnote. */
const QUEUED_CALLS = 520
/** Avg call length for the time model — labeled "~2 min avg" in copy. */
const AVG_CALL_MIN = 2
/** Mock billing cycle for proration copy (both charge and credit directions). */
const CYCLE_DAYS = 30
const CYCLE_DAYS_LEFT = 18

function usd(n: number, cents = true) {
  return cents ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString()}`
}

function fmtMin(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} h` : `${h} h ${m} m`
}

/** Queue model: remaining wall-clock minutes = backlog × avg ÷ lines. */
function minutesLeftAt(lines: number) {
  return Math.round((QUEUED_CALLS * AVG_CALL_MIN) / lines)
}

/** Proration is symmetric: charge on the way up, credit on the way down. */
function proratedUsd(deltaLines: number) {
  return Math.abs(deltaLines) * LINE_PRICE_USD * (CYCLE_DAYS_LEFT / CYCLE_DAYS)
}

/** R6: minutes of full-utilization runway left under the spend cap. */
function minutesToCapAt(lines: number, usage: PlanUsage) {
  const cap = usage.spendCapUsd
  if (cap == null) return null
  const headroom = Math.max(0, cap - usage.paygSpendUsd)
  return Math.round(headroom / (lines * PAYG_RATE))
}

type Confirm = { kind: "purchase" | "reduce"; delta: number }

// ─── Root: key by scenario so mock purchases reset on scenario switch ────────

export function VariantC({ scenario }: ConcurrencyVariantProps) {
  return <VariantCInner key={scenario.id} scenario={scenario} />
}

function VariantCInner({ scenario }: ConcurrencyVariantProps) {
  const s = scenario
  // 'purchased'/'downgrade' start with 5 purchased lines already on the account.
  const [purchased, setPurchased] = React.useState(() =>
    s.id === "purchased" || s.id === "downgrade" ? 5 : 0,
  )
  const [confirm, setConfirm] = React.useState<Confirm | null>(() =>
    s.id === "purchased" ? { kind: "purchase", delta: 5 } : null,
  )
  // 'downgrade' opens straight into the manage flow — that IS the scenario.
  const [sheetOpen, setSheetOpen] = React.useState(s.id === "downgrade")
  // Wizard mock's Max-concurrent selection; bumped to the new max on purchase
  // so the buy visibly unlocks the control the user was stuck on.
  const [maxSel, setMaxSel] = React.useState(String(INCLUDED_LINES))

  const total = INCLUDED_LINES + purchased
  const liveUsed = Math.min(s.liveUsed, total)

  function buy(delta: number) {
    setPurchased((p) => p + delta)
    setConfirm({ kind: "purchase", delta })
    setMaxSel(String(INCLUDED_LINES + purchased + delta))
  }

  function applyManage(nextPurchased: number) {
    const delta = nextPurchased - purchased
    if (delta === 0) return setSheetOpen(false)
    setPurchased(nextPurchased)
    setConfirm({ kind: delta > 0 ? "purchase" : "reduce", delta })
    setSheetOpen(false)
  }

  return (
    <div className="space-y-4">
      {s.id === "wall" ? (
        <>
          {/* Placement (a): under the wizard's Max concurrent select */}
          <EmbedCaption>Wizard · Batch calls › Configure › Other settings</EmbedCaption>
          <WizardEmbed lines={total} value={maxSel} onValueChange={setMaxSel}>
            {confirm ? (
              <LiveNowConfirmation purchased={purchased} confirm={confirm} liveUsed={liveUsed} />
            ) : (
              <ConcurrencyMoment
                placement="wizard"
                usage={s.usage}
                purchased={purchased}
                liveUsed={liveUsed}
                onBuy={buy}
              />
            )}
          </WizardEmbed>

          {/* Placement (b): the same block as a Monitor banner on a live batch */}
          <EmbedCaption>Monitor · live batch banner — same block, second placement</EmbedCaption>
          {confirm ? (
            <LiveNowConfirmation purchased={purchased} confirm={confirm} liveUsed={liveUsed} />
          ) : (
            <ConcurrencyMoment
              placement="monitor"
              usage={s.usage}
              purchased={purchased}
              liveUsed={liveUsed}
              onBuy={buy}
            />
          )}
        </>
      ) : s.id === "purchased" ? (
        <>
          <LiveNowConfirmation purchased={purchased} confirm={confirm} liveUsed={liveUsed} />
          <EmbedCaption>Billing · the companion strip already reflects the new split</EmbedCaption>
          <BillingStrip
            tone="idle"
            usage={s.usage}
            purchased={purchased}
            liveUsed={liveUsed}
            confirm={null}
            onManage={() => setSheetOpen(true)}
          />
        </>
      ) : (
        <>
          <EmbedCaption>Billing · companion strip — the findable home for the same purchase flow</EmbedCaption>
          <BillingStrip
            tone={s.id === "busy" ? "busy" : "idle"}
            usage={s.usage}
            purchased={purchased}
            liveUsed={liveUsed}
            confirm={confirm}
            onManage={() => setSheetOpen(true)}
          />
        </>
      )}

      <ManageLinesSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        purchased={purchased}
        liveUsed={liveUsed}
        usage={s.usage}
        onApply={applyManage}
      />
    </div>
  )
}

// ─── The at-the-wall purchase moment (the whitespace surface) ────────────────

function ConcurrencyMoment({
  placement,
  usage,
  purchased,
  liveUsed,
  onBuy,
}: {
  placement: "wizard" | "monitor"
  usage: PlanUsage
  purchased: number
  liveUsed: number
  onBuy: (delta: number) => void
}) {
  const lines = INCLUDED_LINES + purchased
  const [delta, setDelta] = React.useState(5)
  const [custom, setCustom] = React.useState(false)
  const [customInput, setCustomInput] = React.useState("15")

  const customNum = Number(customInput)
  const effDelta = custom
    ? Math.min(40, Math.max(1, Number.isFinite(customNum) ? customNum : 1))
    : delta

  const remainNow = minutesLeftAt(lines)
  const remainNext = minutesLeftAt(lines + effDelta)
  const saved = remainNow - remainNext
  const monthly = effDelta * LINE_PRICE_USD
  const today = proratedUsd(effDelta)
  const capMin = minutesToCapAt(lines + effDelta, usage)
  const headroom =
    usage.spendCapUsd != null ? Math.max(0, usage.spendCapUsd - usage.paygSpendUsd) : null

  return (
    <MomentBanner tone="warning" icon={Hourglass}>
      {/* Lead with the situation — the wall stated as queue, never as failure (R4) */}
      <p className="text-sm font-medium tabular-nums">
        {placement === "wizard"
          ? `${lines} calls is your full line capacity — beyond it, this batch queues.`
          : `All ${lines} lines are in use — new calls are queuing, none drop or fail.`}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
        At this pace the {QUEUED_CALLS.toLocaleString()} remaining calls finish in{" "}
        ≈{fmtMin(remainNow)}. With +{effDelta} lines: ≈{fmtMin(remainNext)} —{" "}
        <span className="font-medium text-foreground">about {saved} min sooner</span>.{" "}
        <Badge variant="secondary" className="align-middle text-xs">Estimate</Badge>
      </p>

      {/* R3: utilization sits directly beside the buy control — never sell blind */}
      <LineGauge className="mt-3" purchased={purchased} liveUsed={liveUsed} />

      {/* Stepper collapsed into quick chips + custom; ONE purchase action below */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {[5, 10].map((d) => (
          <Button
            key={d}
            type="button"
            size="sm"
            variant={!custom && delta === d ? "default" : "outline"}
            className="h-7 text-xs tabular-nums"
            onClick={() => {
              setCustom(false)
              setDelta(d)
            }}
          >
            +{d} lines · ${d * LINE_PRICE_USD}/mo
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant={custom ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() => setCustom(true)}
        >
          Custom
        </Button>
        {custom && (
          <Input
            inputMode="numeric"
            className="h-7 w-16 text-xs tabular-nums"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value.replace(/[^\d]/g, ""))}
            aria-label="Custom number of lines to add"
          />
        )}
      </div>

      <div className="mt-3">
        <Button size="sm" className="tabular-nums" onClick={() => onBuy(effDelta)}>
          Add {effDelta} lines · {usd(today)} today
        </Button>
        <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
          Prorated for the {CYCLE_DAYS_LEFT} days left this cycle, then {usd(monthly, false)}/mo
          — live the moment you confirm.
        </p>
      </div>

      {/* R6: reconcile with the spend cap — speed priced honestly, no surprise bill */}
      {usage.spendCapUsd != null && headroom != null && capMin != null && (
        <p className="mt-3 flex items-start gap-1.5 border-t pt-3 text-xs text-muted-foreground tabular-nums">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>
            Your {usd(usage.spendCapUsd, false)}/mo spend cap stays put — lines buy speed, not
            a higher bill. At full use, {lines + effDelta} lines spend{" "}
            ≈{usd((lines + effDelta) * PAYG_RATE)}/min, so the {usd(headroom)} left under your
            cap lasts ≈{fmtMin(capMin)} at that pace (estimate).
          </span>
        </p>
      )}

      {/* R5: the estimate shows its work; pricing is a labeled wireframe mock */}
      <p className="mt-2 text-xs text-muted-foreground tabular-nums">
        Time estimate: {QUEUED_CALLS.toLocaleString()} queued calls × ~{AVG_CALL_MIN} min avg ÷
        lines. Pricing is a wireframe placeholder ({usd(LINE_PRICE_USD, false)}/line/mo).
      </p>
    </MomentBanner>
  )
}

// ─── Instant "live now" confirmation (R2) ─────────────────────────────────────

function LiveNowConfirmation({
  purchased,
  confirm,
  liveUsed,
}: {
  purchased: number
  confirm: Confirm | null
  liveUsed: number
}) {
  const total = INCLUDED_LINES + purchased
  const delta = confirm?.delta ?? purchased
  return (
    <MomentBanner tone="success" icon={CheckCircle2}>
      {/* R1: the new total never appears without its included + purchased split */}
      <p className="text-sm font-medium tabular-nums">
        {total} lines live now — {INCLUDED_LINES} included + {purchased} purchased.
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
        {usd(proratedUsd(delta))} charged today, prorated for the {CYCLE_DAYS_LEFT} of{" "}
        {CYCLE_DAYS} days left this cycle — then {usd(purchased * LINE_PRICE_USD, false)}/mo.
        Queued calls started dialing on the new lines immediately.
      </p>
      <LineGauge className="mt-3" purchased={purchased} liveUsed={liveUsed} />
    </MomentBanner>
  )
}

// ─── Wizard embed: the control where the wall is FELT ─────────────────────────

function WizardEmbed({
  lines,
  value,
  onValueChange,
  children,
}: {
  lines: number
  value: string
  onValueChange: (v: string) => void
  children: React.ReactNode
}) {
  // Mirror of step-configure's OutboundSettings option list; capacity gaps are
  // visible inside the select itself so the moment below reads as the unlock.
  const options = Array.from(new Set([5, 10, lines, 25, 50])).sort((a, b) => a - b)
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="max-w-48 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Max concurrent</Label>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((c) => (
              <SelectItem key={c} value={String(c)} disabled={c > lines}>
                {c} calls{c > lines ? " — add lines" : c === lines ? " — your max" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {children}
    </div>
  )
}

// ─── Billing companion strip: the findable home for the same flow ────────────

function BillingStrip({
  tone,
  usage,
  purchased,
  liveUsed,
  confirm,
  onManage,
}: {
  tone: "idle" | "busy"
  usage: PlanUsage
  purchased: number
  liveUsed: number
  confirm: Confirm | null
  onManage: () => void
}) {
  const total = INCLUDED_LINES + purchased
  const savedByFive = minutesLeftAt(total) - minutesLeftAt(total + 5)
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Concurrent call lines</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              How many calls can run at once, across batches and inbound
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onManage}>
            <SlidersHorizontal className="h-3.5 w-3.5" /> Manage lines
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {confirm?.kind === "reduce" && (
          <MomentBanner tone="success" icon={CheckCircle2}>
            <p className="text-sm font-medium tabular-nums">
              Now {total} lines — {INCLUDED_LINES} included + {purchased} purchased.
            </p>
            {/* R7: prorated credit, plainly, with no penalty tone */}
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              A {usd(proratedUsd(confirm.delta))} credit for the {CYCLE_DAYS_LEFT} unused days
              applies to your next invoice. Effective immediately — add lines back anytime.
            </p>
          </MomentBanner>
        )}
        {confirm?.kind === "purchase" && (
          <LiveNowConfirmation purchased={purchased} confirm={confirm} liveUsed={liveUsed} />
        )}

        {/* R1: hero total always carries its split */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {total} lines
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {INCLUDED_LINES} included + {purchased} purchased
            {purchased > 0 && <> ({usd(purchased * LINE_PRICE_USD, false)}/mo)</>}
          </span>
        </div>

        <LineGauge purchased={purchased} liveUsed={liveUsed} />

        {/* Busy: the case for more lines made with utilization evidence, not urgency */}
        {tone === "busy" && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground tabular-nums">
            <Activity className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>
              Utilization has held at 80% or more for the last 22 min of this batch. At the
              wall, new calls queue — nothing drops. If batches often run this hot, +5 lines
              would finish one like this ≈{savedByFive} min sooner (estimate) — add them from
              Manage lines.
            </span>
          </p>
        )}

        {/* R4: wall behavior disclosed before it ever happens, even at 2 of 10 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0" />
            When every line is busy, new batch calls queue — nothing drops or fails.
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {usd(LINE_PRICE_USD, false)}/line/mo · placeholder pricing
          </p>
        </div>
        {usage.spendCapUsd != null && (
          <p className="text-xs text-muted-foreground tabular-nums">
            Lines never change your {usd(usage.spendCapUsd, false)}/mo spend cap — only how
            fast usage can reach it.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Manage sheet: add AND reduce in one considered write path ────────────────

function ManageLinesSheet({
  open,
  onOpenChange,
  purchased,
  liveUsed,
  usage,
  onApply,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  purchased: number
  liveUsed: number
  usage: PlanUsage
  onApply: (nextPurchased: number) => void
}) {
  const [next, setNext] = React.useState(purchased)

  // Re-seed the draft with the latest saved count each time the sheet opens.
  React.useEffect(() => {
    if (open) setNext(purchased)
  }, [open, purchased])

  const delta = next - purchased
  const totalNext = INCLUDED_LINES + next
  const capMin = minutesToCapAt(totalNext, usage)
  const headroom =
    usage.spendCapUsd != null ? Math.max(0, usage.spendCapUsd - usage.paygSpendUsd) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Manage lines</SheetTitle>
          <SheetDescription className="tabular-nums">
            {INCLUDED_LINES} lines are included with your plan — purchased lines add to them
            and can be removed anytime.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6">
          {/* R3: utilization right beside the control that changes capacity */}
          <LineGauge purchased={purchased} liveUsed={liveUsed} />

          {/* The stepper: one number, both directions — no separate cancel flow */}
          <div className="space-y-2">
            <Label className="text-sm">Purchased lines</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={next <= 0}
                onClick={() => setNext((n) => Math.max(0, n - 5))}
                aria-label="Remove 5 purchased lines"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-16 text-center text-sm font-medium tabular-nums">
                {next} lines
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={next >= 40}
                onClick={() => setNext((n) => Math.min(40, n + 5))}
                aria-label="Add 5 purchased lines"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                → {totalNext} total ({INCLUDED_LINES} included + {next} purchased)
              </span>
            </div>
          </div>

          {/* Consequence preview — charge going up, credit coming down */}
          {delta > 0 && (
            <div className="space-y-1 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground tabular-nums">
              <p className="font-medium text-foreground">
                +{delta} lines: {usd(proratedUsd(delta))} today, then{" "}
                {usd(next * LINE_PRICE_USD, false)}/mo.
              </p>
              <p>
                Prorated for the {CYCLE_DAYS_LEFT} of {CYCLE_DAYS} days left this cycle. Lines
                go live the moment you confirm.
              </p>
              {usage.spendCapUsd != null && headroom != null && capMin != null && (
                <p>
                  Your {usd(usage.spendCapUsd, false)}/mo cap is unchanged — at full use,{" "}
                  {totalNext} lines would reach it in ≈{fmtMin(capMin)} (estimate).
                </p>
              )}
            </div>
          )}
          {delta < 0 && (
            <div className="space-y-1 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground tabular-nums">
              {/* R7 whitespace: a documented, self-serve reduction with plain terms */}
              <p className="font-medium text-foreground">
                −{-delta} lines: {usd(proratedUsd(delta))} credit on your next invoice.
              </p>
              <p>
                The credit covers the {CYCLE_DAYS_LEFT} unused days. Takes effect
                immediately — a line on a live call finishes that call first.
              </p>
              <p>No fees, no lock-in — add lines back anytime.</p>
              {totalNext < liveUsed && (
                <p role="alert" className="text-warning">
                  That&apos;s below the {liveUsed} lines in use right now — calls in progress
                  finish, then new calls queue until lines free up.
                </p>
              )}
            </div>
          )}
          {delta === 0 && (
            <p className="text-xs text-muted-foreground">
              No change yet — step the count up or down to preview the exact charge or credit.
            </p>
          )}
        </div>

        <SheetFooter className="px-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button
            disabled={delta === 0}
            className="tabular-nums"
            onClick={() => onApply(next)}
          >
            {delta > 0 ? `Add ${delta} lines` : `Reduce to ${totalNext} lines`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Shared gauge: R3 + R8 (role=meter, labelled) + R1 (seam tick) ────────────

function LineGauge({
  purchased,
  liveUsed,
  className,
}: {
  purchased: number
  liveUsed: number
  className?: string
}) {
  const total = INCLUDED_LINES + purchased
  const atWall = liveUsed >= total
  const labelId = React.useId()
  return (
    <div className={className}>
      <p id={labelId} className="mb-1.5 text-xs text-muted-foreground tabular-nums">
        {liveUsed} of {total} lines in use right now · {INCLUDED_LINES} included +{" "}
        {purchased} purchased
      </p>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={liveUsed}
        aria-labelledby={labelId}
        className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        {/* Warning (not destructive) at the wall: queueing is slow, not broken */}
        <div
          className={cn(
            "h-full rounded-full transition-all",
            atWall ? "bg-warning" : "bg-primary",
          )}
          style={{ width: `${Math.min(100, (liveUsed / total) * 100)}%` }}
        />
        {purchased > 0 && (
          // Seam tick — the included/purchased boundary stays legible inside the bar
          <div
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-foreground/40"
            style={{ left: `${(INCLUDED_LINES / total) * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}

// ─── Local banner shell (X1 StateBanner idiom — not exported from there) ──────

function MomentBanner({
  tone,
  icon: Icon,
  children,
}: {
  tone: "success" | "warning"
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  const tones = {
    success: "border-success/40 bg-success/[0.06]",
    warning: "border-warning/40 bg-warning/[0.06]",
  } as const
  const iconTones = {
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
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
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

// ─── Lab-only caption: names WHERE each embed lives in the real product ───────

function EmbedCaption({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}
