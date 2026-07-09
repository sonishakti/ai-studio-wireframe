"use client"

import * as React from "react"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  Pause,
  ShieldCheck,
  SlidersHorizontal,
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  freeMinutesStats,
  spendStats,
  type SpendState,
} from "@/lib/campaign-data"
import type { SpendVariantProps } from "./spec"

/**
 * Variant C — compact meter + cap-setup side-sheet.
 * The card stays glanceable (split-tier meter, projected bill, quiet cap row);
 * cap-setting is a deliberate 3-beat moment in a Sheet, so the Billing page
 * never turns into a settings form. All figures derive from the fixture via
 * spendStats()/freeMinutesStats() — the cap is framed as the USER's protection.
 */

// $0.10/min — the plan's metered rate (R12). The only non-derived figure here;
// every $ shown is minutes × this, traceable back to PLAN_USAGE.
const PAYG_RATE_USD_PER_MIN = 0.1

/** Whole-dollar display for caps/chips; cents only when the value has them. */
function usd(n: number) {
  return Number.isInteger(n) ? `$${n.toLocaleString()}` : `$${n.toFixed(2)}`
}

/** Exact-cents display for metered spend and estimates. */
function usdExact(n: number) {
  return `$${n.toFixed(2)}`
}

function minsAt(usdAmount: number) {
  return Math.max(0, Math.round(usdAmount / PAYG_RATE_USD_PER_MIN))
}

function digits(s: string) {
  return s.replace(/\D/g, "")
}

// ─── Small layout primitives ─────────────────────────────────────────────────

const BANNER_TONES = {
  primary: "border-primary/30 bg-primary/5",
  warning: "border-warning/40 bg-warning/10",
  destructive: "border-destructive/40 bg-destructive/5",
  success: "border-success/40 bg-success/10",
  muted: "border-border bg-muted/40",
} as const

function StateBanner({
  tone,
  icon,
  title,
  body,
  actions,
}: {
  tone: keyof typeof BANNER_TONES
  icon: React.ReactNode
  title: string
  body: string
  actions?: React.ReactNode
}) {
  return (
    <div className={cn("rounded-lg border px-4 py-3", BANNER_TONES[tone])}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}

/** One numbered step in the sheet — the flow reads top-to-bottom as a sequence. */
function Beat({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
          {n}
        </span>
        <p className="text-sm font-medium">{title}</p>
      </div>
      <div className="space-y-2 pl-7">{children}</div>
    </div>
  )
}

// ─── Variant ─────────────────────────────────────────────────────────────────

export function VariantC({ scenario }: SpendVariantProps) {
  const u = scenario.usage
  const fm = freeMinutesStats(u)
  const base = spendStats(u)

  const ungated = u.freeMinutesUngated
  const gated = fm.included - ungated

  // Mock write-path: the sheet "saves" locally so the card re-renders the
  // consequence (a raised cap can resume a paused account) without a backend.
  const [saved, setSaved] = React.useState<{
    cap: number
    alertPct: number
  } | null>(null)
  const [keptPaused, setKeptPaused] = React.useState(false)
  const [ackWarning, setAckWarning] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const cap = saved?.cap ?? base.capUsd
  const alertPct = saved?.alertPct ?? base.alertPct
  const spent = base.spentUsd

  // Mirrors spendStats() state derivation so a locally-saved cap moves the
  // lifecycle honestly (e.g. raising past $spent clears cap_hit).
  let state: SpendState = "free"
  if (base.freeMinutesLeft <= 0 && u.cardOnFile) {
    state = "payg"
    if (cap != null && cap > 0) {
      if (spent >= cap) state = "cap_hit"
      else if (spent >= cap * alertPct) state = "cap_warning"
    }
  }
  const pctOfCap =
    cap != null && cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0
  const headroomUsd = cap != null ? Math.max(0, cap - spent) : 0
  // The run-rate estimate can exceed the cap; the invoice never does (R5/R7).
  const projected =
    cap != null ? Math.min(base.projectedUsd, cap) : base.projectedUsd
  const runRateOverCap = cap != null && base.projectedUsd > cap

  const isFree = state === "free"
  const exhaustedNoCard = base.freeMinutesLeft <= 0 && !u.cardOnFile
  const atThreshold =
    !u.cardOnFile && fm.used >= ungated && base.freeMinutesLeft > 0
  // S8 is a moment (just-confirmed), not a derivable data state — the fixture
  // id stands in for the transient post-confirm flag the sheet also sets.
  const showConfirm = saved != null || scenario.id === "cap-raised"
  const resumedByRaise =
    saved != null && base.state === "cap_hit" && state !== "cap_hit"

  const openSheet = () => setSheetOpen(true)

  // ── Contextual banner (one at a time, most blocking wins) ─────────────────
  let banner: React.ReactNode = null
  if (state === "cap_hit" && cap != null) {
    banner = keptPaused ? (
      <StateBanner
        tone="muted"
        icon={<Pause className="h-4 w-4 text-muted-foreground" />}
        title={`Staying paused at your ${usd(cap)} cap.`}
        body={`New calls resume when the ${base.periodLabel} period rolls over — or the moment you raise the cap. This period's invoice stays at ${usd(cap)}.`}
        actions={
          <Button size="sm" variant="ghost" onClick={openSheet}>
            Raise cap
          </Button>
        }
      />
    ) : (
      <StateBanner
        tone="destructive"
        icon={<Pause className="h-4 w-4 text-destructive" />}
        title={`${usdExact(spent)} of ${usd(cap)} — your cap did its job. New calls are paused.`}
        body={`Calls that were live finished normally, every transcript and recording is intact, and this period's invoice will not exceed ${usd(cap)}.`}
        actions={
          <>
            <Button size="sm" onClick={openSheet}>
              Raise cap
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setKeptPaused(true)}
            >
              Keep paused
            </Button>
          </>
        }
      />
    )
  } else if (showConfirm && cap != null) {
    banner = (
      <StateBanner
        tone="success"
        icon={<CheckCircle2 className="h-4 w-4 text-success" />}
        title={
          saved != null && base.capUsd != null && saved.cap > base.capUsd
            ? `Cap raised to ${usd(cap)} — effective now, this period.`
            : saved != null && base.capUsd == null
              ? `Spend controls set — ${usd(cap)}/mo cap, effective now.`
              : `Cap raised to ${usd(cap)} — effective now, this period.`
        }
        body={
          state === "free"
            ? `Alert at ${usdExact(cap * alertPct)} (${Math.round(alertPct * 100)}%). At the cap, new calls pause, live calls finish, and your invoice never exceeds it.`
            : `${resumedByRaise ? "New calls resumed. " : ""}Headroom restored: ${usdExact(headroomUsd)} ≈ ${minsAt(headroomUsd)} min. Projected bill ${usdExact(projected)} — an estimate against your ${usd(cap)} cap.`
        }
      />
    )
  } else if (state === "cap_warning" && cap != null) {
    banner = ackWarning ? (
      <StateBanner
        tone="muted"
        icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
        title={`Cap kept at ${usd(cap)}.`}
        body="New calls pause at the cap; calls in progress always finish. Your invoice stays under it."
      />
    ) : (
      <StateBanner
        tone="warning"
        icon={<AlertTriangle className="h-4 w-4 text-warning" />}
        title={`${usdExact(spent)} of your ${usd(cap)} cap (${pctOfCap}%).`}
        body={`${usdExact(headroomUsd)} ≈ ${minsAt(headroomUsd)} min of headroom left this period. Raising the cap adds capacity; keeping it is just as valid — new calls pause at ${usd(cap)} and the invoice stays under it.`}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={openSheet}>
              Raise cap
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAckWarning(true)}
            >
              Keep {usd(cap)} cap
            </Button>
          </>
        }
      />
    )
  } else if (exhaustedNoCard) {
    banner = (
      <StateBanner
        tone="destructive"
        icon={<Lock className="h-4 w-4 text-destructive" />}
        title={`${fm.used} of ${fm.included} free minutes used — new calls are paused.`}
        body={`Calls that were live finished normally; nothing was cut off. One step resumes service: add a card. Usage then rolls into pay-as-you-go at ${usdExact(PAYG_RATE_USD_PER_MIN)}/min, capped at ${usd(u.defaultSpendCapUsd)}/mo by default — a limit you own and can change.`}
        actions={
          <Button size="sm" onClick={openSheet} className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Add a card to resume
          </Button>
        }
      />
    )
  } else if (atThreshold) {
    banner = (
      <StateBanner
        tone="primary"
        icon={<CreditCard className="h-4 w-4 text-primary" />}
        title={`${fm.used} of your first ${ungated} free minutes used — a card unlocks ${gated} more, still free.`}
        body={`$0 today. You'll set a spend cap with it (default ${usd(u.defaultSpendCapUsd)}/mo) — your own protection for when pay-as-you-go eventually starts.`}
        actions={
          <Button size="sm" onClick={openSheet}>
            Set spend controls
          </Button>
        }
      />
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Usage &amp; spend</CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                {base.periodLabel} · {fm.plan} tier
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={openSheet}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {cap != null ? "Edit spend controls" : "Set spend controls"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {banner}

          {/* ── Hero figure — minutes while free, projected $ once metered ── */}
          {isFree ? (
            <div>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {fm.remaining.toLocaleString()}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  free min {fm.used === 0 ? "ready" : "left"}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                {fm.used} of {fm.included} min used this period
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {usdExact(projected)}
                </p>
                <Badge variant="secondary" className="text-xs">
                  Estimate
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Projected bill this period — straight-line run rate, updates
                with use.
                {runRateOverCap && cap != null && (
                  <span className="tabular-nums">
                    {" "}
                    Run rate is {usdExact(base.projectedUsd)}; your invoice is
                    capped at {usd(cap)}.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* ── Meter — unit switches at the free→PAYG boundary (R10) ────── */}
          {isFree ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Free minutes</span>
                <span className="text-muted-foreground tabular-nums">
                  {fm.used} of {fm.included} min used
                </span>
              </div>
              <div
                role="meter"
                aria-label="Free minutes used"
                aria-valuemin={0}
                aria-valuemax={fm.included}
                aria-valuenow={fm.used}
                aria-valuetext={`${fm.used} of ${fm.included} free minutes used`}
                className="flex h-2 w-full overflow-hidden rounded-full"
              >
                {/* Segment 1 — the no-card slice */}
                <div
                  className="relative h-full bg-primary/15"
                  style={{ width: `${(ungated / fm.included) * 100}%` }}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-primary"
                    style={{
                      width: `${(Math.min(fm.used, ungated) / ungated) * 100}%`,
                    }}
                  />
                </div>
                {/* Segment 2 — the card-unlocked slice; muted track reads as
                    capacity waiting, not a wall */}
                <div
                  className="relative h-full border-l-2 border-background bg-muted"
                  style={{ width: `${(gated / fm.included) * 100}%` }}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/60"
                    style={{
                      width: `${(Math.max(0, fm.used - ungated) / gated) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {ungated} min · no card needed
                </span>
                <span className="flex items-center gap-1 tabular-nums">
                  {!u.cardOnFile && <Lock className="h-3 w-3 shrink-0" />}
                  +{gated} min ·{" "}
                  {u.cardOnFile ? "unlocked" : "free with a card"}
                </span>
              </div>
            </div>
          ) : (
            cap != null && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Monthly cap</span>
                  <span className="text-muted-foreground tabular-nums">
                    {usdExact(spent)} of {usd(cap)} used ({pctOfCap}%)
                  </span>
                </div>
                <div className="relative">
                  <div
                    role="meter"
                    aria-label="Monthly spend cap used"
                    aria-valuemin={0}
                    aria-valuemax={cap}
                    aria-valuenow={spent}
                    aria-valuetext={`${usdExact(spent)} of ${usd(cap)} monthly cap used`}
                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={cn(
                        "h-full",
                        state === "cap_hit"
                          ? "bg-destructive"
                          : state === "cap_warning"
                            ? "bg-warning"
                            : "bg-primary"
                      )}
                      style={{ width: `${pctOfCap}%` }}
                    />
                  </div>
                  {/* Alert-threshold tick — the warning fires here, before the wall */}
                  <div
                    aria-hidden
                    className="absolute inset-y-0 w-px bg-foreground/40"
                    style={{ left: `${alertPct * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Bell className="h-3 w-3 shrink-0" /> alert at{" "}
                    {usdExact(cap * alertPct)}
                  </span>
                  <span className="tabular-nums">cap {usd(cap)}</span>
                </div>
                {state !== "cap_hit" && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {usdExact(headroomUsd)} ≈ {minsAt(headroomUsd)} min of
                    headroom left under your cap.
                  </p>
                )}
              </div>
            )
          )}

          {/* Metering-lag disclosure — lives with the meter (R9) */}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            Usage metering can lag a few minutes — recent calls may not show
            yet.
          </p>

          {/* Projection while still free — explains when money starts (R7) */}
          {isFree && (
            <p className="text-xs text-muted-foreground tabular-nums">
              Projected bill: {usdExact(base.projectedUsd)} — estimate.
              Pay-as-you-go ({usdExact(PAYG_RATE_USD_PER_MIN)}/min) starts only
              after your {fm.included} free minutes.
            </p>
          )}

          {/* Quiet cap row — cap + alert + usage read together (R2) */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            {cap != null ? (
              <span className="tabular-nums">
                Spend cap {usd(cap)}/mo · alert at {usdExact(cap * alertPct)} (
                {Math.round(alertPct * 100)}%) — your protection, adjustable
                anytime
              </span>
            ) : (
              <span className="tabular-nums">
                No spend cap yet — you set one (default{" "}
                {usd(u.defaultSpendCapUsd)}/mo) when your card goes on file
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <SpendControlsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        cardOnFile={u.cardOnFile}
        currentCap={cap}
        defaultCap={u.defaultSpendCapUsd}
        currentAlertPct={alertPct}
        spentUsd={spent}
        state={state}
        freeMinutesLeft={base.freeMinutesLeft}
        onSave={(next) => {
          setSaved(next)
          setKeptPaused(false)
          setAckWarning(false)
        }}
      />
    </>
  )
}

// ─── Cap-setup sheet — the deliberate 3-beat write path ─────────────────────

function SpendControlsSheet({
  open,
  onOpenChange,
  cardOnFile,
  currentCap,
  defaultCap,
  currentAlertPct,
  spentUsd,
  state,
  freeMinutesLeft,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  cardOnFile: boolean
  currentCap: number | null
  defaultCap: number
  currentAlertPct: number
  spentUsd: number
  state: SpendState
  freeMinutesLeft: number
  onSave: (next: { cap: number; alertPct: number }) => void
}) {
  const [capInput, setCapInput] = React.useState("")
  const [alertSel, setAlertSel] = React.useState(currentAlertPct)
  const [cardNum, setCardNum] = React.useState("")
  const [exp, setExp] = React.useState("")
  const [cvc, setCvc] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  // Quick amounts are multiples of the plan default — no magic dollar figures.
  const quickCaps = [1, 2, 4].map((m) => defaultCap * m)
  // Keep the fixture's default threshold in the options even if it's custom.
  const alertOptions = Array.from(new Set([0.5, currentAlertPct, 0.9])).sort(
    (a, b) => a - b
  )

  // Seed the form from current values each time the sheet opens.
  React.useEffect(() => {
    if (open) {
      setCapInput(String(currentCap ?? defaultCap))
      setAlertSel(currentAlertPct)
      setErr(null)
      setBusy(false)
    }
  }, [open, currentCap, defaultCap, currentAlertPct])

  const capNum = Number.parseFloat(capInput)
  const capValid = Number.isFinite(capNum) && capNum > 0
  const raising = state === "cap_hit"
  const belowSpent = raising && capValid && capNum <= spentUsd

  function save() {
    if (!cardOnFile && (digits(cardNum).length < 12 || digits(exp).length < 3 || digits(cvc).length < 3)) {
      setErr("Enter your card details — $0 is charged today.")
      return
    }
    if (!capValid) {
      setErr("Enter a cap amount above $0.")
      return
    }
    setErr(null)
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      onOpenChange(false)
      onSave({ cap: capNum, alertPct: alertSel })
    }, 900)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) {
          setErr(null)
          setBusy(false)
        }
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {!cardOnFile
              ? "Add a card & set spend controls"
              : raising
                ? "Raise your spend cap"
                : currentCap != null
                  ? "Edit spend controls"
                  : "Set spend controls"}
          </SheetTitle>
          <SheetDescription>
            {!cardOnFile
              ? freeMinutesLeft > 0
                ? `$0 today — the card unlocks your remaining ${freeMinutesLeft} free minutes. These controls decide what pay-as-you-go is ever allowed to cost you.`
                : `$0 today — calls resume on pay-as-you-go, and these controls decide what it's allowed to cost you.`
              : raising && currentCap != null
                ? `You're at ${usdExact(spentUsd)} of ${usd(currentCap)}. Raising the cap resumes new calls immediately; the alert moves with it.`
                : "Two numbers, both yours: the most a month can cost, and when we warn you first."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6">
          {!cardOnFile && (
            <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-medium">Card — $0 charged today</p>
              <div className="space-y-1.5">
                <Label htmlFor="vc-card">Card number</Label>
                <Input
                  id="vc-card"
                  value={cardNum}
                  onChange={(e) => {
                    setCardNum(e.target.value)
                    if (err) setErr(null)
                  }}
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  autoComplete="cc-number"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="vc-exp">Expiry</Label>
                  <Input
                    id="vc-exp"
                    value={exp}
                    onChange={(e) => setExp(e.target.value)}
                    placeholder="MM / YY"
                    autoComplete="cc-exp"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="vc-cvc">CVC</Label>
                  <Input
                    id="vc-cvc"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    autoComplete="cc-csc"
                  />
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" /> Encrypted by our payment
                processor. We never store your card.
              </p>
            </div>
          )}

          <Beat n={1} title="Monthly spend cap">
            <div className="flex items-center gap-2">
              <Label htmlFor="vc-cap-amount" className="sr-only">
                Monthly spend cap in dollars
              </Label>
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="vc-cap-amount"
                value={capInput}
                onChange={(e) => {
                  setCapInput(e.target.value)
                  if (err) setErr(null)
                }}
                inputMode="decimal"
                className="w-24 tabular-nums"
              />
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickCaps.map((a) => (
                <Button
                  key={a}
                  type="button"
                  size="sm"
                  variant={capNum === a ? "secondary" : "outline"}
                  aria-pressed={capNum === a}
                  className="tabular-nums"
                  onClick={() => setCapInput(String(a))}
                >
                  {usd(a)}
                  {a === defaultCap && " · default"}
                </Button>
              ))}
            </div>
            {capValid && (
              <p className="text-xs text-muted-foreground tabular-nums">
                ≈ {minsAt(capNum).toLocaleString()} min of pay-as-you-go at{" "}
                {usdExact(PAYG_RATE_USD_PER_MIN)}/min.
              </p>
            )}
            {belowSpent && (
              <p className="text-xs text-warning tabular-nums">
                Below the {usdExact(spentUsd)} already spent — new calls stay
                paused until the next period.
              </p>
            )}
          </Beat>

          <Beat n={2} title="Alert me before the cap">
            <div className="flex flex-wrap gap-2">
              {alertOptions.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={alertSel === p ? "secondary" : "outline"}
                  aria-pressed={alertSel === p}
                  className="tabular-nums"
                  onClick={() => setAlertSel(p)}
                >
                  {Math.round(p * 100)}%{p === currentAlertPct && " · default"}
                </Button>
              ))}
            </div>
            {capValid && (
              <p className="text-xs text-muted-foreground tabular-nums">
                Email at {usdExact(capNum * alertSel)} — it fires before
                anything pauses.
              </p>
            )}
          </Beat>

          <Beat n={3} title="What happens at the cap">
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Pause className="h-3.5 w-3.5 shrink-0" />
                New calls pause — nothing new is billed.
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Calls already live finish normally.
              </p>
              <p className="flex items-center gap-2 tabular-nums">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                Your invoice never exceeds{" "}
                {capValid ? usd(capNum) : "your cap"}.
              </p>
              <p className="flex items-center gap-2 tabular-nums">
                <Bell className="h-3.5 w-3.5 shrink-0" />
                Heads-up email at{" "}
                {capValid ? usdExact(capNum * alertSel) : "your threshold"} (
                {Math.round(alertSel * 100)}%), before the pause.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Change either anytime — the cap is your protection, and you own
              it.
            </p>
          </Beat>

          {err && (
            <p role="alert" className="text-sm text-destructive">
              {err}
            </p>
          )}
        </div>

        <SheetFooter className="px-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button onClick={save} disabled={busy} className="gap-1.5">
            {busy && (
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            )}
            {busy
              ? "Saving…"
              : raising && capValid
                ? `Raise cap to ${usd(capNum)}`
                : !cardOnFile
                  ? "Add card & save controls"
                  : "Save spend controls"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
