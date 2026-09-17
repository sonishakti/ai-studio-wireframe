"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  CheckCircle2, PhoneIncoming, Megaphone, ArrowRight,
} from "lucide-react"
import { track, Events } from "@/lib/analytics"
import { SipQuickConnect } from "@/components/sip-quick-connect"
import { BuyNumberPanel } from "@/components/buy-number-panel"
import { TrunkHandover } from "@/components/trunk-handover"
import { TrunkTestCall } from "@/components/trunk-test-call"
import { NumberIdentityRows, TrunkSection } from "@/components/trunk-section"
import { CARRIERS, DEFAULT_TRUNK, type CarrierId, type SipTrunk } from "@/lib/sip-trunk"

type Phase = "form" | "success"
// Three ways to end up with a number, one door (16, 2026-09-17): get one from
// Agora, connect one you own the fast way, or wire the SIP yourself.
type Mode = "buy" | "quick" | "manual"

export function AddPhoneNumberSheet({
  children,
  onAdded,
  defaultMode = "quick",
  open: openProp,
  onOpenChange,
}: {
  /** Trigger element — optional when the sheet is driven via `open` (e.g. the
   *  caller-ID dropdown's footer door, where a SheetTrigger can't live). */
  children?: React.ReactNode
  /** In-builder mode (Channel › inbound accelerator, 2026-07-28): the success
   *  phase offers "Link to this agent" instead of the route cards (which
   *  navigate to a NEW draft — a dead end mid-edit), and the added number is
   *  handed back so the caller can list + link it. */
  onAdded?: (n: { number: string; label: string; carrier?: CarrierId; carrierName?: string }) => void
  /** Resources › Channels and the wizard SIP hints open the fast path by
   *  default; the manual form stays one toggle away (A3, 2026-07-09). */
  defaultMode?: Mode
  /** Controlled open (2026-07-29) — omit both to keep the trigger-driven
   *  behavior every existing call site relies on. */
  open?: boolean
  onOpenChange?: (o: boolean) => void
}) {
  const router = useRouter()
  const [openState, setOpenState] = React.useState(false)
  const open = openProp ?? openState
  const setOpen = (o: boolean) => {
    setOpenState(o)
    onOpenChange?.(o)
  }
  // A3 Quick connect is the default path (Future-scope switch removed 2026-09-11).
  const [mode, setMode] = React.useState<Mode>(defaultMode)
  // The sheet is mounted persistently by its callers, so `defaultMode` as a
  // useState initializer only ever ran once: a door that asks for the buy
  // branch would have opened Quick connect. Re-apply it on every open.
  React.useEffect(() => { if (open) setMode(defaultMode) }, [open, defaultMode])
  const [phase, setPhase] = React.useState<Phase>("form")
  // One record for what this sheet produced, whichever branch produced it: the
  // number, its name, who carries it and the trunk it rides on.
  // `carrier` starts unset, the way the guided branch's first question does:
  // pre-picking Twilio put a name on somebody's bill that they never gave us,
  // and the summary then printed it back to them as a fact (owner 2026-09-17).
  const [form, setForm] = React.useState<{
    number: string
    displayName: string
    carrier?: CarrierId
    carrierName?: string
  }>({ number: "", displayName: "" })
  const [trunk, setTrunk] = React.useState<SipTrunk>({ ...DEFAULT_TRUNK, setupPath: "manual" })

  const reset = () => {
    setMode(defaultMode)
    setPhase("form")
    setForm({ number: "", displayName: "" })
    setTrunk({ ...DEFAULT_TRUNK, setupPath: "manual" })
  }

  // Learning 3's either-or: a trunk is authenticated by digest credentials or
  // by allowed addresses, and the carriers accept either.
  const canAdd =
    !!form.carrier && form.number.trim() && form.displayName.trim() && trunk.address.trim() &&
    (trunk.username.trim() || trunk.allowedCidrs.length > 0)

  // Manual SIP used to reach "added successfully" off six filled fields having
  // proved nothing, while the branch next door earned the same screen with a
  // real call. There is one ending now, and the call is it.
  const carrierLabel =
    form.carrierName?.trim() || (form.carrier ? CARRIERS[form.carrier].label : "")

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      {children ? <SheetTrigger asChild>{children}</SheetTrigger> : null}
      <SheetContent className="w-full overflow-y-auto p-0 flex flex-col data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle>Add phone number</SheetTitle>
          {phase === "form" && mode !== "buy" && (
            <SheetDescription>
              Bring a number you already own. Agora routes it.
            </SheetDescription>
          )}
        </SheetHeader>

        {phase === "form" && (
          <div className="px-5 pt-4">
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => { if (v) setMode(v as Mode) }}
              variant="outline"
              size="sm"
              className="w-full"
              aria-label="How you get this number"
            >
              <ToggleGroupItem value="buy" className="flex-1 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-foreground">
                Get a number
              </ToggleGroupItem>
              <ToggleGroupItem value="quick" className="flex-1 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-foreground">
                Guided setup
              </ToggleGroupItem>
              <ToggleGroupItem value="manual" className="flex-1 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-foreground">
                Manual SIP
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {phase === "form" && mode === "buy" ? (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <BuyNumberPanel
              onConnected={(e164) => { setForm((f) => ({ ...f, number: e164 })); setPhase("success") }}
              onFallback={() => setMode("quick")}
            />
          </div>
        ) : phase === "form" && mode === "quick" ? (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <SipQuickConnect
              onConnected={(r) => {
                setForm({ number: r.e164, displayName: r.label, carrier: r.carrier, carrierName: r.carrierName })
                setTrunk(r.trunk)
                track(Events.phone_number_imported, { carrier: r.carrier, transport: r.trunk.transport })
                setPhase("success")
              }}
              onFallback={() => { track(Events.manual_fallback_opened, {}); setMode("manual") }}
            />
          </div>
        ) : phase === "form" ? (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* The same handover the guided branch shows, because the address
                you paste at the carrier is the same address either way. */}
            <TrunkHandover
              carrier={form.carrier}
              carrierName={form.carrierName}
              gateway={trunk.gateway}
              transport={trunk.transport}
              onGateway={(g) => setTrunk({ ...trunk, gateway: g })}
            />
            <NumberIdentityRows
              number={form.number}
              label={form.displayName}
              onChange={(n) => setForm({ ...form, number: n.number, displayName: n.label })}
            />
            <TrunkSection
              numberId="new"
              trunk={trunk}
              carrier={form.carrier}
              carrierName={form.carrierName}
              onChange={setTrunk}
              onCarrierChange={(c, name) => setForm({ ...form, carrier: c, carrierName: name })}
            />
            {canAdd ? (
              <TrunkTestCall
                e164={form.number}
                onConnected={() => {
                  track(Events.phone_number_imported, { carrier: form.carrier, transport: trunk.transport })
                  setPhase("success")
                }}
              />
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <p className="text-sm font-medium">Phone number added successfully!</p>
              </div>

              <div className="space-y-2 text-sm">
                {/* A number from Agora has no trunk and no carrier of the
                    customer's, so it says the two things it knows rather than
                    four, two of them invented. Nothing here falls back to a
                    placeholder: every line is what was just connected. */}
                {mode === "buy" ? (
                  <>
                    <Summary label="Phone number" value={form.number} />
                    <Summary label="From" value="Agora" />
                  </>
                ) : (
                  <>
                    <Summary label="Phone number" value={form.number} />
                    <Summary label="Display name" value={form.displayName} />
                    <Summary label="SIP trunk address" value={trunk.address} />
                    <Summary label="Carrier" value={carrierLabel} />
                  </>
                )}
              </div>

              {!onAdded && (
              <div className="space-y-2 pt-1">
                <p className="text-sm font-medium">Configure this number?</p>
                <p className="text-xs text-muted-foreground">Route this number to:</p>
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
              )}
            </div>

            <div className="border-t border-border px-5 py-3 space-y-2">
              {onAdded ? (
                <>
                  <Button
                    className="w-full"
                    onClick={() => {
                      onAdded({
                        number: form.number,
                        label: form.displayName || form.number,
                        // The caller writes one ledger row for whatever this
                        // sheet produced, so it needs who carries the number.
                        carrier: form.carrier,
                        carrierName: form.carrierName,
                      })
                      setOpen(false)
                      reset()
                    }}
                  >
                    Link to this agent
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => { setOpen(false); reset() }}>Done · don&apos;t link yet</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full" onClick={reset}>Import Another</Button>
                  <Button className="w-full" onClick={() => { setOpen(false); reset() }}>Done</Button>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-right font-medium">{value}</span>
    </div>
  )
}

function RouteCard({ icon: Icon, title, desc, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm focus-visible:border-primary/40">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
    </button>
  )
}
