"use client"

import * as React from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { track, Events } from "@/lib/analytics"
import {
  CARRIERS, GATEWAYS, SIP_TRUNK_GUIDE_URL, originationUri,
  type CarrierId, type GatewayId, type SipTrunk,
} from "@/lib/sip-trunk"

/**
 * TrunkHandover — step 2 of the guided path, and the same block at the top of
 * the manual branch: the handover said out loud. Here is Agora's Origination
 * URI, you paste it at your carrier, you tell us which one you used.
 *
 * This is the ONE place the gateway is chosen (learning 4): it is a choice
 * about which address you paste at the carrier, not a routing setting, and
 * Agora stores no record of it. Everywhere else — the number page's Gateway
 * location row — it is a value with a "Requires Engine" caption, never a
 * second Select. Only one branch renders at a time, so there is one gateway
 * control on screen in any pass.
 *
 * The Origination URI is the only copyable thing here. The per-country
 * signalling IPs live behind the guide link because the docs page lists them
 * in accordions and this research reproduced not one address: a Copy button
 * over addresses nobody has read is a fabricated host made pasteable, and one
 * invented octet is a 403 on the first real caller.
 */
export function TrunkHandover({
  carrier,
  carrierName,
  gateway,
  transport,
  onGateway,
}: {
  carrier?: CarrierId
  /** The name on the bill, when the carrier is one the enum cannot name. */
  carrierName?: string
  /** Null until the customer says which address they pasted. */
  gateway: GatewayId | null
  /** TLS answers on 5061, TCP and UDP on 5060. */
  transport: SipTrunk["transport"]
  onGateway: (g: GatewayId) => void
}) {
  const [copied, setCopied] = React.useState(false)

  // "Another carrier" is a label, not a name: use the one the customer typed,
  // and fall back to the house's own second person rather than printing the
  // enum's placeholder word at them.
  const name = carrierName?.trim() || (carrier && carrier !== "other" ? CARRIERS[carrier].label : "your carrier")
  const steps = carrier ? CARRIERS[carrier].steps : []
  const uri = gateway ? originationUri(gateway, transport) : ""

  const copyUri = () => {
    navigator.clipboard?.writeText(uri)
    track(Events.trunk_value_copied, { field: "origination_uri" })
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-balance">Set this up at {name}</p>
        <p className="text-xs text-muted-foreground">Paste this into your {name} console.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Gateway location</Label>
        <Select
          value={gateway ?? ""}
          onValueChange={(v) => {
            onGateway(v as GatewayId)
            track(Events.trunk_gateway_recorded, { gateway: v })
          }}
        >
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {(Object.keys(GATEWAYS) as GatewayId[]).map((g) => (
              <SelectItem key={g} value={g}>{GATEWAYS[g].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* The address itself, once we know which one they are pasting. */}
      {uri && (
        <div className="space-y-1.5">
          <Label>Origination URI</Label>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs">{uri}</code>
            <Button variant="ghost" size="sm" className="h-6 shrink-0 gap-1 px-1.5 text-xs" onClick={copyUri}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
            </Button>
          </div>
        </div>
      )}

      {/* The carrier's own console words, for the two consoles this research
          actually captured. The rest get the guide link and no invented path. */}
      {steps.length > 0 && (
        <ol className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          {steps.map((s, i) => (
            <li key={s.where} className="flex gap-2">
              <span className="shrink-0 tabular-nums">{i + 1}.</span>
              <span className="min-w-0">
                <span className="font-medium text-foreground">{s.where}</span>: {s.what}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
        <p>Allow the Agora signalling IPs for your country at {name}. The guide lists them by country code.</p>
        <p>Media travels on its own ports. Allow those at {name}.</p>
        <a
          href={SIP_TRUNK_GUIDE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => track(Events.trunk_guide_opened, { carrier: carrier ?? "other" })}
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Open the Agora SIP trunk guide <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
