"use client"

import * as React from "react"
import type { useRouter } from "next/navigation"
import {
  PhoneIncoming,
  PhoneOutgoing,
  Code2,
  Globe,
  Upload,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CodeBlock } from "@/components/code-block"
import { PHONE_NUMBERS } from "@/lib/campaign-data"
import { track, Events, timeToLiveMs } from "@/lib/analytics"
import { toast } from "sonner"

/**
 * channel-configs — the shared, reusable channel building blocks (2026-06-24).
 *
 * Extracted out of `agent-deployment-panel.tsx` (where they were module-private)
 * so BOTH the legacy deploy panel AND the new creation wizard
 * (`components/wizard/*`) consume one source of truth for "how a channel goes
 * live". The wizard reuses `ConfigCard` / `GoLiveButton` / `publishDeployment` /
 * `EmbedConfig` / `WebWidgetConfig` directly; `InboundConfig` / `BatchConfig`
 * keep the legacy panel working unchanged.
 */

export type Channel = "inbound" | "batch" | "code" | "web"

/** The four ways an agent goes live — used by the panel's 2×2 channel chooser. */
export const CHANNELS: {
  id: Channel
  label: string
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: "inbound", label: "Inbound", title: "Answer a phone number", desc: "Your agent picks up every inbound call, 24/7.", icon: PhoneIncoming },
  { id: "batch", label: "Batch calls", title: "Launch batch calls", desc: "Upload a contact list and your agent dials each one.", icon: PhoneOutgoing },
  { id: "code", label: "Embed", title: "Embed in your app", desc: "Drop in the SDK or call the API — no number needed.", icon: Code2 },
  { id: "web", label: "Web widget", title: "Web widget", desc: "A floating chat/voice widget for your website.", icon: Globe },
]

/**
 * publishDeployment — the one shared go-live action.
 *
 * Fires the north-star event (`deployment_went_live`) + time-to-live, toasts,
 * then lands on Monitor (the post-publish home, NOT a config detour). Both the
 * legacy panel's `goLive` and the wizard's Publish step call this so the funnel
 * is measured identically from every entry point.
 */
export function publishDeployment({
  router,
  agentId,
  agentName,
  channel,
  name,
}: {
  router: ReturnType<typeof useRouter>
  agentId: string
  agentName: string
  channel: string
  name: string
}) {
  track(Events.deployment_went_live, { agent_id: agentId, channel })
  const ms = timeToLiveMs()
  if (ms != null) track(Events.time_to_live_ms, { ms, agent_id: agentId })
  toast.success(`${name || "Deployment"} is live`, {
    description: `${agentName || "Your agent"} is now answering on ${channel}.`,
  })
  router.push(
    "/monitor?" +
      new URLSearchParams({ deployed: name, channel, agent: agentName }),
  )
}

// ─── Shared frame + button ────────────────────────────────────────────────────

/** A titled card the channel config lives inside. */
export function ConfigCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </section>
  )
}

export function GoLiveButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean
  label: string
  onClick: () => void
}) {
  return (
    <div className="space-y-1.5">
      <Button className="w-full sm:w-auto" disabled={disabled} onClick={onClick}>
        {label}
      </Button>
      {disabled && (
        <p className="text-xs text-muted-foreground">Save this agent first.</p>
      )}
    </div>
  )
}

// ─── Legacy channel configs (consumed by agent-deployment-panel) ──────────────

export function InboundConfig({
  disabled,
  onGoLive,
}: {
  disabled: boolean
  onGoLive: (channel: string, name: string) => void
}) {
  const available = PHONE_NUMBERS.filter((n) => n.status === "unassigned")
  const [name, setName] = React.useState("")
  const [number, setNumber] = React.useState(available[0]?.id ?? "")
  const [greeting, setGreeting] = React.useState(
    "Hi, thanks for calling — how can I help you today?",
  )
  const [prompt, setPrompt] = React.useState(
    "You answer inbound calls. Be concise, helpful, and route to a human if asked.",
  )

  return (
    <ConfigCard title="Answer a phone number">
      <div className="space-y-2">
        <Label htmlFor="ib-name" className="text-sm font-medium">Deployment name</Label>
        <Input
          id="ib-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Support Line"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Phone number</Label>
        <Select value={number} onValueChange={setNumber}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Choose an available number" />
          </SelectTrigger>
          <SelectContent>
            {available.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.number} · {n.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          No number free? Agora routes your own carrier number — connect one via SIP.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ib-greeting" className="text-sm font-medium">Greeting</Label>
        <Textarea
          id="ib-greeting"
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          className="min-h-[64px] text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ib-prompt" className="text-sm font-medium">System prompt</Label>
        <Textarea
          id="ib-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[96px] text-sm font-mono"
        />
      </div>

      <GoLiveButton
        disabled={disabled}
        label="Go live"
        onClick={() => onGoLive("Inbound", name || "Inbound deployment")}
      />
    </ConfigCard>
  )
}

export function BatchConfig({
  disabled,
  onGoLive,
}: {
  disabled: boolean
  onGoLive: (channel: string, name: string) => void
}) {
  const [name, setName] = React.useState("")
  const [file, setFile] = React.useState<string | null>(null)
  const [greeting, setGreeting] = React.useState(
    "Hi, this is a quick call from Acme — do you have a moment?",
  )
  const [prompt, setPrompt] = React.useState(
    "You make outbound calls to the uploaded contacts. Be brief and respect a no.",
  )

  const pickFile = () => {
    setFile("contacts.csv")
    toast.success("contacts.csv attached", { description: "248 contacts detected." })
  }

  return (
    <ConfigCard title="Launch batch calls">
      <div className="space-y-2">
        <Label htmlFor="bc-name" className="text-sm font-medium">Batch name</Label>
        <Input
          id="bc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Q3 Renewals"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Contacts</Label>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={pickFile}>
            <Upload className="h-3.5 w-3.5" /> Upload contacts CSV
          </Button>
          {file && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-primary" /> {file}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Columns become dynamic variables your agent can use — name, account, etc.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bc-greeting" className="text-sm font-medium">Greeting</Label>
        <Textarea
          id="bc-greeting"
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          className="min-h-[64px] text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bc-prompt" className="text-sm font-medium">Prompt</Label>
        <Textarea
          id="bc-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[96px] text-sm font-mono"
        />
      </div>

      <GoLiveButton
        disabled={disabled}
        label="Launch batch"
        onClick={() => onGoLive("Batch calls", name || "Batch deployment")}
      />
    </ConfigCard>
  )
}

export function EmbedConfig({ agentId }: { agentId: string }) {
  const snippet = `npm install @agora/agent-sdk

import { AgentClient } from "@agora/agent-sdk"

const client = new AgentClient({
  agentId: "${agentId}",
  apiKey: process.env.AGORA_API_KEY,
})

await client.connect()`

  return (
    <ConfigCard title="Embed in your app">
      <p className="text-sm text-muted-foreground">
        Install the SDK and connect to this agent. No phone number needed — it runs
        wherever your app does.
      </p>
      <CodeBlock language="typescript" filename="agent.ts">
        {snippet}
      </CodeBlock>
      <p className="text-xs text-muted-foreground">
        Your API key lives in Project Settings. The agent goes live the first time a
        client connects.
      </p>
    </ConfigCard>
  )
}

export function WebWidgetConfig({ agentId }: { agentId: string }) {
  const [title, setTitle] = React.useState("Chat with us")
  const [greeting, setGreeting] = React.useState("Hi! How can I help?")

  const snippet = `<script
  src="https://cdn.agora.io/agent-widget.js"
  data-agent-id="${agentId}"
  data-title="${title}"
  data-greeting="${greeting}"
  async
></script>`

  return (
    <ConfigCard title="Web widget">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ww-title" className="text-sm font-medium">Widget title</Label>
          <Input
            id="ww-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ww-greeting" className="text-sm font-medium">Greeting</Label>
          <Input
            id="ww-greeting"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Paste this before <code className="font-mono text-xs">&lt;/body&gt;</code> on
        any page — the floating widget appears, wired to this agent.
      </p>
      <CodeBlock language="html" filename="index.html">
        {snippet}
      </CodeBlock>
    </ConfigCard>
  )
}
