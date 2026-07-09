"use client"

// A3 itsp-lab VARIANT 2 — "Guided three-step sheet". THROWAWAY (judged → folded → deleted).
//
// Shape: a Sheet with a PERSISTENT stepper — (1) Connect carrier · (2) Pick a
// number · (3) Verify. The spec's five automation stages map onto it so the
// user only ever sees three decisions:
//   validate creds → step 1 · enumerate → step 2's loading edge · create
//   trunk + routing + attach → a compact staged strip INSIDE the 2→3
//   transition · verify (REAL test call) → step 3.
// Failures land ON their step with the spec's recovery copy (R5); retry
// re-runs ONLY the failed stage and completed work stays visibly checked (R2).
// The flow can only END on a connected test call (R6) — Done stays disabled
// until then, because provisioning success ≠ call success.

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import {
  AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2,
  ChevronDown, Circle, ExternalLink, KeyRound, Loader2, Megaphone, Phone,
  PhoneCall, PhoneIncoming, PhoneOutgoing, ShieldCheck, Waypoints,
} from "lucide-react"
import { MOCK_NUMBERS, PROVIDERS, type ItspVariantProps } from "@/components/itsp-lab/spec"

// ---------------------------------------------------------------------------
// Carrier link map — R5 requires every failure to NAME the carrier-side fix
// and link it. Agora sells no numbers (R8), so the empty state must point at
// the carrier's own buy flow, never an in-product purchase.
const CARRIER: Record<string, {
  credsHint: string; credsUrl: string
  buyHint: string; buyUrl: string
  geoHint: string; geoUrl: string
  logsHint: string; logsUrl: string
  hasAuthToken: boolean
}> = {
  twilio: {
    credsHint: "Twilio Console → Account → API keys & tokens",
    credsUrl: "https://console.twilio.com/us1/account/keys-credentials/api-keys",
    buyHint: "Twilio Console → Phone Numbers → Buy a number",
    buyUrl: "https://console.twilio.com/us1/develop/phone-numbers/manage/search",
    geoHint: "Twilio Console → Voice → Geo permissions",
    geoUrl: "https://console.twilio.com/us1/develop/voice/settings/geo-permissions",
    logsHint: "Twilio Console → Monitor → Logs → Calls",
    logsUrl: "https://console.twilio.com/us1/monitor/logs/calls",
    hasAuthToken: true,
  },
  telnyx: {
    credsHint: "Telnyx Portal → API Keys",
    credsUrl: "https://portal.telnyx.com/#/app/api-keys",
    buyHint: "Telnyx Portal → Numbers → Search & buy",
    buyUrl: "https://portal.telnyx.com/#/app/numbers/search-numbers",
    geoHint: "Telnyx Portal → Outbound Voice Profiles → Allowed destinations",
    geoUrl: "https://portal.telnyx.com/#/app/outbound-profiles",
    logsHint: "Telnyx Portal → Reporting → Call Detail Records",
    logsUrl: "https://portal.telnyx.com/#/app/reporting",
    hasAuthToken: false, // Telnyx auth is API-key only — no less-secure fork to offer
  },
}

const TRUNK_NAME = "studio-x-trunk"

type Phase =
  | "s1-form" | "s1-validating" | "s1-error"
  | "s2-enumerating" | "s2-empty" | "s2-pick"
  | "strip"
  | "s3-idle" | "s3-ringing" | "s3-connected" | "s3-ended" | "s3-failed"

type StageStatus = "pending" | "running" | "done" | "failed"

const IDLE_STAGES = { trunk: "pending", routing: "pending", attach: "pending" } as const satisfies Record<string, StageStatus>

export function Variant2({ scenario }: ItspVariantProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [phase, setPhase] = React.useState<Phase>("s1-form")

  // Step 1 — R1: ≤4 inputs before automation (label · provider · credential pair).
  const [providerId, setProviderId] = React.useState<string>("twilio")
  const [label, setLabel] = React.useState("")
  const [method, setMethod] = React.useState<"scoped" | "authtoken">("scoped")
  const [scopedKey, setScopedKey] = React.useState("")
  const [sid, setSid] = React.useState("")
  const [authToken, setAuthToken] = React.useState("")
  const [connectedAt, setConnectedAt] = React.useState<Date | null>(null)

  // Step 2
  const [selectedE164, setSelectedE164] = React.useState<string | null>(null)
  const [pendingOverwrite, setPendingOverwrite] = React.useState<(typeof MOCK_NUMBERS)[number] & { routedTo: string | null } | null>(null)

  // 2→3 transition strip
  const [stages, setStages] = React.useState<Record<"trunk" | "routing" | "attach", StageStatus>>(IDLE_STAGES)
  const [stripFailed, setStripFailed] = React.useState(false)

  // Step 3
  const [callSeconds, setCallSeconds] = React.useState(0)

  // Mock-failure bookkeeping: the scenario fails the FIRST attempt at its
  // failAt stage; the retry succeeds — that is exactly what lets the judge see
  // "retry re-runs only the failed stage" (R2) instead of an infinite wall.
  const attemptsRef = React.useRef({ credentials: 0, enumerate: 0, attach: 0, verify: 0 })

  // Mock timers — tracked so closing the sheet mid-run can't fire stale state.
  const timersRef = React.useRef<number[]>([])
  const later = React.useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms))
  }, [])
  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])
  React.useEffect(() => clearTimers, [clearTimers])

  const carrier = CARRIER[providerId]
  const providerLabel = PROVIDERS.find((p) => p.id === providerId)?.label ?? "Carrier"
  // Telnyx has no auth-token path — force the (only) key method when switching.
  const effectiveMethod = carrier.hasAuthToken ? method : "scoped"

  // T3 seeds the FIRST number as already-routed so the judge naturally hits
  // the pre-overwrite confirm (R4) instead of tiptoeing around it.
  const numbers = React.useMemo(
    () =>
      MOCK_NUMBERS.map((n, i) => ({
        ...n,
        routedTo: scenario.failure === "on-other-trunk" && i === 0 ? "support-legacy" : null,
      })),
    [scenario.failure],
  )
  const selected = numbers.find((n) => n.e164 === selectedE164) ?? null

  const rawCred = effectiveMethod === "scoped" ? scopedKey : authToken
  const credLast4 = rawCred.trim().slice(-4) || "4f2a" // mock fallback so the recap never shows blank
  const credKind = effectiveMethod === "scoped" ? "scoped key" : "auth token"

  const canConnect =
    effectiveMethod === "scoped" ? scopedKey.trim().length > 0 : sid.trim().length > 0 && authToken.trim().length > 0

  // ---- stage runners (each re-runs ONLY itself on retry — R2) ----

  function runValidate() {
    setPhase("s1-validating")
    later(() => {
      const fail = scenario.failure === "bad-creds" && attemptsRef.current.credentials === 0
      attemptsRef.current.credentials += 1
      if (fail) {
        setPhase("s1-error")
      } else {
        setConnectedAt(new Date())
        runEnumerate()
      }
    }, 1100)
  }

  function runEnumerate() {
    setPhase("s2-enumerating")
    later(() => {
      const empty = scenario.failure === "no-numbers" && attemptsRef.current.enumerate === 0
      attemptsRef.current.enumerate += 1
      setPhase(empty ? "s2-empty" : "s2-pick")
    }, 1200)
  }

  // The 2→3 transition: trunk → routing → attach as a compact strip. Only
  // `attach` can fail here (geo-block 32205); trunk/routing stay checked so
  // retry visibly re-runs one row, not the world.
  function runStrip() {
    setPhase("strip")
    setStripFailed(false)
    setStages({ trunk: "running", routing: "pending", attach: "pending" })
    later(() => {
      setStages((s) => ({ ...s, trunk: "done", routing: "running" }))
      later(() => {
        setStages((s) => ({ ...s, routing: "done", attach: "running" }))
        later(() => runAttach(), 400)
      }, 900)
    }, 900)
  }

  function runAttach() {
    setStages((s) => ({ ...s, attach: "running" }))
    setStripFailed(false)
    later(() => {
      const fail = scenario.failure === "geo-blocked" && attemptsRef.current.attach === 0
      attemptsRef.current.attach += 1
      if (fail) {
        setStages((s) => ({ ...s, attach: "failed" }))
        setStripFailed(true)
      } else {
        setStages((s) => ({ ...s, attach: "done" }))
        later(() => setPhase("s3-idle"), 500)
      }
    }, 900)
  }

  function runCall() {
    setCallSeconds(0)
    setPhase("s3-ringing")
    later(() => {
      const fail = scenario.failure === "verify-fail" && attemptsRef.current.verify === 0
      attemptsRef.current.verify += 1
      setPhase(fail ? "s3-failed" : "s3-connected")
    }, 1400)
  }

  // Call-duration tick — only while live; tabular-nums keeps it from jittering.
  React.useEffect(() => {
    if (phase !== "s3-connected") return
    const id = window.setInterval(() => setCallSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [phase])

  function reset() {
    clearTimers()
    setPhase("s1-form")
    setProviderId("twilio")
    setLabel("")
    setMethod("scoped")
    setScopedKey("")
    setSid("")
    setAuthToken("")
    setConnectedAt(null)
    setSelectedE164(null)
    setPendingOverwrite(null)
    setStages(IDLE_STAGES)
    setStripFailed(false)
    setCallSeconds(0)
    attemptsRef.current = { credentials: 0, enumerate: 0, attach: 0, verify: 0 }
  }

  // ---- stepper derivation ----
  const currentStep: 1 | 2 | 3 = phase.startsWith("s1") ? 1 : phase.startsWith("s2") || phase === "strip" ? 2 : 3
  const step1Done = connectedAt !== null && currentStep !== 1
  const step2Done = phase === "strip" || phase.startsWith("s3")
  const verified = phase === "s3-connected" || phase === "s3-ended"
  // No back-jumps while automation is mid-flight — a half-created trunk with
  // the user editing credentials is exactly the ambiguity the spec forbids.
  const busy = phase === "s1-validating" || phase === "s2-enumerating" || (phase === "strip" && !stripFailed) || phase === "s3-ringing"

  function goToStep(target: 1 | 2) {
    if (busy || verified) return
    if (target === 1) setPhase("s1-form")
    if (target === 2 && connectedAt) {
      // Numbers were already enumerated → land straight on the picker;
      // re-fetching would falsely imply the enumerate stage re-ran.
      if (attemptsRef.current.enumerate > 0 && scenario.failure !== "no-numbers") setPhase("s2-pick")
      else runEnumerate()
    }
  }

  function selectNumber(n: (typeof numbers)[number]) {
    if (n.routedTo && n.e164 !== selectedE164) {
      setPendingOverwrite(n) // R4 — consent BEFORE any routing is touched
      return
    }
    setSelectedE164(n.e164)
  }

  const connectedAtLabel = connectedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? ""
  const mm = String(Math.floor(callSeconds / 60)).padStart(2, "0")
  const ss = String(callSeconds % 60).padStart(2, "0")

  return (
    <>
      {/* Inline lab trigger — the variant is judged inside the sheet, this card just opens it. */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <PhoneCall className="h-4 w-4 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Bring a carrier number</p>
            <p className="text-xs text-muted-foreground">
              Twilio or Telnyx — Studio creates and verifies the SIP trunk for you. You bring a number you already own; Agora doesn&apos;t sell numbers.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Sheet
            open={open}
            onOpenChange={(o) => {
              setOpen(o)
              if (!o) reset() // fresh run per open — the lab judges one scenario at a time
            }}
          >
            <SheetTrigger asChild>
              <Button size="sm">
                Connect carrier number
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto p-0 flex flex-col data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
              <SheetHeader className="px-5 py-4 border-b border-border">
                <SheetTitle>Connect a carrier number</SheetTitle>
                <SheetDescription>Three steps — credentials, number, then a real test call.</SheetDescription>
              </SheetHeader>

              {/* Persistent stepper — always visible so failures are legible in place. */}
              <div className="border-b border-border bg-muted/30 px-5 py-3">
                <ol className="flex items-center gap-2">
                  <StepPip
                    index={1}
                    labelText="Connect carrier"
                    recap={step1Done ? `${providerLabel} ••••${credLast4}` : undefined}
                    state={phase === "s1-error" ? "error" : step1Done ? "done" : currentStep === 1 ? "active" : "upcoming"}
                    clickable={step1Done && !busy && !verified}
                    onClick={() => goToStep(1)}
                  />
                  <StepConnector done={step1Done} />
                  <StepPip
                    index={2}
                    labelText="Pick a number"
                    recap={step2Done && selected ? selected.e164 : undefined}
                    state={step2Done ? "done" : currentStep === 2 ? "active" : "upcoming"}
                    clickable={connectedAt !== null && currentStep === 3 && !busy && !verified}
                    onClick={() => goToStep(2)}
                  />
                  <StepConnector done={step2Done && phase !== "strip"} />
                  <StepPip
                    index={3}
                    labelText="Verify"
                    recap={verified ? "call connected" : undefined}
                    state={
                      phase === "s3-failed" ? "error"
                        : verified ? "done"
                        : phase === "strip" ? "working" // automation is carrying the user toward it
                        : currentStep === 3 ? "active" : "upcoming"
                    }
                    clickable={false}
                  />
                </ol>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* ============ STEP 1 — Connect carrier ============ */}
                {currentStep === 1 && (
                  <>
                    {connectedAt && phase === "s1-form" && (
                      // Returning via Back: show what is stored (R7) — masked, timestamped.
                      <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-2">
                        <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                        <p className="text-xs">
                          Connected — {providerLabel} {credKind} <span className="font-mono tabular-nums">••••{credLast4}</span>
                          <span className="text-muted-foreground tabular-nums"> · today {connectedAtLabel}</span>
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label>Provider</Label>
                      <ToggleGroup
                        type="single"
                        value={providerId}
                        onValueChange={(v) => { if (v) setProviderId(v) }}
                        spacing={0}
                        variant="outline"
                        aria-label="Carrier provider"
                      >
                        {PROVIDERS.map((p) => (
                          <ToggleGroupItem
                            key={p.id}
                            value={p.id}
                            aria-label={p.label}
                            className="h-8 px-4 text-xs font-medium data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                          >
                            {p.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="v2-label">Label <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        id="v2-label"
                        placeholder={`${providerLabel} main line`}
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                      />
                    </div>

                    {/* R1 — scoped key is the promoted path; auth token exists but is
                        folded away and explicitly labeled the less-secure option. */}
                    {effectiveMethod === "scoped" && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="v2-key">{providerId === "twilio" ? "Scoped API key" : "API key"}</Label>
                          <Badge variant="secondary" className="text-xs">
                            <ShieldCheck />
                            Recommended
                          </Badge>
                        </div>
                        <Input
                          id="v2-key"
                          type="password"
                          placeholder={providerId === "twilio" ? "SKxxxxxxxxxxxxxxxx" : "KEYxxxxxxxxxxxxxxxx"}
                          value={scopedKey}
                          onChange={(e) => setScopedKey(e.target.value)}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Create one at {carrier.credsHint}.{" "}
                          <CarrierLink href={carrier.credsUrl}>Open</CarrierLink>
                        </p>
                      </div>
                    )}

                    {carrier.hasAuthToken && (
                      <Collapsible open={method === "authtoken"} onOpenChange={(o) => setMethod(o ? "authtoken" : "scoped")}>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <ChevronDown className={cn("h-3.5 w-3.5 motion-safe:transition-transform", method === "authtoken" && "rotate-180")} />
                            Use Account SID + Auth Token instead
                            <Badge variant="warning" className="text-xs">less secure</Badge>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-3 space-y-3">
                          <p className="text-xs text-muted-foreground">
                            The auth token grants full account access. A scoped key limits what Studio can touch — prefer it when you can.
                          </p>
                          <div className="space-y-1.5">
                            <Label htmlFor="v2-sid">Account SID</Label>
                            <Input id="v2-sid" placeholder="ACxxxxxxxxxxxxxxxx" value={sid} onChange={(e) => setSid(e.target.value)} className="font-mono text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="v2-token">Auth Token</Label>
                            <Input id="v2-token" type="password" placeholder="••••••••••••••••" value={authToken} onChange={(e) => setAuthToken(e.target.value)} className="font-mono text-sm" />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {phase === "s1-validating" && (
                      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5">
                        <Loader2 className="h-4 w-4 text-primary motion-safe:animate-spin shrink-0" />
                        <p className="text-xs text-muted-foreground">Validating credentials with {providerLabel}…</p>
                      </div>
                    )}

                    {phase === "s1-error" && (
                      // T1 must: exact fix + where to find it; and explicitly claim
                      // NOTHING else happened — no partial-success ambiguity.
                      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                          <p className="text-sm font-medium">{providerLabel} rejected these credentials (401)</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Nothing was created — no trunk, no routing changes. Check the{" "}
                          {providerId === "twilio" ? "SID and token" : "API key"} at {carrier.credsHint}, then try again.
                        </p>
                        <CarrierLink href={carrier.credsUrl}>Open {providerLabel} credentials</CarrierLink>
                      </div>
                    )}
                  </>
                )}

                {/* ============ STEP 2 — Pick a number ============ */}
                {phase === "s2-enumerating" && (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5">
                    <Loader2 className="h-4 w-4 text-primary motion-safe:animate-spin shrink-0" />
                    <p className="text-xs text-muted-foreground">Fetching the numbers in your {providerLabel} account…</p>
                  </div>
                )}

                {phase === "s2-empty" && (
                  // T2 must: deep-link buying AT THE CARRIER (Agora sells none, R8)
                  // and hold trunk creation against an empty account.
                  <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2 text-center">
                    <Phone className="h-5 w-5 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium">No numbers in this {providerLabel} account</p>
                    <p className="text-xs text-muted-foreground">
                      Agora doesn&apos;t sell numbers — buy one at {providerLabel} first, then re-check.
                      Trunk creation is on hold until the account has at least one number.
                    </p>
                    <div className="pt-1">
                      <CarrierLink href={carrier.buyUrl}>{carrier.buyHint}</CarrierLink>
                    </div>
                  </div>
                )}

                {phase === "s2-pick" && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Found <span className="font-medium text-foreground tabular-nums">{numbers.length}</span> numbers in {providerLabel}. Capabilities shown before you choose — outbound-only caller IDs can place calls but can&apos;t receive them.
                    </p>
                    {/* R3 — capability badges BEFORE selection */}
                    <div className="space-y-2" role="radiogroup" aria-label="Phone number">
                      {numbers.map((n) => {
                        const isSelected = n.e164 === selectedE164
                        return (
                          <button
                            key={n.e164}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => selectNumber(n)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg border p-3 text-left motion-safe:transition-colors",
                              isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium font-mono tabular-nums">{n.e164}</p>
                              <p className="text-xs text-muted-foreground">{n.label}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {n.capability === "inbound+outbound" ? (
                                <Badge variant="secondary" className="text-xs">
                                  <PhoneIncoming />
                                  Inbound + outbound
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="text-xs">
                                  <PhoneOutgoing />
                                  Outbound-only
                                </Badge>
                              )}
                              {n.routedTo && (
                                // T3 — surfaced BEFORE the overwrite moment, not after
                                <Badge variant="outline" className="text-xs">
                                  <Waypoints />
                                  Currently routed elsewhere
                                </Badge>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}

                {/* ============ 2→3 TRANSITION — the compact staged strip ============ */}
                {phase === "strip" && selected && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Connecting <span className="font-mono tabular-nums text-foreground">{selected.e164}</span> — this is the work Retell makes you do in two consoles.
                    </p>
                    <div className="rounded-md border border-border bg-muted/30 divide-y divide-border">
                      <StageRow status={stages.trunk} labelText={`Create SIP trunk (${TRUNK_NAME})`} />
                      <StageRow status={stages.routing} labelText="Point origination & termination at Agora" />
                      <StageRow status={stages.attach} labelText={`Attach ${selected.e164} to the trunk`} />
                    </div>

                    {stripFailed && (
                      // T4 must: name + link the carrier-side setting; retry re-runs
                      // ONLY the attach row — trunk/routing above keep their checks.
                      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                          <p className="text-sm font-medium">{providerLabel} blocked the attachment — geo permissions (error 32205)</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your {providerLabel} account doesn&apos;t allow voice to this number&apos;s region.
                          Turn it on at {carrier.geoHint}, then retry. The trunk and routing above are already done and won&apos;t re-run.
                        </p>
                        <div className="flex items-center gap-3 pt-1">
                          <Button size="sm" onClick={runAttach}>Retry attach</Button>
                          <CarrierLink href={carrier.geoUrl}>Open geo permissions</CarrierLink>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ============ STEP 3 — Verify with a REAL call (R6) ============ */}
                {currentStep === 3 && selected && (
                  <>
                    {(phase === "s3-idle" || phase === "s3-ringing" || phase === "s3-failed") && (
                      <p className="text-xs text-muted-foreground">
                        The trunk exists — that&apos;s provisioning, not proof. A test call is the only fact that counts, so Done unlocks after it connects.
                      </p>
                    )}

                    {phase === "s3-idle" && (
                      <div className="rounded-lg border border-border bg-card p-4 text-center space-y-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto">
                          <PhoneCall className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium font-mono tabular-nums">{selected.e164}</p>
                        <Button onClick={runCall}>
                          <Phone className="h-4 w-4" />
                          Place test call
                        </Button>
                      </div>
                    )}

                    {phase === "s3-ringing" && (
                      <div className="rounded-lg border border-border bg-card p-4 text-center space-y-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto">
                          <Phone className="h-5 w-5 text-primary motion-safe:animate-pulse" />
                        </div>
                        <p className="text-sm font-medium">Ringing <span className="font-mono tabular-nums">{selected.e164}</span>…</p>
                        <p className="text-xs text-muted-foreground">Calling through the new trunk — not a simulation.</p>
                      </div>
                    )}

                    {(phase === "s3-connected" || phase === "s3-ended") && (
                      <>
                        <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-2.5">
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                          <p className="text-sm font-medium flex-1">
                            {phase === "s3-connected" ? "Connected — the call is live" : "Test call connected"}
                          </p>
                          {phase === "s3-connected" && (
                            <span className="text-xs text-muted-foreground font-mono tabular-nums">{mm}:{ss}</span>
                          )}
                          {phase === "s3-connected" && (
                            <Button size="sm" variant="outline" onClick={() => setPhase("s3-ended")}>End call</Button>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <SummaryRow labelText="Number" value={selected.e164} mono />
                          <SummaryRow labelText="Trunk" value={TRUNK_NAME} mono />
                          <SummaryRow labelText="Provider" value={providerLabel} />
                          <SummaryRow labelText="Label" value={label.trim() || `${providerLabel} main line`} />
                        </div>

                        {/* R7 — stored credential: masked, timestamped, disconnect ≠ revocation */}
                        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3">
                          <KeyRound className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="text-xs space-y-0.5">
                            <p>
                              {providerLabel} {credKind} <span className="font-mono tabular-nums">••••{credLast4}</span>
                              <span className="text-muted-foreground tabular-nums"> · connected today {connectedAtLabel}</span>
                            </p>
                            <p className="text-muted-foreground">
                              Disconnecting in Studio removes it here only — it does not revoke the key at {providerLabel}. Revoke it there if you rotate.
                            </p>
                          </div>
                        </div>

                        {/* Same success routing as the manual sheet — the number should go to work. */}
                        <div className="space-y-2 pt-1">
                          <p className="text-sm font-medium">Put this number to work</p>
                          <RouteCard
                            icon={PhoneIncoming}
                            titleText="Set up inbound"
                            desc="Route incoming calls to an agent."
                            onClick={() => { setOpen(false); reset(); router.push("/deploy/inbound/new") }}
                          />
                          <RouteCard
                            icon={Megaphone}
                            titleText="Create a campaign"
                            desc="Use this number for outbound campaigns."
                            onClick={() => { setOpen(false); reset(); router.push("/deploy/batch-calls/new") }}
                          />
                        </div>
                      </>
                    )}

                    {phase === "s3-failed" && (
                      // T5 must: configuration exists ≠ calls connect — two facts,
                      // stated plainly; carrier call logs linked; retry + manual fallback.
                      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                          <p className="text-sm font-medium">The configuration exists — calls don&apos;t connect yet</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Those are two different facts. The trunk, routing, and number attachment all succeeded, but the test
                          call to <span className="font-mono tabular-nums">{selected.e164}</span> didn&apos;t complete. {providerLabel}&apos;s
                          own call logs show how far it got: {carrier.logsHint}.
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <Button size="sm" onClick={runCall}>Call again</Button>
                          <CarrierLink href={carrier.logsUrl}>Open {providerLabel} call logs</CarrierLink>
                          <button
                            type="button"
                            onClick={() => { setOpen(false); reset(); router.push("/deploy/phone-numbers") }}
                            className="text-xs text-primary hover:underline"
                          >
                            Set up SIP manually instead
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer — manual-SIP fallback is reachable from EVERY phase (R8). */}
              <div className="border-t border-border px-5 py-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => { setOpen(false); reset(); router.push("/deploy/phone-numbers") }}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Set up SIP manually instead
                </button>

                <div className="flex items-center gap-2">
                  {currentStep === 1 && (
                    <Button
                      onClick={runValidate}
                      disabled={!canConnect || phase === "s1-validating"}
                    >
                      {phase === "s1-validating" ? (
                        <>
                          <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
                          Validating…
                        </>
                      ) : phase === "s1-error" ? (
                        "Try again"
                      ) : (
                        `Connect ${providerLabel}`
                      )}
                    </Button>
                  )}

                  {currentStep === 2 && phase !== "strip" && (
                    <>
                      <Button variant="outline" onClick={() => goToStep(1)} disabled={busy}>
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      {phase === "s2-empty" ? (
                        // Retry re-runs ONLY enumeration (R2) — nothing upstream repeats.
                        <Button onClick={runEnumerate}>Re-check numbers</Button>
                      ) : (
                        <Button onClick={runStrip} disabled={!selected || busy}>
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}

                  {phase === "strip" && (
                    <>
                      <Button variant="outline" onClick={() => setPhase("s2-pick")} disabled={!stripFailed}>
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button disabled>
                        {stripFailed ? "Retry above" : (
                          <>
                            <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
                            Setting up…
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {currentStep === 3 && (
                    <>
                      <Button variant="outline" onClick={() => goToStep(2)} disabled={busy || verified}>
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      {/* R6 — Done only exists on the far side of a connected call. */}
                      <Button onClick={() => { setOpen(false); reset() }} disabled={!verified}>
                        Done
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* R4 — pre-overwrite confirm: calm, factual, and declining touches nothing.
          Association would SILENTLY replace the number's existing voice routing,
          so consent happens at selection time, before any automation runs. */}
      <AlertDialog open={pendingOverwrite !== null} onOpenChange={(o) => { if (!o) setPendingOverwrite(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This number is routed elsewhere</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-mono tabular-nums">{pendingOverwrite?.e164}</span> currently sends calls to the
              trunk &ldquo;{pendingOverwrite?.routedTo}&rdquo;. Attaching it here replaces that voice routing — calls
              will come to this agent instead. Nothing changes until you confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingOverwrite(null)}>Keep current routing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingOverwrite) setSelectedE164(pendingOverwrite.e164)
                setPendingOverwrite(null)
              }}
            >
              Move it here
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Local pieces — the lab is throwaway, so these stay in-file rather than
// polluting components/ with soon-deleted exports.

function StepPip({
  index, labelText, recap, state, clickable, onClick,
}: {
  index: number
  labelText: string
  recap?: string
  state: "done" | "active" | "upcoming" | "error" | "working"
  clickable: boolean
  onClick?: () => void
}) {
  return (
    <li className="flex items-center gap-2 min-w-0">
      <button
        type="button"
        onClick={onClick}
        disabled={!clickable}
        aria-current={state === "active" ? "step" : undefined}
        className={cn("flex items-center gap-2 min-w-0", clickable ? "cursor-pointer" : "cursor-default")}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums",
            state === "done" && "border-success bg-success/10 text-success",
            state === "active" && "border-primary bg-primary/10 text-primary",
            state === "error" && "border-destructive bg-destructive/10 text-destructive",
            state === "working" && "border-primary text-primary",
            state === "upcoming" && "border-border text-muted-foreground",
          )}
        >
          {state === "done" ? <Check className="h-3.5 w-3.5" />
            : state === "error" ? <AlertCircle className="h-3.5 w-3.5" />
            : state === "working" ? <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />
            : index}
        </span>
        <span className="min-w-0 text-left">
          <span
            className={cn(
              "block text-xs font-medium truncate",
              state === "active" || state === "done" ? "text-foreground"
                : state === "error" ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {labelText}
          </span>
          {recap && <span className="block text-xs text-muted-foreground truncate tabular-nums">{recap}</span>}
        </span>
      </button>
    </li>
  )
}

function StepConnector({ done }: { done: boolean }) {
  return <li aria-hidden="true" className={cn("h-px flex-1", done ? "bg-success" : "bg-border")} />
}

// One automation stage inside the 2→3 strip. Failed stages go red IN PLACE;
// done stages never lose their check on retry (R2 / T4 must).
function StageRow({ status, labelText }: { status: StageStatus; labelText: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {status === "pending" && <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      {status === "running" && <Loader2 className="h-3.5 w-3.5 text-primary motion-safe:animate-spin shrink-0" />}
      {status === "done" && <Check className="h-3.5 w-3.5 text-success shrink-0" />}
      {status === "failed" && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
      <p
        className={cn(
          "text-xs tabular-nums",
          status === "running" && "text-foreground font-medium",
          status === "done" && "text-muted-foreground",
          status === "pending" && "text-muted-foreground",
          status === "failed" && "text-destructive font-medium",
        )}
      >
        {labelText}
      </p>
    </div>
  )
}

function SummaryRow({ labelText, value, mono }: { labelText: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{labelText}</span>
      <span className={cn("text-sm text-right font-medium", mono && "font-mono tabular-nums")}>{value}</span>
    </div>
  )
}

function CarrierLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

// Mirrors the manual sheet's success routing so the winner folds in cleanly.
function RouteCard({
  icon: Icon, titleText, desc, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  titleText: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left motion-safe:transition-all hover:border-primary/40 hover:shadow-sm focus-visible:border-primary/40"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{titleText}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 motion-safe:transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
    </button>
  )
}
