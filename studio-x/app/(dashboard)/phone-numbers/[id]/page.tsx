"use client"

import * as React from "react"
import { use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, AlertTriangle, Phone, PhoneForwarded, Megaphone, ClipboardCheck, Bot, Unlink,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PHONE_NUMBERS, CAMPAIGNS, AGENTS } from "@/lib/campaign-data"
import { toast } from "sonner"

export default function EditPhoneNumberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const number = PHONE_NUMBERS.find((n) => n.id === id)
  // pn_new is the synthetic "just added" id from the add sheet
  const isNew = id === "pn_new"
  if (!number && !isNew) notFound()

  const assignedCampaigns = (number?.assignedTo ?? []).map((cid) => CAMPAIGNS.find((c) => c.id === cid)).filter(Boolean)
  const usedByCampaigns = assignedCampaigns.length > 0
  const assignedAgent = number?.assignedAgent

  // Inbound settings
  const [agent, setAgent] = React.useState(assignedAgent?.id ?? "none")
  const [detached, setDetached] = React.useState(false)
  const [recording, setRecording] = React.useState(true)
  const [transcript, setTranscript] = React.useState(true)
  const [transfer, setTransfer] = React.useState(true)
  const [transferDest, setTransferDest] = React.useState("")
  const [transferCriteria, setTransferCriteria] = React.useState("")
  // Hang-up
  const [endOfConversation, setEndOfConversation] = React.useState(true)
  const [maxDuration, setMaxDuration] = React.useState(300)
  const [silenceHangup, setSilenceHangup] = React.useState(true)
  const [silenceTimeout, setSilenceTimeout] = React.useState(120)
  // Post-call analysis
  const [successEval, setSuccessEval] = React.useState(true)
  const [evalCriteria, setEvalCriteria] = React.useState("")

  // Lock state: numbers used by campaigns are hard-locked (cancel the campaigns
  // to edit); numbers bound directly to an agent can be unlocked in place by
  // detaching the agent. Free numbers are fully editable.
  const usedByAgent = !usedByCampaigns && !!assignedAgent
  const locked = usedByCampaigns || (usedByAgent && !detached)

  const detachAgent = () => {
    setDetached(true)
    setAgent("none")
    toast.info(`Detached ${assignedAgent?.name ?? "agent"} — you can now edit this number.`)
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title={number?.number ?? "New Phone Number"}
        description="Configure your imported SIP number."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="gap-1.5">
              <Link href="/phone-numbers"><ArrowLeft className="h-3.5 w-3.5" /> Phone Numbers</Link>
            </Button>
            <Button size="sm" onClick={() => toast.success("Phone number saved (mock)")}>Save</Button>
          </div>
        }
      />

      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          {/* Lock banner — campaigns (hard lock) vs agent (detachable in place) */}
          {usedByCampaigns && (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  This number is being used by {assignedCampaigns.length} campaign{assignedCampaigns.length > 1 ? "s" : ""}.
                  {" "}To edit its details, cancel the campaign{assignedCampaigns.length > 1 ? "s" : ""} to proceed.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href={`/campaigns/${assignedCampaigns[0]!.id}`}>View Campaigns</Link>
              </Button>
            </div>
          )}
          {usedByAgent && !detached && (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex items-start gap-2.5">
                <Bot className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  This number is being used by an Agent. Detach the assigned agent
                  {" "}<span className="font-medium">{assignedAgent?.name}</span> if you wish to edit its details.
                </p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={detachAgent}>
                <Unlink className="h-3.5 w-3.5" /> Detach Assigned Agent
              </Button>
            </div>
          )}

          {/* Phone Number Details (SIP) */}
          <Section icon={Phone} title="Phone Number Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInput label="Phone Number" value={number?.number ?? ""} disabled mono />
              <FieldSelect label="Vendor" value={number?.vendor ?? "Twilio"} options={["Twilio", "Vonage", "Bandwidth", "Telnyx"]} disabled={locked} />
              <FieldInput label="Display Name" value={number?.label ?? ""} disabled={locked} />
              <FieldInput label="SIP Trunk Address" placeholder="agora-us-swym-us.pstn…" disabled={locked} mono />
              <FieldInput label="SIP Trunk Username" value="user123" disabled={locked} mono />
              <FieldInput label="SIP Trunk Password" value="••••••••••••••••" type="password" disabled={locked} mono />
            </div>
            <div className="space-y-1.5">
              <Label>Transport Protocol</Label>
              <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5 w-fit">
                {["TCP", "UDP", "TLS"].map((t, i) => (
                  <span key={t} className={"rounded px-3 h-7 inline-flex items-center text-xs font-medium " + (i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground")}>{t}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Choose the protocol for SIP communication.</p>
            </div>
          </Section>

          {/* Inbound Settings */}
          <Section icon={PhoneForwarded} title="Inbound Settings">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label>Assign to Agent</Label>
                {assignedAgent && !detached && (
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={detachAgent}>
                    <Unlink className="h-3 w-3" /> Detach Assigned Agent
                  </Button>
                )}
              </div>
              <Select value={agent} onValueChange={setAgent} disabled={locked}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {AGENTS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">All incoming calls to this number will be answered by this agent.</p>
            </div>
            <Toggle label="Call Recording" desc="Enable automatic call recording." checked={recording} onChange={setRecording} />
            <Toggle label="Call Transcript" desc="Enable automatic call transcription." checked={transcript} onChange={setTranscript} />
            <Toggle label="Transfer Call to Human" desc="Transfers to a human agent when needed or asked for." checked={transfer} onChange={setTransfer} />
            {transfer && (
              <div className="space-y-3 pl-1">
                <div className="space-y-1.5">
                  <Label>Transfer Destination</Label>
                  <Input placeholder="5550001234, or E.164 +15550001234, or SIP address" value={transferDest} onChange={(e) => setTransferDest(e.target.value)} className="font-mono text-sm" />
                  <p className="text-xs text-muted-foreground">Detects automatically between Phone, E.164, and SIP.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Transfer Criteria</Label>
                  <Textarea placeholder="Describe when calls should be transferred to a human…" value={transferCriteria} onChange={(e) => setTransferCriteria(e.target.value)} rows={2} />
                </div>
              </div>
            )}
          </Section>

          {/* Hang-up Configuration */}
          <Section icon={Phone} title="Hang-up Configuration">
            <Toggle label="End of Conversation" desc="Hang up when the conversation concludes naturally." checked={endOfConversation} onChange={setEndOfConversation} />
            <div className="space-y-1.5">
              <Label>Max Call Duration (seconds)</Label>
              <Input type="number" value={maxDuration} onChange={(e) => setMaxDuration(Number(e.target.value))} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Maximum length for a conversation.</p>
            </div>
            <Toggle label="Silence Hangup" desc="The call hangs up automatically if the user is silent for too long." checked={silenceHangup} onChange={setSilenceHangup} />
            {silenceHangup && (
              <div className="space-y-1.5">
                <Label>Silence Timeout (seconds)</Label>
                <Input type="number" value={silenceTimeout} onChange={(e) => setSilenceTimeout(Number(e.target.value))} className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground">Call ends after {silenceTimeout} seconds of no response.</p>
              </div>
            )}
          </Section>

          {/* Post Call Analysis */}
          <Section icon={ClipboardCheck} title="Post Call Analysis">
            <Toggle label="Success Evaluation" desc='Evaluate whether the call with a user was "Successful" or "Failed".' checked={successEval} onChange={setSuccessEval} />
            {successEval && (
              <div className="space-y-1.5">
                <Label>Evaluation Criteria</Label>
                <Textarea
                  placeholder="Evaluate whether the agent's call with the user was successful. Consider whether the issue was resolved, communication clarity, professionalism, and adherence to policy…"
                  value={evalCriteria}
                  onChange={(e) => setEvalCriteria(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </Section>

          {/* Assigned campaigns list (when in use) */}
          {usedByCampaigns && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold">Used by campaigns</p>
                <div className="space-y-1.5">
                  {assignedCampaigns.map((c) => (
                    <Link key={c!.id} href={`/campaigns/${c!.id}`} className="flex items-center justify-between text-sm hover:text-primary transition-colors">
                      <span className="inline-flex items-center gap-2"><Megaphone className="h-3.5 w-3.5 text-muted-foreground" /> {c!.name}</span>
                      <Badge variant="outline" className="text-xs">{c!.type}</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <Separator />
        {children}
      </CardContent>
    </Card>
  )
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
    </div>
  )
}

function FieldInput({ label, value, placeholder, disabled, mono, type }: { label: string; value?: string; placeholder?: string; disabled?: boolean; mono?: boolean; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input defaultValue={value} placeholder={placeholder} disabled={disabled} type={type} className={mono ? "font-mono text-sm" : "text-sm"} />
    </div>
  )
}

function FieldSelect({ label, value, options, disabled }: { label: string; value: string; options: string[]; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select defaultValue={value} disabled={disabled}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
