"use client"

import * as React from "react"
import {
  CheckCircle2,
  Phone,
  PhoneForwarded,
  SlidersHorizontal,
} from "lucide-react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  SheetFooter, SheetClose,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { track, Events } from "@/lib/analytics"
import {
  CONCURRENCY, PAYG_RATE, PLAN_USAGE, concurrencyStats, spendStats,
} from "@/lib/campaign-data"
import { StateBanner } from "@/components/usage-spend-card"

/**
 * ConcurrencyCard — self-serve concurrent lines (A6, judge winner A + grafts;
 * LEARNINGS §20 2026-07-09).
 * ──────────────────────────────────────────────────────────────────────────
 * Lines govern how many calls run AT ONCE; the spend cap governs usage $.
 * Rules this card must never break:
 *  • included vs purchased are SEPARATE numbers, never merged
 *  • purchases apply instantly ("live now"), prorated for the days left in
 *    the cycle — from PLAN_USAGE.periodDays*, never hardcoded cycle math
 *  • the wall is INFORMATION, not alarm: at capacity, batch calls queue;
 *    nothing drops. "Keep queuing" is a first-class choice.
 *  • line fees bill separately from usage — the spend cap is untouched by
 *    buying lines, and the copy says so plainly
 *  • every estimate shows its inputs (queue × avg-call ÷ lines) and wears
 *    the Estimate label; commit buttons carry EXACT amounts
 */

/** Average call length assumed by queue math — shown in the formula footnote
 *  wherever a time-saved estimate appears (never a hidden tuning constant). */
const AVG_CALL_MIN = 2

export function ConcurrencyCard() {
  const [purchased, setPurchased] = React.useState(CONCURRENCY.purchased)
  const [confirm, setConfirm] = React.useState<{ qty: number; charge: number } | null>(null)
  const [keptQueuing, setKeptQueuing] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const stats = concurrencyStats({ ...CONCURRENCY, purchased })
  const spend = spendStats({ ...PLAN_USAGE })
  const meterId = React.useId()

  React.useEffect(() => {
    if (stats.atWall) track(Events.concurrency_wall_viewed, { lines: stats.totalLines, queued: stats.queued })
    // once per mount is enough for a wireframe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onPurchased(qty: number, charge: number) {
    setPurchased((p) => Math.max(0, p + qty))
    setConfirm({ qty, charge })
    setSheetOpen(false)
    setKeptQueuing(false)
  }

  // Time-saved model, shown with its inputs (grafts: C's show-your-work,
  // B's live recompute). Only meaningful while calls are queued.
  const minSaved = (addQty: number) =>
    stats.queued > 0 && addQty > 0
      ? Math.round(
          (stats.queued * AVG_CALL_MIN) / stats.totalLines -
          (stats.queued * AVG_CALL_MIN) / (stats.totalLines + addQty),
        )
      : 0

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Concurrent lines</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              How many calls can run at once
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs tabular-nums">
            {stats.totalLines} lines
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Banner first (X1 idiom) ─────────────────────────────────── */}
        {confirm && (
          <StateBanner tone="success" icon={CheckCircle2}>
            <p className="text-sm font-medium">
              {confirm.qty > 0
                ? `${confirm.qty} added line${confirm.qty > 1 ? "s" : ""} live now — ${stats.totalLines} total (${stats.included} included + ${stats.purchased} purchased).`
                : `${-confirm.qty} line${confirm.qty < -1 ? "s" : ""} removed — ${stats.totalLines} total (${stats.included} included + ${stats.purchased} purchased).`}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {confirm.qty > 0
                ? `$${confirm.charge.toFixed(2)} today, prorated for the ${PLAN_USAGE.periodDaysTotal - PLAN_USAGE.periodDaysElapsed} days left this cycle — then $${(stats.purchased * stats.pricePerLineMo).toFixed(0)}/mo. Reduce anytime for a prorated credit.`
                : `$${confirm.charge.toFixed(2)} credited on your next invoice. Add lines back anytime.`}
            </p>
          </StateBanner>
        )}

        {stats.atWall && !confirm && (
          // The wall is designed behavior — primary tone, zero alarm.
          <StateBanner tone="primary" icon={PhoneForwarded}>
            <p className="text-sm font-medium">
              All {stats.totalLines} lines are in use — new batch calls queue. Nothing drops
              or fails.
            </p>
            {stats.queued > 0 && (
              <p className="text-xs text-muted-foreground tabular-nums">
                +5 lines ≈ your queue clears ~{minSaved(5)} min sooner{" "}
                <Badge variant="secondary" className="text-xs align-middle">Estimate</Badge>{" "}
                — {stats.queued} queued calls × ~{AVG_CALL_MIN} min ÷ lines.
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" onClick={() => setSheetOpen(true)}>Add lines</Button>
              {keptQueuing ? (
                <span className="inline-flex items-center text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-success" />
                  Queuing as designed — calls dial as lines free up.
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setKeptQueuing(true); track(Events.keep_queuing_clicked, { lines: stats.totalLines }) }}
                >
                  Keep queuing
                </Button>
              )}
            </div>
          </StateBanner>
        )}

        {/* ── Gauge — live utilization beside the buy control ─────────── */}
        <div>
          <p id={meterId} className="text-xs text-muted-foreground mb-1.5 tabular-nums">
            {stats.inUse} of {stats.totalLines} lines in use right now
          </p>
          <div
            role="meter"
            aria-valuemin={0}
            aria-valuemax={stats.totalLines}
            aria-valuenow={Math.min(stats.inUse, stats.totalLines)}
            aria-labelledby={meterId}
            className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${stats.pctInUse}%` }}
            />
            {/* Included/purchased seam — the split stays visible in the bar */}
            {stats.purchased > 0 && (
              <div
                aria-hidden="true"
                className="absolute inset-y-0 w-px bg-foreground/40"
                style={{ left: `${(stats.included / stats.totalLines) * 100}%` }}
              />
            )}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" aria-hidden />
              {stats.included} included free
            </span>
            <span>
              {stats.purchased > 0
                ? `${stats.purchased} purchased · $${stats.pricePerLineMo}/line/mo`
                : `add more at $${stats.pricePerLineMo}/line/mo`}
            </span>
          </div>
        </div>

        {/* ── Disclosures + write path (X1 idiom) ─────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            At capacity, batch calls queue — nothing drops. Line fees bill separately from
            usage: your spend cap governs per-minute spend only.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs shrink-0"
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {stats.purchased > 0 ? "Add or reduce lines" : "Add lines"}
          </Button>
        </div>
      </CardContent>

      <AddLinesSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        purchased={purchased}
        queued={stats.queued}
        totalLines={stats.totalLines}
        capHeadroomUsd={spend.capUsd != null ? Math.max(0, spend.capUsd - spend.spentUsd) : null}
        onCommit={onPurchased}
      />
    </Card>
  )
}

// ─── Add/reduce sheet — the considered write path ─────────────────────────────

export function AddLinesSheet({
  open,
  onOpenChange,
  purchased,
  queued,
  totalLines,
  capHeadroomUsd,
  onCommit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  purchased: number
  queued: number
  totalLines: number
  capHeadroomUsd: number | null
  onCommit: (qty: number, chargeOrCredit: number) => void
}) {
  const price = CONCURRENCY.pricePerLineMo
  const daysLeft = PLAN_USAGE.periodDaysTotal - PLAN_USAGE.periodDaysElapsed
  const [qty, setQty] = React.useState(5)

  React.useEffect(() => {
    if (open) setQty(5)
  }, [open])

  // Negative qty = reduce purchased lines (min: remove all purchased).
  const clamped = Math.max(-purchased, Math.min(40, qty))
  const adding = clamped > 0
  // Proration derives from the period position — never hardcoded cycle days.
  const prorated = Math.round(Math.abs(clamped) * price * (daysLeft / PLAN_USAGE.periodDaysTotal) * 100) / 100
  const newTotal = totalLines + clamped
  const monthlyAfter = (purchased + Math.max(0, clamped)) * price

  const saved =
    queued > 0 && adding
      ? Math.round((queued * AVG_CALL_MIN) / totalLines - (queued * AVG_CALL_MIN) / newTotal)
      : 0
  // Full-burn time-to-cap on the NEW line count — the cap can bite before a
  // speed-up pays off; when it would, pair the purchase with a cap review.
  const burnPerMin = newTotal * PAYG_RATE
  const capMinutes =
    capHeadroomUsd != null && burnPerMin > 0 ? Math.round(capHeadroomUsd / burnPerMin) : null

  function commit() {
    if (clamped === 0) return
    track(Events.lines_added, { qty: clamped, prorated_charge_usd: adding ? prorated : -prorated })
    onCommit(clamped, prorated)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Concurrent lines</SheetTitle>
          <SheetDescription>
            {totalLines} today — {CONCURRENCY.included} included free
            {purchased > 0 ? ` + ${purchased} purchased` : ""}. Changes apply instantly.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6">
          <div className="space-y-2">
            <Label htmlFor="line-qty">Change line count</Label>
            <div className="flex items-center gap-2">
              {[5, 10].map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant={clamped === q ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs tabular-nums"
                  onClick={() => setQty(q)}
                >
                  +{q}
                </Button>
              ))}
              {purchased > 0 && (
                <Button
                  type="button"
                  variant={clamped < 0 ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs tabular-nums"
                  onClick={() => setQty(-purchased)}
                >
                  Remove all {purchased}
                </Button>
              )}
              <Input
                id="line-qty"
                inputMode="numeric"
                className="h-7 w-20 text-xs"
                value={String(qty)}
                onChange={(e) => setQty(Number(e.target.value.replace(/[^\d-]/g, "")) || 0)}
                aria-label="Custom line change (negative reduces)"
              />
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              {adding
                ? `${clamped} × $${price}/mo = $${(clamped * price).toFixed(0)}/mo · $${prorated.toFixed(2)} prorated for the ${daysLeft} days left this cycle · then $${monthlyAfter.toFixed(0)}/mo total`
                : clamped < 0
                  ? `$${prorated.toFixed(2)} prorated credit on your next invoice — no fees, add lines back anytime`
                  : "Pick a change"}
              {" "}· wireframe pricing
            </p>
            {saved > 0 && (
              <p className="text-xs text-muted-foreground tabular-nums">
                Your queue clears ~{saved} min sooner{" "}
                <Badge variant="secondary" className="text-xs align-middle">Estimate</Badge> —{" "}
                {queued} queued × ~{AVG_CALL_MIN} min ÷ lines.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Lines and your spend cap:</p>
            <p>
              · More lines never raise your cap — line fees bill separately; the cap governs
              per-minute usage.
            </p>
            {capHeadroomUsd != null && capMinutes != null && adding && (
              <p className="tabular-nums">
                · At full use, {newTotal} lines spend ${burnPerMin.toFixed(2)}/min — your $
                {capHeadroomUsd.toFixed(2)} headroom lasts ≈{capMinutes} min (estimate).
                {saved > 0 && capMinutes < saved && (
                  <> The cap would pause calls before the speed-up pays off — review it in
                  Usage &amp; spend above.</>
                )}
              </p>
            )}
          </div>
        </div>

        <SheetFooter className="px-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button disabled={clamped === 0} onClick={commit} className="tabular-nums">
            {adding
              ? `Add ${clamped} line${clamped > 1 ? "s" : ""} · $${prorated.toFixed(2)} today`
              : `Remove ${-clamped} line${clamped < -1 ? "s" : ""} · $${prorated.toFixed(2)} credit`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
