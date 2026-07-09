"use client"

// Variant 4 · "Provider-first honesty" (itsp-lab — THROWAWAY, judged then folded).
//
// The entry is a menu of three doors that each price themselves BEFORE the
// user opens them: how many fields, how many minutes, and who does the work.
// Why: the friction being deleted hides its cost — Retell buries 5 manual
// steps across two consoles, Vapi 9 (two of them raw API calls). Naming the
// cost up front is the pattern under test. Each card also carries the truth
// line for what we never do: Agora sells no numbers (R8).
//
// Contract: ./spec.ts (R1–R8). The `scenario` prop decides where the mock
// run fails; retry re-runs ONLY the failed stage (R2) and — mock convention —
// succeeds, as if the user made the named carrier-side fix.

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AddPhoneNumberSheet } from "@/components/add-phone-number-sheet"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Megaphone,
  PhoneCall,
  PhoneIncoming,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { MOCK_NUMBERS } from "./spec"
import type { ItspVariantProps } from "./spec"

/* ────────────────────────────── stage machine ────────────────────────────── */

const STAGES = ["credentials", "enumerate", "create", "associate", "verify"] as const
type StageId = (typeof STAGES)[number]
// "action" = the machine pauses for the user: number pick (R3) or the
// pre-overwrite consent gate (R4). Neither is a failure.
type StageStatus = "pending" | "running" | "done" | "failed" | "action"

const INITIAL_STAGES: Record<StageId, StageStatus> = {
  credentials: "pending",
  enumerate: "pending",
  create: "pending",
  associate: "pending",
  verify: "pending",
}

// Mock latencies — long enough that the honest narration is readable,
// short enough that a judge isn't waiting. Verify is longest: a real call.
const DURATION: Record<StageId, number> = {
  credentials: 900,
  enumerate: 1100,
  create: 1300,
  associate: 900,
  verify: 1900,
}

/* ─────────────────────────── provider metadata ───────────────────────────── */

type ProviderId = "twilio" | "telnyx"
type CredMode = "scoped" | "token"

type CredField = { id: string; label: string; placeholder: string; secret?: boolean; mono?: boolean }

const PROVIDER_META: Record<
  ProviderId,
  {
    label: string
    initial: string
    time: string
    // The honest-menu headline — exactly what the door costs.
    cost: string
    steps: string[]
    trunkNoun: string
    trunkName: string
    credsUrl: string
    credsPath: string
    buyUrl: string
    buyPath: string
    geoUrl: string
    geoPath: string
    logsUrl: string
    logsPath: string
    hasScopedChoice: boolean
  }
> = {
  twilio: {
    label: "Twilio",
    initial: "Tw",
    time: "~1 min",
    cost: "4 fields · ~1 minute · we configure the trunk",
    steps: [
      "You: a label + credentials (4 fields)",
      "You: pick which of your numbers",
      "We: validate · create the trunk · attach",
      "Ends on a real test call — not a checkmark",
    ],
    trunkNoun: "SIP trunk",
    trunkName: "agora-trunk-7f3a",
    credsUrl: "https://console.twilio.com/us1/account/keys-credentials/api-keys",
    credsPath: "Twilio Console → Account → API keys & tokens",
    buyUrl: "https://console.twilio.com/us1/develop/phone-numbers/manage/search",
    buyPath: "Twilio Console → Phone Numbers → Buy a number",
    geoUrl: "https://console.twilio.com/us1/develop/voice/settings/geo-permissions",
    geoPath: "Twilio Console → Voice → Settings → Geo permissions",
    logsUrl: "https://console.twilio.com/us1/monitor/logs/calls",
    logsPath: "Twilio Console → Monitor → Logs → Calls",
    hasScopedChoice: true,
  },
  telnyx: {
    label: "Telnyx",
    initial: "Tx",
    time: "~1 min",
    cost: "1 API key · ~1 minute · we configure the connection",
    steps: [
      "You: a label + 1 API key",
      "You: pick which of your numbers",
      "We: validate · create the connection · attach",
      "Ends on a real test call — not a checkmark",
    ],
    trunkNoun: "FQDN connection",
    trunkName: "agora-conn-7f3a",
    credsUrl: "https://portal.telnyx.com/#/app/api-keys",
    credsPath: "Telnyx Mission Control → Account → API Keys",
    buyUrl: "https://portal.telnyx.com/#/app/numbers/search-numbers",
    buyPath: "Mission Control → Numbers → Search & Buy",
    geoUrl: "https://portal.telnyx.com/#/app/outbound-profiles",
    geoPath: "Mission Control → Voice → Outbound profiles → Allowed destinations",
    logsUrl: "https://portal.telnyx.com/#/app/reporting/debugging",
    logsPath: "Mission Control → Reporting → Debugging",
    hasScopedChoice: false,
  },
}

// R1: ≤4 inputs before automation starts. Scoped key needs the parent Account
// SID for REST scoping, so worst case = 4 — which is what the card advertises.
const CRED_FIELDS: Record<ProviderId, Record<CredMode, CredField[]>> = {
  twilio: {
    scoped: [
      { id: "label", label: "Label", placeholder: "e.g. Support line · Twilio prod" },
      { id: "accountSid", label: "Account SID", placeholder: "AC…", mono: true },
      { id: "keySid", label: "API key SID", placeholder: "SK…", mono: true },
      { id: "keySecret", label: "API key secret", placeholder: "Shown once at creation — paste it here", secret: true, mono: true },
    ],
    token: [
      { id: "label", label: "Label", placeholder: "e.g. Support line · Twilio prod" },
      { id: "accountSid", label: "Account SID", placeholder: "AC…", mono: true },
      { id: "authToken", label: "Auth Token", placeholder: "Your account's master token", secret: true, mono: true },
    ],
  },
  telnyx: {
    // Telnyx has one credential shape; the mode toggle never renders for it.
    scoped: [
      { id: "label", label: "Label", placeholder: "e.g. Sales line · Telnyx prod" },
      { id: "apiKey", label: "API key", placeholder: "KEY…", secret: true, mono: true },
    ],
    token: [],
  },
}

// R7: stored credentials mask to last 4.
const maskTail = (v: string) => `•••• ${v.trim().slice(-4) || "————"}`

/* ─────────────────────────────── component ───────────────────────────────── */

export function Variant4({ scenario }: ItspVariantProps) {
  const [phase, setPhase] = React.useState<"menu" | "flow">("menu")
  const [provider, setProvider] = React.useState<ProviderId>("twilio")
  const [credMode, setCredMode] = React.useState<CredMode>("scoped")
  const [fields, setFields] = React.useState<Record<string, string>>({})
  const [stages, setStages] = React.useState(INITIAL_STAGES)
  const [numbers, setNumbers] = React.useState<typeof MOCK_NUMBERS | null>(null)
  const [selected, setSelected] = React.useState<string | null>(null)
  const [overwriteOk, setOverwriteOk] = React.useState(false)
  const [declined, setDeclined] = React.useState<string | null>(null)
  const [connectedAt, setConnectedAt] = React.useState<string | null>(null)
  const [finished, setFinished] = React.useState(false)

  // Stages whose failure has been shown once — the next retry of ONLY that
  // stage succeeds (mock stand-in for "you made the carrier-side fix").
  const recoveredRef = React.useRef<Set<StageId>>(new Set())
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scenario switch = a fresh run. Reset during render (React's
  // adjust-state-on-prop-change pattern) so no stale frame flashes.
  const [seenScenario, setSeenScenario] = React.useState(scenario.id)
  if (seenScenario !== scenario.id) {
    setSeenScenario(scenario.id)
    setPhase("menu")
    setProvider("twilio")
    setCredMode("scoped")
    setFields({})
    setStages(INITIAL_STAGES)
    setNumbers(null)
    setSelected(null)
    setOverwriteOk(false)
    setDeclined(null)
    setConnectedAt(null)
    setFinished(false)
    recoveredRef.current = new Set()
  }

  // Kill any in-flight mock timer when the scenario changes or on unmount.
  React.useEffect(() => {
    const ref = timerRef
    return () => {
      if (ref.current) clearTimeout(ref.current)
    }
  }, [scenario.id])

  const meta = PROVIDER_META[provider]
  const activeFields = CRED_FIELDS[provider][meta.hasScopedChoice ? credMode : "scoped"]
  const canConnect = activeFields.every((f) => (fields[f.id] ?? "").trim().length > 0)
  const started = stages.credentials !== "pending"
  const keyFieldId = provider === "telnyx" ? "apiKey" : credMode === "scoped" ? "keySid" : "accountSid"
  const masked = maskTail(fields[keyFieldId] ?? "")

  /* ── machine ── */

  const schedule = (ms: number, fn: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fn, ms)
  }

  function startStage(stage: StageId) {
    setStages((s) => ({ ...s, [stage]: "running" }))
    schedule(DURATION[stage], () => settleStage(stage))
  }

  function settleStage(stage: StageId) {
    // "on-other-trunk" is not an API failure — it's the consent gate handled
    // pre-run in gateOrAssociate(). Everything else fails once, then recovers.
    const failsHere =
      scenario.failAt === stage &&
      scenario.failure !== "on-other-trunk" &&
      !recoveredRef.current.has(stage)
    if (failsHere) {
      recoveredRef.current.add(stage)
      setStages((s) => ({ ...s, [stage]: "failed" }))
      return
    }
    switch (stage) {
      case "credentials":
        setConnectedAt(new Date().toLocaleTimeString())
        setStages((s) => ({ ...s, credentials: "done" }))
        startStage("enumerate")
        break
      case "enumerate":
        // R3: capabilities surface BEFORE selection; nothing is created yet.
        setNumbers(MOCK_NUMBERS)
        setStages((s) => ({ ...s, enumerate: "action" }))
        break
      case "create":
        setStages((s) => ({ ...s, create: "done" }))
        gateOrAssociate(false)
        break
      case "associate":
        setStages((s) => ({ ...s, associate: "done" }))
        startStage("verify")
        break
      case "verify":
        setStages((s) => ({ ...s, verify: "done" }))
        setFinished(true)
        break
    }
  }

  // R4: association silently overwrites existing voice routing — so we never
  // run it without explicit consent when the number is already routed.
  function gateOrAssociate(confirmedNow: boolean) {
    if (scenario.failure === "on-other-trunk" && !confirmedNow && !overwriteOk) {
      setStages((s) => ({ ...s, associate: "action" }))
    } else {
      startStage("associate")
    }
  }

  function handleAttach() {
    if (!selected) return
    setDeclined(null)
    setStages((s) => ({ ...s, enumerate: "done" }))
    // After a declined overwrite the trunk already exists — honest machines
    // don't re-create it; we jump straight back to the gate.
    if (stages.create === "done") gateOrAssociate(overwriteOk)
    else startStage("create")
  }

  function confirmOverwrite() {
    setOverwriteOk(true)
    startStage("associate")
  }

  // T3 decline: everything stays untouched — back to the picker, calmly.
  function declineOverwrite() {
    setDeclined(selected)
    setStages((s) => ({ ...s, associate: "pending", enumerate: "action" }))
  }

  // R7: disconnect removes the key from Agora only — copy says so below.
  function disconnect() {
    if (timerRef.current) clearTimeout(timerRef.current)
    recoveredRef.current = new Set()
    setStages(INITIAL_STAGES)
    setNumbers(null)
    setSelected(null)
    setOverwriteOk(false)
    setDeclined(null)
    setConnectedAt(null)
    setFinished(false)
  }

  function backToMenu() {
    disconnect()
    setFields({})
    setPhase("menu")
  }

  /* ── entry: the honest menu ── */

  if (phase === "menu") {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div>
          <h2 className="text-base font-semibold">Bring your number live</h2>
          <p className="text-sm text-muted-foreground">
            Three doors. Each one tells you its price before you open it.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <DoorCard
            initial={PROVIDER_META.twilio.initial}
            name="Twilio"
            time={PROVIDER_META.twilio.time}
            cost={PROVIDER_META.twilio.cost}
            steps={PROVIDER_META.twilio.steps}
            truth="You bring the number — we never buy one for you."
            cta="Connect Twilio"
            onClick={() => {
              setProvider("twilio")
              setPhase("flow")
            }}
          />
          <DoorCard
            initial={PROVIDER_META.telnyx.initial}
            name="Telnyx"
            time={PROVIDER_META.telnyx.time}
            cost={PROVIDER_META.telnyx.cost}
            steps={PROVIDER_META.telnyx.steps}
            truth="You bring the number — we never buy one for you."
            cta="Connect Telnyx"
            onClick={() => {
              setProvider("telnyx")
              setPhase("flow")
            }}
          />
          {/* R8: the manual door reuses the existing sheet — not rebuilt here. */}
          <AddPhoneNumberSheet>
            <DoorCard
              initial="SIP"
              name="Other carrier"
              time="~10 min"
              cost="Manual SIP form · ~10 minutes · 6 fields"
              steps={[
                "You: number, domain, auth — 6 fields",
                "You: also configure the trunk at your carrier",
                "We: store the routing you typed",
                "No automated test call — you verify yourself",
              ]}
              truth="Your carrier, your number, your trunk config."
              cta="Open the form"
            />
          </AddPhoneNumberSheet>
        </div>

        <p className="text-xs text-muted-foreground">
          Agora doesn&apos;t sell or port phone numbers — every door attaches a number you
          already own at your carrier. Nothing here purchases anything.
        </p>
      </div>
    )
  }

  /* ── provider flow ── */

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 gap-1" onClick={backToMenu}>
          <ArrowLeft className="h-3.5 w-3.5" />
          All providers
        </Button>
      </div>

      <div>
        <h2 className="text-base font-semibold">{meta.label} — bring a number live</h2>
        <p className="text-sm text-muted-foreground">
          {meta.cost}. The number stays owned at {meta.label}; we only route it.
        </p>
      </div>

      {/* Credentials: the only typing the user does (R1). */}
      <Card>
        <CardContent className="space-y-4 p-4">
          {stages.credentials === "done" ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <KeyRound className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-medium tabular-nums">{masked}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Validated {connectedAt}
                      {meta.hasScopedChoice
                        ? credMode === "scoped"
                          ? " · scoped API key"
                          : " · account auth token"
                        : " · API key"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
              {/* R7: disconnect ≠ revocation — say it where the button lives. */}
              <p className="text-xs text-muted-foreground">
                Disconnect removes this key from Agora only. It stays valid at {meta.label} until
                you revoke it there.
              </p>
            </>
          ) : (
            <>
              {meta.hasScopedChoice && (
                <div className="space-y-2">
                  <Label>Credential type</Label>
                  {/* R1: scoped key is the preferred, pre-selected path. */}
                  <CredModeOption
                    active={credMode === "scoped"}
                    icon={ShieldCheck}
                    title="Scoped API key"
                    badge="Recommended"
                    body={`Limited to what this flow needs — revoke it at ${meta.label} any time without touching anything else.`}
                    onClick={() => setCredMode("scoped")}
                  />
                  <CredModeOption
                    active={credMode === "token"}
                    icon={KeyRound}
                    title="Account SID + Auth Token"
                    body="Works, but it's the master credential for your whole account — less secure. Prefer a scoped key."
                    onClick={() => setCredMode("token")}
                  />
                </div>
              )}

              {/* Sequential paste-work stacks top-to-bottom, never columns. */}
              <div className="space-y-3">
                {activeFields.map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    <Label htmlFor={`v4-${f.id}`}>{f.label}</Label>
                    {f.secret ? (
                      <SecretInput
                        id={`v4-${f.id}`}
                        placeholder={f.placeholder}
                        value={fields[f.id] ?? ""}
                        onChange={(v) => setFields((s) => ({ ...s, [f.id]: v }))}
                      />
                    ) : (
                      <Input
                        id={`v4-${f.id}`}
                        placeholder={f.placeholder}
                        value={fields[f.id] ?? ""}
                        onChange={(e) => setFields((s) => ({ ...s, [f.id]: e.target.value }))}
                        className={cn(f.mono && "font-mono text-sm")}
                      />
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Find these at{" "}
                <a
                  href={meta.credsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  {meta.credsPath}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>

              {/* The connect button hands over after stage 1 starts; from then
                  on all actions live in the staged strip below. */}
              {!started && (
                <Button className="w-full" disabled={!canConnect} onClick={() => startStage("credentials")}>
                  Connect — validation runs first
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* The staged strip: honest narration, R2 retry semantics. */}
      {started && (
        <Card>
          <CardContent className="p-4">
            <ol className="space-y-1" aria-live="polite">
              {STAGES.map((stage, i) => {
                const status = stages[stage]
                return (
                  <li key={stage}>
                    <div className="flex items-center gap-2.5 py-1.5">
                      <StageIcon status={status} />
                      <span
                        className={cn(
                          "text-sm",
                          status === "pending" ? "text-muted-foreground" : "font-medium",
                        )}
                      >
                        {i + 1}. {stageTitle(stage, meta.trunkNoun)}
                      </span>
                      {status === "done" && (
                        <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                          {doneNote(stage, meta, selected)}
                        </span>
                      )}
                    </div>

                    {status === "running" && (
                      <p className="pb-1.5 pl-7 text-xs text-muted-foreground">
                        {runningNote(stage, meta, selected)}
                      </p>
                    )}

                    {/* R3: pick with capability badges before anything exists. */}
                    {stage === "enumerate" && status === "action" && numbers && (
                      <div className="space-y-2 pb-2 pl-7">
                        <p className="text-xs text-muted-foreground">
                          Capabilities first, so there&apos;s no surprise later — outbound-only
                          caller IDs can&apos;t receive calls, so they can&apos;t ride this{" "}
                          {meta.trunkNoun}.
                        </p>
                        {declined && (
                          <p className="text-xs text-muted-foreground">
                            Nothing changed — <span className="font-mono tabular-nums">{declined}</span>{" "}
                            keeps its current routing.
                          </p>
                        )}
                        {numbers.map((n) => {
                          const inbound = n.capability === "inbound+outbound"
                          return (
                            <button
                              key={n.e164}
                              type="button"
                              disabled={!inbound}
                              aria-pressed={selected === n.e164}
                              onClick={() => setSelected(n.e164)}
                              className={cn(
                                "flex w-full items-center gap-2.5 rounded-md border p-2.5 text-left transition-colors",
                                selected === n.e164
                                  ? "border-primary ring-1 ring-primary"
                                  : "border-border",
                                inbound
                                  ? "hover:border-foreground/30"
                                  : "cursor-not-allowed opacity-60",
                              )}
                            >
                              <span className="font-mono text-sm tabular-nums">{n.e164}</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs shrink-0",
                                  inbound
                                    ? "border-success/40 bg-success/10 text-success"
                                    : "border-warning/40 bg-warning/10 text-warning",
                                )}
                              >
                                {inbound ? "Inbound + outbound" : "Outbound only"}
                              </Badge>
                              <span className="ml-auto text-right text-xs text-muted-foreground">
                                {n.label}
                                {!inbound && " — can't receive calls"}
                              </span>
                            </button>
                          )
                        })}
                        <Button size="sm" disabled={!selected} onClick={handleAttach}>
                          Attach {selected ?? "a number"}
                        </Button>
                      </div>
                    )}

                    {/* R4: pre-overwrite consent — calm, symmetric choices. */}
                    {stage === "associate" && status === "action" && (
                      <div className="pb-2 pl-7">
                        <RecoveryCard
                          tone="warning"
                          title={`${selected} already routes somewhere`}
                        >
                          <p>
                            It&apos;s attached to <span className="font-medium">legacy-support-trunk</span>{" "}
                            today. Moving it here deletes that voice routing — future calls land on
                            Agora instead. A number points at exactly one trunk; this can&apos;t merge.
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button variant="outline" size="sm" onClick={declineOverwrite}>
                              Keep existing routing
                            </Button>
                            <Button size="sm" onClick={confirmOverwrite}>
                              Move it to this {meta.trunkNoun}
                            </Button>
                          </div>
                        </RecoveryCard>
                      </div>
                    )}

                    {/* R5: per-failure copy naming + linking the carrier-side fix. */}
                    {status === "failed" && (
                      <div className="pb-2 pl-7">
                        {stage === "credentials" && (
                          <RecoveryCard tone="destructive" title={`${meta.label} replied 401 — credentials rejected`} mockNote>
                            <p>
                              These values don&apos;t match an active account. Copy them fresh from{" "}
                              <CarrierLink href={meta.credsUrl} label={meta.credsPath} />, correct
                              the fields above, and retry. Nothing else happened — no numbers were
                              read, no {meta.trunkNoun} was created.
                            </p>
                            <div className="pt-1">
                              <Button size="sm" onClick={() => startStage("credentials")}>
                                Retry validation
                              </Button>
                            </div>
                          </RecoveryCard>
                        )}
                        {stage === "enumerate" && (
                          <RecoveryCard tone="destructive" title={`No voice numbers on this ${meta.label} account`} mockNote>
                            <p>
                              Agora doesn&apos;t sell numbers, so there&apos;s nothing to attach yet. Buy
                              one at <CarrierLink href={meta.buyUrl} label={meta.buyPath} />, then
                              re-check. We won&apos;t create a {meta.trunkNoun} against an empty
                              account.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button variant="outline" size="sm" asChild>
                                <a href={meta.buyUrl} target="_blank" rel="noreferrer">
                                  Buy at {meta.label}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                              <Button size="sm" onClick={() => startStage("enumerate")}>
                                Re-check numbers
                              </Button>
                            </div>
                          </RecoveryCard>
                        )}
                        {stage === "associate" && (
                          <RecoveryCard tone="destructive" title="Carrier blocked the attach — geo permissions" mockNote>
                            <p>
                              {meta.label} refused to route this number&apos;s region
                              {provider === "twilio" && (
                                <span className="font-mono tabular-nums"> (error 32205)</span>
                              )}
                              . Enable it at <CarrierLink href={meta.geoUrl} label={meta.geoPath} />,
                              then retry. Steps 1–3 are done and stay done — retry re-runs only this
                              step.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button variant="outline" size="sm" asChild>
                                <a href={meta.geoUrl} target="_blank" rel="noreferrer">
                                  Open geo permissions
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                              <Button size="sm" onClick={() => startStage("associate")}>
                                Retry this step
                              </Button>
                            </div>
                          </RecoveryCard>
                        )}
                        {stage === "verify" && (
                          <RecoveryCard tone="destructive" title="Provisioned — but the test call didn't connect" mockNote>
                            <p>
                              The {meta.trunkNoun}, routing, and number attachment all exist. A
                              working call is a different fact, and it hasn&apos;t happened yet.{" "}
                              {meta.label}&apos;s own logs show the carrier&apos;s view:{" "}
                              <CarrierLink href={meta.logsUrl} label={meta.logsPath} />.
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <Button size="sm" onClick={() => startStage("verify")}>
                                Retry test call
                              </Button>
                              {/* R8: manual fallback reachable at the worst moment. */}
                              <AddPhoneNumberSheet>
                                <Button variant="ghost" size="sm">
                                  Set up manually instead
                                </Button>
                              </AddPhoneNumberSheet>
                            </div>
                          </RecoveryCard>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* R6: the flow ends on a connected call — never a "saved" checkmark. */}
      {finished && (
        <Card className="border-success/40">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-success/10">
                <PhoneCall className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Test call connected — <span className="font-mono tabular-nums">{selected}</span> is live
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  A real call rang through {meta.trunkName} and was answered with audio both ways.
                  That&apos;s the finish line — not a settings checkmark.
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <SummaryRow label="Number" value={selected ?? ""} mono />
              <SummaryRow label="Provider" value={meta.label} />
              <SummaryRow label={cap(meta.trunkNoun)} value={meta.trunkName} mono />
              <SummaryRow label="Credential" value={`${masked} · validated ${connectedAt ?? ""}`} mono />
            </div>
            <p className="text-xs text-muted-foreground">
              Disconnecting later removes the credential from Agora only — revoke it at{" "}
              {meta.label} to kill it.
            </p>

            <Separator />

            {/* Same route cards the manual sheet ends on — one success grammar. */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Put it to work</p>
              <LinkRouteCard
                icon={PhoneIncoming}
                title="Set up inbound"
                desc="Route incoming calls on this number to an agent."
                href="/deploy/inbound/new"
              />
              <LinkRouteCard
                icon={Megaphone}
                title="Create a campaign"
                desc="Use this number as the caller ID for outbound batch calls."
                href="/deploy/batch-calls/new"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* R8: the manual door stays reachable from inside the automated one. */}
      {!finished && (
        <p className="text-xs text-muted-foreground">
          Prefer to wire SIP yourself?{" "}
          <AddPhoneNumberSheet>
            <button type="button" className="text-primary hover:underline">
              Use the manual form (6 fields)
            </button>
          </AddPhoneNumberSheet>
        </p>
      )}
    </div>
  )
}

/* ───────────────────────────── copy helpers ─────────────────────────────── */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function stageTitle(stage: StageId, trunkNoun: string) {
  switch (stage) {
    case "credentials":
      return "Validate credentials"
    case "enumerate":
      return "Find your numbers"
    case "create":
      return `Create the ${trunkNoun}`
    case "associate":
      return "Attach the number"
    case "verify":
      return "Verify with a real test call"
  }
}

// Honest narration: each running stage names plausible work, and verify says
// out loud that provisioning success ≠ call success.
function runningNote(stage: StageId, meta: (typeof PROVIDER_META)[ProviderId], selected: string | null) {
  switch (stage) {
    case "credentials":
      return `Checking the key against ${meta.label}'s API — read-only, nothing is created yet.`
    case "enumerate":
      return "Listing voice-capable numbers on the account…"
    case "create":
      return `Creating ${meta.trunkNoun} ${meta.trunkName} and pointing its origination at Agora's SIP edge…`
    case "associate":
      return `Attaching ${selected ?? "the number"} to ${meta.trunkName}…`
    case "verify":
      return `Placing a live call to ${selected ?? "the number"} through the new ${meta.trunkNoun} — provisioning success ≠ call success.`
  }
}

function doneNote(stage: StageId, meta: (typeof PROVIDER_META)[ProviderId], selected: string | null) {
  switch (stage) {
    case "credentials":
      return "accepted"
    case "enumerate":
      return selected ?? `${MOCK_NUMBERS.length} found`
    case "create":
      return meta.trunkName
    case "associate":
      return selected ?? ""
    case "verify":
      return "answered · 4 s"
  }
}

/* ─────────────────────────── leaf components ─────────────────────────────── */

// Module-level (never defined inside render) so rows don't remount per keystroke.

function StageIcon({ status }: { status: StageStatus }) {
  switch (status) {
    case "pending":
      return <CircleDashed className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    case "running":
      // Motion-gated: the spinner only spins when the user allows motion.
      return <Loader2 className="h-4 w-4 shrink-0 text-primary motion-safe:animate-spin" />
    case "done":
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
    case "failed":
      return <XCircle className="h-4 w-4 shrink-0 text-destructive" />
    case "action":
      return <CircleDot className="h-4 w-4 shrink-0 text-primary" />
  }
}

type DoorCardProps = {
  initial: string
  name: string
  time: string
  cost: string
  steps: string[]
  truth: string
  cta: string
} & React.ComponentPropsWithoutRef<"button">

// The honest-menu card: price tag (fields · minutes · who works) + the named
// steps + the never-do truth line — all readable before the door opens.
// Spreads button props so it can be a Radix SheetTrigger child (asChild).
function DoorCard({ initial, name, time, cost, steps, truth, cta, className, ...rest }: DoorCardProps) {
  return (
    <button
      type="button"
      className={cn(
        "group flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:shadow-sm focus-visible:border-primary/40",
        className,
      )}
      {...rest}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
          {initial}
        </div>
        <Badge variant="outline" className="shrink-0 text-xs tabular-nums">
          {time}
        </Badge>
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight">{name}</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{cost}</p>
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {steps.map((s) => (
          <li key={s} className="flex gap-1.5 leading-snug">
            <span aria-hidden className="text-foreground/50">
              ·
            </span>
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-auto space-y-2 pt-1">
        <p className="border-t border-border pt-2 text-xs leading-snug text-muted-foreground">{truth}</p>
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary">
          {cta}
          <ArrowRight className="h-3 w-3 motion-safe:transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  )
}

function CredModeOption({
  active,
  icon: Icon,
  title,
  badge,
  body,
  onClick,
}: {
  active: boolean
  icon: React.ComponentType<{ className?: string }>
  title: string
  badge?: string
  body: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "w-full rounded-md border p-3 text-left transition-colors",
        active ? "border-primary ring-1 ring-primary" : "border-border hover:border-foreground/30",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
        {badge && (
          <Badge variant="outline" className="border-success/40 bg-success/10 text-xs text-success">
            {badge}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{body}</p>
    </button>
  )
}

// Secrets stay type=password by default; reveal is per-field and deliberate.
function SecretInput({
  id,
  value,
  placeholder,
  onChange,
}: {
  id: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-9 font-mono text-sm"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide secret" : "Show secret"}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

// One shape for every recovery moment. warning = consent gate (calm, not
// scary); destructive = a stage actually failed.
function RecoveryCard({
  tone,
  title,
  children,
  mockNote,
}: {
  tone: "warning" | "destructive"
  title: string
  children: React.ReactNode
  mockNote?: boolean
}) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-md border p-3",
        tone === "warning" ? "border-warning/40 bg-warning/5" : "border-destructive/40 bg-destructive/5",
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      <div className="space-y-2 text-xs leading-snug text-muted-foreground">{children}</div>
      {mockNote && (
        <p className="text-xs italic text-muted-foreground/70">
          Mock: retrying assumes you made the carrier-side fix.
        </p>
      )}
    </div>
  )
}

function CarrierLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-0.5 text-primary hover:underline"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-right text-sm font-medium", mono && "font-mono tabular-nums")}>{value}</span>
    </div>
  )
}

// Link twin of the manual sheet's RouteCard — same grammar at both successes.
function LinkRouteCard({
  icon: Icon,
  title,
  desc,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  href: string
}) {
  return (
    <Link
      href={href}
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
    </Link>
  )
}
