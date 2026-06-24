"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  Info,
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
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/code-block"
import { PHONE_NUMBERS, type Agent } from "@/lib/campaign-data"
import { track, Events, timeToLiveMs } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

/**
 * AgentDeploymentPanel — the "Deploy" step of the agent editor, rebuilt as a
 * SELF-CONTAINED, in-builder deploy surface (2026-06-24).
 *
 * The whole point: configuring + going live happens HERE, on /agents/[id]/edit —
 * the user is never ejected to a /deploy/* route to finish. (Persona also moved
 * in: it used to be the builder's first step; now each deployment carries its own
 * voice + prompt.) Landing on Monitor AFTER go-live is correct — that's the
 * destination, not a config detour.
 *
 * Structure (all inline within this panel — no router nav to /deploy, no <Link>
 * to /deploy):
 *   1. Persona block (tone · language · personality · brand)
 *   2. Channel chooser — Inbound · Batch calls · Embed · Web widget
 *   3. The chosen channel's lightweight-but-real config, revealed inline
 *   4. Go live → track + toast + router.push('/monitor?…')
 *
 * Guard: a brand-new agent (id === "new") has never been saved, so go-live is
 * disabled until it persists.
 */

const TONES = ["Friendly", "Professional", "Neutral", "Playful"]
const LANGUAGES = ["en-US", "en-GB", "es-ES", "hi-IN", "ja-JP"]

type Channel = "inbound" | "batch" | "code" | "web"

const CHANNELS: {
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

export function AgentDeploymentPanel({ id, agent }: { id: string; agent?: Agent }) {
  const router = useRouter()
  const isUnsaved = id === "new" || !agent
  const agentName = agent?.name ?? "the agent"
  const [editIdentity, setEditIdentity] = React.useState(false)

  // ── Persona (moved in from the old standalone first step) ──────────────────
  const [personality, setPersonality] = React.useState(
    agent?.persona.personality ?? "Warm, concise, professional",
  )
  const [tone, setTone] = React.useState(agent?.persona.tone ?? "Friendly")
  const [language, setLanguage] = React.useState(agent?.persona.language ?? "en-US")
  const [brand, setBrand] = React.useState(agent?.persona.brand ?? "")

  // ── Channel selection — the hero. Default to the most common (inbound) so the
  // config is immediately in reach; ?dc= overrides it below. ──────────────────
  const [channel, setChannel] = React.useState<Channel | null>("inbound")

  // Preselect a channel when arriving from a channel card (?dc=…), e.g. the home's
  // "Embed in your app" → this Deploy step with the code config already open. Keeps
  // deploy fully in-context — the user is never routed to a /deploy/* page.
  React.useEffect(() => {
    const dc = new URLSearchParams(window.location.search).get("dc")
    if (dc === "inbound" || dc === "batch" || dc === "code" || dc === "web") {
      setChannel(dc)
    }
  }, [])

  // Going live: track the north-star event + time-to-live, then land on Monitor.
  const goLive = (label: string, name: string) => {
    if (isUnsaved) return
    track(Events.deployment_went_live, { agent_id: id, channel: label })
    const ms = timeToLiveMs()
    if (ms != null) track(Events.time_to_live_ms, { ms, agent_id: id })
    toast.success(`${name || "Deployment"} is live`, {
      description: `${agent?.name ?? "Your agent"} is now answering on ${label}.`,
    })
    router.push(
      "/monitor?" +
        new URLSearchParams({ deployed: name, channel: label, agent: agent?.name ?? "" }),
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {isUnsaved && (
        <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/40 p-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            Save this agent first to deploy it. Finish the Stack step, then the channels below unlock.
          </p>
        </div>
      )}

      {/* ── Persona = WHO the agent is, MODULAR per deployment (won a 5-prototype
          audit). The agent's persona is the reusable base; here you override only
          what this deployment needs — usually just the personality. Tone/language/
          brand inherit from the agent, editable via "Edit identity". ──────────── */}
      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium">Persona for this deployment</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inherits {agentName}&apos;s voice — only the personality changes here, unless you edit the identity.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dp-personality" className="text-sm font-medium">Personality for this deployment</Label>
          <Textarea
            id="dp-personality"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            className="min-h-[96px] text-sm"
            placeholder="e.g. Warm, patient, solution-first"
          />
          <p className="text-xs text-muted-foreground">
            Pre-filled from {agentName}. Edit to tailor this deployment.
          </p>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">Identity from {agentName}</p>
            <button
              type="button"
              onClick={() => setEditIdentity((v) => !v)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {editIdentity ? "Done" : "Edit identity"}
            </button>
          </div>
          {!editIdentity ? (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs font-normal">Tone · {tone}</Badge>
              <Badge variant="outline" className="text-xs font-normal">Language · {language}</Badge>
              {brand && <Badge variant="outline" className="text-xs font-normal">Brand · {brand}</Badge>}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Brand</Label>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Acme" />
              </div>
              <p className="text-xs text-muted-foreground">Edits to identity apply to this deployment only.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Channel = WHERE/HOW it goes live. The hero — the action you take on
          this screen, foregrounded. ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">Choose how it goes live</h2>
          <p className="text-sm text-muted-foreground">
            One agent, one channel. Pick where {agent?.name ?? "your agent"} starts taking traffic.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {CHANNELS.map((c) => {
            const Icon = c.icon
            const selected = channel === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                aria-pressed={selected}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-foreground/20 hover:bg-accent/40",
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1 text-sm font-medium">{c.title}</span>
                {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── 3. The chosen channel's inline config ───────────────────────────── */}
      {channel === "inbound" && (
        <InboundConfig disabled={isUnsaved} onGoLive={goLive} />
      )}
      {channel === "batch" && (
        <BatchConfig disabled={isUnsaved} onGoLive={goLive} />
      )}
      {channel === "code" && <EmbedConfig agentId={id} />}
      {channel === "web" && <WebWidgetConfig agentId={id} />}

      {/* ── 4. Footer — managing live deployments lives in Monitor (not /deploy) ── */}
      <Link
        href="/monitor"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Manage live deployments in Monitor
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

// ─── Channel configs ──────────────────────────────────────────────────────────

/** Shared frame: a titled card the channel config lives inside. */
function ConfigCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </section>
  )
}

function GoLiveButton({
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

function InboundConfig({
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

function BatchConfig({
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

function EmbedConfig({ agentId }: { agentId: string }) {
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

function WebWidgetConfig({ agentId }: { agentId: string }) {
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
