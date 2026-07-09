"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  CreditCard,
  Gift,
  PauseCircle,
  ShieldCheck,
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
  PLAN_USAGE, type PlanUsage, freeMinutesStats, spendStats,
} from "@/lib/campaign-data"
import { AddCardSheet } from "@/components/free-minutes-nudge"

/**
 * UsageSpendCard — the Billing "Usage & spend" surface (X1, 2026-07-09).
 * ──────────────────────────────────────────────────────────────────────
 * Winner of the 3-variant judge round (see LEARNINGS §20): variant B's money
 * skeleton — projection always clamped to the cap, every recovery loop
 * rendering its consequence — in variant C's single-card shell with the
 * write-path in a Sheet, plus variant A's labelled role="meter".
 *
 * Money rules this card must never break:
 *  • Numbers before adjectives; every figure carries its unit.
 *  • The meter's PRIMARY unit switches at the free→PAYG boundary:
 *    minutes while the free tier lasts, dollars-of-cap once paid.
 *  • The projected bill is an ESTIMATE, says so, and never exceeds the cap
 *    on display — the cap holds the invoice, and the copy explains that.
 *  • At the cap: what stopped (new calls), what didn't (live calls finish,
 *    data intact), one primary CTA; "keep paused" is a first-class choice.
 * All state derives from PLAN_USAGE via freeMinutesStats()/spendStats() over
 * a local overlay — the lifecycle state machine is never re-implemented here.
 */

import { PAYG_RATE } from "@/lib/campaign-data"

function usd(n: number, cents = true) {
  return cents
    ? `$${n.toFixed(2)}`
    : `$${Math.round(n).toLocaleString()}`
}

export function UsageSpendCard() {
  // Mock-local overlay: the wireframe's stand-in for cap/card mutations.
  const [cardOnFile, setCardOnFile] = React.useState(PLAN_USAGE.cardOnFile)
  const [capUsd, setCapUsd] = React.useState<number | null>(PLAN_USAGE.spendCapUsd)
  const [alertPct, setAlertPct] = React.useState(PLAN_USAGE.spendAlertPct)
  // A cautious user may set a cap BEFORE adding a card; it arms at capture.
  const [preCardCap, setPreCardCap] = React.useState<number | null>(null)
  // Transient confirmations — moments, not states (judge fix: no permanent
  // "cap raised" banner derived from cap ≠ default).
  const [confirm, setConfirm] = React.useState<"card" | "cap-set" | "cap-raised" | null>(null)
  const [keptPaused, setKeptPaused] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const effective: PlanUsage = {
    ...PLAN_USAGE,
    cardOnFile,
    spendCapUsd: cardOnFile ? (capUsd ?? PLAN_USAGE.defaultSpendCapUsd) : null,
    spendAlertPct: alertPct,
  }
  const free = freeMinutesStats(effective)
  const spend = spendStats(effective)

  const paygPhase = spend.state !== "free"
  const cap = spend.capUsd
  const rawProjected = spend.projectedUsd
  const projectedShown = cap != null ? Math.min(rawProjected, cap) : rawProjected
  const projectionClamped = cap != null && rawProjected > cap
  const headroomUsd = cap != null ? Math.max(0, cap - spend.spentUsd) : null
  const headroomMin = headroomUsd != null ? Math.round(headroomUsd / PAYG_RATE) : null

  const meterLabelId = React.useId()

  const thresholdReached =
    !cardOnFile && free.used >= effective.freeMinutesUngated && free.used < free.included
  const exhaustedNoCard = !cardOnFile && free.used >= free.included

  React.useEffect(() => {
    if (paygPhase) {
      track(Events.projected_bill_viewed, {
        projected_usd: projectedShown,
        spend_state: spend.state,
      })
    }
    // Once per mount is enough for a wireframe meter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onCardAdded() {
    setCardOnFile(true)
    setCapUsd(preCardCap ?? PLAN_USAGE.defaultSpendCapUsd)
    setConfirm("card")
  }

  function saveControls(nextCap: number, nextAlertPct: number) {
    const prevCap = cardOnFile ? (capUsd ?? PLAN_USAGE.defaultSpendCapUsd) : null
    if (cardOnFile) {
      setCapUsd(nextCap)
    } else {
      setPreCardCap(nextCap)
    }
    setAlertPct(nextAlertPct)
    if (prevCap != null && nextCap > prevCap && spend.state === "cap_hit") {
      track(Events.spend_cap_raised, {
        from_usd: prevCap, to_usd: nextCap, at_spend_usd: spend.spentUsd,
      })
      setConfirm("cap-raised")
      setKeptPaused(false)
    } else {
      track(Events.spend_cap_set, {
        cap_usd: nextCap, alert_pct: nextAlertPct, pre_card: !cardOnFile,
      })
      setConfirm("cap-set")
    }
    setSheetOpen(false)
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Usage &amp; spend</CardTitle>
            <CardDescription className="text-xs mt-0.5">{spend.periodLabel}</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/billing/usage">
              View details <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Banner first: the state that needs acting on leads the card ── */}
        {confirm === "card" && (
          <StateBanner tone="success" icon={CheckCircle2}>
            <p className="text-sm font-medium">
              Card on file — {free.included - effective.freeMinutesUngated} more free minutes unlocked.
            </p>
            <p className="text-xs text-muted-foreground">
              After your {free.included} free minutes, usage rolls into pay-as-you-go at{" "}
              {usd(PAYG_RATE)}/min under your {usd(capUsd ?? PLAN_USAGE.defaultSpendCapUsd, false)}/mo cap.
              You&apos;re still at $0 today.
            </p>
          </StateBanner>
        )}

        {confirm === "cap-raised" && (
          <StateBanner tone="success" icon={CheckCircle2}>
            <p className="text-sm font-medium">
              Cap raised to {usd(capUsd ?? 0, false)}/mo — new calls resumed.
            </p>
            <p className="text-xs text-muted-foreground">
              {headroomUsd != null && headroomMin != null && (
                <>Headroom restored: {usd(headroomUsd)} (≈{headroomMin.toLocaleString()} min). </>
              )}
              Effective immediately; the estimate below already reflects it.
            </p>
          </StateBanner>
        )}

        {thresholdReached && confirm !== "card" && (
          <StateBanner tone="primary" icon={Gift}>
            <p className="text-sm font-medium">
              You&apos;ve used your first {effective.freeMinutesUngated} free minutes. A card
              unlocks {free.included - effective.freeMinutesUngated} more — free.
            </p>
            <p className="text-xs text-muted-foreground">
              $0 today. No charge until all {free.included} free minutes are used, and
              pay-as-you-go stays under a cap you set.
            </p>
            <div className="mt-2">
              <AddCardSheet onUnlocked={onCardAdded}>
                <Button size="sm" className="gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Add a card
                </Button>
              </AddCardSheet>
            </div>
          </StateBanner>
        )}

        {exhaustedNoCard && (
          <StateBanner tone="destructive" icon={PauseCircle}>
            <p className="text-sm font-medium">
              All {free.included} free minutes used — new calls are paused.
            </p>
            <p className="text-xs text-muted-foreground">
              Calls already in progress finished normally and your agents and data are
              untouched. Add a card to resume: usage rolls into pay-as-you-go at{" "}
              {usd(PAYG_RATE)}/min under a cap you set.
            </p>
            <div className="mt-2">
              <AddCardSheet onUnlocked={onCardAdded}>
                <Button size="sm" className="gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Add a card to resume
                </Button>
              </AddCardSheet>
            </div>
          </StateBanner>
        )}

        {spend.state === "cap_warning" && (
          <StateBanner tone="warning" icon={BellRing}>
            <p className="text-sm font-medium">
              {spend.pctOfCap}% of your {usd(cap ?? 0, false)}/mo cap used —{" "}
              {usd(headroomUsd ?? 0)} left (≈{(headroomMin ?? 0).toLocaleString()} min).
            </p>
            <p className="text-xs text-muted-foreground">
              At the cap, new calls pause; live calls finish. Raise it for more headroom,
              or keep it — both are fine.
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => setSheetOpen(true)}>Raise cap</Button>
              <Button size="sm" variant="outline" onClick={() => setConfirm(null)}>
                Keep my cap
              </Button>
            </div>
          </StateBanner>
        )}

        {spend.state === "cap_hit" && confirm !== "cap-raised" && (
          <StateBanner tone="destructive" icon={PauseCircle}>
            <p className="text-sm font-medium">
              {usd(spend.spentUsd)} of {usd(cap ?? 0, false)} — the cap you set did exactly
              its job. New calls are paused.
            </p>
            <p className="text-xs text-muted-foreground">
              Calls in progress finished normally, your agents and data are untouched, and
              this invoice will not exceed {usd(cap ?? 0, false)}.
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => setSheetOpen(true)}>Raise cap</Button>
              {keptPaused ? (
                <span className="inline-flex items-center text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-success" />
                  Staying paused at your {usd(cap ?? 0, false)} cap until the period resets.
                </span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setKeptPaused(true)}>
                  Keep paused
                </Button>
              )}
            </div>
          </StateBanner>
        )}

        {/* ── Hero: minutes while free, the estimated bill once PAYG ────── */}
        {paygPhase ? (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {usd(projectedShown)}
              </span>
              <Badge variant="secondary" className="text-xs">Estimate</Badge>
              <span className="text-xs text-muted-foreground">
                projected this period — updates as you use
              </span>
            </div>
            {projectionClamped && (
              <p className="mt-1 text-xs text-muted-foreground">
                Run rate alone would be {usd(rawProjected)} — your {usd(cap ?? 0, false)} cap
                holds the invoice.
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-2">
              <span
                id={meterLabelId}
                className="text-2xl font-semibold tracking-tight tabular-nums"
              >
                {free.used === 0
                  ? `${free.included.toLocaleString()} free minutes ready`
                  : `${free.used.toLocaleString()} of ${free.included.toLocaleString()} free minutes used`}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {usd(0)} projected — pay-as-you-go starts only after your{" "}
              {free.included} free minutes, and never without a card on file.
            </p>
          </div>
        )}

        {/* ── Meter: split-tier minutes OR dollars-of-cap ────────────────── */}
        {paygPhase ? (
          <div>
            <p id={meterLabelId} className="text-xs text-muted-foreground mb-1.5 tabular-nums">
              Pay-as-you-go: {usd(spend.spentUsd)} of {usd(cap ?? 0, false)} monthly cap
              ({spend.pctOfCap}%)
            </p>
            <div
              role="meter"
              aria-valuemin={0}
              aria-valuemax={cap ?? 0}
              aria-valuenow={Math.min(spend.spentUsd, cap ?? 0)}
              aria-labelledby={meterLabelId}
              className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  spend.state === "cap_hit"
                    ? "bg-destructive"
                    : spend.state === "cap_warning"
                      ? "bg-warning"
                      : "bg-primary",
                )}
                style={{ width: `${Math.min(100, spend.pctOfCap)}%` }}
              />
              {/* Alert-threshold tick — the warning fires here, before the wall */}
              <div
                aria-hidden="true"
                className="absolute inset-y-0 w-px bg-foreground/40"
                style={{ left: `${Math.round(alertPct * 100)}%` }}
              />
            </div>
            {headroomUsd != null && headroomMin != null && spend.state !== "cap_hit" && (
              <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                {usd(headroomUsd)} left before the cap (≈{headroomMin.toLocaleString()} min)
                · alert at {Math.round(alertPct * 100)}%
              </p>
            )}
          </div>
        ) : (
          <div>
            <div
              role="meter"
              aria-valuemin={0}
              aria-valuemax={free.included}
              aria-valuenow={Math.min(free.used, free.included)}
              aria-labelledby={meterLabelId}
              className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full"
            >
              {/* Two visible slices: what's free NOW vs what a card unlocks —
                  the locked half must read as expandable capacity, not a wall */}
              <div className="relative h-full flex-1 overflow-hidden rounded-l-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, (free.used / effective.freeMinutesUngated) * 100)}%`,
                  }}
                />
              </div>
              <div className="relative h-full flex-1 overflow-hidden rounded-r-full bg-muted">
                <div
                  className={cn("h-full transition-all", cardOnFile ? "bg-primary" : "bg-primary/30")}
                  style={{
                    width: `${Math.min(100, (Math.max(0, free.used - effective.freeMinutesUngated) / (free.included - effective.freeMinutesUngated)) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
              <span>{effective.freeMinutesUngated} min — no card needed</span>
              <span className="inline-flex items-center gap-1">
                {!cardOnFile && <Gift className="h-3 w-3" />}
                {free.included - effective.freeMinutesUngated} min —{" "}
                {cardOnFile ? "unlocked" : "free with a card"}
              </span>
            </div>
          </div>
        )}

        {/* ── Disclosures + the quiet write-path row ─────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            {cardOnFile ? (
              <>
                Spend cap {usd(capUsd ?? PLAN_USAGE.defaultSpendCapUsd, false)}/mo · alert at{" "}
                {Math.round(alertPct * 100)}%
              </>
            ) : preCardCap != null ? (
              <>Cap of {usd(preCardCap, false)}/mo saved — it arms with your first card</>
            ) : (
              <>No cap yet — defaults to {usd(PLAN_USAGE.defaultSpendCapUsd, false)}/mo with your first card</>
            )}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {cardOnFile || preCardCap != null ? "Edit spend controls" : "Set spend controls"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Usage can take a few minutes to reflect. At your cap, new calls pause — live
          calls finish, and your invoice never exceeds the cap.
        </p>
      </CardContent>

      <SpendControlsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentCap={cardOnFile ? (capUsd ?? PLAN_USAGE.defaultSpendCapUsd) : preCardCap}
        currentAlertPct={alertPct}
        spentUsd={spend.spentUsd}
        cardOnFile={cardOnFile}
        onSave={saveControls}
      />
    </Card>
  )
}

// ─── Contextual state banner ──────────────────────────────────────────────────
// Exported: the ConcurrencyCard (A6) shares this exact banner idiom so the two
// Billing money surfaces can never diverge in tone.

export function StateBanner({
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

// ─── Spend-controls sheet — the considered write path (3 beats) ───────────────

function SpendControlsSheet({
  open,
  onOpenChange,
  currentCap,
  currentAlertPct,
  spentUsd,
  cardOnFile,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  currentCap: number | null
  currentAlertPct: number
  spentUsd: number
  cardOnFile: boolean
  onSave: (capUsd: number, alertPct: number) => void
}) {
  const defaultCap = PLAN_USAGE.defaultSpendCapUsd
  const [capInput, setCapInput] = React.useState(String(currentCap ?? defaultCap))
  const [pct, setPct] = React.useState(Math.round(currentAlertPct * 100))

  // Re-seed drafts each time the sheet opens with the latest saved values.
  React.useEffect(() => {
    if (open) {
      setCapInput(String(currentCap ?? defaultCap))
      setPct(Math.round(currentAlertPct * 100))
    }
  }, [open, currentCap, currentAlertPct, defaultCap])

  const capNum = Number(capInput)
  const capValid = Number.isFinite(capNum) && capNum >= 1
  // 1–99: at 100 the "alerts before anything pauses" promise would be false.
  const pctClamped = Math.min(99, Math.max(1, pct))
  const belowSpend = capValid && spentUsd > 0 && capNum < spentUsd
  const quickCaps = [defaultCap, defaultCap * 2, defaultCap * 3]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Spend controls</SheetTitle>
          <SheetDescription>
            Your cap, your ceiling — pay-as-you-go can never bill past it.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6">
          {/* Beat 1 — the cap */}
          <div className="space-y-2">
            <Label htmlFor="spend-cap">Monthly spend cap (USD)</Label>
            <Input
              id="spend-cap"
              inputMode="numeric"
              value={capInput}
              onChange={(e) => setCapInput(e.target.value.replace(/[^\d]/g, ""))}
            />
            <div className="flex gap-2">
              {quickCaps.map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant={capNum === q ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs tabular-nums"
                  onClick={() => setCapInput(String(q))}
                >
                  ${q}
                </Button>
              ))}
            </div>
            {!cardOnFile && (
              <p className="text-xs text-muted-foreground">
                No card on file yet — this cap is saved now and arms automatically with
                your first card.
              </p>
            )}
            {belowSpend && (
              <p role="alert" className="text-xs text-warning">
                That&apos;s below the {usd(spentUsd)} already spent this period — new calls
                stay paused until the period resets or you raise the cap.
              </p>
            )}
          </div>

          {/* Beat 2 — the alert that fires before the wall */}
          <div className="space-y-2">
            <Label htmlFor="spend-alert">Alert me at</Label>
            <div className="flex items-center gap-2">
              {[50, 75, 90].map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={pctClamped === p ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs tabular-nums"
                  onClick={() => setPct(p)}
                >
                  {p}%
                </Button>
              ))}
              <Input
                id="spend-alert"
                inputMode="numeric"
                className="h-7 w-16 text-xs"
                value={String(pct)}
                onChange={(e) => setPct(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
                aria-label="Custom alert threshold percent"
              />
            </div>
            {capValid && (
              <p className="text-xs text-muted-foreground tabular-nums">
                We&apos;ll warn you at {usd((pctClamped / 100) * capNum)} — before anything
                pauses.
              </p>
            )}
          </div>

          {/* Beat 3 — what happens at the cap, in plain language */}
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">At the cap:</p>
            <p>· New calls pause — nothing is deleted or suspended.</p>
            <p>· Calls already in progress finish normally.</p>
            <p>· Your invoice never exceeds the cap, even if usage reporting lags.</p>
            <p>· Raise, lower, or remove the cap anytime — changes apply immediately.</p>
          </div>
        </div>

        <SheetFooter className="px-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button
            disabled={!capValid}
            onClick={() => onSave(capNum, pctClamped / 100)}
          >
            Save spend controls
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
