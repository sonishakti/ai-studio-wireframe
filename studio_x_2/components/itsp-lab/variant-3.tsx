"use client"

// itsp-lab Variant 3 — "Paste-and-go" (THROWAWAY judge-round harness, see spec.ts)
// ─────────────────────────────────────────────────────────────────────────────
// Thesis: ONE screen, ONE visible decision (provider + credential pair), then
// [Connect my carrier]. Everything downstream is automatic and NARRATED by a
// staged mono log — validate ✓ → numbers found → trunk → attach → REAL test
// call. Humans are pulled in only when the machine genuinely can't decide:
//   · >1 viable number       → compact picker pauses the log (badges first, R3)
//   · exactly 1 viable       → auto-picked with a timed undo affordance
//   · overwrite risk (T3)    → explicit calm confirm — Twilio replaces routing
//                              silently; we ask out loud (R4)
// Every failure interrupts IN PLACE with the carrier-side fix named + linked
// (R5); retry re-runs ONLY the failed stage — the log NEVER restarts (R2).
// The flow ends on a live test call, never a "saved" checkmark (R6).

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
// Shared banner idiom from the Billing money surfaces — same tones, no drift.
import { StateBanner } from "@/components/usage-spend-card"
import {
  ArrowRight, CheckCircle2, ExternalLink, Globe, KeyRound, Loader2, Megaphone,
  Phone, PhoneForwarded, PhoneIncoming, PhoneMissed, PhoneOff, ShieldCheck, Undo2,
} from "lucide-react"
import {
  MOCK_NUMBERS, PROVIDERS,
  type ItspScenario, type ItspStage, type ItspVariantProps,
} from "@/components/itsp-lab/spec"

type ProviderId = (typeof PROVIDERS)[number]["id"]
type MockNumber = (typeof MOCK_NUMBERS)[number]
type Failure = NonNullable<ItspScenario["failure"]>
/** Twilio only: scoped API key is the default (safer); SID+token is opt-in. */
type CredMode = "scoped" | "authtoken"

// The machine the tail region renders. Log lines are FACTS (append-only);
// the machine is the ONE live moment below them — spinner, pause, or interrupt.
type Machine =
  | { t: "form" }
  | { t: "stage"; stage: ItspStage; text: string }
  | { t: "pick" }
  | { t: "auto-picked"; number: MockNumber } // single viable number → undo window
  | { t: "confirm-overwrite"; number: MockNumber }
  | { t: "declined"; number: MockNumber }
  | { t: "failed"; stage: ItspStage; failure: Failure }
  | { t: "test-ready"; number: MockNumber }
  | { t: "success"; number: MockNumber }

interface LogLine {
  id: number
  time: string
  tone: "done" | "fail" | "pause" | "note"
  text: string
}

const TRUNK_NAME = "agora-4f2a"

// Carrier-side deep links: R5 demands the fix live AT the carrier, named.
const CARRIER: Record<ProviderId, {
  consoleHome: string
  buyNumber: string
  geoPermissions: string
  geoLabel: string
  callLogs: string
  credWhere: string
  trunkHost: string
}> = {
  twilio: {
    consoleHome: "https://console.twilio.com",
    buyNumber: "https://console.twilio.com/us1/develop/phone-numbers/manage/search",
    geoPermissions: "https://console.twilio.com/us1/develop/voice/settings/geo-permissions",
    geoLabel: "Voice Geographic Permissions",
    callLogs: "https://console.twilio.com/us1/monitor/logs/calls",
    credWhere: "Twilio Console home → Account Info",
    trunkHost: "pstn.twilio.com",
  },
  telnyx: {
    consoleHome: "https://portal.telnyx.com",
    buyNumber: "https://portal.telnyx.com/#/app/numbers/search-numbers",
    geoPermissions: "https://portal.telnyx.com/#/app/outbound-profiles",
    geoLabel: "Outbound profile · allowed destinations",
    callLogs: "https://portal.telnyx.com/#/app/reporting/debugging",
    credWhere: "Telnyx Portal → API Keys",
    trunkHost: "sip.telnyx.com",
  },
}

function credFieldMeta(providerId: ProviderId, credMode: CredMode) {
  if (providerId === "telnyx") {
    return { id: null, secret: { label: "API key", placeholder: "KEY0123456789ABCDEF" } }
  }
  return credMode === "scoped"
    ? {
        id: { label: "API key SID", placeholder: "SKxxxxxxxxxxxxxxxx" },
        secret: { label: "API key secret", placeholder: "Paste the secret" },
      }
    : {
        id: { label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxx" },
        secret: { label: "Auth Token", placeholder: "Paste the token" },
      }
}

function stamp() {
  // Mock clock — real time is fine for a wireframe; lines are client-appended
  // after mount, so there is no SSR text to mismatch.
  return new Date().toLocaleTimeString("en-GB")
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return reduced
}

export function Variant3({ scenario }: ItspVariantProps) {
  const router = useRouter()
  // Auto-open: the harness remounts per scenario; judges land inside the sheet.
  const [open, setOpen] = React.useState(true)

  // ── The ≤4 inputs (R1): provider + one credential pair (2–3 fields total) ──
  const [providerId, setProviderId] = React.useState<ProviderId>("twilio")
  const [credMode, setCredMode] = React.useState<CredMode>("scoped") // safer default
  const [keyId, setKeyId] = React.useState("")
  const [keySecret, setKeySecret] = React.useState("")

  const [machine, setMachine] = React.useState<Machine>({ t: "form" })
  const [log, setLog] = React.useState<LogLine[]>([])
  const [connectedAt, setConnectedAt] = React.useState<Date | null>(null)

  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]
  const links = CARRIER[providerId]
  const meta = credFieldMeta(providerId, credMode)
  const credLabel =
    providerId === "telnyx" ? "API key" : credMode === "scoped" ? "scoped API key" : "Auth Token"
  // R7: stored credentials mask to last 4 — never echo the secret back.
  const last4 = (keySecret.trim() || "3kF9").slice(-4)

  const reduced = usePrefersReducedMotion()
  const reducedRef = React.useRef(reduced)
  reducedRef.current = reduced

  // Single-slot timer: at most ONE staged step is ever in flight.
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearPending = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])
  React.useEffect(() => clearPending, [clearPending])
  const later = React.useCallback((ms: number, fn: () => void) => {
    clearPending()
    // Motion-gated: reduced motion collapses the theater to near-instant.
    timerRef.current = setTimeout(fn, reducedRef.current ? 120 : ms)
  }, [clearPending])

  const idRef = React.useRef(0)
  const push = React.useCallback((tone: LogLine["tone"], text: string) => {
    idRef.current += 1
    const line: LogLine = { id: idRef.current, time: stamp(), tone, text }
    setLog((l) => [...l, line]) // append-only: the log never restarts (R2)
  }, [])

  // Each scenario fails its stage exactly once; retry then succeeds — that is
  // the mock's stand-in for "you fixed it at the carrier".
  const failedOnceRef = React.useRef(false)
  // T3: the overwrite conflict belongs to the FIRST number tried; picking a
  // different number after declining attaches cleanly.
  const conflictRef = React.useRef<string | null>(null)
  const chosenRef = React.useRef<MockNumber | null>(null)

  // Keep the newest log line / live moment in view.
  const bodyRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = bodyRef.current
    if (el && machine.t !== "form") el.scrollTop = el.scrollHeight
  }, [log.length, machine.t])

  // ── The staged run — each function is one honest stage of real work ────────

  function runValidate() {
    setMachine({ t: "stage", stage: "credentials", text: `Validating credentials with ${provider.label}…` })
    later(950, () => {
      if (scenario.failAt === "credentials" && !failedOnceRef.current) {
        failedOnceRef.current = true
        push("fail", `${provider.label} rejected the credentials — HTTP 401`)
        setMachine({ t: "failed", stage: "credentials", failure: "bad-creds" })
        return
      }
      push("done", `Credentials valid · ${provider.label} account "Acme Support" · ${credLabel} ····${last4}`)
      runEnumerate()
    })
  }

  function runEnumerate() {
    setMachine({ t: "stage", stage: "enumerate", text: "Enumerating phone numbers on the account…" })
    later(1100, () => {
      if (scenario.failAt === "enumerate" && !failedOnceRef.current) {
        failedOnceRef.current = true
        push("fail", "0 phone numbers found on this account")
        setMachine({ t: "failed", stage: "enumerate", failure: "no-numbers" })
        return
      }
      const viable = MOCK_NUMBERS.filter((n) => n.capability === "inbound+outbound")
      push(
        "done",
        `${MOCK_NUMBERS.length} numbers found · ${viable.length} inbound+outbound · ${MOCK_NUMBERS.length - viable.length} outbound-only`,
      )
      if (viable.length === 1) {
        // Exactly one number can actually take calls → don't make a human pick
        // from a list of one. Auto-select, hold a short undo window, move on.
        chosenRef.current = viable[0]
        push("note", `${viable[0].e164} auto-selected — the only number that can take calls`)
        setMachine({ t: "auto-picked", number: viable[0] })
        later(2600, () => runCreate(viable[0]))
      } else {
        // A real choice exists → the ONLY moment T0 pauses for a human.
        push("pause", `${viable.length} numbers can take calls — your pick`)
        setMachine({ t: "pick" })
      }
    })
  }

  function choose(n: MockNumber) {
    clearPending() // cancels an auto-pick countdown if the user undid it late
    chosenRef.current = n
    push("done", `${n.e164} selected`)
    runCreate(n)
  }

  function runCreate(n: MockNumber) {
    setMachine({ t: "stage", stage: "create", text: `Creating SIP trunk ${TRUNK_NAME} + origination routing…` })
    later(1200, () => {
      push("done", `Trunk live · sip:${TRUNK_NAME}.${links.trunkHost}`)
      runAssociate(n)
    })
  }

  function runAssociate(n: MockNumber, overwriteConfirmed = false) {
    setMachine({
      t: "stage",
      stage: "associate",
      text: overwriteConfirmed
        ? `Replacing routing and attaching ${n.e164}…`
        : `Attaching ${n.e164} to the trunk…`,
    })
    later(950, () => {
      // T3 — association would SILENTLY overwrite existing voice routing at the
      // carrier. We stop and ask; the carrier never would (R4).
      if (
        scenario.failure === "on-other-trunk" &&
        !overwriteConfirmed &&
        (conflictRef.current === null || conflictRef.current === n.e164)
      ) {
        conflictRef.current = n.e164
        push("pause", `${n.e164} already has voice routing at ${provider.label} — paused before changing anything`)
        setMachine({ t: "confirm-overwrite", number: n })
        return
      }
      if (scenario.failure === "geo-blocked" && !failedOnceRef.current) {
        failedOnceRef.current = true
        push("fail", `Attach blocked — ${provider.label} error 32205 (geographic permissions)`)
        setMachine({ t: "failed", stage: "associate", failure: "geo-blocked" })
        return
      }
      push("done", `${n.e164} attached — inbound calls now route to your agent`)
      push("note", "Provisioning complete. Provisioned ≠ answering — one real call proves it.")
      setMachine({ t: "test-ready", number: n })
    })
  }

  // R6: the run ENDS on a live call the user places — never a saved checkmark.
  function placeTestCall(n: MockNumber) {
    setMachine({ t: "stage", stage: "verify", text: `Calling ${n.e164} — listen for the ring…` })
    later(1700, () => {
      if (scenario.failure === "verify-fail" && !failedOnceRef.current) {
        failedOnceRef.current = true
        push("fail", "Test call did not connect — rang out after 15s")
        setMachine({ t: "failed", stage: "verify", failure: "verify-fail" })
        return
      }
      push("done", "Test call connected — answered in 2.1s, two-way audio confirmed")
      setConnectedAt(new Date())
      setMachine({ t: "success", number: n })
    })
  }

  function begin() {
    setLog([])
    failedOnceRef.current = false
    conflictRef.current = null
    chosenRef.current = null
    setConnectedAt(null)
    runValidate()
  }

  // Retry re-runs ONLY the failed stage; every ✓ above stays put (R2, T4-must).
  function retryStage(stage: ItspStage) {
    const n = chosenRef.current
    if (stage === "credentials") runValidate()
    else if (stage === "enumerate") runEnumerate()
    else if (stage === "associate" && n) runAssociate(n)
    else if (stage === "verify" && n) placeTestCall(n)
  }

  // R8: manual fallback is always reachable. Harness stub — the fold-in wires
  // this to AddPhoneNumberSheet; a toast keeps the affordance honest here.
  function openManualForm() {
    toast("Opens the manual SIP form (Add Phone Number) — wired at fold-in.")
  }

  const canConnect = (meta.id ? keyId.trim().length > 0 : true) && keySecret.trim().length > 0
  const running = machine.t !== "form"

  return (
    <>
      {/* Launcher — the harness page renders variants inline; the sheet opens
          on mount and this card re-opens it after dismissal. */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div>
          <p className="text-sm font-medium">Paste-and-go</p>
          <p className="text-xs text-muted-foreground">
            One credential, one button — the rest is a narrated run that ends on a live call.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Open</Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle>Connect your carrier</SheetTitle>
            <SheetDescription>
              Paste one credential — validation, numbers, trunk, routing, and a live test call,
              narrated as it happens.
            </SheetDescription>
          </SheetHeader>

          <div ref={bodyRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {!running ? (
              /* ── THE one screen: provider + credential pair (3 inputs max, R1) ── */
              <>
                <div className="space-y-1.5">
                  <Label>Carrier</Label>
                  <Select
                    value={providerId}
                    onValueChange={(v) => {
                      setProviderId(v as ProviderId)
                      setCredMode("scoped")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <CredFields
                  meta={meta}
                  keyId={keyId}
                  keySecret={keySecret}
                  onKeyId={setKeyId}
                  onKeySecret={setKeySecret}
                />

                {/* R1 — scoped key preferred; SID+token allowed but labeled riskier */}
                {providerId === "twilio" && (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {credMode === "scoped" ? (
                        <>
                          A scoped API key can only manage voice — not your whole account.{" "}
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs"
                            onClick={() => setCredMode("authtoken")}
                          >
                            Use Account SID + Auth Token instead
                          </Button>
                        </>
                      ) : (
                        <>
                          Works, but the Auth Token grants full account access — a scoped API key
                          is safer.{" "}
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs"
                            onClick={() => setCredMode("scoped")}
                          >
                            Switch back to a scoped key
                          </Button>
                        </>
                      )}
                    </span>
                  </p>
                )}

                <Button className="w-full" disabled={!canConnect} onClick={begin}>
                  Connect my carrier
                </Button>
                <p className="text-xs text-muted-foreground">
                  ≈30 seconds. We validate, find your numbers, build the trunk, attach, and place a
                  real test call — pausing only when we genuinely need you. Works with numbers you
                  already own; Agora doesn&apos;t sell or port numbers.
                </p>
              </>
            ) : (
              /* ── The staged log: facts above, the one live moment below ── */
              <>
                <div role="log" aria-label="Connection progress" className="space-y-1">
                  {log.map((line) => (
                    <LogRow key={line.id} line={line} />
                  ))}

                  {machine.t === "stage" && (
                    <div className="flex items-start gap-2 font-mono text-xs leading-5 text-muted-foreground">
                      <span className="shrink-0 tabular-nums text-muted-foreground/70">{stamp()}</span>
                      <Loader2 className="mt-1 h-3 w-3 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
                      <span>{machine.text}</span>
                    </div>
                  )}
                </div>

                {/* ── Pauses & interrupts render IN PLACE, under the intact log ── */}

                {machine.t === "pick" && (
                  <NumberPicker onChoose={choose} conflictE164={conflictRef.current} />
                )}

                {machine.t === "auto-picked" && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">
                      Continuing with{" "}
                      <span className="font-mono tabular-nums text-foreground">{machine.number.e164}</span>{" "}
                      in a moment…
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        clearPending()
                        push("note", "Auto-pick undone — your choice instead")
                        setMachine({ t: "pick" })
                      }}
                    >
                      <Undo2 className="h-3.5 w-3.5" /> Choose a different number
                    </Button>
                  </div>
                )}

                {machine.t === "confirm-overwrite" && (
                  <StateBanner tone="warning" icon={PhoneForwarded}>
                    <p className="text-sm font-medium">
                      {machine.number.e164} already routes somewhere at {provider.label}.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Attaching it here replaces that voice routing — {provider.label} does this
                      silently, so we&apos;re asking out loud. Calls to this number would reach your
                      agent instead of wherever they go today. Decline and nothing changes.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          push("note", "Replacing the existing routing — confirmed by you")
                          runAssociate(machine.number, true)
                        }}
                      >
                        Replace routing and attach
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          push("note", "Kept as-is — no routing was changed")
                          setMachine({ t: "declined", number: machine.number })
                        }}
                      >
                        Keep it as-is
                      </Button>
                    </div>
                  </StateBanner>
                )}

                {machine.t === "declined" && (
                  <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <p className="text-sm font-medium">Nothing changed.</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono tabular-nums">{machine.number.e164}</span> keeps its
                      current routing. The trunk we created sits idle until a number is attached —
                      pick a different one, or come back anytime.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" onClick={() => setMachine({ t: "pick" })}>
                        Choose a different number
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}

                {machine.t === "failed" && machine.failure === "bad-creds" && (
                  <StateBanner tone="destructive" icon={KeyRound}>
                    <p className="text-sm font-medium">
                      Those credentials didn&apos;t work — {provider.label} said 401.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The values don&apos;t match an active {provider.label} account. The real pair
                      lives at {links.credWhere}. If they look right, check whether the account is
                      suspended. Nothing was created or changed — no trunk, no routing, nothing to
                      clean up.
                    </p>
                    <div className="mt-2 space-y-2">
                      <CredFields
                        meta={meta}
                        keyId={keyId}
                        keySecret={keySecret}
                        onKeyId={setKeyId}
                        onKeySecret={setKeySecret}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" disabled={!canConnect} onClick={() => retryStage("credentials")}>
                          Retry validation
                        </Button>
                        <CarrierLink href={links.consoleHome} label={`Open ${provider.label} Console`} />
                      </div>
                    </div>
                  </StateBanner>
                )}

                {machine.t === "failed" && machine.failure === "no-numbers" && (
                  <StateBanner tone="warning" icon={PhoneOff}>
                    <p className="text-sm font-medium">
                      Your {provider.label} account has 0 phone numbers.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Agora doesn&apos;t sell numbers, so there&apos;s nothing to auto-buy — pick one
                      up at {provider.label} (about a minute), then rerun this step. We stopped
                      before creating a trunk; an empty account gets nothing half-built.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <CarrierLink href={links.buyNumber} label={`Buy a number at ${provider.label}`} primary />
                      <Button size="sm" variant="outline" onClick={() => retryStage("enumerate")}>
                        I&apos;ve got one — look again
                      </Button>
                    </div>
                  </StateBanner>
                )}

                {machine.t === "failed" && machine.failure === "geo-blocked" && (
                  <StateBanner tone="destructive" icon={Globe}>
                    <p className="text-sm font-medium">
                      {provider.label} blocked the attach — error 32205, geographic permissions.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your account&apos;s {links.geoLabel} don&apos;t cover this number&apos;s
                      region. Enable the region at {provider.label}, then retry — only this step
                      re-runs. The trunk and every ✓ above stay done.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <CarrierLink href={links.geoPermissions} label={`Open ${links.geoLabel}`} primary />
                      <Button size="sm" variant="outline" onClick={() => retryStage("associate")}>
                        Retry the attach
                      </Button>
                    </div>
                  </StateBanner>
                )}

                {machine.t === "failed" && machine.failure === "verify-fail" && (
                  <StateBanner tone="destructive" icon={PhoneMissed}>
                    <p className="text-sm font-medium">
                      Provisioned, yes. Connecting, no — the test call didn&apos;t go through.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The trunk, routing, and number all exist — that&apos;s configuration. A call
                      that connects is the only proof, and this one rang out. {provider.label}&apos;s
                      own call logs usually name the reason first — origination-URI typos and
                      carrier-side blocks show up there before anywhere else.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CarrierLink href={links.callLogs} label={`Open ${provider.label} call logs`} primary />
                      <Button size="sm" variant="outline" onClick={() => retryStage("verify")}>
                        Retry the test call
                      </Button>
                      <Button variant="link" className="h-auto p-0 text-xs" onClick={openManualForm}>
                        Set up manually instead
                      </Button>
                    </div>
                  </StateBanner>
                )}

                {machine.t === "test-ready" && (
                  <StateBanner tone="primary" icon={Phone}>
                    <p className="text-sm font-medium">Everything&apos;s provisioned. Now the real test.</p>
                    <p className="text-xs text-muted-foreground">
                      Provisioning success isn&apos;t call success. This places a live call to{" "}
                      <span className="font-mono tabular-nums">{machine.number.e164}</span> and
                      connects it right here — free, about ten seconds.
                    </p>
                    <div className="mt-2">
                      <Button size="sm" className="gap-1.5" onClick={() => placeTestCall(machine.number)}>
                        <Phone className="h-3.5 w-3.5" /> Call {machine.number.e164}
                      </Button>
                    </div>
                  </StateBanner>
                )}

                {machine.t === "success" && (
                  <div className="space-y-4">
                    <StateBanner tone="success" icon={CheckCircle2}>
                      <p className="text-sm font-medium">
                        Live — a real call just connected through {machine.number.e164}.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Trunk sip:{TRUNK_NAME}.{links.trunkHost} · answered in 2.1s · two-way audio
                        confirmed.
                      </p>
                    </StateBanner>

                    {/* R7 — masked, timestamped, and honest about what disconnect does */}
                    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm font-medium">
                          {provider.label} · {credLabel}{" "}
                          <span className="font-mono tabular-nums">····{last4}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Connected{" "}
                          {(connectedAt ?? new Date()).toLocaleString(undefined, {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Disconnect removes this key from Agora only — it stays active at{" "}
                          {provider.label} until you revoke it there.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toast(
                            `Key removed from Agora. It is still active at ${provider.label} — revoke it there if you no longer need it.`,
                          )
                        }
                      >
                        Disconnect
                      </Button>
                    </div>

                    {/* Same route cards the manual sheet ends on — one shared exit */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Put {machine.number.e164} to work</p>
                      <RouteCard
                        icon={PhoneIncoming}
                        title="Set up inbound"
                        desc="Route incoming calls to an agent."
                        onClick={() => {
                          setOpen(false)
                          router.push("/deploy/inbound/new")
                        }}
                      />
                      <RouteCard
                        icon={Megaphone}
                        title="Create a campaign"
                        desc="Use this number for outbound campaigns."
                        onClick={() => {
                          setOpen(false)
                          router.push("/deploy/batch-calls/new")
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* R8 — the manual fallback is quiet but ALWAYS reachable, every phase */}
          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Your number, your carrier — Agora never buys numbers for you.
            </p>
            {machine.t === "success" ? (
              <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
            ) : (
              <Button variant="link" className="h-auto shrink-0 p-0 text-xs" onClick={openManualForm}>
                Prefer the manual SIP form?
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// ─── Module-level pieces (never defined inside the component) ─────────────────

const TONE_STYLE: Record<LogLine["tone"], { glyph: string; glyphCls: string; textCls: string }> = {
  done: { glyph: "✓", glyphCls: "text-success", textCls: "text-foreground" },
  fail: { glyph: "✗", glyphCls: "text-destructive", textCls: "text-destructive" },
  pause: { glyph: "→", glyphCls: "text-warning", textCls: "text-warning" },
  note: { glyph: "·", glyphCls: "text-muted-foreground", textCls: "text-muted-foreground" },
}

function LogRow({ line }: { line: LogLine }) {
  const s = TONE_STYLE[line.tone]
  return (
    <div className="flex items-start gap-2 font-mono text-xs leading-5">
      <span className="shrink-0 tabular-nums text-muted-foreground/70">{line.time}</span>
      <span aria-hidden="true" className={cn("w-3 shrink-0 text-center", s.glyphCls)}>
        {s.glyph}
      </span>
      <span className={cn("min-w-0 tabular-nums", s.textCls)}>{line.text}</span>
    </div>
  )
}

/** The picker moment — capability badges BEFORE selection (R3, ElevenLabs parity). */
function NumberPicker({
  onChoose,
  conflictE164,
}: {
  onChoose: (n: MockNumber) => void
  conflictE164: string | null
}) {
  const viable = MOCK_NUMBERS.filter((n) => n.capability === "inbound+outbound")
  return (
    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
      <p className="text-sm font-medium">
        {viable.length} numbers can take calls — which one goes live?
      </p>
      <p className="text-xs text-muted-foreground">
        Outbound-only caller IDs can place calls but never receive them, so they can&apos;t front
        this trunk.
      </p>
      {MOCK_NUMBERS.map((n) =>
        n.capability === "inbound+outbound" ? (
          <button
            key={n.e164}
            type="button"
            onClick={() => onChoose(n)}
            className="group flex w-full flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left transition-all hover:border-primary/40 hover:shadow-sm focus-visible:border-primary/40"
          >
            <span className="font-mono text-sm tabular-nums">{n.e164}</span>
            <Badge variant="secondary" className="text-xs">Inbound + outbound</Badge>
            <span className="text-xs text-muted-foreground">{n.label}</span>
            {conflictE164 === n.e164 && (
              <span className="text-xs text-warning">currently routed elsewhere — attaching replaces it</span>
            )}
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </button>
        ) : (
          // Visible but not selectable — the capability explains itself instead
          // of silently hiding the number the user knows they own.
          <div
            key={n.e164}
            className="flex w-full flex-wrap items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 opacity-70"
          >
            <span className="font-mono text-sm tabular-nums text-muted-foreground">{n.e164}</span>
            <Badge variant="outline" className="text-xs">Outbound-only</Badge>
            <span className="text-xs text-muted-foreground">
              {n.label} — can&apos;t receive calls
            </span>
          </div>
        ),
      )}
    </div>
  )
}

/** Credential pair — shared by the form and the 401 interrupt so retry edits in place. */
function CredFields({
  meta,
  keyId,
  keySecret,
  onKeyId,
  onKeySecret,
}: {
  meta: ReturnType<typeof credFieldMeta>
  keyId: string
  keySecret: string
  onKeyId: (v: string) => void
  onKeySecret: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      {meta.id && (
        <div className="space-y-1.5">
          <Label>{meta.id.label}</Label>
          <Input
            value={keyId}
            onChange={(e) => onKeyId(e.target.value)}
            placeholder={meta.id.placeholder}
            className="font-mono text-sm"
            autoComplete="off"
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>{meta.secret.label}</Label>
        <Input
          type="password"
          value={keySecret}
          onChange={(e) => onKeySecret(e.target.value)}
          placeholder={meta.secret.placeholder}
          className="font-mono text-sm"
          autoComplete="off"
        />
      </div>
    </div>
  )
}

/** Outbound deep link to the carrier — every failure names its fix and links it (R5). */
function CarrierLink({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  return (
    <Button size="sm" variant={primary ? "default" : "outline"} asChild>
      <a href={href} target="_blank" rel="noreferrer" className="gap-1.5">
        {label} <ExternalLink className="h-3 w-3" />
      </a>
    </Button>
  )
}

/** Same shape as the manual sheet's success route cards — one shared exit idiom. */
function RouteCard({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm focus-visible:border-primary/40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
    </button>
  )
}
