"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  CheckCircle2, Eye, EyeOff, PhoneIncoming, Megaphone, ArrowRight, HelpCircle,
} from "lucide-react"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"
import { SipQuickConnect } from "@/components/sip-quick-connect"
import { useFutureScope } from "@/lib/future-scope"

type Phase = "form" | "success"
type Transport = "TCP" | "UDP" | "TLS"
type Mode = "quick" | "manual"

export function AddPhoneNumberSheet({
  children,
  onAdded,
  defaultMode = "quick",
}: {
  children: React.ReactNode
  /** In-builder mode (Channel › inbound accelerator, 2026-07-28): the success
   *  phase offers "Link to this agent" instead of the route cards (which
   *  navigate to a NEW draft — a dead end mid-edit), and the added number is
   *  handed back so the caller can list + link it. */
  onAdded?: (n: { number: string; label: string }) => void
  /** Resources › Channels and the wizard SIP hints open the fast path by
   *  default; the manual form stays one toggle away (A3, 2026-07-09). */
  defaultMode?: Mode
}) {
  const router = useRouter()
  const [future] = useFutureScope()
  const [open, setOpen] = React.useState(false)
  // A3 Quick connect is future-scope-gated; off = the manual SIP form only.
  const [mode, setMode] = React.useState<Mode>(future ? defaultMode : "manual")
  const [phase, setPhase] = React.useState<Phase>("form")
  const [showPw, setShowPw] = React.useState(false)
  const [transport, setTransport] = React.useState<Transport>("TCP")
  const [form, setForm] = React.useState({ number: "", vendor: "", displayName: "", sipDomain: "", username: "", password: "" })

  const reset = () => {
    setMode(future ? defaultMode : "manual")
    setPhase("form")
    setForm({ number: "", vendor: "", displayName: "", sipDomain: "", username: "", password: "" })
    setTransport("TCP")
  }

  const canAdd = form.number.trim() && form.vendor && form.displayName.trim() && form.sipDomain.trim() && form.username.trim()

  const handleAdd = () => {
    if (!canAdd) {
      toast.error("Fill in the required fields")
      return
    }
    track(Events.phone_number_imported, { vendor: form.vendor, transport })
    setPhase("success")
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto p-0 flex flex-col data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle>Add a phone number</SheetTitle>
          {phase === "form" && (
            <SheetDescription>
              Bring a number you already own — Agora routes it, and doesn&apos;t sell or port
              numbers.
            </SheetDescription>
          )}
        </SheetHeader>

        {phase === "form" && future && (
          <div className="px-5 pt-4">
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => { if (v) setMode(v as Mode) }}
              variant="outline"
              size="sm"
              className="w-full"
              aria-label="Connection method"
            >
              <ToggleGroupItem value="quick" className="flex-1 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
                Quick connect
              </ToggleGroupItem>
              <ToggleGroupItem value="manual" className="flex-1 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
                Manual SIP
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {phase === "form" && mode === "quick" ? (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <SipQuickConnect
              onConnected={(e164) => { setForm((f) => ({ ...f, number: e164, vendor: f.vendor || "Twilio" })); setPhase("success") }}
              onFallback={() => { track(Events.manual_fallback_opened, {}); setMode("manual") }}
            />
          </div>
        ) : phase === "form" ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone Number" required>
                  <Input placeholder="+1 (555) 123-4567" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="font-mono text-sm" />
                </Field>
                <Field label="Vendor" required>
                  <Select value={form.vendor} onValueChange={(v) => setForm({ ...form, vendor: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Twilio">Twilio</SelectItem>
                      <SelectItem value="Vonage">Vonage</SelectItem>
                      <SelectItem value="Bandwidth">Bandwidth</SelectItem>
                      <SelectItem value="Telnyx">Telnyx</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Display Name" required>
                  <Input placeholder="Friendly name for your team" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
                </Field>
                <Field label="SIP Domain" required>
                  <Input placeholder="sip.twilio.com" value={form.sipDomain} onChange={(e) => setForm({ ...form, sipDomain: e.target.value })} className="font-mono text-sm" />
                </Field>
                <Field label="Username" required>
                  <Input placeholder="user123" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="font-mono text-sm" />
                </Field>
                <Field label="Password" required>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} placeholder="••••••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-9 font-mono text-sm" />
                    <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </Field>
              </div>

              <Field label="Transport Protocol" required>
                <ToggleGroup
                  type="single"
                  value={transport}
                  onValueChange={(v) => { if (v) setTransport(v as Transport) }}
                  spacing={0}
                  variant="outline"
                  aria-label="Transport protocol"
                >
                  {(["TCP", "UDP", "TLS"] as Transport[]).map((t) => (
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
                <p className="text-xs text-muted-foreground">Choose the protocol for SIP communication.</p>
              </Field>

              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3">
                <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Need help?{" "}
                  <a href="https://docs.agora.io/en" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Learn how to add an outbound SIP number.
                  </a>
                </p>
              </div>
            </div>

            <div className="border-t border-border px-5 py-3">
              <Button className="w-full" onClick={handleAdd} disabled={!canAdd}>Add Phone Number</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <p className="text-sm font-medium">Phone number added successfully!</p>
              </div>

              <div className="space-y-2 text-sm">
                <Summary label="Phone Number" value={form.number || "+1 (555) 789-4734"} />
                <Summary label="Display Name" value={form.displayName || "New number"} />
                <Summary label="SIP Domain" value={form.sipDomain || "sip.domain.com"} />
                <Summary label="Vendor" value={form.vendor || "Twilio"} />
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
                      onAdded({ number: form.number || "+1 (555) 789-4734", label: form.displayName || "New number" })
                      setOpen(false)
                      reset()
                    }}
                  >
                    Link to this agent
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => { setOpen(false); reset() }}>Done — don&apos;t link yet</Button>
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
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
