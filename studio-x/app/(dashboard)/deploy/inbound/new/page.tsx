"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Rocket, Bot, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AGENTS, PHONE_NUMBERS, STACK_PRESETS, CHANNEL_LABEL, type ChannelKind } from "@/lib/campaign-data"
import { track, Events, timeToLiveMs } from "@/lib/analytics"
import { DeployContextBar } from "@/components/deploy-context-bar"
import { toast } from "sonner"

// New inbound deployment — one agent answers on ONE channel. The
// environment-specific prompt is authored here, not on the agent.
const INBOUND_CHANNELS: ChannelKind[] = ["telephony", "web", "whatsapp", "sms"]

const STARTER_PROMPT = `# ROLE
Describe who the agent is on THIS deployment — what callers need and what a
resolved conversation looks like.

# CONSTRAINTS
Keep spoken responses under 40 words. Escalate to a human when confidence is low.`

export default function NewInboundPage() {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [agentId, setAgentId] = React.useState<string>("")

  // Pre-fill the agent when arriving from the Deploy chooser (?agent=…).
  React.useEffect(() => {
    const a = new URLSearchParams(window.location.search).get("agent")
    if (a && AGENTS.some((x) => x.id === a)) setAgentId(a)
  }, [])
  const [channel, setChannel] = React.useState<ChannelKind>("telephony")
  const [numberId, setNumberId] = React.useState<string>("")
  const [prompt, setPrompt] = React.useState(STARTER_PROMPT)
  const [greeting, setGreeting] = React.useState("Thanks for reaching out — how can I help?")

  const agent = AGENTS.find((a) => a.id === agentId)
  const freeNumbers = PHONE_NUMBERS.filter((n) => n.status === "unassigned")
  const canActivate = Boolean(
    name.trim() && agentId && (channel !== "telephony" || numberId),
  )

  const handleActivate = () => {
    toast.success(`"${name}" is answering`, {
      description: `${agent?.name} is live on ${CHANNEL_LABEL[channel]}.`,
    })
    // ★ North star — traffic-ready deployment is live. Report how long the build
    // → live took (the <3-min deploy spine) when we have a build-start stamp.
    track(Events.deployment_went_live, { agent_id: agentId, channel })
    const ms = timeToLiveMs()
    if (ms != null) track(Events.time_to_live_ms, { ms, agent_id: agentId })
    // After deploy, the user wants to MONITOR it — not land on a list. Land on
    // Monitor with a "you're live" banner (the deployment carries no traffic yet).
    const q = new URLSearchParams({ deployed: name, channel: CHANNEL_LABEL[channel], agent: agent?.name ?? "" })
    router.push(`/monitor?${q.toString()}`)
  }

  const cancelHref = agentId ? `/agents/${agentId}/edit#deployment` : "/integrations?tab=channels"

  return (
    <div className="flex flex-col flex-1">
      <DeployContextBar channelLabel="New inbound deployment" />
      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">New inbound deployment</h2>
              <p className="text-sm text-muted-foreground">One agent, one channel — live in minutes.</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href={cancelHref}><ArrowLeft className="h-3.5 w-3.5" /> Cancel</Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ib-name" className="text-sm font-medium">Name</Label>
                  <Input
                    id="ib-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Support Hotline"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Channel</Label>
                  <Select value={channel} onValueChange={(v) => setChannel(v as ChannelKind)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INBOUND_CHANNELS.map((c) => (
                        <SelectItem key={c} value={c}>{CHANNEL_LABEL[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Agent</Label>
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Pick the agent that answers" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENTS.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {agent && (
                  <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">
                    <Bot className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {agent.persona.tone} · {agent.persona.language} ·{" "}
                      {STACK_PRESETS[agent.stack.preset].label} stack ({agent.stack.llm.model})
                    </span>
                  </div>
                )}
              </div>

              {channel === "web" && (
                <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/40 p-3">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground leading-relaxed">
                    Style the widget — theme, voice blob, modes, and embed snippet — in the{" "}
                    <Link href={`/deploy/web-widget?agent=${agentId}`} className="underline underline-offset-2 hover:text-primary">
                      Web Widget builder
                    </Link>.
                  </p>
                </div>
              )}

              {channel === "telephony" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Answers on</Label>
                  <Select value={numberId} onValueChange={setNumberId}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Pick a free number" />
                    </SelectTrigger>
                    <SelectContent>
                      {freeNumbers.map((n) => (
                        <SelectItem key={n.id} value={n.id}>{n.number} — {n.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Inbound is 1:1 — one agent answers everything on this number.{" "}
                    <Link href="/deploy/phone-numbers" className="underline underline-offset-2 hover:text-foreground">
                      Manage numbers
                    </Link>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ib-new-prompt" className="text-sm font-medium">System Prompt</Label>
                <Textarea
                  id="ib-new-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[180px] font-mono text-xs leading-relaxed"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                  What the agent should do when answering here.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ib-new-greeting" className="text-sm font-medium">Greeting</Label>
                <Textarea
                  id="ib-new-greeting"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" disabled={!canActivate} onClick={handleActivate}>
              <Rocket className="h-3.5 w-3.5" /> Activate
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
