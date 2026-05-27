"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, MessageSquare, Plus, Globe } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { markActivationStep } from "@/components/activation-checklist"

export default function DeploySmsPage() {
  const [agent, setAgent] = React.useState("agt_01")
  const [number, setNumber] = React.useState("+1 (415) 555-0142")
  const [autoReply, setAutoReply] = React.useState(true)
  const [welcome, setWelcome] = React.useState("Hi! You're texting Acme support. What can I help with?")

  const handleEnable = () => {
    markActivationStep("deploy")
    toast.success("SMS deployment enabled", {
      description: `${number} now routes inbound texts to your agent.`,
    })
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Deploy to SMS"
        description="Text conversations with your agent. Two-way, with media support."
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/deploy"><ArrowRight className="h-3.5 w-3.5 rotate-180" /> All channels</Link>
          </Button>
        }
      />

      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /> Setup</CardTitle>
                <CardDescription>SMS uses the same phone number pool as Telephony. Reuse a number or buy a new one with SMS capability.</CardDescription>
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>SMS-capable number</Label>
                  <div className="flex gap-2">
                    <Select value={number} onValueChange={setNumber}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+1 (415) 555-0142">+1 (415) 555-0142 — Voice + SMS</SelectItem>
                        <SelectItem value="+1 (628) 555-0177">+1 (628) 555-0177 — Voice + SMS</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="default" asChild>
                      <Link href="/deploy/telephony"><Plus className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Behaviour</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-reply on first message</p>
                    <p className="text-xs text-muted-foreground">Send a welcome message when someone texts for the first time.</p>
                  </div>
                  <Switch checked={autoReply} onCheckedChange={setAutoReply} />
                </div>
                {autoReply && (
                  <div className="space-y-1.5">
                    <Label>Welcome message</Label>
                    <Textarea value={welcome} onChange={(e) => setWelcome(e.target.value)} rows={3} />
                    <p className="text-xs text-muted-foreground tabular-nums">{welcome.length} / 160 characters</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button onClick={handleEnable} className="w-full sm:w-auto">Enable SMS deployment</Button>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /> Coverage</CardTitle></CardHeader>
              <CardContent className="text-xs space-y-2">
                <p className="text-muted-foreground">SMS available on numbers in:</p>
                <ul className="text-xs space-y-1 list-disc pl-4">
                  <li>United States</li>
                  <li>Canada</li>
                  <li>United Kingdom</li>
                  <li>Most EU countries</li>
                </ul>
                <p className="text-[10px] text-muted-foreground pt-2 border-t">A2P 10DLC registration required for US numbers.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
