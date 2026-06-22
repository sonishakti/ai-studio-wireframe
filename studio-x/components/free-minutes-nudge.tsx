"use client"

import * as React from "react"
import {
  Gift,
  CreditCard,
  Lock,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
  SheetFooter, SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { track, Events } from "@/lib/analytics"
import { PLAN_USAGE, getDefaultAgent } from "@/lib/campaign-data"

/**
 * FreeMinutesNudge — the half-tier card nudge (2026-06-22).
 * ────────────────────────────────────────────────────────
 * Agora bills per minute and doesn't sell/port numbers, so the card sits on
 * USAGE, not on a resource. The free tier is split: 150 minutes card-free, then
 * at 150 used we nudge for a card that UNLOCKS 150 more (still free). This gets a
 * card on file before exhaustion → usage rolls into pay-as-you-go instead of the
 * old suspend→reactivate loop. The aha (first 150 min) is never paywalled.
 */

function digits(s: string) {
  return s.replace(/\D/g, "")
}

export function FreeMinutesNudge() {
  const { freeMinutesUsed, freeMinutesUngated, freeMinutesIncluded, cardOnFile, defaultSpendCapUsd } = PLAN_USAGE
  const reached = freeMinutesUsed >= freeMinutesUngated
  const [unlocked, setUnlocked] = React.useState(false)

  // Fire the nudge-shown event once when the threshold is genuinely reached.
  React.useEffect(() => {
    if (reached && !cardOnFile) {
      track(Events.free_minutes_halfway, { used: freeMinutesUsed, ungated: freeMinutesUngated })
    }
  }, [reached, cardOnFile, freeMinutesUsed, freeMinutesUngated])

  // Nothing to show: under the threshold, or a card is already on file.
  if (!reached || cardOnFile) return null

  if (unlocked) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06] px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
        <div className="flex-1 min-w-0 text-sm">
          <p className="font-medium">150 more free minutes unlocked — card on file.</p>
          <p className="text-xs text-muted-foreground">
            You won&apos;t be suspended at the limit. After your {freeMinutesIncluded} free minutes, usage rolls into
            pay-as-you-go (capped at ${defaultSpendCapUsd}/mo).
          </p>
        </div>
      </div>
    )
  }

  const pct = Math.min(100, (freeMinutesUsed / freeMinutesUngated) * 100)

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/[0.04] px-4 py-3.5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            You&apos;ve used your {freeMinutesUngated} free minutes. Add a card to unlock {freeMinutesIncluded - freeMinutesUngated} more — free.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            No charge until those run out, and you set a spend cap. Adding it now means you roll into
            pay-as-you-go instead of being cut off.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <Progress value={pct} className="h-1.5 flex-1" />
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
              {freeMinutesUsed} / {freeMinutesUngated} min
            </span>
          </div>
        </div>
        <AddCardSheet onUnlocked={() => setUnlocked(true)}>
          <Button size="sm" className="shrink-0 gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Add a card
          </Button>
        </AddCardSheet>
      </div>
    </div>
  )
}

// ─── Add-card sheet — unlocks the second free slice ──────────────────────────

function AddCardSheet({
  children,
  onUnlocked,
}: {
  children: React.ReactNode
  onUnlocked: () => void
}) {
  const { freeMinutesUngated, freeMinutesIncluded, defaultSpendCapUsd } = PLAN_USAGE
  const bonus = freeMinutesIncluded - freeMinutesUngated
  const [open, setOpen] = React.useState(false)
  const [cardNum, setCardNum] = React.useState("")
  const [exp, setExp] = React.useState("")
  const [cvc, setCvc] = React.useState("")
  const [capOn, setCapOn] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  function add() {
    if (digits(cardNum).length < 12 || digits(exp).length < 3 || digits(cvc).length < 3) {
      setErr("Enter your card details to unlock the minutes.")
      return
    }
    setErr(null)
    setBusy(true)
    track(Events.card_captured, { agent_id: getDefaultAgent().id, at_minute: freeMinutesUngated })
    window.setTimeout(() => {
      track(Events.free_minutes_unlocked, { unlocked: bonus, included: freeMinutesIncluded })
      setBusy(false)
      setOpen(false)
      onUnlocked()
    }, 1100)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setErr(null); setBusy(false) } }}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Unlock {bonus} more free minutes</SheetTitle>
          <SheetDescription>
            Add a card to keep your agent running. You&apos;re not charged today — the next {bonus} minutes
            are still free.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6">
          <div className="rounded-lg border border-primary/30 bg-primary/[0.04] px-4 py-3 text-sm">
            <p className="font-medium">$0 today.</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Unlocks {bonus} more free minutes ({freeMinutesIncluded} total). Only after those does
              pay-as-you-go start — and we cap it so it can&apos;t bill-shock you.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nudge-card">Card number</Label>
              <Input id="nudge-card" value={cardNum} onChange={(e) => { setCardNum(e.target.value); if (err) setErr(null) }} inputMode="numeric" placeholder="1234 5678 9012 3456" autoComplete="cc-number" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="nudge-exp">Expiry</Label>
                <Input id="nudge-exp" value={exp} onChange={(e) => setExp(e.target.value)} placeholder="MM / YY" autoComplete="cc-exp" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="nudge-cvc">CVC</Label>
                <Input id="nudge-cvc" value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123" autoComplete="cc-csc" />
              </div>
            </div>

            <label className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
              <input type="checkbox" checked={capOn} onChange={(e) => setCapOn(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
              <span>
                Cap pay-as-you-go at <span className="font-medium tabular-nums">${defaultSpendCapUsd}/mo</span>
                <span className="block text-xs text-muted-foreground">We pause new calls if you hit the cap — adjustable anytime.</span>
              </span>
            </label>

            {err && <p role="alert" className="text-sm text-destructive">{err}</p>}

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Encrypted by our payment processor. We never store your card.
            </p>
          </div>
        </div>

        <SheetFooter className="px-6">
          <SheetClose asChild>
            <Button variant="outline">Not now</Button>
          </SheetClose>
          <Button onClick={add} disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Unlocking…" : `Unlock ${bonus} free minutes`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
