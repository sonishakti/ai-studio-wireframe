"use client"

import * as React from "react"
import { Eye, EyeOff, PhoneCall } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { track, Events } from "@/lib/analytics"
import {
  CARRIERS, GATEWAYS, TRUNK_STATE_LABEL, isCidr, trunkState,
  type CarrierId, type SipTrunk,
} from "@/lib/sip-trunk"

/**
 * TrunkSection — the trunk as rows on the number that carries it, rendered
 * identically in the sheet's guided third step, in the sheet's manual branch
 * and on the number detail page, so the setup half and the manage half are one
 * surface (owner rule: things that belong together look the same).
 *
 * It REPLACES two page-private row renderers rather than adding a third:
 * `FieldInput`/`FieldSelect` inside number-client.tsx, which bind
 * `defaultValue` and cannot be imported by the sheet, and `Field` inside
 * add-phone-number-sheet.tsx.
 *
 * Anatomy is the number page's own label, control and one quiet line — the way
 * Transfer Destination already renders at number-client.tsx:174-178 — and NOT
 * the builder's SectionRows: SectionRows goes two-column at @3xl, 768px of real
 * container width, while the sheet is about 536px and the number page about
 * 728px, so the 240px label rail never appears at either and the import would
 * buy nothing.
 *
 * Every row carries a `data-design-focus` id, so the ladder's fix links and the
 * prototype's journey-start link land on the row they name.
 */

// ─── The row ─────────────────────────────────────────────────────────────────

export function TrunkRow({
  focusId,
  label,
  hint,
  caption,
  children,
}: {
  /** `data-design-focus` id — deep links (`?focus=<id>`) open at this row. */
  focusId?: string
  label: React.ReactNode
  /** Quiet explainer under the control. */
  hint?: React.ReactNode
  /** Second quiet line, the slot the house's own EngineRow puts "Requires
   *  Engine" in (wizard/engine-row.tsx:72). */
  caption?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div data-design-focus={focusId} className="scroll-mt-28 space-y-1.5">
      <Label className="text-balance">{label}</Label>
      {children ? <div className="space-y-2">{children}</div> : null}
      {hint ? <div className="text-xs leading-relaxed text-muted-foreground">{hint}</div> : null}
      {caption ? <div className="text-xs leading-relaxed text-muted-foreground">{caption}</div> : null}
    </div>
  )
}

// ─── Identity ────────────────────────────────────────────────────────────────

/**
 * The two fields that are identity and not trunk. Both branches of the sheet
 * and the detail page render these same two rows, so the number is described
 * the same way wherever it is added.
 */
export function NumberIdentityRows({
  number,
  label,
  onChange,
  numberLocked,
}: {
  number: string
  label: string
  /** Called with the whole pair, so a caller keeps one setState per edit. */
  onChange: (next: { number: string; label: string }) => void
  /** The number itself cannot be re-typed once it exists. */
  numberLocked?: boolean
}) {
  return (
    <>
      <TrunkRow label="Phone number">
        <Input
          value={number}
          onChange={(e) => onChange({ number: e.target.value, label })}
          placeholder="+1 (555) 123-4567"
          disabled={numberLocked}
          className="font-mono text-sm"
        />
      </TrunkRow>
      <TrunkRow label="Display name">
        <Input
          value={label}
          onChange={(e) => onChange({ number, label: e.target.value })}
          placeholder="Friendly name for your team"
          className="text-sm"
        />
      </TrunkRow>
    </>
  )
}

// ─── State chip ──────────────────────────────────────────────────────────────

const STATE_VARIANT: Record<ReturnType<typeof trunkState>, "secondary" | "outline" | "destructive"> = {
  connected: "secondary",
  "never-called": "outline",
  rejected: "destructive",
  "not-set": "outline",
}

/** The connected line is completed by the trunk's own stored age, so the
 *  Trunk column and the Connection row say the same four things. */
function stateLine(trunk: SipTrunk): string {
  const state = trunkState(trunk)
  if (state === "connected") return `${TRUNK_STATE_LABEL.connected} ${trunk.lastConnectedAt}`
  return TRUNK_STATE_LABEL[state]
}

export function TrunkStateChip({ trunk }: { trunk: SipTrunk }) {
  const state = trunkState(trunk)
  return <Badge variant={STATE_VARIANT[state]}>{stateLine(trunk)}</Badge>
}

// ─── The section ─────────────────────────────────────────────────────────────

export function TrunkSection({
  numberId,
  trunk,
  carrier,
  carrierName,
  onChange,
  onCarrierChange,
  locked,
  showConnection,
  showGateway,
  onTestCall,
}: {
  numberId: string
  trunk: SipTrunk
  /** Carrier lives on the number, not on the trunk: one field per thing. */
  carrier?: CarrierId
  /** The name on the bill, when the carrier is one the enum cannot name. */
  carrierName?: string
  onChange: (t: SipTrunk) => void
  onCarrierChange: (c: CarrierId, name?: string) => void
  /** The number is in use: the rows read, nothing writes. */
  locked?: boolean
  /** The Connection row, which belongs to the manage half. */
  showConnection?: boolean
  /** The recorded gateway, which belongs to the manage half. The choice
   *  itself is made once, in TrunkHandover. */
  showGateway?: boolean
  /** Opens the test call. Pass it wherever the Connection row should offer
   *  "Call this number"; without it the row states the connection and stops,
   *  rather than showing a button that does nothing. */
  onTestCall?: () => void
}) {
  const [showPw, setShowPw] = React.useState(false)
  const [replacing, setReplacing] = React.useState(false)
  // The password is typed and handed on; it is never read back out of a trunk,
  // which mirrors `existingPassword` in phone-number-contracts.ts:83-84.
  const [password, setPassword] = React.useState("")
  const [allowText, setAllowText] = React.useState(trunk.allowedCidrs.join("\n"))

  // Re-seed the allowlist box when the row moves to another number; typing is
  // never clobbered by a re-render of the same one.
  React.useEffect(() => {
    setAllowText(trunk.allowedCidrs.join("\n"))
    setReplacing(false)
    setPassword("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberId])

  const cidrs = allowText.split("\n").map((l) => l.trim()).filter(Boolean)
  const malformed = cidrs.filter((c) => !isCidr(c))

  const editAllowlist = (text: string) => {
    setAllowText(text)
    onChange({ ...trunk, allowedCidrs: text.split("\n").map((l) => l.trim()).filter(Boolean) })
  }

  const editPassword = (value: string) => {
    setPassword(value)
    onChange({ ...trunk, hasPassword: trunk.hasPassword || value.trim().length > 0 })
  }

  return (
    <div className="space-y-4">
      {showConnection && (
        <TrunkRow focusId="trunk-connection" label="Connection">
          <div className="flex flex-wrap items-center gap-2">
            <TrunkStateChip trunk={trunk} />
            {onTestCall && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onTestCall}>
                <PhoneCall className="h-3.5 w-3.5" /> Call this number
              </Button>
            )}
          </div>
        </TrunkRow>
      )}

      <TrunkRow focusId="trunk-carrier" label="Carrier">
        <Select
          value={carrier ?? ""}
          onValueChange={(v) => {
            // A typed name belongs to "Another carrier" alone: carrying it onto
            // a named carrier would leave the bill's name beside the wrong one.
            const next = v as CarrierId
            onCarrierChange(next, next === "other" ? carrierName : undefined)
          }}
          disabled={locked}
        >
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {(Object.keys(CARRIERS) as CarrierId[]).map((c) => (
              <SelectItem key={c} value={c}>{CARRIERS[c].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {carrier === "other" && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Carrier name</Label>
            <Input
              value={carrierName ?? ""}
              onChange={(e) => onCarrierChange("other", e.target.value)}
              placeholder="The name on your bill"
              disabled={locked}
              className="text-sm"
            />
          </div>
        )}
      </TrunkRow>

      <TrunkRow
        focusId="trunk-address"
        label="SIP trunk address"
        hint="Domain or IP for the outbound trunk. Ports are supported."
      >
        <Input
          value={trunk.address}
          onChange={(e) => onChange({ ...trunk, address: e.target.value })}
          disabled={locked}
          className="font-mono text-sm"
        />
      </TrunkRow>

      <TrunkRow label="Transport">
        <ToggleGroup
          type="single"
          value={trunk.transport}
          onValueChange={(v) => { if (v) onChange({ ...trunk, transport: v as SipTrunk["transport"] }) }}
          spacing={0}
          variant="outline"
          disabled={locked}
          aria-label="Transport"
        >
          {(["TCP", "UDP", "TLS"] as SipTrunk["transport"][]).map((t) => (
            <ToggleGroupItem
              key={t}
              value={t}
              aria-label={t}
              className="h-7 px-3 text-xs font-medium data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
            >
              {t}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </TrunkRow>

      <TrunkRow focusId="trunk-credential" label="Credential">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Username</Label>
          <Input
            value={trunk.username}
            onChange={(e) => onChange({ ...trunk, username: e.target.value })}
            disabled={locked}
            className="font-mono text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={trunk.hasPassword ? "secondary" : "outline"}>
            {trunk.hasPassword ? "Set" : "Not set"}
          </Badge>
          {!replacing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={locked}
              onClick={() => setReplacing(true)}
            >
              Replace password
            </Button>
          )}
        </div>
        {replacing && (
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => editPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={locked}
              className="pr-9 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </TrunkRow>

      <TrunkRow
        focusId="trunk-allowlist"
        label="Allowed IP ranges"
        hint="Calls are accepted only from these ranges, one CIDR block per line."
        caption={
          malformed.length > 0
            ? <span className="text-destructive">Each line needs a CIDR block, such as 185.86.151.0/24.</span>
            : cidrs.length === 0
              ? "Any IP address can reach this number."
              : null
        }
      >
        <Textarea
          value={allowText}
          onChange={(e) => editAllowlist(e.target.value)}
          onBlur={() => track(Events.trunk_allowlist_edited, { ranges: cidrs.length })}
          rows={3}
          disabled={locked}
          className="font-mono text-sm"
        />
      </TrunkRow>

      {showGateway && (
        <TrunkRow
          focusId="trunk-gateway"
          label="Gateway location"
          hint="Your carrier routes to whichever address you pasted there."
          caption="Requires Engine"
        >
          <p className={cn("text-sm", !trunk.gateway && "text-muted-foreground")}>
            {trunk.gateway ? GATEWAYS[trunk.gateway].label : "Not recorded"}
          </p>
        </TrunkRow>
      )}

      <TrunkRow
        focusId="trunk-headers"
        label="SIP headers"
        hint="Added to the INVITE on every outbound call."
        caption="Requires Engine"
      >
        {trunk.headers.length > 0 ? (
          <div className="space-y-1">
            {trunk.headers.map((h) => (
              <p key={h.name} className="font-mono text-xs">{h.name} · {h.value}</p>
            ))}
          </div>
        ) : null}
      </TrunkRow>
    </div>
  )
}
