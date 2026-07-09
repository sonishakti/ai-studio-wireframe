"use client"

import * as React from "react"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  Lock,
  Pause,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { freeMinutesStats, spendStats } from "@/lib/campaign-data"
import type { SpendVariantProps } from "./spec"

/**
 * Variant A — ONE consolidated "Usage & spend" card.
 * Stacked top-to-bottom because the sections are a sequence, not parallel
 * choices (project layout rule): what you used → what it will cost → the
 * protections you control → what (if anything) needs a decision right now.
 * Every figure derives from spendStats()/freeMinutesStats() over the scenario
 * fixture; the only constant is the PAYG rate those fixtures are built on
 * (R12: every $ = minutes × rate — nothing typed by hand).
 */

const USD_PER_MIN = 0.1

// Caps read cleaner whole ("$50"); metered figures always carry cents
// ("$18.40") so estimates never look more precise than the cap they run into.
function usd(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

function usdExact(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Headroom shown in $ AND ~minutes (R3: units beat bare figures for a
// per-minute product). Round, not floor — float drift (8.799…) must not
// eat a whole minute.
function minutesFor(usdAmount: number) {
  return Math.round(usdAmount / USD_PER_MIN)
}

export function VariantA({ scenario }: SpendVariantProps) {
  const u = scenario.usage
  const free = freeMinutesStats(u)
  const spend = spendStats(u)

  const ungated = u.freeMinutesUngated
  const bonus = free.included - ungated
  const locked = !u.cardOnFile

  // R7 unit switch: the meter counts minutes while the free tier lasts and
  // dollars-of-cap once paid metering starts — never both at once.
  const paygMode = spend.state !== "free"
  // state !== "free" implies a card was captured, and card capture always sets
  // a cap (PlanUsage contract) — the fallback narrows the type, never renders.
  const cap = spend.capUsd ?? u.defaultSpendCapUsd
  const headroomUsd = Math.max(0, cap - spend.spentUsd)
  const capHit = spend.state === "cap_hit"
  const capWarning = spend.state === "cap_warning"
  // A cap above the offered default while back in plain PAYG = the user just
  // raised it (S8): confirm the new ceiling rather than re-warn.
  const capRaised =
    spend.state === "payg" && spend.capUsd != null && spend.capUsd !== u.defaultSpendCapUsd
  const exhaustedNoCard = locked && spend.freeMinutesLeft <= 0
  const thresholdNoCard = locked && free.used >= ungated && spend.freeMinutesLeft > 0

  // The invoice honors the cap (R5), so a straight line past it can never
  // bill — at cap-hit the honest bill is the cap, with the raw rate disclosed.
  const billUsd = capHit ? Math.min(spend.projectedUsd, cap) : spend.projectedUsd

  const uid = React.useId()
  const meterId = `${uid}-meter`
  const capFieldId = `${uid}-cap`
  const alertFieldId = `${uid}-alert`
  const capInputRef = React.useRef<HTMLInputElement>(null)

  const seededCap = String(spend.capUsd ?? u.defaultSpendCapUsd)
  const seededAlert = String(Math.round(spend.alertPct * 100))
  const [prevScenarioId, setPrevScenarioId] = React.useState(scenario.id)
  const [capDraft, setCapDraft] = React.useState(seededCap)
  const [alertDraft, setAlertDraft] = React.useState(seededAlert)
  const [saved, setSaved] = React.useState(false)
  const [keepPaused, setKeepPaused] = React.useState(false)
  const [keptCap, setKeptCap] = React.useState(false)

  // The lab harness swaps scenarios under a mounted component — drafts must
  // re-seed from the new fixture (adjust-state-during-render, no effect).
  if (prevScenarioId !== scenario.id) {
    setPrevScenarioId(scenario.id)
    setCapDraft(seededCap)
    setAlertDraft(seededAlert)
    setSaved(false)
    setKeepPaused(false)
    setKeptCap(false)
  }

  const capNum = Number.parseFloat(capDraft)
  const alertNum = Number.parseFloat(alertDraft)
  const capValid = Number.isFinite(capNum) && capNum > 0
  const alertValid = Number.isFinite(alertNum) && alertNum >= 1 && alertNum <= 100
  // The bar's alert tick tracks the editable % live, so threshold + cap +
  // usage read as one instrument (R2), not three settings.
  const tickPct = alertValid ? Math.min(100, Math.round(alertNum)) : Math.round(spend.alertPct * 100)

  const seg1Fill = ungated > 0 ? Math.min(100, (Math.min(free.used, ungated) / ungated) * 100) : 0
  const seg2Fill = bonus > 0 ? Math.min(100, (Math.max(0, free.used - ungated) / bonus) * 100) : 0
  const fillTone = capHit ? "bg-destructive" : capWarning ? "bg-warning" : "bg-primary"

  function focusCapInput() {
    capInputRef.current?.focus()
    capInputRef.current?.select()
  }

  const statusBadge =
    capHit || exhaustedNoCard ? (
      <Badge variant="outline" className="text-xs border-destructive/40 text-destructive">
        New calls paused
      </Badge>
    ) : capWarning ? (
      <Badge variant="outline" className="text-xs border-warning/40 text-warning">
        Approaching cap
      </Badge>
    ) : capRaised ? (
      <Badge variant="outline" className="text-xs border-success/40 text-success">
        Cap raised
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">
        {free.plan} tier
      </Badge>
    )

  // ── (4) Contextual state banner — at most one, worst state wins ───────────
  let banner: React.ReactNode = null
  if (capHit) {
    banner = keepPaused ? (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <Pause className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="flex-1 min-w-0 text-xs text-muted-foreground tabular-nums">
          Staying paused — new calls stay off for the rest of {spend.periodLabel}, and the invoice
          stays at {usd(cap)}. Raise the cap above anytime to resume.
        </p>
      </div>
    ) : (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3.5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <Pause className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium tabular-nums">
              {usdExact(spend.spentUsd)} of {usd(cap)} — your cap paused new calls.
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              Stopped: new inbound and outbound calls. Still working: in-flight calls finished
              normally, your agents and data are untouched, and this period&apos;s invoice stays at{" "}
              {usd(cap)}. The cap you set did exactly its job.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={focusCapInput}>
                Raise cap
              </Button>
              <Button size="sm" variant="outline" onClick={() => setKeepPaused(true)}>
                Keep paused
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  } else if (capWarning) {
    banner = (
      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3.5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium tabular-nums">
              {usdExact(spend.spentUsd)} of {usd(cap)} cap ({spend.pctOfCap}%) —{" "}
              {usdExact(headroomUsd)} left (~{minutesFor(headroomUsd)} min).
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              This is your {Math.round(spend.alertPct * 100)}% alert, fired before anything pauses.
              Raising the cap adds capacity; keeping it is just as valid — it&apos;s your guardrail,
              and new calls simply pause if it&apos;s reached.
            </p>
            {keptCap ? (
              <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                Cap unchanged — new calls pause at {usd(cap)}, and the invoice won&apos;t exceed it.
              </p>
            ) : (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={focusCapInput}>
                  Raise cap
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setKeptCap(true)}>
                  Keep current cap
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } else if (capRaised) {
    banner = (
      <div className="flex flex-wrap items-start gap-3 rounded-lg border border-success/40 bg-success/5 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium tabular-nums">
            Cap raised to {usd(cap)} — in effect now, for {spend.periodLabel}.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            Headroom restored: {usdExact(headroomUsd)} (~{minutesFor(headroomUsd)} min). New calls
            resumed, and the estimate above now runs against the {usd(cap)} cap.
          </p>
        </div>
      </div>
    )
  } else if (exhaustedNoCard) {
    banner = (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3.5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <Lock className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium tabular-nums">
              All {free.included} free minutes used — new calls are paused.
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              In-flight calls finished normally; nothing was cut off mid-conversation. One step
              resumes service: add a card, and usage rolls into pay-as-you-go at{" "}
              {usdExact(USD_PER_MIN)}/min under your {usd(u.defaultSpendCapUsd)}/mo cap.
            </p>
            <Button size="sm" variant="destructive" className="mt-2.5 gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Add a card to resume
            </Button>
          </div>
        </div>
      </div>
    )
  } else if (thresholdNoCard) {
    banner = (
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3.5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium tabular-nums">
              {free.used} of {ungated} no-card minutes used. A card unlocks {bonus} more — still
              free, $0 today.
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              No charge until all {free.included} free minutes are gone; after that, pay-as-you-go
              starts with your {usd(u.defaultSpendCapUsd)}/mo cap already protecting you.
            </p>
            <Button size="sm" className="mt-2.5 gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Add a card
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Usage &amp; spend</CardTitle>
            <CardDescription className="text-xs mt-0.5">{spend.periodLabel}</CardDescription>
          </div>
          {statusBadge}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── (1) The meter — minutes until the free tier is done, then $-of-cap ── */}
        <div>
          {!paygMode ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                <p id={meterId} className="text-sm font-medium tabular-nums">
                  {free.used} of {free.included} free minutes used
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {free.remaining} min left
                </p>
              </div>
              {/* Segment widths/fills are data-driven percentages — inline style
                  is the Progress-component precedent, not a styling escape hatch. */}
              <div
                role="meter"
                aria-labelledby={meterId}
                aria-valuemin={0}
                aria-valuemax={free.included}
                aria-valuenow={free.used}
                aria-valuetext={`${free.used} of ${free.included} free minutes used`}
                className="mt-2 flex h-2.5 gap-1"
              >
                <div
                  className="h-full overflow-hidden rounded-full bg-muted"
                  style={{ width: `${(ungated / free.included) * 100}%` }}
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${seg1Fill}%` }} />
                </div>
                {/* Locked slice keeps the primary tint + dashed edge: capacity
                    waiting to be unlocked, not a wall. */}
                <div
                  className={
                    locked
                      ? "h-full flex-1 overflow-hidden rounded-full border border-dashed border-primary/40 bg-primary/5"
                      : "h-full flex-1 overflow-hidden rounded-full bg-muted"
                  }
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${seg2Fill}%` }} />
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="tabular-nums">{ungated} min — no card needed</span>
                {locked ? (
                  <span className="flex items-center gap-1 text-primary tabular-nums">
                    <Lock className="h-3 w-3" /> +{bonus} min free — add a card to unlock
                  </span>
                ) : (
                  <span className="flex items-center gap-1 tabular-nums">
                    <CheckCircle2 className="h-3 w-3 text-success" /> +{bonus} min — unlocked with
                    your card
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                <p id={meterId} className="text-sm font-medium tabular-nums">
                  {usdExact(spend.spentUsd)} of {usd(cap)} monthly cap ({spend.pctOfCap}%)
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {usdExact(headroomUsd)} left (~{minutesFor(headroomUsd)} min)
                </p>
              </div>
              <div
                role="meter"
                aria-labelledby={meterId}
                aria-valuemin={0}
                aria-valuemax={cap}
                aria-valuenow={spend.spentUsd}
                aria-valuetext={`${usdExact(spend.spentUsd)} of ${usd(cap)} monthly cap used`}
                className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-muted"
              >
                <div className={`h-full rounded-full ${fillTone}`} style={{ width: `${spend.pctOfCap}%` }} />
                {/* Alert tick — moves with the editable threshold below (R2). */}
                <div
                  className="absolute inset-y-0 w-px bg-foreground/40"
                  style={{ left: `${tickPct}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-muted-foreground tabular-nums">
                <span>
                  Alert at {tickPct}% ({usdExact((cap * tickPct) / 100)})
                </span>
                <span>Cap {usd(cap)}</span>
              </div>
              {/* The 150+150 story stays legible after the free tier is spent (R4). */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-1.5 w-16 shrink-0 gap-0.5" aria-hidden="true">
                  <span className="h-full flex-1 rounded-full bg-primary/40" />
                  <span className="h-full flex-1 rounded-full bg-primary/40" />
                </span>
                <span className="tabular-nums">
                  Free tier used — {free.used} of {free.included} min ({ungated} no-card + {bonus}{" "}
                  card-unlocked)
                </span>
              </div>
            </>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" /> Usage metering can lag a few minutes — the most
            recent calls may not be counted yet.
          </p>
        </div>

        <Separator />

        {/* ── (2) Projected bill — always an estimate, never a promise ── */}
        <div>
          <p className="text-xs text-muted-foreground">Projected bill this period</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p
              className={
                paygMode
                  ? "text-2xl font-semibold tracking-tight tabular-nums"
                  : "text-lg font-semibold tracking-tight tabular-nums"
              }
            >
              {usdExact(billUsd)}
            </p>
            <p className="text-xs text-muted-foreground">Estimate — updates as you use.</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {!paygMode
              ? `Pay-as-you-go hasn't started — it begins only after all ${free.included} free minutes, at ${usdExact(USD_PER_MIN)}/min.`
              : capHit
                ? `Straight-line run rate was ${usdExact(spend.projectedUsd)} — your ${usd(cap)} cap holds the invoice at ${usd(cap)}.`
                : capRaised
                  ? `Straight line from ${usdExact(spend.spentUsd)} over ${u.periodDaysElapsed} of ${u.periodDaysTotal} days — now projected against your ${usd(cap)} cap.`
                  : `Straight line from ${usdExact(spend.spentUsd)} spent over ${u.periodDaysElapsed} of ${u.periodDaysTotal} days.`}
          </p>
        </div>

        <Separator />

        {/* ── (3) Spend protections — the user's own guardrails, editable inline ── */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Spend protections</p>
            {locked && (
              <Badge variant="secondary" className="text-xs">
                Applies when pay-as-you-go starts
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Your cap, your protection: at the cap we pause new calls only — in-flight calls
            finish, and the invoice never exceeds it.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={capFieldId} className="text-xs">
                Monthly cap (USD)
              </Label>
              <Input
                ref={capInputRef}
                id={capFieldId}
                inputMode="decimal"
                value={capDraft}
                onChange={(e) => {
                  setCapDraft(e.target.value)
                  setSaved(false)
                }}
                aria-invalid={!capValid}
                className="h-8 w-28 tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={alertFieldId} className="text-xs">
                Alert at (% of cap)
              </Label>
              <Input
                id={alertFieldId}
                inputMode="numeric"
                value={alertDraft}
                onChange={(e) => {
                  setAlertDraft(e.target.value)
                  setSaved(false)
                }}
                aria-invalid={!alertValid}
                className="h-8 w-24 tabular-nums"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={!capValid || !alertValid || saved}
              onClick={() => setSaved(true)}
            >
              {saved ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Saved
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
          {capValid && alertValid ? (
            <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
              Alert fires at {Math.round(alertNum)}% — {usdExact((capNum * alertNum) / 100)} of{" "}
              {usd(capNum)} — before anything pauses.
            </p>
          ) : (
            <p role="alert" className="mt-1.5 text-xs text-destructive">
              Cap must be above $0 and the alert between 1 and 100%.
            </p>
          )}
        </div>

        {banner && (
          <>
            <Separator />
            {banner}
          </>
        )}
      </CardContent>
    </Card>
  )
}
