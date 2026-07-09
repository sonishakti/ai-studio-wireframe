"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, Circle, CircleDashed,
  KeyRound, Loader2, Megaphone, Phone, PhoneIncoming, PhoneOutgoing, Wrench,
} from "lucide-react"
import {
  MOCK_NUMBERS, PROVIDERS, type ItspStage, type ItspVariantProps,
} from "./spec"

/**
 * Variant 1 · "Mode-toggle sheet" — ONE sheet, two modes.
 * ─────────────────────────────────────────────────────────────────────────
 * Quick connect (default): key → staged auto-provisioning, rendered as the
 * same honest staged-work idiom as provisioning-ceremony.tsx — every stage
 * names plausible backend work, failures name the carrier-side fix, retry
 * re-runs ONLY the failed stage (R2), and the flow ENDS on a real test call
 * (R6) — never on a "saved" checkmark, because provisioning ≠ a working call.
 * Manual SIP: a reference note only — the full form already exists in
 * components/add-phone-number-sheet.tsx and is NOT rebuilt here (R8).
 *
 * Honesty contract carried from spec.ts: Agora sells no numbers (the empty
 * state deep-links to the carrier, never to a buy-from-us flow); association
 * silently overwrites existing voice routing at the carrier, so we gate it
 * behind a calm explicit confirm (R4); stored credentials mask to last 4 and
 * disconnect ≠ carrier-side revocation (R7).
 */

type Mode = "quick" | "manual"
type ProviderId = (typeof PROVIDERS)[number]["id"]
type MockNumber = (typeof MOCK_NUMBERS)[number]
// The run is a linear stage machine with three interactive gates (pick a
// number, confirm the overwrite, place the test call) — gates are phases,
// not stages, so completed checkmarks never regress while the user decides.
type Phase =
  | "idle" | "running" | "pick" | "confirm" | "failed"
  | "call" | "ringing" | "connected" | "done"

const STAGE_IDS: ItspStage[] = ["credentials", "enumerate", "create", "associate", "verify"]
// ~1s per mocked stage — long enough to read each narration line, short
// enough that the whole happy path stays under the manual form's fill time.
const STAGE_MS = 1000
const BEAT_MS = 1200
const TRUNK_NAME = "TK-quick-4f2a"
const CONFLICT_TRUNK = "TK-legacy-support"

// Carrier-side fixes must be NAMED and LINKED (R5) — generic "check your
// provider settings" copy is exactly the friction this lab is deleting.
const CARRIER: Record<ProviderId, {
  name: string
  keysWhere: string
  keysUrl: string
  buyUrl: string
  geoWhere: string
  geoUrl: string
  logsUrl: string
}> = {
  twilio: {
    name: "Twilio",
    keysWhere: "Account → Keys & credentials → API keys",
    keysUrl: "https://console.twilio.com/us1/account/keys-credentials/api-keys",
    buyUrl: "https://console.twilio.com/us1/develop/phone-numbers/manage/search",
    geoWhere: "Voice → Settings → Geo permissions",
    geoUrl: "https://console.twilio.com/us1/develop/voice/settings/geo-permissions",
    logsUrl: "https://console.twilio.com/us1/monitor/logs/calls",
  },
  telnyx: {
    name: "Telnyx",
    keysWhere: "Account settings → Keys & credentials",
    keysUrl: "https://portal.telnyx.com/#/app/api-keys",
    buyUrl: "https://portal.telnyx.com/#/app/numbers/search-numbers",
    geoWhere: "Outbound voice profiles → Allowed destinations",
    geoUrl: "https://portal.telnyx.com/#/app/outbound-profiles",
    logsUrl: "https://portal.telnyx.com/#/app/reporting/debugging",
  },
}

export function Variant1({ scenario }: ItspVariantProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<Mode>("quick")
  const [provider, setProvider] = React.useState<ProviderId>("twilio")
  // Scoped key is the default credential path; SID+token is the disclosed,
  // explicitly less-secure fallback (R1) — opening one hides the other so
  // the input count never exceeds 4 before automation starts.
  const [twilioScoped, setTwilioScoped] = React.useState(true)
  const [form, setForm] = React.useState({
    label: "", keySid: "", keySecret: "", accountSid: "", authToken: "", telnyxKey: "",
  })
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [stageIdx, setStageIdx] = React.useState(0)
  const [selected, setSelected] = React.useState<MockNumber | null>(null)
  const [overwriteOk, setOverwriteOk] = React.useState(false)
  const [declined, setDeclined] = React.useState(false)
  // After one retry the mocked failure clears — so judges see the full
  // recovery loop (fix at carrier → retry ONLY this stage → continue).
  const [bypass, setBypass] = React.useState(false)
  const [connectedAt, setConnectedAt] = React.useState<string | null>(null)

  const resetRun = React.useCallback(() => {
    setPhase("idle")
    setStageIdx(0)
    setSelected(null)
    setOverwriteOk(false)
    setDeclined(false)
    setBypass(false)
    setConnectedAt(null)
  }, [])

  // Reset when the harness switches scenarios — render-time state adjustment
  // (react.dev "adjusting state when a prop changes"), no effect needed.
  const [seenScenario, setSeenScenario] = React.useState(scenario.id)
  if (seenScenario !== scenario.id) {
    setSeenScenario(scenario.id)
    setMode("quick")
    resetRun()
  }

  const carrier = CARRIER[provider]
  const conflict = scenario.failure === "on-other-trunk"
  const credsFailed = phase === "failed" && STAGE_IDS[stageIdx] === "credentials"

  const activeCred =
    provider === "telnyx" ? form.telnyxKey : twilioScoped ? form.keySecret : form.authToken
  const credKind =
    provider === "telnyx" ? "API key" : twilioScoped ? "Scoped key" : "Auth token"
  const credFilled =
    provider === "telnyx"
      ? form.telnyxKey.trim().length > 0
      : twilioScoped
        ? form.keySid.trim().length > 0 && form.keySecret.trim().length > 0
        : form.accountSid.trim().length > 0 && form.authToken.trim().length > 0
  const last4 = activeCred.trim().slice(-4) || "····"

  // ── Mock stage progression. Content progression (not decoration), so it
  // runs under reduced motion; only spin/pulse are motion-gated.
  React.useEffect(() => {
    if (phase === "running") {
      const t = window.setTimeout(() => {
        const id = STAGE_IDS[stageIdx]
        // on-other-trunk is NOT a stage failure — it's the confirm gate;
        // once confirmed, association genuinely succeeds.
        if (scenario.failAt === id && scenario.failure !== "on-other-trunk" && !bypass) {
          setPhase("failed")
          return
        }
        if (id === "credentials") {
          setStageIdx(1)
        } else if (id === "enumerate") {
          // Pause for the number pick — capability badges BEFORE selection (R3).
          setStageIdx(2)
          setPhase("pick")
        } else if (id === "create") {
          setStageIdx(3)
          // Pre-overwrite confirm fires BEFORE associate runs (R4) — the
          // carrier would overwrite silently; we ask first.
          if (conflict && !overwriteOk) setPhase("confirm")
        } else if (id === "associate") {
          // Never auto-run verify — the user places the real call (R6).
          setStageIdx(4)
          setPhase("call")
        }
      }, STAGE_MS)
      return () => window.clearTimeout(t)
    }
    if (phase === "ringing") {
      const t = window.setTimeout(() => {
        if (scenario.failure === "verify-fail" && !bypass) setPhase("failed")
        else setPhase("connected")
      }, BEAT_MS)
      return () => window.clearTimeout(t)
    }
    if (phase === "connected") {
      const t = window.setTimeout(() => {
        setStageIdx(5)
        setConnectedAt(
          new Date().toLocaleString(undefined, {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
          }),
        )
        setPhase("done")
      }, BEAT_MS)
      return () => window.clearTimeout(t)
    }
  }, [phase, stageIdx, bypass, overwriteOk, conflict, scenario])

  function pickNumber(n: MockNumber) {
    setSelected(n)
    setDeclined(false)
    // If create already ran (we came back via a declined confirm), skip
    // straight to the associate gate — done work stays done (R2 spirit).
    if (stageIdx >= 3 && conflict && !overwriteOk) setPhase("confirm")
    else setPhase("running")
  }

  function declineOverwrite() {
    // Declining changes NOTHING — the number's existing routing is untouched,
    // the trunk we created stays (visibly done), only the choice reopens.
    setSelected(null)
    setDeclined(true)
    setPhase("pick")
  }

  function retryStage() {
    setBypass(true)
    // Verify retries as a fresh call attempt; every other stage re-runs its
    // narration. Either way, ONLY the failed stage re-runs (R2).
    if (STAGE_IDS[stageIdx] === "verify") setPhase("ringing")
    else setPhase("running")
  }

  function stageVisual(i: number): "pending" | "active" | "done" | "failed" | "waiting" {
    if (phase === "failed" && i === stageIdx) return "failed"
    if (i < stageIdx) return "done"
    if (phase === "running" && i === stageIdx) return "active"
    if (i === 4 && (phase === "ringing" || phase === "connected")) return "active"
    if (i === 3 && phase === "confirm") return "waiting"
    if (i === 4 && phase === "call") return "waiting"
    return "pending"
  }

  // Stage narration — each line names plausible work (T0 must #2), and the
  // associate/verify lines absorb the picked number once it exists.
  const stages: { id: ItspStage; label: string; detail: string }[] = [
    {
      id: "credentials",
      label: "Validate credentials",
      detail: `Checking the ${credKind.toLowerCase()} against the ${carrier.name} API`,
    },
    {
      id: "enumerate",
      label: "Find your numbers",
      detail: stageIdx > 1 ? `${MOCK_NUMBERS.length} voice numbers found` : "Listing voice numbers on the account",
    },
    {
      id: "create",
      label: "Create trunk & routing",
      detail: `Trunk ${TRUNK_NAME}, origination URI, credential list`,
    },
    {
      id: "associate",
      label: selected ? `Attach ${selected.e164}` : "Attach the number",
      detail: "Points the number's voice routing at the new trunk",
    },
    {
      id: "verify",
      label: "Verify with a real call",
      detail: phase === "done" ? "Connected — audio both ways" : "Provisioning isn't proof — a call is",
    },
  ]

  // Credential fields render in two places (setup, and re-opened under a 401
  // so the fix reads top-to-bottom: failed stage → why → edit → retry) —
  // hoisted once so the two spots can't drift.
  const credentialFields =
    provider === "twilio" ? (
      <Collapsible
        open={!twilioScoped}
        onOpenChange={(o) => setTwilioScoped(!o)}
        className="space-y-3"
      >
        {twilioScoped && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="API key SID" required>
                <Input
                  placeholder="SK…"
                  value={form.keySid}
                  onChange={(e) => setForm({ ...form, keySid: e.target.value })}
                  className="font-mono text-sm"
                />
              </Field>
              <Field label="API key secret" required>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={form.keySecret}
                  onChange={(e) => setForm({ ...form, keySecret: e.target.value })}
                  className="font-mono text-sm"
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              <KeyRound className="mr-1 inline h-3 w-3 align-[-0.125em]" aria-hidden />
              Scoped to voice and revocable on its own — the safer credential.
              Create one under{" "}
              <a href={CARRIER.twilio.keysUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {CARRIER.twilio.keysWhere} ↗
              </a>
            </p>
          </div>
        )}
        {/* Less-secure fallback is disclosed, not hidden (R1) — opening it
            swaps the fields so the pre-automation input count stays ≤4. */}
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground">
            {twilioScoped ? "Use Account SID + Auth Token instead" : "Back to the scoped key (safer)"}
            <ChevronDown
              className={`h-3 w-3 motion-safe:transition-transform ${twilioScoped ? "" : "rotate-180"}`}
              aria-hidden
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Account SID" required>
              <Input
                placeholder="AC…"
                value={form.accountSid}
                onChange={(e) => setForm({ ...form, accountSid: e.target.value })}
                className="font-mono text-sm"
              />
            </Field>
            <Field label="Auth Token" required>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={form.authToken}
                onChange={(e) => setForm({ ...form, authToken: e.target.value })}
                className="font-mono text-sm"
              />
            </Field>
          </div>
          <p className="text-xs text-warning">
            The auth token grants full account access and can&apos;t be scoped —
            rotating it breaks every integration that uses it. Prefer a scoped
            API key when you can.
          </p>
        </CollapsibleContent>
      </Collapsible>
    ) : (
      <div className="space-y-3">
        <Field label="API key" required>
          <Input
            type="password"
            placeholder="KEY…"
            value={form.telnyxKey}
            onChange={(e) => setForm({ ...form, telnyxKey: e.target.value })}
            className="font-mono text-sm"
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          Create one under{" "}
          <a href={CARRIER.telnyx.keysUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {CARRIER.telnyx.keysWhere} ↗
          </a>
        </p>
      </div>
    )

  return (
    <div className="space-y-2">
      {/* Scenario context so the variant reads standalone in the lab grid */}
      <p className="text-xs text-muted-foreground">{scenario.label}</p>
      <Sheet
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) {
            resetRun()
            setMode("quick")
          }
        }}
      >
        <SheetTrigger asChild>
          <Button className="gap-2">
            <Phone className="h-4 w-4" aria-hidden />
            Connect a phone number
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full overflow-y-auto p-0 flex flex-col data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
          <SheetHeader className="px-5 py-4 border-b border-border">
            <SheetTitle>Connect a phone number</SheetTitle>
            {/* R8: never imply purchase — the user brings an owned number */}
            <SheetDescription>
              Bring a number you already own — Agora doesn&apos;t sell or port numbers.
            </SheetDescription>
          </SheetHeader>

          {/* Mode toggle stays visible in EVERY phase — the manual fallback
              must always be reachable (R8), including mid-run and on failure. */}
          <div className="px-5 py-3 border-b border-border">
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => { if (v) setMode(v as Mode) }}
              spacing={0}
              variant="outline"
              aria-label="Connection mode"
              className="w-full"
            >
              <ToggleGroupItem
                value="quick"
                className="h-8 flex-1 text-xs font-medium data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
              >
                Quick connect
              </ToggleGroupItem>
              <ToggleGroupItem
                value="manual"
                className="h-8 flex-1 text-xs font-medium data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
              >
                Manual SIP
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {mode === "manual" ? (
            /* Reference-only: the full manual form already ships in
               components/add-phone-number-sheet.tsx — rebuilding it here
               would fork the source of truth. */
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <Wrench className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">The full manual form stays available</p>
                  <p className="text-xs text-muted-foreground">
                    Number, vendor, SIP domain, username, password, transport — the
                    existing Add Phone Number sheet under Deploy → Phone Numbers.
                    Quick connect never replaces it; it&apos;s the fallback whenever your
                    carrier isn&apos;t supported here or automation can&apos;t reach it.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* ── Setup: ≤4 inputs before automation starts (R1) —
                    optional label + provider + one credential pair. */}
                {phase === "idle" && (
                  <div className="space-y-4">
                    <Field label="Label" hint="optional">
                      <Input
                        placeholder="Support line"
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                      />
                    </Field>
                    <Field label="Provider" required>
                      <ToggleGroup
                        type="single"
                        value={provider}
                        onValueChange={(v) => { if (v) setProvider(v as ProviderId) }}
                        variant="outline"
                        aria-label="Carrier"
                        className="w-full"
                      >
                        {PROVIDERS.map((p) => (
                          <ToggleGroupItem
                            key={p.id}
                            value={p.id}
                            className="h-auto flex-1 flex-col items-start gap-0.5 px-3 py-2 data-[state=on]:border-primary/50 data-[state=on]:bg-primary/5"
                          >
                            <span className="text-sm font-medium">{p.label}</span>
                            <span className="text-xs font-normal text-muted-foreground">
                              {p.id === "twilio" ? "Scoped key, or SID + token" : "API key"}
                            </span>
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </Field>
                    {credentialFields}
                  </div>
                )}

                {/* ── Compact credential summary while the run owns the sheet */}
                {phase !== "idle" && !credsFailed && (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
                    <span className="text-sm font-medium">{carrier.name}</span>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {credKind} ····{last4}
                    </span>
                  </div>
                )}

                {/* ── Staged narration — one polite live region for the whole
                    run, per the provisioning-ceremony idiom. */}
                {phase !== "idle" && (
                  <div role="status" aria-live="polite" className="space-y-4">
                    <ol className="space-y-2.5">
                      {stages.map((s, i) => {
                        const st = stageVisual(i)
                        return (
                          <li
                            key={s.id}
                            className="rounded-lg border border-border bg-card px-3.5 py-2.5"
                          >
                            <div className="flex items-start gap-3">
                              {st === "done" ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                              ) : st === "active" ? (
                                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 text-primary motion-safe:animate-spin" aria-hidden />
                              ) : st === "failed" ? (
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                              ) : st === "waiting" ? (
                                <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                              ) : (
                                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden />
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">
                                  {s.label}
                                  <span className="sr-only">
                                    {st === "done" ? " — done" : st === "active" ? " — in progress" : st === "failed" ? " — failed" : st === "waiting" ? " — waiting on you" : ""}
                                  </span>
                                </span>
                                <span className="block text-xs text-muted-foreground">{s.detail}</span>
                              </span>
                            </div>

                            {/* Gate 1 · number picker — capability badges BEFORE
                                selection (R3); outbound-only rows explain themselves. */}
                            {i === 1 && phase === "pick" && (
                              <div className="mt-3 space-y-2 border-t border-border pt-3">
                                <p className="text-xs font-medium">Pick the number to attach</p>
                                {declined && (
                                  <p className="text-xs text-muted-foreground">
                                    Nothing changed — that number&apos;s routing is untouched.
                                  </p>
                                )}
                                <div role="radiogroup" aria-label="Numbers on this account" className="space-y-2">
                                  {MOCK_NUMBERS.map((n) => {
                                    const outboundOnly = n.capability === "outbound-only"
                                    return (
                                      <button
                                        key={n.e164}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected?.e164 === n.e164}
                                        onClick={() => pickNumber(n)}
                                        className="group flex w-full flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm focus-visible:border-primary/40"
                                      >
                                        <span className="flex w-full items-center justify-between gap-3">
                                          <span className="font-mono text-sm font-medium tabular-nums">{n.e164}</span>
                                          {outboundOnly ? (
                                            <Badge variant="warning" className="gap-1">
                                              <PhoneOutgoing aria-hidden />
                                              Outbound-only
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="gap-1">
                                              <PhoneIncoming aria-hidden />
                                              Inbound + outbound
                                            </Badge>
                                          )}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {n.label}
                                          {outboundOnly &&
                                            " — a verified caller ID can place calls but never receive them. Fine for batch calls; not for inbound."}
                                        </span>
                                      </button>
                                    )
                                  })}
                                </div>
                                {/* R8: no auto-purchase, ever — the empty edge
                                    routes to the carrier's own store. */}
                                <p className="text-xs text-muted-foreground">
                                  Missing a number? Agora sells none —{" "}
                                  <a href={carrier.buyUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    buy one at {carrier.name} ↗
                                  </a>{" "}
                                  and rescan.
                                </p>
                              </div>
                            )}

                            {/* Gate 2 · pre-overwrite confirm (R4). Calm and
                                neutral by design — this is a routing decision,
                                not a catastrophe; declining changes nothing. */}
                            {i === 3 && phase === "confirm" && selected && (
                              <div className="mt-3 space-y-2 border-t border-border pt-3">
                                <p className="text-sm font-medium">
                                  {selected.e164} already routes somewhere
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Its voice calls currently go to trunk{" "}
                                  <span className="font-mono">{CONFLICT_TRUNK}</span>. Attaching it
                                  here replaces that routing — {carrier.name} does this silently,
                                  so we&apos;re asking first. The old trunk keeps existing; it just
                                  stops receiving this number&apos;s calls.
                                </p>
                                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                                  <Button variant="outline" size="sm" className="flex-1" onClick={declineOverwrite}>
                                    Keep current routing
                                  </Button>
                                  <Button size="sm" className="flex-1" onClick={() => { setOverwriteOk(true); setPhase("running") }}>
                                    Attach here instead
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Gate 3 · the REAL test call (R6) — the user
                                places it; success is a connected call, not a save. */}
                            {i === 4 && (phase === "call" || phase === "ringing" || phase === "connected") && selected && (
                              <div className="mt-3 space-y-2 border-t border-border pt-3">
                                {phase === "call" && (
                                  <>
                                    <p className="text-xs text-muted-foreground">
                                      Everything is provisioned — now prove it. This places a real
                                      call through the new trunk to {selected.e164}.
                                    </p>
                                    <Button size="sm" className="w-full gap-2" onClick={() => setPhase("ringing")}>
                                      <Phone className="h-4 w-4" aria-hidden />
                                      Place test call
                                    </Button>
                                  </>
                                )}
                                {phase === "ringing" && (
                                  <p className="flex items-center gap-2 text-sm">
                                    <PhoneOutgoing className="h-4 w-4 shrink-0 text-primary motion-safe:animate-pulse" aria-hidden />
                                    Ringing <span className="font-mono tabular-nums">{selected.e164}</span>…
                                  </p>
                                )}
                                {phase === "connected" && (
                                  <p className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                                    Connected — audio both ways.
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Failure card renders under the failed stage —
                                nothing after it is claimed to have happened. */}
                            {phase === "failed" && i === stageIdx && (
                              <FailurePanel
                                failure={scenario.failure}
                                carrier={carrier}
                                number={selected?.e164}
                                onRetry={STAGE_IDS[stageIdx] === "credentials" ? undefined : retryStage}
                                onManual={() => setMode("manual")}
                              />
                            )}
                          </li>
                        )
                      })}
                    </ol>

                    {/* ── Success: verified-by-call receipt + masked stored
                        credential (R7) + the same route cards as the manual sheet. */}
                    {phase === "done" && selected && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-2.5">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                          <p className="text-sm font-medium">
                            Verified with a real call — {selected.e164} is connected.
                          </p>
                        </div>

                        <div className="space-y-2 text-sm">
                          <Summary label="Phone Number" value={selected.e164} mono />
                          <Summary
                            label="Capability"
                            value={selected.capability === "outbound-only" ? "Outbound-only" : "Inbound + outbound"}
                          />
                          <Summary label="Trunk" value={TRUNK_NAME} mono />
                          <Summary label="Provider" value={carrier.name} />
                          <Summary
                            label="Credential"
                            value={`${credKind} ····${last4} · connected ${connectedAt ?? ""}`}
                            mono
                          />
                        </div>
                        {/* R7: disconnect ≠ revocation — say so where the
                            credential is shown, not buried in docs. */}
                        <p className="text-xs text-muted-foreground">
                          Disconnecting removes this credential from Agora only — it stays
                          valid at {carrier.name} until you revoke it there.
                        </p>

                        <div className="space-y-2 border-t border-border pt-4">
                          <p className="text-sm font-medium">Put it to work</p>
                          <RouteCard
                            icon={PhoneIncoming}
                            title="Set up inbound"
                            desc={
                              selected.capability === "outbound-only"
                                ? "This number can't receive calls — attach an inbound-capable number first."
                                : "Route incoming calls to an agent."
                            }
                            disabled={selected.capability === "outbound-only"}
                            onClick={() => { setOpen(false); router.push("/deploy/inbound/new") }}
                          />
                          <RouteCard
                            icon={Megaphone}
                            title="Create a campaign"
                            desc="Use this number for outbound batch calls."
                            onClick={() => { setOpen(false); router.push("/deploy/batch-calls/new") }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* On a 401 the credential fields re-open BELOW the failure
                    card so the fix reads top-to-bottom: what failed → why →
                    edit → retry (footer). */}
                {credsFailed && <div className="space-y-4">{credentialFields}</div>}
              </div>

              {/* Footer only when there's one obvious next action; mid-run the
                  stage list carries the interaction. */}
              {phase === "idle" && (
                <div className="border-t border-border px-5 py-3">
                  <Button className="w-full" onClick={() => setPhase("running")} disabled={!credFilled}>
                    Connect {carrier.name}
                  </Button>
                </div>
              )}
              {credsFailed && (
                <div className="border-t border-border px-5 py-3">
                  <Button className="w-full" onClick={retryStage} disabled={!credFilled}>
                    Validate again
                  </Button>
                </div>
              )}
              {phase === "done" && (
                <div className="border-t border-border px-5 py-3">
                  <Button className="w-full" onClick={() => { setOpen(false); resetRun() }}>
                    Done
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ── Per-failure copy (R5): the carrier-side fix is NAMED and LINKED, the
   blast radius is stated (what did NOT happen), and retry touches only the
   failed stage. Credentials failures get no inline retry — the fields
   re-open below and the footer's "Validate again" is the retry. */
function FailurePanel({
  failure,
  carrier,
  number,
  onRetry,
  onManual,
}: {
  failure?: "bad-creds" | "no-numbers" | "on-other-trunk" | "geo-blocked" | "verify-fail"
  carrier: (typeof CARRIER)[ProviderId]
  number?: string
  onRetry?: () => void
  onManual: () => void
}) {
  const content =
    failure === "bad-creds"
      ? {
          title: `${carrier.name} said no — 401 unauthorized.`,
          body: `The credential didn't authenticate. Check for a missing character or an inactive key — both live under ${carrier.keysWhere}.`,
          honesty: `Nothing ran after this: no numbers were read, no trunk was created, nothing changed at ${carrier.name}.`,
          link: { label: `Open ${carrier.name} keys ↗`, href: carrier.keysUrl },
          retryLabel: undefined as string | undefined,
        }
      : failure === "no-numbers"
        ? {
            title: "No voice numbers on this account.",
            body: `The credential works — the account just owns no numbers to attach. Agora doesn't sell numbers, so buy one at ${carrier.name} first, then rescan.`,
            honesty: "Trunk creation didn't start — nothing was created.",
            link: { label: `Buy a number at ${carrier.name} ↗`, href: carrier.buyUrl },
            retryLabel: "Rescan numbers" as string | undefined,
          }
        : failure === "geo-blocked"
          ? {
              title:
                carrier.name === "Twilio"
                  ? "Attach blocked — geographic permissions (error 32205)."
                  : `Attach blocked — geo permissions at ${carrier.name}.`,
              body: `${carrier.name} refuses calls to this number's region until it's enabled account-side, under ${carrier.geoWhere}. Fix it there, then retry — only this step re-runs; everything above stays done.`,
              honesty: undefined,
              link: { label: `Open ${carrier.geoWhere} ↗`, href: carrier.geoUrl },
              retryLabel: "Retry attach" as string | undefined,
            }
          : {
              // verify-fail: configuration exists, calls don't connect yet —
              // two different facts, stated as such.
              title: "The trunk exists — the call didn't connect.",
              body: `Provisioning succeeded: trunk, routing, and ${number ?? "the number"} are all configured. The test call still failed — those are different facts, and only a connected call is proof. ${carrier.name}'s call logs show what the carrier saw.`,
              honesty: undefined,
              link: { label: `Open ${carrier.name} call logs ↗`, href: carrier.logsUrl },
              retryLabel: "Call again" as string | undefined,
            }

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <p className="text-sm font-medium text-destructive">{content.title}</p>
      <p className="text-xs text-muted-foreground">{content.body}</p>
      {content.honesty && <p className="text-xs text-muted-foreground">{content.honesty}</p>}
      <a
        href={content.link.href}
        target="_blank"
        rel="noreferrer"
        className="inline-block text-xs text-primary hover:underline"
      >
        {content.link.label}
      </a>
      {(onRetry || failure === "verify-fail") && (
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          {onRetry && content.retryLabel && (
            <Button size="sm" className="flex-1" onClick={onRetry}>
              {content.retryLabel}
            </Button>
          )}
          {failure === "verify-fail" && (
            <Button variant="outline" size="sm" className="flex-1" onClick={onManual}>
              Set up manually instead
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function Field({
  label, required, hint, children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
        {hint && <span className="font-normal text-muted-foreground"> · {hint}</span>}
      </Label>
      {children}
    </div>
  )
}

function Summary({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-sm text-right font-medium tabular-nums" : "text-sm text-right font-medium"}>
        {value}
      </span>
    </div>
  )
}

/* Same route-card shape as add-phone-number-sheet.tsx so both entry points
   end on an identical "now use it" beat — plus a disabled treatment for
   outbound-only numbers, which can't take inbound. */
function RouteCard({
  icon: Icon, title, desc, onClick, disabled,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:shadow-none"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {!disabled && (
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
      )}
    </button>
  )
}
