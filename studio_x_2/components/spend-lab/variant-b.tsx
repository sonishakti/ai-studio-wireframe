"use client"

// X1 spend-lab · Variant B — "Meter band + controls row" (OpenAI Limits pattern).
// THROWAWAY HARNESS variant (deleted after the judge round). Read/write split:
// Card 1 is a read-only usage band — split-tier meter ∥ projected bill as
// PARALLEL columns (side-by-side = parallel info, the project layout rule) —
// Card 2 is the write surface: cap + alert threshold as calm settings rows.
// Every figure routes through spendStats()/freeMinutesStats() on the scenario
// fixture, so this surface can never disagree with the Monitor nudge or the
// account ring (R11), and every $ stays minutes × $0.10 traceable (R12).

import * as React from "react"
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Gift,
  Info,
  Lock,
  Pencil,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { freeMinutesStats, spendStats, type PlanUsage } from "@/lib/campaign-data"
import type { SpendVariantProps } from "./spec"

// The PLAN_USAGE metering rate ($0.10/min). Derived $↔min conversions go
// through this one constant so they stay traceable to the fixture (R12).
const USD_PER_MIN = 0.1

const fmtUsd = (n: number) => `$${n.toFixed(2)}`
const usdToMin = (usd: number) => Math.max(0, Math.round(usd / USD_PER_MIN))

// ─── State banner shell — tones mirror free-minutes-nudge treatments ─────────

type BannerTone = "info" | "success" | "warning" | "danger"

const BANNER_TONE: Record<BannerTone, { wrap: string; chip: string }> = {
  info: { wrap: "border-primary/30 bg-primary/[0.04]", chip: "bg-primary/10 text-primary" },
  success: { wrap: "border-success/40 bg-success/[0.06]", chip: "bg-success/10 text-success" },
  warning: { wrap: "border-warning/40 bg-warning/[0.06]", chip: "bg-warning/10 text-warning" },
  danger: { wrap: "border-destructive/40 bg-destructive/5", chip: "bg-destructive/10 text-destructive" },
}

function StateBanner({
  tone,
  icon: IconCmp,
  title,
  body,
  children,
}: {
  tone: BannerTone
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: React.ReactNode
  children?: React.ReactNode
}) {
  const t = BANNER_TONE[tone]
  return (
    <div className={`rounded-lg border px-4 py-3.5 ${t.wrap}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.chip}`}>
          <IconCmp className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Settings row — label + current value + Edit, à la OpenAI Limits ─────────

function ControlRow({
  label,
  description,
  value,
  editing,
  editor,
  onEdit,
  editDisabled = false,
}: {
  label: string
  description: string
  value: React.ReactNode
  editing: boolean
  editor: React.ReactNode
  onEdit: () => void
  editDisabled?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {editing ? (
        editor
      ) : (
        <div className="flex shrink-0 items-center gap-3">
          {value}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onEdit}
            disabled={editDisabled}
            aria-label={`Edit ${label.toLowerCase()}`}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Variant B ────────────────────────────────────────────────────────────────

export function VariantB({ scenario }: SpendVariantProps) {
  const u = scenario.usage

  // Write-surface state (mock). Overrides stay null until touched so the
  // fixture remains the source of truth; edits recompute through spendStats()
  // so the read band and the controls can never drift apart (R2/R11).
  const [capOverride, setCapOverride] = React.useState<number | null>(null)
  const [alertOverride, setAlertOverride] = React.useState<number | null>(null)
  const [cardAdded, setCardAdded] = React.useState(false)
  const [stayAck, setStayAck] = React.useState(false)
  const [editing, setEditing] = React.useState<"cap" | "alert" | null>(null)
  const [capDraft, setCapDraft] = React.useState("")
  const [alertDraft, setAlertDraft] = React.useState("")

  // Reset local edits when the harness switches scenarios (render-time reset,
  // the React "adjust state on prop change" pattern — no effect needed).
  const [prevId, setPrevId] = React.useState(scenario.id)
  if (prevId !== scenario.id) {
    setPrevId(scenario.id)
    setCapOverride(null)
    setAlertOverride(null)
    setCardAdded(false)
    setStayAck(false)
    setEditing(null)
  }

  const cardOnFile = u.cardOnFile || cardAdded
  // The cap is born at card capture (product policy: defaults, never absent
  // once PAYG is possible) — mirrors the PlanUsage doc comments.
  const capUsd = capOverride ?? u.spendCapUsd ?? (cardAdded ? u.defaultSpendCapUsd : null)
  const alertPct = alertOverride ?? u.spendAlertPct

  const effective: PlanUsage = { ...u, cardOnFile, spendCapUsd: capUsd, spendAlertPct: alertPct }
  const free = freeMinutesStats(effective)
  const spend = spendStats(effective)

  const ungated = u.freeMinutesUngated
  const unlockable = free.included - ungated
  const alertAtUsd = capUsd != null ? capUsd * alertPct : null
  // The hero figure is what the invoice will actually say — the cap clamps it
  // even when the raw run rate overshoots (R5/R7).
  const billedUsd = capUsd != null ? Math.min(spend.projectedUsd, capUsd) : spend.projectedUsd
  const clampNote =
    capUsd != null && spend.projectedUsd > capUsd
      ? `Run rate alone would be ${fmtUsd(spend.projectedUsd)} — the ${fmtUsd(capUsd)} cap holds the invoice.`
      : null

  const controlsRef = React.useRef<HTMLDivElement>(null)

  function startRaiseCap() {
    const current = capUsd ?? u.defaultSpendCapUsd
    // Open the editor holding a concrete proposal (next round step up), not a
    // blank — the CTA promised capacity, the editor should arrive with some.
    setCapDraft(String(Math.ceil((current * 1.5) / 10) * 10))
    setEditing("cap")
    controlsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  function addCard() {
    setCardAdded(true)
  }

  const capDraftNum = Number.parseFloat(capDraft)
  const capDraftValid = Number.isFinite(capDraftNum) && capDraftNum > 0

  function saveCap(e: React.FormEvent) {
    e.preventDefault()
    if (!capDraftValid) return
    setCapOverride(Math.round(capDraftNum * 100) / 100)
    setEditing(null)
    setStayAck(false) // a new cap supersedes any keep-paused choice
  }

  const alertDraftNum = Number.parseFloat(alertDraft)
  // 1–99: the alert exists to fire BEFORE the wall, so 100% is not a setting.
  const alertDraftValid = Number.isFinite(alertDraftNum) && alertDraftNum >= 1 && alertDraftNum <= 99

  function saveAlert(e: React.FormEvent) {
    e.preventDefault()
    if (!alertDraftValid) return
    setAlertOverride(Math.round(alertDraftNum) / 100)
    setEditing(null)
  }

  // ── Contextual state banner (one at a time, calmest true statement wins) ──
  let banner: React.ReactNode = null
  if (spend.state === "cap_hit" && capUsd != null) {
    banner = (
      <StateBanner
        tone="danger"
        icon={Lock}
        title={`Monthly cap reached — ${fmtUsd(spend.spentUsd)} of ${fmtUsd(capUsd)}. New calls are paused.`}
        body={
          <>
            Only new calls stopped: in-flight calls finished normally, your agents and data are untouched, and the
            invoice will not exceed {fmtUsd(capUsd)}. Raise the cap to add capacity, or stay paused until the period
            resets — both are fine.
          </>
        }
      >
        {stayAck ? (
          <p className="flex items-center gap-1.5 self-center text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
            Staying paused — new calls resume next period. Raise the cap below anytime.
          </p>
        ) : (
          <div className="flex shrink-0 items-center gap-2 self-center">
            <Button size="sm" onClick={startRaiseCap}>
              Raise cap
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStayAck(true)}>
              Keep paused
            </Button>
          </div>
        )}
      </StateBanner>
    )
  } else if (spend.state === "cap_warning" && capUsd != null) {
    const headroom = Math.max(0, capUsd - spend.spentUsd)
    banner = (
      <StateBanner
        tone="warning"
        icon={AlertTriangle}
        title={`Approaching your cap — ${fmtUsd(spend.spentUsd)} of ${fmtUsd(capUsd)} (${spend.pctOfCap}%).`}
        body={
          <>
            {fmtUsd(headroom)} of headroom left (~{usdToMin(headroom)} min at $0.10/min). Raise the cap for more
            capacity, or keep it — new calls simply pause at {fmtUsd(capUsd)} and the invoice stays under it. Nothing
            breaks either way.
          </>
        }
      >
        {stayAck ? (
          <p className="flex items-center gap-1.5 self-center text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
            Cap stays at {fmtUsd(capUsd)} — new calls pause there if reached.
          </p>
        ) : (
          // Equal weight on purpose: keeping the cap is as legitimate as raising it.
          <div className="flex shrink-0 items-center gap-2 self-center">
            <Button size="sm" variant="outline" onClick={startRaiseCap}>
              Raise cap
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStayAck(true)}>
              Keep current cap
            </Button>
          </div>
        )}
      </StateBanner>
    )
  } else if (cardOnFile && capUsd != null && capUsd !== u.defaultSpendCapUsd && spend.freeMinutesLeft <= 0) {
    // Cap differs from the capture-time default → the user changed it (the S8
    // confirmation state, and the local raise-from-cap-hit path lands here too).
    const headroom = Math.max(0, capUsd - spend.spentUsd)
    banner = (
      <StateBanner
        tone="success"
        icon={CheckCircle2}
        title={`Cap ${capUsd > u.defaultSpendCapUsd ? "raised" : "updated"} to ${fmtUsd(capUsd)}/mo — in effect now, for this period.`}
        body={
          <>
            Headroom is back: {fmtUsd(headroom)} (~{usdToMin(headroom)} min). Nothing is paused at this spend level,
            and the projected bill now runs against the new cap.
          </>
        }
      />
    )
  } else if (!cardOnFile && free.remaining <= 0) {
    banner = (
      <StateBanner
        tone="danger"
        icon={Lock}
        title={`All ${free.included} free minutes used — new calls are paused.`}
        body={
          <>
            In-flight calls finished normally and nothing was deleted. One step resumes service: add a card, and usage
            rolls into pay-as-you-go at $0.10/min with a {fmtUsd(u.defaultSpendCapUsd)}/mo cap you control.
          </>
        }
      >
        <Button size="sm" className="shrink-0 gap-1.5 self-center" onClick={addCard}>
          <CreditCard className="h-3.5 w-3.5" /> Add a card to resume
        </Button>
      </StateBanner>
    )
  } else if (!cardOnFile && free.used >= ungated) {
    banner = (
      <StateBanner
        tone="info"
        icon={Gift}
        title={`First ${ungated} free minutes used — a card unlocks ${unlockable} more, still free.`}
        body={
          <>
            $0.00 today. Pay-as-you-go starts only after all {free.included} free minutes, protected by your own spend
            cap — {fmtUsd(u.defaultSpendCapUsd)}/mo by default, adjustable below.
          </>
        }
      >
        <Button size="sm" className="shrink-0 gap-1.5 self-center" onClick={addCard}>
          <CreditCard className="h-3.5 w-3.5" /> Add a card
        </Button>
      </StateBanner>
    )
  } else if (cardAdded) {
    banner = (
      <StateBanner
        tone="success"
        icon={CheckCircle2}
        title={
          free.remaining > 0
            ? `Card on file — ${unlockable} more free minutes unlocked.`
            : "Card on file — new calls resumed."
        }
        body={
          free.remaining > 0 ? (
            <>
              Still $0.00 today. After all {free.included} free minutes, usage rolls into pay-as-you-go, capped at{" "}
              {fmtUsd(capUsd ?? u.defaultSpendCapUsd)}/mo below.
            </>
          ) : (
            <>
              Usage now rolls into pay-as-you-go at $0.10/min, capped at {fmtUsd(capUsd ?? u.defaultSpendCapUsd)}/mo.
              Adjust the cap below anytime.
            </>
          )
        }
      />
    )
  }

  // ── Usage band — primary unit switches at the free→PAYG boundary ──────────
  const ungatedSharePct = free.included > 0 ? (ungated / free.included) * 100 : 50
  let usageBand: React.ReactNode
  if (spend.state !== "free" && capUsd != null) {
    // PAYG phase: dollars-of-cap is the primary unit.
    const headroom = Math.max(0, capUsd - spend.spentUsd)
    const fill =
      spend.state === "cap_hit" ? "bg-destructive" : spend.state === "cap_warning" ? "bg-warning" : "bg-primary"
    usageBand = (
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <span className="text-sm font-medium">Pay-as-you-go spend</span>
          <span className="text-sm font-semibold tabular-nums">
            {fmtUsd(spend.spentUsd)} of {fmtUsd(capUsd)} cap ({spend.pctOfCap}%)
          </span>
        </div>
        <div
          role="meter"
          aria-label="Pay-as-you-go spend against the monthly cap"
          aria-valuemin={0}
          aria-valuemax={capUsd}
          aria-valuenow={Math.min(spend.spentUsd, capUsd)}
          aria-valuetext={`${fmtUsd(spend.spentUsd)} of ${fmtUsd(capUsd)} monthly cap used (${spend.pctOfCap}%)`}
          className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-secondary"
        >
          <div className={`absolute inset-y-0 left-0 ${fill}`} style={{ width: `${spend.pctOfCap}%` }} />
          {/* Alert-threshold tick — the warning exists to fire before the wall */}
          {alertPct < 1 && (
            <div
              aria-hidden
              className="absolute inset-y-0 w-0.5 bg-foreground/40"
              style={{ left: `${alertPct * 100}%` }}
            />
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
          <span>
            {fmtUsd(headroom)} headroom left (~{usdToMin(headroom)} min at $0.10/min)
          </span>
          <span>
            Alert at {fmtUsd(capUsd * alertPct)} ({Math.round(alertPct * 100)}% of cap)
          </span>
        </div>
        {/* The 150+150 free tier stays legible after the unit switch (R4) */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
          <span aria-hidden className="flex h-1.5 w-16 shrink-0 overflow-hidden rounded-full">
            <span className="h-full bg-primary/70" style={{ width: `${ungatedSharePct}%` }} />
            <span className="h-full w-0.5 bg-background" />
            <span className="h-full flex-1 bg-primary/40" />
          </span>
          <span>
            Free tier used first: {free.used} of {free.included} min ({ungated} + {unlockable} card-unlocked)
          </span>
        </div>
      </div>
    )
  } else {
    // Free phase: minutes are the primary unit; the split tier is the meter.
    const aFillPct = ungated > 0 ? Math.min(100, (Math.min(free.used, ungated) / ungated) * 100) : 0
    const bFillPct =
      unlockable > 0 ? Math.min(100, (Math.max(free.used - ungated, 0) / unlockable) * 100) : 0
    usageBand = (
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <span className="text-sm font-medium">Free minutes</span>
          <span className="text-sm font-semibold tabular-nums">
            {free.used} of {free.included} min used
          </span>
        </div>
        <div
          role="meter"
          aria-label="Free minutes used this period"
          aria-valuemin={0}
          aria-valuemax={free.included}
          aria-valuenow={Math.min(free.used, free.included)}
          aria-valuetext={`${free.used} of ${free.included} free minutes used (${ungated} without a card plus ${unlockable} card-unlocked)`}
          className="mt-2 flex h-3 w-full overflow-hidden rounded-full"
        >
          <div className="relative h-full bg-secondary" style={{ width: `${ungatedSharePct}%` }}>
            <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${aFillPct}%` }} />
          </div>
          <div className="h-full w-0.5 shrink-0 bg-background" />
          {/* Second slice reads as expandable capacity, not a wall — muted track,
              no padlock in the meter itself */}
          <div className={`relative h-full flex-1 ${cardOnFile ? "bg-secondary" : "bg-muted/50"}`}>
            <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${bFillPct}%` }} />
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-primary" />
            {ungated} min — no card needed
          </span>
          <span className="inline-flex items-center gap-1.5">
            {cardOnFile ? (
              <CheckCircle2 aria-hidden className="h-3.5 w-3.5 shrink-0 text-success" />
            ) : free.remaining <= 0 ? (
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-primary/40" />
            ) : (
              <Sparkles aria-hidden className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
            {cardOnFile
              ? `+${unlockable} min free with a card — unlocked`
              : free.remaining <= 0
                ? `${unlockable} card-unlocked min — used`
                : `+${unlockable} min free with a card`}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ─── Card 1 · Current period (read-only usage band) ───────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm">Current period</CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                {spend.periodLabel} · day {u.periodDaysElapsed} of {u.periodDaysTotal}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {free.plan} tier
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {banner}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">{usageBand}</div>
            <div className="flex flex-col md:border-l md:pl-6">
              <p className="text-xs text-muted-foreground">Projected bill · estimate</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{fmtUsd(billedUsd)}</p>
              {spend.state !== "free" ? (
                <>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Straight-line run rate from day {u.periodDaysElapsed} of {u.periodDaysTotal} — an estimate that
                    updates as usage lands.
                  </p>
                  {clampNote && <p className="mt-1.5 text-xs text-muted-foreground">{clampNote}</p>}
                </>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Pay-as-you-go billing starts only after all {free.included} free minutes are used
                  {cardOnFile ? "" : " — and never without a card on file"}.
                </p>
              )}
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3 w-3 shrink-0" />
            Metering lags a little — the last few minutes of calls may not show here yet.
          </p>
        </CardContent>
      </Card>

      {/* ─── Card 2 · Spend controls (write surface) ──────────────────────── */}
      <div ref={controlsRef}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Spend controls</CardTitle>
            <CardDescription className="text-xs">
              Your own protection against bill shock — both numbers are yours to change.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              <ControlRow
                label="Monthly spend cap"
                description="Hard ceiling on pay-as-you-go. New calls pause here — the invoice never goes past it."
                value={
                  capUsd != null ? (
                    <span className="text-sm font-semibold tabular-nums">{fmtUsd(capUsd)} / mo</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Not set — {fmtUsd(u.defaultSpendCapUsd)}/mo default with your first card
                    </span>
                  )
                }
                editing={editing === "cap"}
                editor={
                  <form onSubmit={saveCap} className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="vb-cap-input" className="sr-only">
                      Monthly spend cap in dollars
                    </Label>
                    <span aria-hidden className="text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="vb-cap-input"
                      autoFocus
                      inputMode="decimal"
                      value={capDraft}
                      onChange={(e) => setCapDraft(e.target.value)}
                      className="h-8 w-24 tabular-nums"
                    />
                    <span aria-hidden className="text-sm text-muted-foreground">
                      / mo
                    </span>
                    <Button type="submit" size="sm" disabled={!capDraftValid}>
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </form>
                }
                onEdit={() => {
                  setCapDraft(String(capUsd))
                  setEditing("cap")
                }}
                editDisabled={capUsd == null}
              />
              <ControlRow
                label="Alert threshold"
                description="Warns you before the wall — fires when spend crosses this share of the cap. Default 75%."
                value={
                  <span className="text-sm font-semibold tabular-nums">
                    {Math.round(alertPct * 100)}% of cap
                    {alertAtUsd != null && (
                      <span className="font-normal text-muted-foreground"> · {fmtUsd(alertAtUsd)}</span>
                    )}
                  </span>
                }
                editing={editing === "alert"}
                editor={
                  <form onSubmit={saveAlert} className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="vb-alert-input" className="sr-only">
                      Alert threshold as a percentage of the cap
                    </Label>
                    <Input
                      id="vb-alert-input"
                      autoFocus
                      inputMode="numeric"
                      value={alertDraft}
                      onChange={(e) => setAlertDraft(e.target.value)}
                      className="h-8 w-16 tabular-nums"
                    />
                    <span aria-hidden className="text-sm text-muted-foreground">
                      % of cap
                    </span>
                    <Button type="submit" size="sm" disabled={!alertDraftValid}>
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </form>
                }
                onEdit={() => {
                  setAlertDraft(String(Math.round(alertPct * 100)))
                  setEditing("alert")
                }}
              />
            </div>
            {/* Cap semantics in one place, verbatim policy (R5) */}
            <div className="mt-2 flex items-start gap-2.5 rounded-lg bg-muted/40 px-3.5 py-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                At the cap only <span className="font-medium text-foreground">new</span> calls pause — in-flight calls
                always finish, nothing is deleted, and the invoice honors the cap even if metering lags a little past
                it.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
