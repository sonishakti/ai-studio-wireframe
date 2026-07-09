"use client"

import * as React from "react"
import {
  CheckCircle2, Loader2, PhoneCall, ShieldCheck, Eye, EyeOff,
  ChevronDown, PlugZap, AlertTriangle, Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { track, Events } from "@/lib/analytics"
import { StateBanner } from "@/components/usage-spend-card"

/**
 * SipQuickConnect — paste a carrier credential, we configure the SIP trunk
 * (A3, judge winner V1 "Mode-toggle" + V3 fact-log/auto-pick + V2 named picker
 * & live timer; LEARNINGS §20 2026-07-09). Rendered as the "Quick connect"
 * branch of AddPhoneNumberSheet; the manual SIP form is the sibling fallback.
 *
 * Honesty contract (the lens A3 won on):
 *  • ≤4 inputs before automation; scoped API key preferred, Auth Token the
 *    labeled less-secure fallback (Twilio's own guidance)
 *  • the run streams a timestamped FACT-LOG of real work — never a bare spinner
 *  • a single viable number auto-picks with an undo; the pick is a named step
 *  • the flow ENDS on a user-placed test call that rings→connects, never a
 *    "configuration saved" checkmark (provisioning success ≠ call success)
 *  • Agora sells no numbers — you bring one you already own (fine print AFTER
 *    the action, never a gate)
 * Mock only: timers stand in for the real validate→enumerate→create→attach.
 */

type Provider = "twilio" | "telnyx"

const PROVIDERS: Record<Provider, { label: string; routing: string; keyHelp: string }> = {
  twilio: { label: "Twilio", routing: "SIP trunk", keyHelp: "Account › API keys & tokens" },
  telnyx: { label: "Telnyx", routing: "FQDN connection", keyHelp: "API Keys" },
}

// Numbers the mock enumeration returns (capability per research: purchased =
// inbound+outbound, verified caller ID = outbound-only).
const MOCK_NUMBERS = [
  { e164: "+1 (415) 555-0132", capability: "inbound+outbound" as const, label: "Purchased" },
  { e164: "+1 (628) 555-0177", capability: "inbound+outbound" as const, label: "Purchased" },
  { e164: "+44 20 7946 0958", capability: "outbound-only" as const, label: "Verified caller ID" },
]

type Stage = "connect" | "validating" | "pick" | "provisioning" | "verify" | "done"

interface LogLine { t: string; text: string; ok?: boolean }

export function SipQuickConnect({
  onConnected,
  onFallback,
}: {
  /** Number verified + trunk live → hand back to the sheet's route cards. */
  onConnected: (e164: string) => void
  /** Escape to the manual SIP form (R8 — always reachable). */
  onFallback: () => void
}) {
  const [provider, setProvider] = React.useState<Provider>("twilio")
  const [useToken, setUseToken] = React.useState(true) // Auth Token is immediately available; scoped key is one click away
  const [showSecret, setShowSecret] = React.useState(false)
  const [cred, setCred] = React.useState({ label: "", sid: "", secret: "" })
  const [stage, setStage] = React.useState<Stage>("connect")
  const [log, setLog] = React.useState<LogLine[]>([])
  const [pickedIdx, setPickedIdx] = React.useState<number | null>(null)
  const [callState, setCallState] = React.useState<"idle" | "ringing" | "connected" | "failed">("idle")
  const [callSec, setCallSec] = React.useState(0)
  const timers = React.useRef<number[]>([])
  const clock = React.useRef<number | null>(null)

  React.useEffect(() => () => {
    timers.current.forEach(clearTimeout)
    if (clock.current) clearInterval(clock.current)
  }, [])

  const mask = cred.secret ? `····${cred.secret.slice(-4).padStart(4, "·")}` : "····"
  // Twilio Auth Token = SID + token; scoped key = SK SID + secret; Telnyx = one key.
  const canConnect =
    provider === "telnyx"
      ? cred.secret.trim().length > 0
      : cred.sid.trim().length > 0 && cred.secret.trim().length > 0

  function push(text: string, ok = true) {
    // Deterministic mock timestamp — no clock read in render.
    setLog((l) => [...l, { t: `${String(9 + Math.floor(l.length / 6)).padStart(2, "0")}:${String((l.length * 7) % 60).padStart(2, "0")}`, text, ok }])
  }

  function connect() {
    if (!canConnect) return
    track(Events.sip_quick_connect_started, { provider, credential: useToken ? "token" : "scoped_key" })
    setStage("validating")
    setLog([])
    const acct = provider === "twilio" ? "Acme Support" : "Acme Telnyx"
    timers.current.push(window.setTimeout(() => {
      push(`Credentials valid · ${PROVIDERS[provider].label} account “${acct}” · ${mask}`)
      track(Events.credentials_validated, { provider })
    }, 900))
    timers.current.push(window.setTimeout(() => {
      push(`${MOCK_NUMBERS.length} numbers found · 2 inbound+outbound · 1 outbound-only`)
      track(Events.numbers_enumerated, { count: MOCK_NUMBERS.length })
      setStage("pick")
    }, 1900))
  }

  function pick(idx: number, auto = false) {
    setPickedIdx(idx)
    track(Events.number_picked, { mode: auto ? "auto" : "manual" })
    setStage("provisioning")
    const n = MOCK_NUMBERS[idx]
    push(`Creating ${PROVIDERS[provider].routing.toLowerCase()} · sip:agora-4f2a.pstn.${provider}.com`)
    timers.current.push(window.setTimeout(() => {
      push("Routing configured · inbound → Agora edge, outbound → your trunk")
      track(Events.trunk_created, { provider })
    }, 1000))
    timers.current.push(window.setTimeout(() => {
      push(`${n.e164} attached to the trunk`)
      setStage("verify")
    }, 1900))
  }

  function placeTestCall() {
    setCallState("ringing")
    track(Events.test_call_placed, {})
    setCallSec(0)
    clock.current = window.setInterval(() => setCallSec((s) => s + 1), 1000)
    timers.current.push(window.setTimeout(() => {
      if (clock.current) clearInterval(clock.current)
      setCallState("connected")
      track(Events.test_call_connected, {})
      push("Test call answered — two-way audio confirmed", true)
      setStage("done")
    }, 2600))
  }

  // ── Stage 1: credentials ────────────────────────────────────────────────
  if (stage === "connect") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PROVIDERS) as Provider[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              aria-pressed={provider === p}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                provider === p ? "border-primary/60 bg-primary/[0.04]" : "border-border hover:bg-accent/40",
              )}
            >
              <span className="font-medium">{PROVIDERS[p].label}</span>
              <span className="block text-xs text-muted-foreground">we configure the {PROVIDERS[p].routing.toLowerCase()}</span>
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sip-label" className="text-xs text-muted-foreground">Label (optional)</Label>
          <Input id="sip-label" placeholder="e.g. Prod carrier" value={cred.label} onChange={(e) => setCred({ ...cred, label: e.target.value })} />
        </div>

        {provider === "twilio" && (
          <div className="space-y-1.5">
            <Label htmlFor="sip-sid" className="text-xs text-muted-foreground">
              {useToken ? "Account SID" : "API key SID (SK…)"}
            </Label>
            <Input id="sip-sid" className="font-mono text-sm" placeholder={useToken ? "AC…" : "SK…"} value={cred.sid} onChange={(e) => setCred({ ...cred, sid: e.target.value })} />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="sip-secret" className="text-xs text-muted-foreground">
            {provider === "telnyx" ? "API key" : useToken ? "Auth Token" : "API key secret"}
          </Label>
          <div className="relative">
            <Input
              id="sip-secret"
              type={showSecret ? "text" : "password"}
              className="pr-9 font-mono text-sm"
              placeholder="••••••••••••"
              value={cred.secret}
              onChange={(e) => setCred({ ...cred, secret: e.target.value })}
            />
            <button type="button" onClick={() => setShowSecret((s) => !s)} aria-label={showSecret ? "Hide" : "Show"} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {provider === "twilio" && (
            <button type="button" onClick={() => { setUseToken((t) => !t); setCred({ ...cred, sid: "", secret: "" }) }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-3 w-3" />
              {useToken ? "Use a scoped API key instead (safer — least-privilege)" : "Use Account SID + Auth Token instead (less secure)"}
            </button>
          )}
        </div>

        <Button className="w-full gap-1.5" onClick={connect} disabled={!canConnect}>
          <PlugZap className="h-4 w-4" /> Connect {PROVIDERS[provider].label}
        </Button>
        <p className="text-xs text-muted-foreground">
          Find your key under {PROVIDERS[provider].label} {PROVIDERS[provider].keyHelp}. You bring a
          number you already own — Agora doesn&apos;t sell or port numbers.{" "}
          <button type="button" onClick={onFallback} className="underline underline-offset-2 hover:text-foreground">
            Prefer the manual SIP form?
          </button>
        </p>
      </div>
    )
  }

  const pickedNumber = pickedIdx != null ? MOCK_NUMBERS[pickedIdx] : null

  // ── Stages 2–5: the fact-log + the moments that need a human ─────────────
  return (
    <div className="space-y-4">
      {/* Append-only fact-log (V3 graft) — real work, not a spinner */}
      <div role="log" aria-live="polite" className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs">
        {log.map((l, i) => (
          <p key={i} className="flex items-start gap-2">
            <span className="shrink-0 text-muted-foreground tabular-nums">{l.t}</span>
            {l.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />}
            <span className="min-w-0 flex-1">{l.text}</span>
          </p>
        ))}
        {(stage === "validating" || stage === "provisioning") && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" /> working…
          </p>
        )}
      </div>

      {/* Named "Pick a number" step (V2 graft) — capability badges before choice */}
      {stage === "pick" && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Pick a number to route</p>
          {MOCK_NUMBERS.map((n, i) => {
            const outboundOnly = n.capability === "outbound-only"
            return (
              <button
                key={n.e164}
                type="button"
                disabled={outboundOnly}
                onClick={() => pick(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  outboundOnly ? "cursor-not-allowed border-dashed border-border opacity-60" : "border-border hover:border-primary/40 hover:bg-accent/30",
                )}
              >
                <PhoneCall className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-sm">{n.e164}</span>
                  <span className="block text-xs text-muted-foreground">
                    {n.label} · {outboundOnly ? "can’t receive calls (verified caller ID)" : "inbound + outbound"}
                  </span>
                </span>
                {outboundOnly ? (
                  <Badge variant="outline" className="shrink-0 text-xs">outbound only</Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0 text-xs">inbound + outbound</Badge>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* The verify step — a REAL user-placed test call, never a saved check */}
      {(stage === "verify" || stage === "done") && (
        <StateBanner tone={callState === "connected" ? "success" : "primary"} icon={callState === "connected" ? CheckCircle2 : Radio}>
          {callState === "connected" ? (
            <>
              <p className="text-sm font-medium">Verified with a real call — {pickedNumber?.e164} is live.</p>
              <p className="text-xs text-muted-foreground">Answered in {callSec || 2}s, two-way audio. Route it to an agent below.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Trunk is provisioned — now prove it connects.</p>
              <p className="text-xs text-muted-foreground">
                Configuration success isn&apos;t call success. Place a real test call before you rely on it.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" className="gap-1.5" onClick={placeTestCall} disabled={callState === "ringing"}>
                  {callState === "ringing"
                    ? <><Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" /> Ringing… {callSec}s</>
                    : <><PhoneCall className="h-3.5 w-3.5" /> Place test call</>}
                </Button>
                <button type="button" onClick={onFallback} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  Didn&apos;t connect? Set up manually
                </button>
              </div>
            </>
          )}
        </StateBanner>
      )}

      {/* Stored-credential presentation (R7) — masked, disconnect ≠ revoke */}
      {stage === "done" && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 min-w-0">
              {PROVIDERS[provider].label} {useToken ? "credential" : "scoped key"} {mask} · connected just now
            </span>
            <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => track(Events.trunk_disconnected, { provider })}>
              Disconnect
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Disconnect stops Agora using this credential — it doesn&apos;t revoke or rotate it at {PROVIDERS[provider].label}.
          </p>
          <Button className="w-full" onClick={() => onConnected(pickedNumber!.e164)}>
            Route this number
          </Button>
        </>
      )}
    </div>
  )
}
