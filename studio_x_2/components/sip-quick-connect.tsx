"use client"

import * as React from "react"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { track, Events } from "@/lib/analytics"
import { FactLog, pushLine, type LogLine } from "@/components/fact-log"
import { RadioCardGroup, RadioCard } from "@/components/wizard/radio-cards"
import { TrunkHandover } from "@/components/trunk-handover"
import { TrunkTestCall } from "@/components/trunk-test-call"
import { NumberIdentityRows, TrunkSection } from "@/components/trunk-section"
import {
  CARRIERS, DEFAULT_TRUNK, type CarrierId, type SipTrunk,
} from "@/lib/sip-trunk"

/**
 * SipQuickConnect — the guided branch of AddPhoneNumberSheet: pick the carrier,
 * take Agora's Origination URI to its console, bring the trunk back, then prove
 * it with a call you place.
 *
 * What this used to be was four `setTimeout` calls claiming a capability no
 * vendor in the market ships. It said "we configure the SIP trunk" off a carrier
 * API key, logged "Creating SIP trunk · sip:agora-4f2a.pstn.telnyx.com" — a host
 * Telnyx does not own — and enumerated three invented numbers. Vapi and Retell
 * walk the user through the carrier's own portal; ElevenLabs' Twilio key only
 * rewrites an existing number's webhook. Nobody provisions a trunk from a key,
 * so setup is a named handover and the fact log now carries only what actually
 * happened in this product (17, 2026-09-17).
 *
 * The carrier key fields went with the automation: with no carrier API call
 * there is no carrier key to scope, and a field that collects a credential
 * Agora has no call to make with is the same fabrication moved into the inputs.
 * The one credential in this flow is the SIP digest pair, and it is optional
 * against an IP allowlist, which is the carrier's own either-or.
 *
 * What survives, unchanged: the flow ENDS on a call the user places (not one of
 * the five vendors does this), the append-only fact log instead of a spinner,
 * each carrier's own noun stated before the choice with "Another carrier" never
 * hidden, and disconnect said out loud not to be revocation.
 */

type Stage = "carrier" | "handover" | "trunk" | "verify" | "done"

export function SipQuickConnect({
  onConnected,
  onFallback,
}: {
  /** Trunk set up and proved by a real call → hand the whole record back to the
   *  sheet, so the summary prints what was connected rather than a default. */
  onConnected: (r: {
    e164: string
    label: string
    carrier: CarrierId
    carrierName?: string
    trunk: SipTrunk
  }) => void
  /** Escape to the manual SIP form (R8 — always reachable). */
  onFallback: () => void
}) {
  const [stage, setStage] = React.useState<Stage>("carrier")
  const [carrier, setCarrier] = React.useState<CarrierId | "">("")
  const [carrierName, setCarrierName] = React.useState("")
  const [identity, setIdentity] = React.useState({ number: "", label: "" })
  const [trunk, setTrunk] = React.useState<SipTrunk>({ ...DEFAULT_TRUNK, setupPath: "guided" })
  const [log, setLog] = React.useState<LogLine[]>([])

  const push = (text: string, ok = true) => setLog((l) => pushLine(l, text, ok))

  const carrierLabel = carrierName.trim() || (carrier && carrier !== "other" ? CARRIERS[carrier].label : "your carrier")
  // Learning 3's either-or, as the carriers themselves state it: digest
  // credentials or allowed addresses, and a trunk needs one of the two.
  const canSaveTrunk =
    identity.number.trim().length > 0 &&
    identity.label.trim().length > 0 &&
    trunk.address.trim().length > 0 &&
    (trunk.username.trim().length > 0 || trunk.allowedCidrs.length > 0)

  // ── Stage 1: the carrier ────────────────────────────────────────────────
  if (stage === "carrier") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium">Pick your carrier</p>
        <RadioCardGroup
          value={carrier}
          onValueChange={(v) => setCarrier(v as CarrierId)}
          aria-label="Pick your carrier"
        >
          {(Object.keys(CARRIERS) as CarrierId[]).map((c) => (
            <RadioCard
              key={c}
              value={c}
              title={CARRIERS[c].label}
              description={CARRIERS[c].noun}
            />
          ))}
        </RadioCardGroup>

        {carrier === "other" && (
          <div className="space-y-1.5">
            <Label htmlFor="carrier-name">Carrier name</Label>
            <Input
              id="carrier-name"
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              placeholder="The name on your bill"
              className="text-sm"
            />
          </div>
        )}

        <Button
          className="w-full"
          disabled={!carrier}
          onClick={() => {
            track(Events.sip_quick_connect_started, { carrier: carrier || "other" })
            setStage("handover")
          }}
        >
          Continue
        </Button>
        <p className="text-xs text-muted-foreground">
          <button type="button" onClick={onFallback} className="underline underline-offset-2 hover:text-foreground">
            Prefer the manual SIP form?
          </button>
        </p>
      </div>
    )
  }

  // ── Stage 2: the handover ───────────────────────────────────────────────
  if (stage === "handover") {
    return (
      <div className="space-y-4">
        <TrunkHandover
          carrier={carrier || undefined}
          carrierName={carrierName}
          gateway={trunk.gateway}
          transport={trunk.transport}
          onGateway={(g) => setTrunk((t) => ({ ...t, gateway: g }))}
        />
        <Button className="w-full" disabled={!trunk.gateway} onClick={() => setStage("trunk")}>
          Continue
        </Button>
      </div>
    )
  }

  // ── Stage 3: the trunk they created over there ──────────────────────────
  if (stage === "trunk") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium">Add your trunk details</p>
        <NumberIdentityRows
          number={identity.number}
          label={identity.label}
          onChange={setIdentity}
        />
        <TrunkSection
          numberId="new"
          trunk={trunk}
          carrier={carrier || undefined}
          carrierName={carrierName}
          onChange={setTrunk}
          onCarrierChange={(c, name) => { setCarrier(c); setCarrierName(name ?? "") }}
        />
        <Button
          className="w-full"
          disabled={!canSaveTrunk}
          onClick={() => {
            push(`Trunk saved · ${trunk.address} over ${trunk.transport}`)
            setStage("verify")
          }}
        >
          Continue
        </Button>
      </div>
    )
  }

  // ── Stages 4 and 5: the call, and what it proved ────────────────────────
  return (
    <div className="space-y-4">
      {/* Append-only fact log — what happened here, in this product, and never
          work no vendor performs. Shared with the buy branch of this sheet. */}
      <FactLog lines={log} />

      {stage === "verify" && (
        <TrunkTestCall
          e164={identity.number}
          onConnected={() => {
            push("Test call answered · two-way audio confirmed")
            setTrunk((t) => ({ ...t, lastConnectedAt: "just now", lastFailureCode: null }))
            setStage("done")
          }}
          onFailed={() => push("The carrier rejected the call", false)}
        />
      )}

      {stage === "done" && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 flex-1">
              {carrierLabel} trunk · {trunk.username.trim()
                ? `${trunk.username} · password set`
                : `${trunk.allowedCidrs.length} allowed IP ranges`}
            </span>
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={() => track(Events.trunk_disconnected, { carrier: carrier || "other" })}
            >
              Disconnect
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Disconnect stops Agora using this credential. It doesn&apos;t revoke or rotate it at {carrierLabel}.
          </p>
          <Button
            className="w-full"
            onClick={() => onConnected({
              e164: identity.number,
              label: identity.label,
              carrier: (carrier || "other") as CarrierId,
              carrierName: carrier === "other" ? carrierName.trim() || undefined : undefined,
              trunk,
            })}
          >
            Route this number
          </Button>
        </>
      )}
    </div>
  )
}
