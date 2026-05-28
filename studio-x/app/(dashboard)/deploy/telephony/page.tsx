"use client"

import * as React from "react"
import Link from "next/link"
import {
  Phone, ArrowRight, Plus, Search, Globe, Building2, Headphones,
  CheckCircle2, Megaphone,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { track, Events } from "@/lib/analytics"
import { markActivationStep } from "@/components/activation-checklist"

// ─── stub catalog of buyable numbers ────────────────────────────────────────

const BUYABLE_NUMBERS = [
  { number: "+1 (415) 555-0142", region: "US — San Francisco, CA", capabilities: ["Voice", "SMS"],   monthly: "$1.15" },
  { number: "+1 (628) 555-0177", region: "US — San Francisco, CA", capabilities: ["Voice", "SMS"],   monthly: "$1.15" },
  { number: "+1 (212) 555-0193", region: "US — New York, NY",      capabilities: ["Voice"],          monthly: "$1.50" },
  { number: "+44 20 7946 0102", region: "UK — London",             capabilities: ["Voice", "SMS"],   monthly: "$2.20" },
  { number: "+1 (800) 555-0167", region: "US — Toll-free",         capabilities: ["Voice", "SMS"],   monthly: "$3.50" },
]

// ─── component ───────────────────────────────────────────────────────────────

export default function DeployTelephonyPage() {
  const [agent, setAgent] = React.useState("agt_01")
  const [country, setCountry] = React.useState("US")
  const [areaCode, setAreaCode] = React.useState("")
  const [selected, setSelected] = React.useState<string | null>(null)
  const [purchasing, setPurchasing] = React.useState(false)

  const handlePurchase = async () => {
    if (!selected) return
    setPurchasing(true)
    track(Events.phone_number_imported, { number: selected, agent_id: agent } as Record<string, unknown>)
    await new Promise((r) => setTimeout(r, 900))
    setPurchasing(false)
    markActivationStep("deploy")
    toast.success("Number purchased + assigned", {
      description: `${selected} is now routing to your agent. Try calling it.`,
      action: { label: "View number", onClick: () => {} },
    })
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Deploy to Telephony"
        description="Buy or import a phone number, assign it to an agent, and start taking calls."
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/deploy"><ArrowRight className="h-3.5 w-3.5 rotate-180" /> All channels</Link>
          </Button>
        }
      />

      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div className="space-y-5">
            <Tabs defaultValue="buy">
              <TabsList>
                <TabsTrigger value="buy">Buy from Agora</TabsTrigger>
                <TabsTrigger value="import">Import from carrier</TabsTrigger>
                <TabsTrigger value="byoc">Bring your own SIP trunk</TabsTrigger>
              </TabsList>

              {/* Buy from Agora */}
              <TabsContent value="buy" className="space-y-4 pt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Search for a number</CardTitle>
                    <CardDescription>Numbers are leased monthly — cancel any time.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Country</Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Area code (optional)</Label>
                        <Input
                          value={areaCode}
                          onChange={(e) => setAreaCode(e.target.value)}
                          placeholder="e.g. 415"
                        />
                      </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {BUYABLE_NUMBERS.length} numbers available
                      </p>
                      {BUYABLE_NUMBERS.map((n) => {
                        const isSelected = selected === n.number
                        return (
                          <button
                            key={n.number}
                            onClick={() => setSelected(isSelected ? null : n.number)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                              isSelected ? "border-primary ring-1 ring-primary/30 bg-primary/[0.04]" : "hover:bg-accent/30"
                            }`}
                          >
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-sm">{n.number}</p>
                              <p className="text-xs text-muted-foreground">{n.region}</p>
                            </div>
                            <div className="flex gap-1.5">
                              {n.capabilities.map((c) => (
                                <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                              ))}
                            </div>
                            <span className="text-sm tabular-nums font-medium ml-2">{n.monthly}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Assign to agent</CardTitle>
                    <CardDescription>The number routes incoming calls to this agent.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Agent</Label>
                      <Select value={agent} onValueChange={setAgent}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agt_01">Support Bot v2 (Live)</SelectItem>
                          <SelectItem value="agt_03">Appointment Setter (Live)</SelectItem>
                          <SelectItem value="agt_05">Survey Bot (Live)</SelectItem>
                          <SelectItem value="agt_02">Sales Qualifier (Draft)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Draft agents can be assigned but won't take live calls until deployed.
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      disabled={!selected || purchasing}
                      onClick={handlePurchase}
                    >
                      {purchasing ? "Purchasing…" : selected ? `Purchase ${selected} & assign` : "Pick a number above"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Import from carrier */}
              <TabsContent value="import" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Import a number you already own</CardTitle>
                    <CardDescription>
                      We support Twilio, Vonage, Bandwidth, Telnyx, Plivo. Bring your account credentials
                      and we'll pull your numbers into Studio_X.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Carrier</Label>
                      <Select defaultValue="twilio">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twilio">Twilio</SelectItem>
                          <SelectItem value="vonage">Vonage</SelectItem>
                          <SelectItem value="bandwidth">Bandwidth</SelectItem>
                          <SelectItem value="telnyx">Telnyx</SelectItem>
                          <SelectItem value="plivo">Plivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label>Account SID</Label><Input placeholder="AC••••••" /></div>
                      <div className="space-y-1.5"><Label>Auth Token</Label><Input type="password" placeholder="••••••" /></div>
                    </div>
                    <Button className="w-full">
                      <Search className="h-4 w-4" /> Fetch numbers from Twilio
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BYOC */}
              <TabsContent value="byoc" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">SIP trunk credentials</CardTitle>
                    <CardDescription>For enterprise telephony. We'll connect to your existing PBX.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5"><Label>SIP URI</Label><Input className="font-mono text-sm" placeholder="sip:trunk.acme.com" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label>Username</Label><Input /></div>
                      <div className="space-y-1.5"><Label>Password</Label><Input type="password" /></div>
                    </div>
                    <Button className="w-full">Test connection</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right rail — quick reference */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /> Coverage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Countries</span><span className="font-medium tabular-nums">62</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Toll-free</span><span className="font-medium">US, UK, CA</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">SMS</span><span className="font-medium">US, UK, EU</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> Enterprise</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>Need volume pricing, dedicated numbers, or carrier compliance review?</p>
                <Button variant="ghost" size="sm" className="mt-2 -ml-2" asChild>
                  <Link href="/help/contact-sales">Talk to sales →</Link>
                </Button>
              </CardContent>
            </Card>
            {/* Manage existing — links to the routes that lost their sidebar slot */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Manage existing</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5">
                <Button variant="ghost" size="sm" className="w-full justify-between -mx-2" asChild>
                  <Link href="/telephony/phone-numbers">
                    <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Numbers</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-between -mx-2" asChild>
                  <Link href="/telephony/campaigns">
                    <span className="flex items-center gap-2"><Megaphone className="h-3.5 w-3.5 text-muted-foreground" /> Campaigns</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Headphones className="h-4 w-4 text-muted-foreground" /> Tip</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Test your agent in the browser first — no number needed.</p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/agents">Open playground</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
