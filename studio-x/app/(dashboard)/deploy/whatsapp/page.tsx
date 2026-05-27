"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, MessageCircle, Building, ShieldCheck, CheckCircle2, ExternalLink } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { markActivationStep } from "@/components/activation-checklist"

const PREREQS = [
  { label: "Meta Business account",          done: true,  detail: "Verified — Acme Inc." },
  { label: "WhatsApp Business API access",   done: false, detail: "Apply for access via Meta" },
  { label: "Verified business phone number", done: false, detail: "Used as your WhatsApp sender" },
]

export default function DeployWhatsAppPage() {
  const [agent, setAgent] = React.useState("agt_01")
  const [sender, setSender] = React.useState("")
  const [businessId, setBusinessId] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSubmitting(false)
    markActivationStep("deploy")
    toast.success("Connection request submitted", {
      description: "We'll verify your WhatsApp Business account and email you within 1 business day.",
    })
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Deploy to WhatsApp"
        description="Take voice + text on WhatsApp Business. Requires a verified business number."
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/deploy"><ArrowRight className="h-3.5 w-3.5 rotate-180" /> All channels</Link>
          </Button>
        }
      />

      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {/* Prereqs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  Prerequisites
                </CardTitle>
                <CardDescription>WhatsApp Business API requires Meta verification before agents can connect.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                {PREREQS.map((p, i) => (
                  <div key={p.label} className={`flex items-center gap-3 py-3 ${i < PREREQS.length - 1 ? "border-b" : ""}`}>
                    {p.done
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.detail}</p>
                    </div>
                    {!p.done && (
                      <Button variant="outline" size="sm" className="text-xs">
                        Set up <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  Connect WhatsApp Business
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Agent</Label>
                  <Select value={agent} onValueChange={setAgent}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agt_01">Support Bot v2 (Live)</SelectItem>
                      <SelectItem value="agt_03">Appointment Setter (Live)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Meta Business ID</Label>
                    <Input value={businessId} onChange={(e) => setBusinessId(e.target.value)} placeholder="123456789012345" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sender phone number</Label>
                    <Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="+1 415 555 0142" />
                  </div>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={submitting || !businessId || !sender}>
                  {submitting ? "Submitting…" : "Submit for verification"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right rail */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /> Pricing</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Service conversations</span><span className="font-medium">Free</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Utility messages</span><span className="font-medium tabular-nums">$0.005 each</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Marketing messages</span><span className="font-medium tabular-nums">$0.025 each</span></div>
                <p className="text-[10px] text-muted-foreground pt-2 border-t">Meta sets the rates. Studio_X passes through at cost.</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="py-4 text-xs text-muted-foreground space-y-2">
                <Badge variant="outline" className="text-[9px]">Approval time</Badge>
                <p>Most WhatsApp Business connections approve within 24 hours. Enterprise-tier customers get priority review.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
