"use client"

import * as React from "react"
import Link from "next/link"
import {
  Phone,
  CreditCard,
  Lock,
  ShieldCheck,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
  SheetFooter, SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { track, Events } from "@/lib/analytics"
import {
  CLAIMABLE_NUMBERS,
  PORT_CARRIERS,
  PLAN_USAGE,
  stackEstimate,
  type Agent,
} from "@/lib/campaign-data"

/**
 * ClaimNumberSheet — the activation hinge of the "Claim your number" flow.
 * ────────────────────────────────────────────────────────────────────────
 * 2026-06-22 (workflow-designed: "Claim your number" + Launch-Pass safety net).
 * Card lands HERE and only here — on acquiring a NEW Agora number (the Twilio
 * pattern: the card buys the resource, not the product). Two EQUAL-weight paths:
 *
 *   • Get a new Agora number → inline card. $0 today; the 300 free minutes apply
 *     first, then pay-as-you-go. A default spend cap means PAYG can't bill-shock,
 *     and an at-250-min warning replaces the old suspend→reactivate CAC loop.
 *   • Port a number from Twilio/Telnyx/Vonage → NO card (billing stays with the
 *     old carrier — the switcher's card-free path to live traffic, no double-pay).
 *
 * The card NEVER gates deployment_went_live for ported numbers (or web/code).
 */

const CHANNEL_COPY: Record<"campaign" | "inbound", { verb: string; need: string }> = {
  inbound: { verb: "answer", need: "A number for your agent to pick up." },
  campaign: { verb: "dial from", need: "A number for your agent to place calls from." },
}

function digits(s: string) {
  return s.replace(/\D/g, "")
}

export function ClaimNumberSheet({
  agent,
  channel,
  children,
}: {
  agent: Agent
  channel: "campaign" | "inbound"
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState<"new" | "port">("new")
  const [phase, setPhase] = React.useState<"form" | "live">("form")
  const [busy, setBusy] = React.useState(false)
  const [liveNumber, setLiveNumber] = React.useState("")
  const [ported, setPorted] = React.useState(false)

  // New-number fields
  const [areaCode, setAreaCode] = React.useState(CLAIMABLE_NUMBERS[0].areaCode)
  const [cardNum, setCardNum] = React.useState("")
  const [exp, setExp] = React.useState("")
  const [cvc, setCvc] = React.useState("")
  const [capOn, setCapOn] = React.useState(true)
  const [newErr, setNewErr] = React.useState<string | null>(null)

  // Port fields
  const [carrier, setCarrier] = React.useState<string>("")
  const [portNum, setPortNum] = React.useState("")
  const [portErr, setPortErr] = React.useState<string | null>(null)

  const reserved = CLAIMABLE_NUMBERS.find((n) => n.areaCode === areaCode) ?? CLAIMABLE_NUMBERS[0]
  const rate = stackEstimate(agent).costPerMin.toFixed(2)
  const chan = CHANNEL_COPY[channel]

  function resetAll() {
    setPhase("form")
    setBusy(false)
    setNewErr(null)
    setPortErr(null)
    setCardNum("")
    setExp("")
    setCvc("")
    setPortNum("")
    setCarrier("")
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setTimeout(resetAll, 200)
  }

  function claimNew() {
    if (digits(cardNum).length < 12 || digits(exp).length < 3 || digits(cvc).length < 3) {
      setNewErr("Enter your card details to claim the number.")
      return
    }
    setNewErr(null)
    setBusy(true)
    // Card attaches to provisioning a NEW resource — not to the product.
    track(Events.card_captured, { path: "new_number", agent_id: agent.id, channel })
    track(Events.phone_number_assigned, { number: reserved.number, agent_id: agent.id, channel, ported: false } as never)
    window.setTimeout(() => {
      track(Events.deployment_went_live, { agent_id: agent.id, channel, ported: false } as never)
      setLiveNumber(reserved.number)
      setPorted(false)
      setPhase("live")
      setBusy(false)
    }, 1200)
  }

  function claimPort() {
    if (!carrier) {
      setPortErr("Pick the carrier your number is with today.")
      return
    }
    if (digits(portNum).length < 10) {
      setPortErr("Enter the number you want to port — at least 10 digits.")
      return
    }
    setPortErr(null)
    setBusy(true)
    // NO card_captured — porting routes billing to the existing carrier.
    track(Events.phone_number_assigned, { number: portNum, agent_id: agent.id, channel, ported: true } as never)
    window.setTimeout(() => {
      track(Events.deployment_went_live, { agent_id: agent.id, channel, ported: true } as never)
      setLiveNumber(portNum)
      setPorted(true)
      setPhase("live")
      setBusy(false)
      toast.success("Port started", { description: "Your number stays live on its current carrier until the port completes." })
    }, 1200)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {phase === "live" ? (
          <LiveState agent={agent} number={liveNumber} ported={ported} rate={rate} />
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Claim a number for {agent.name}</SheetTitle>
              <SheetDescription>
                {chan.need} {agent.name} goes live the moment the number is yours — your 300 free
                minutes apply first.
              </SheetDescription>
            </SheetHeader>

            <div className="px-6">
              <Tabs value={tab} onValueChange={(v) => setTab(v as "new" | "port")}>
                <TabsList className="w-full">
                  <TabsTrigger value="new" className="flex-1 gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Get a new number
                  </TabsTrigger>
                  <TabsTrigger value="port" className="flex-1 gap-1.5">
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Port your number
                  </TabsTrigger>
                </TabsList>

                {/* ── New Agora number — the card path ── */}
                <TabsContent value="new" className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="area-code">Area code</Label>
                    <Select value={areaCode} onValueChange={setAreaCode}>
                      <SelectTrigger id="area-code">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLAIMABLE_NUMBERS.map((n) => (
                          <SelectItem key={n.areaCode} value={n.areaCode}>
                            {n.areaCode} — {n.region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                    <div>
                      <p className="font-mono text-base font-semibold tabular-nums">{reserved.number}</p>
                      <p className="text-xs text-muted-foreground">{reserved.region}</p>
                    </div>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Sparkles className="h-3 w-3" /> Reserved for you
                    </Badge>
                  </div>

                  {/* Cost line ABOVE the card field — never a surprise below it. */}
                  <div className="rounded-lg border border-primary/30 bg-primary/[0.04] px-4 py-3 text-sm">
                    <p className="font-medium">$0 today.</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Your {PLAN_USAGE.freeMinutesIncluded} free minutes apply first — then pay-as-you-go
                      (${rate}/min on Agora&apos;s bundled stack). We&apos;ll warn you at {PLAN_USAGE.warnAtMinutes} min,
                      never suspend you.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="card-num">Card number</Label>
                      <Input
                        id="card-num"
                        value={cardNum}
                        onChange={(e) => { setCardNum(e.target.value); if (newErr) setNewErr(null) }}
                        inputMode="numeric"
                        placeholder="1234 5678 9012 3456"
                        autoComplete="cc-number"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor="card-exp">Expiry</Label>
                        <Input id="card-exp" value={exp} onChange={(e) => setExp(e.target.value)} placeholder="MM / YY" autoComplete="cc-exp" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor="card-cvc">CVC</Label>
                        <Input id="card-cvc" value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123" autoComplete="cc-csc" />
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={capOn}
                        onChange={(e) => setCapOn(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <span>
                        Cap pay-as-you-go at{" "}
                        <span className="font-medium tabular-nums">${PLAN_USAGE.defaultSpendCapUsd}/mo</span>
                        <span className="block text-xs text-muted-foreground">
                          We pause new calls if you hit the cap — adjustable anytime. No bill-shock.
                        </span>
                      </span>
                    </label>

                    {newErr && <p role="alert" className="text-sm text-destructive">{newErr}</p>}

                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" /> Encrypted by our payment processor. We never store your card.
                    </p>
                  </div>
                </TabsContent>

                {/* ── Port an existing number — the card-free path ── */}
                <TabsContent value="port" className="space-y-4 pt-4">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] px-4 py-3 text-sm">
                    <p className="font-medium">Keep your number — no card needed.</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Billing stays with your current carrier until the port completes, so there&apos;s no
                      double-pay during cutover. The switcher&apos;s path to live traffic.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="carrier">Current carrier</Label>
                    <Select value={carrier} onValueChange={(v) => { setCarrier(v); if (portErr) setPortErr(null) }}>
                      <SelectTrigger id="carrier">
                        <SelectValue placeholder="Select your carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {PORT_CARRIERS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="port-num">Number to port</Label>
                    <Input
                      id="port-num"
                      value={portNum}
                      onChange={(e) => { setPortNum(e.target.value); if (portErr) setPortErr(null) }}
                      inputMode="tel"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {portErr && <p role="alert" className="text-sm text-destructive">{portErr}</p>}

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" /> Most US ports finish in 1–3 business days. Your line keeps working the whole time.
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            <SheetFooter className="px-6">
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              {tab === "new" ? (
                <Button onClick={claimNew} disabled={busy} className="gap-1.5">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <CreditCard className="h-4 w-4" />}
                  {busy ? "Claiming…" : "Claim number & go live"}
                </Button>
              ) : (
                <Button onClick={claimPort} disabled={busy} className="gap-1.5">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <ArrowLeftRight className="h-4 w-4" />}
                  {busy ? "Starting port…" : "Port & go live (no card)"}
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── Live state — the north-star moment ──────────────────────────────────────

function LiveState({
  agent,
  number,
  ported,
  rate,
}: {
  agent: Agent
  number: string
  ported: boolean
  rate: string
}) {
  return (
    <>
      <SheetHeader>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <SheetTitle>{agent.name} is live{ported ? " — port started" : ""}</SheetTitle>
        <SheetDescription>
          {ported ? (
            <>Your number keeps working on its current carrier; calls route to {agent.name} now and stay live through the port.</>
          ) : (
            <>{agent.name} now answers <span className="font-mono font-medium text-foreground">{number}</span>. Your free minutes are running first — pay-as-you-go (${rate}/min) only starts after them.</>
          )}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-3 px-6">
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums">{number}</span>
          </div>
          <Badge variant="secondary" className="text-xs">{ported ? "Porting" : "Live"}</Badge>
        </div>
        <Separator />
        <p className="text-sm text-muted-foreground">
          Place a real call to your number to see it in Monitor — every conversation is logged with transcripts and outcomes.
        </p>
      </div>

      <SheetFooter className="px-6">
        <SheetClose asChild>
          <Button variant="outline">Done</Button>
        </SheetClose>
        <Button asChild className="gap-1.5">
          <Link href="/monitor">Open Monitor <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </SheetFooter>
    </>
  )
}
