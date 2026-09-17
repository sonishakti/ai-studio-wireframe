"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  LifeBuoy,
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
import { track, Events } from "@/lib/analytics"
import {
  AGORA_RATE_PER_MIN, DEPLOYMENTS, batchEta, type Deployment,
} from "@/lib/campaign-data"
import {
  BILLING_STATE_EVENT, PUBLISHED_PCU_CEILING, capacityBudget, readCapacity,
  type CapacityBudget,
} from "@/lib/billing-state"
import { StateBanner } from "@/components/usage-spend-card"

/**
 * ConcurrencyCard — concurrent lines on Billing (A6; rebuilt for feature 22,
 * 2026-09-17). This card is the start of the review journey, which is why the
 * root carries the `concurrent-lines` design-focus anchor.
 * ──────────────────────────────────────────────────────────────────────────
 * Rules this card must never break:
 *  • Every number on it is derived in lib/billing-state from things that
 *    exist: the published App ID ceiling, the live calls, the batch runs.
 *    No seeded ceiling, no per-line price, no purchase, no pending request.
 *  • Lines govern how many calls run AT ONCE; the spend cap governs usage $.
 *  • The wall is INFORMATION, not alarm: at capacity, batch calls queue;
 *    nothing drops. "Keep queuing" is a first-class choice.
 *  • Every estimate shows its inputs and wears the Estimate label, and the
 *    queue's clock is the batch run's own observed pace, never an assumed
 *    average call length.
 */

/** The run a queue is actually building on: the one whose calls are waiting.
 *  Nothing is invented when there is none, the estimate simply does not draw. */
function queueingRun(): Deployment | null {
  for (const d of DEPLOYMENTS) {
    const rt = d.batchRuntime
    if (!rt || (rt.pacing !== "paced" && rt.pacing !== "dialing")) continue
    if (rt.queued > 0) return d
  }
  return null
}

export function ConcurrencyCard() {
  const [keptQueuing, setKeptQueuing] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  // Re-read when the spend card writes: the budget box two clicks away is
  // built from the cap that card owns.
  const [, bump] = React.useReducer((n: number) => n + 1, 0)
  React.useEffect(() => {
    window.addEventListener(BILLING_STATE_EVENT, bump)
    return () => window.removeEventListener(BILLING_STATE_EVENT, bump)
  }, [])

  const cap = readCapacity()
  const run = queueingRun()
  const eta = run ? batchEta(run) : null
  const cps = run?.batchRuntime?.cps.actual ?? 0
  const remaining = run ? (run.progress?.total ?? 0) - (run.progress?.completed ?? 0) : 0
  const meterId = React.useId()

  React.useEffect(() => {
    if (cap.atWall) track(Events.concurrency_wall_viewed, { lines: cap.limit, queued: cap.queued })
    // once per mount is enough for a wireframe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card data-design-focus="concurrent-lines">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Concurrent lines</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              How many calls can run at once
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs tabular-nums">
            {cap.limit} lines
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {cap.atWall && (
          // The wall is designed behavior — primary tone, zero alarm.
          <StateBanner tone="primary" icon={PhoneForwarded}>
            <p className="text-sm font-medium">
              All {cap.limit} lines are in use. New batch calls queue. Nothing drops
              or fails.
            </p>
            {cap.queued > 0 && eta && cps > 0 && (
              <p className="text-xs text-muted-foreground tabular-nums">
                <Badge variant="secondary" className="text-xs align-middle">Estimate</Badge>{" "}
                {cap.queued.toLocaleString()} calls are waiting for a line. At {cps.toFixed(1)}{" "}
                calls a second the run has about {eta.minutes} minutes left:{" "}
                {remaining.toLocaleString()} calls left ÷ {cps.toFixed(1)} a second.
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" onClick={() => setSheetOpen(true)}>Ask for more lines</Button>
              {keptQueuing ? (
                <span className="inline-flex items-center text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-success" />
                  Queuing as designed: calls dial as lines free up.
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setKeptQueuing(true); track(Events.keep_queuing_clicked, { lines: cap.limit }) }}
                >
                  Keep queuing
                </Button>
              )}
            </div>
          </StateBanner>
        )}

        {/* ── Gauge — where the account sits against the published ceiling ── */}
        <div>
          <p id={meterId} className="text-xs text-muted-foreground mb-1.5 tabular-nums">
            {cap.inUse} of {cap.limit} lines in use right now: {cap.liveInUse} live calls and{" "}
            {cap.batchInUse} on batch runs.
          </p>
          <div
            role="meter"
            aria-valuemin={0}
            aria-valuemax={cap.limit}
            aria-valuenow={Math.min(cap.inUse, cap.limit)}
            aria-labelledby={meterId}
            className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${cap.pctInUse}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" aria-hidden />
              {cap.limit} lines on this App ID
            </span>
            <span>{cap.queued.toLocaleString()} calls queued</span>
          </div>
        </div>

        {/* ── Disclosures + the one door onto capacity ─────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            At capacity, batch calls queue. Nothing drops. Your spend cap governs
            per-minute spend.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs shrink-0"
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Lines and your budget
          </Button>
        </div>
      </CardContent>

      <CapacitySheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </Card>
  )
}

// ─── The capacity sheet — what the limit is, and what it costs you in time ───

/**
 * One mount, one prop contract, and no number it cannot stand behind. The
 * ceiling is the published one and the console cannot raise it, so the only
 * write path is the support form this app already ships. What the sheet keeps
 * is the idea no competitor shows: what a line count does to a budget.
 */
export function CapacitySheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const cap = readCapacity()
  // The cap lives in storage, so it is read when the sheet opens rather than
  // during render: the first paint must match the one the server drew.
  const [budget, setBudget] = React.useState<CapacityBudget | null>(null)
  React.useEffect(() => {
    if (open) setBudget(capacityBudget(cap.limit))
  }, [open, cap.limit])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Concurrent lines</SheetTitle>
          <SheetDescription className="tabular-nums">
            {cap.limit} lines · {cap.inUse} in use · {cap.queued.toLocaleString()} queued
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6">
          <p className="text-xs text-muted-foreground">
            Agora publishes one limit: {PUBLISHED_PCU_CEILING} calls at once on a single
            App ID. Nothing in the console can raise it.
          </p>

          <div className="space-y-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Lines and your budget</p>
            <p>
              Lines change how fast you spend, not how much. Agora charges $
              {AGORA_RATE_PER_MIN.toFixed(2)} a minute whichever line carries the call.
            </p>
            {budget == null ? null : budget.unit === "minutes" ? (
              <p className="tabular-nums">
                You have {budget.minutesLeft.toLocaleString()} free minutes left. With all{" "}
                {cap.limit} lines dialing they last about {budget.wallClockMinutes} minutes
                of wall clock: {budget.minutesLeft.toLocaleString()} minutes ÷ {cap.limit} lines.
              </p>
            ) : budget.capUsd != null ? (
              <p className="tabular-nums">
                Your ${Math.round(budget.capUsd).toLocaleString()} cap buys{" "}
                {budget.minutesLeft.toLocaleString()} minutes at ${AGORA_RATE_PER_MIN.toFixed(2)} a
                minute. With all {cap.limit} lines dialing they last about{" "}
                {budget.wallClockMinutes} minutes of wall clock:{" "}
                {budget.minutesLeft.toLocaleString()} minutes ÷ {cap.limit} lines.
              </p>
            ) : null}
            <SheetClose asChild>
              <button
                type="button"
                className="rounded text-left font-medium text-foreground underline underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Set your cap in Usage and spend, above.
              </button>
            </SheetClose>
          </div>
        </div>

        <SheetFooter className="px-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button
            asChild
            className="gap-1.5"
            onClick={() => track(Events.capacity_support_opened, { lines: cap.limit, queued: cap.queued })}
          >
            <Link href="/help/contact">
              <LifeBuoy className="h-3.5 w-3.5" /> Open a support request
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
