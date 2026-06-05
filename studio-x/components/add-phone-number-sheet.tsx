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
import { cn } from "@/lib/utils"
import {
  CheckCircle2, Eye, EyeOff, PhoneIncoming, Megaphone, ArrowRight, HelpCircle,
} from "lucide-react"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"

type Phase = "form" | "success"
type Transport = "TCP" | "UDP" | "TLS"

export function AddPhoneNumberSheet({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [phase, setPhase] = React.useState<Phase>("form")
  const [showPw, setShowPw] = React.useState(false)
  const [transport, setTransport] = React.useState<Transport>("TCP")
  const [form, setForm] = React.useState({ number: "", vendor: "", displayName: "", sipDomain: "", username: "", password: "" })

  const reset = () => {
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
      <SheetContent className="sm:max-w-[480px] w-full overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle>Add Phone Number</SheetTitle>
          {phase === "form" && (
            <SheetDescription>Import an existing SIP number from your carrier.</SheetDescription>
          )}
        </SheetHeader>

        {phase === "form" ? (
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
                    <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </Field>
              </div>

              <Field label="Transport Protocol" required>
                <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5 w-fit">
                  {(["TCP", "UDP", "TLS"] as Transport[]).map((t) => (
                    <button key={t} type="button" onClick={() => setTransport(t)}
                      className={cn("rounded px-3 h-7 text-xs font-medium transition-colors", transport === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                      {t}
                    </button>
                  ))}
                </div>
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
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-medium">Phone number added successfully!</p>
              </div>

              <div className="space-y-2 text-sm">
                <Summary label="Phone Number" value={form.number || "+1 (555) 789-4734"} />
                <Summary label="Display Name" value={form.displayName || "New number"} />
                <Summary label="SIP Domain" value={form.sipDomain || "sip.domain.com"} />
                <Summary label="Vendor" value={form.vendor || "Twilio"} />
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-sm font-medium">Configure this number?</p>
                <p className="text-xs text-muted-foreground">Route this number to:</p>
                <RouteCard
                  icon={PhoneIncoming}
                  title="Set up inbound"
                  desc="Route incoming calls to an agent."
                  onClick={() => {
                    setOpen(false)
                    toast.success("Opening inbound setup (mock)")
                    router.push("/phone-numbers/pn_new")
                  }}
                />
                <RouteCard
                  icon={Megaphone}
                  title="Create a campaign"
                  desc="Use this number for outbound campaigns."
                  onClick={() => {
                    setOpen(false)
                    router.push("/campaigns/new?type=outbound")
                  }}
                />
              </div>
            </div>

            <div className="border-t border-border px-5 py-3 space-y-2">
              <Button variant="outline" className="w-full" onClick={reset}>Import Another</Button>
              <Button className="w-full" onClick={() => { setOpen(false); reset() }}>Done</Button>
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
    <button type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}
