"use client"

/**
 * PROTOTYPE — Deploy step, Variant A: "TWO-COLUMN: Identity | Launch".
 *
 * Throwaway exploration. The Deploy step today crams PERSONA (who the agent is)
 * and CHANNEL (where it goes live) into one undifferentiated scroll. This variant
 * makes the split *spatial*: LEFT column = the agent's settled IDENTITY (persona,
 * set-once-and-reuse); RIGHT column = "Go live", the active deployment task
 * (pick a channel → configure → launch). The left/right split IS the mental model.
 */

import * as React from "react"
import {
  PhoneIncoming,
  PhoneOutgoing,
  Code2,
  Globe,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CodeBlock } from "@/components/code-block"
import { cn } from "@/lib/utils"
import { PHONE_NUMBERS, type Agent } from "@/lib/campaign-data"

const TONES = ["Friendly", "Professional", "Neutral", "Playful"]
const LANGUAGES = ["en-US", "en-GB", "es-ES", "hi-IN", "ja-JP"]

type ChannelId = "inbound" | "batch" | "code" | "web"

const CHANNELS: { id: ChannelId; label: string; hint: string; icon: LucideIcon }[] = [
  { id: "inbound", label: "Answer a phone number", hint: "Inbound phone", icon: PhoneIncoming },
  { id: "batch", label: "Launch batch calls", hint: "Outbound campaign", icon: PhoneOutgoing },
  { id: "code", label: "Embed in your app", hint: "SDK snippet", icon: Code2 },
  { id: "web", label: "Web widget", hint: "Drop-in script", icon: Globe },
]

const STATUS_VARIANT: Record<Agent["status"], "default" | "secondary" | "warning"> = {
  live: "default",
  draft: "secondary",
  paused: "warning",
}

const AVAILABLE_NUMBERS = PHONE_NUMBERS.filter((n) => n.status === "unassigned")

export function DeployVariantA({ id, agent }: { id: string; agent?: Agent }) {
  const isUnsaved = id === "new"
  const name = agent?.name ?? "Agent"
  const initial = name.charAt(0).toUpperCase()

  // Persona — stable identity, seeded once from the agent, editable locally.
  const [tone, setTone] = React.useState(agent?.persona.tone ?? "Friendly")
  const [language, setLanguage] = React.useState(agent?.persona.language ?? "en-US")
  const [personality, setPersonality] = React.useState(agent?.persona.personality ?? "")
  const [brand, setBrand] = React.useState(agent?.persona.brand ?? "")

  // Channel — the active "doing".
  const [channel, setChannel] = React.useState<ChannelId>("inbound")
  const [deployName, setDeployName] = React.useState("")
  const [number, setNumber] = React.useState("")
  const [greeting, setGreeting] = React.useState("")
  const [prompt, setPrompt] = React.useState("")

  function goLive() {
    toast.success(`${deployName || "Deployment"} is live`)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* LEFT — IDENTITY. Narrower, settled, set-once. "Who this agent is." */}
      <aside className="lg:col-span-1">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-foreground">{name}</span>
                {agent?.status && (
                  <Badge variant={STATUS_VARIANT[agent.status]} className="capitalize">
                    {agent.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Who {name} is — identity & voice</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Set once, reused across every channel. This is the persona, not the deployment.
          </p>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="va-tone" className="text-xs">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="va-tone" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="va-lang" className="text-xs">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="va-lang" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="va-personality" className="text-xs">Personality</Label>
              <Textarea
                id="va-personality"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Warm, concise, never pushy…"
                className="min-h-20 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="va-brand" className="text-xs">Brand</Label>
              <Input
                id="va-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Acme"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT — GO LIVE. Wider, the active task: pick a channel, configure, launch. */}
      <section className="lg:col-span-2 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Go live</h2>
          <p className="text-xs text-muted-foreground">
            Where and how {name} goes live. Pick one channel — each carries the identity above.
          </p>
        </div>

        {/* Channel chooser — a clean vertical list. Selected one expands below. */}
        <div className="space-y-2">
          {CHANNELS.map((c) => {
            const active = channel === c.id
            const Icon = c.icon
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/50"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.hint}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Inline config for the selected channel. */}
        <div className="rounded-xl border border-border bg-card p-5">
          {(channel === "inbound" || channel === "batch") && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="va-deploy-name" className="text-xs">Deployment name</Label>
                  <Input
                    id="va-deploy-name"
                    value={deployName}
                    onChange={(e) => setDeployName(e.target.value)}
                    placeholder={channel === "inbound" ? "Support line" : "Q3 outreach"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="va-number" className="text-xs">Phone number</Label>
                  <Select value={number} onValueChange={setNumber}>
                    <SelectTrigger id="va-number" className="w-full">
                      <SelectValue placeholder="Select a number" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_NUMBERS.map((n) => (
                        <SelectItem key={n.id} value={n.id}>{n.number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="va-greeting" className="text-xs">Greeting</Label>
                <Textarea
                  id="va-greeting"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Hi, thanks for calling Acme — how can I help?"
                  className="min-h-16 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="va-prompt" className="text-xs">Deployment prompt</Label>
                <Textarea
                  id="va-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Task, guardrails, and dynamic variables for this deployment…"
                  className="min-h-24 resize-none"
                />
              </div>
            </div>
          )}

          {channel === "code" && (
            <CodeBlock language="typescript" filename="agent.ts">
              {`import { AgoraAgent } from "@agora/sdk"

const agent = new AgoraAgent({
  agentId: "${id}",
  apiKey: process.env.AGORA_API_KEY,
})

await agent.connect()`}
            </CodeBlock>
          )}

          {channel === "web" && (
            <CodeBlock language="html" filename="index.html">
              {`<script
  src="https://cdn.agora.io/agent-widget.js"
  data-agent-id="${id}"
  defer
></script>`}
            </CodeBlock>
          )}
        </div>

        {/* Launch. */}
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          {isUnsaved ? (
            <p className="text-xs text-muted-foreground">
              Save this agent before going live.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Carries {name}&apos;s identity into the {CHANNELS.find((c) => c.id === channel)?.hint.toLowerCase()}.
            </p>
          )}
          <Button onClick={goLive} disabled={isUnsaved}>
            Go live
          </Button>
        </div>
      </section>
    </div>
  )
}
