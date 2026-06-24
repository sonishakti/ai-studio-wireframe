"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  PhoneIncoming,
  PhoneOutgoing,
  Code2,
  Globe,
  Check,
  ChevronRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import type { Agent } from "@/lib/campaign-data"
import { PHONE_NUMBERS } from "@/lib/campaign-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CodeBlock } from "@/components/code-block"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"

// ── Variant C — "Settled identity header + Channel hero" ─────────────────────
// Persona = WHO (set once, collapsed into a slim summary bar + Edit sheet).
// Channel = WHERE/HOW it goes live (the hero — foregrounded, dominates).

const TONES = ["Friendly", "Professional", "Neutral", "Playful"] as const
const LANGUAGES = ["en-US", "en-GB", "es-ES", "hi-IN", "ja-JP"] as const

type Persona = { tone: string; language: string; personality: string; brand: string }

type ChannelId = "inbound" | "batch" | "code" | "web"
const CHANNELS: { id: ChannelId; label: string; icon: LucideIcon }[] = [
  { id: "inbound", label: "Answer a phone number", icon: PhoneIncoming },
  { id: "batch", label: "Launch batch calls", icon: PhoneOutgoing },
  { id: "code", label: "Embed in your app", icon: Code2 },
  { id: "web", label: "Web widget", icon: Globe },
]

export function DeployVariantC({ id, agent }: { id: string; agent?: Agent }) {
  const isNew = id === "new"
  const agentName = agent?.name ?? "Aria"

  // Persona — stable identity, edited inside the sheet. One object: WHO the agent is.
  const [persona, setPersona] = React.useState<Persona>({
    tone: agent?.persona.tone ?? "Friendly",
    language: agent?.persona.language ?? "en-US",
    personality: agent?.persona.personality ?? "",
    brand: agent?.persona.brand ?? "",
  })
  const set = (patch: Partial<Persona>) => setPersona((p) => ({ ...p, ...patch }))

  // Channel — the task being performed.
  const [channel, setChannel] = React.useState<ChannelId>("inbound")
  const [name, setName] = React.useState("")
  const [number, setNumber] = React.useState("")
  const [greeting, setGreeting] = React.useState("")
  const [prompt, setPrompt] = React.useState("")

  const openNumbers = PHONE_NUMBERS.filter((n) => n.assignedTo.length === 0)
  const isCall = channel === "inbound" || channel === "batch"
  const snippet =
    channel === "code"
      ? `import { Agora } from "@agora/agent-sdk"\n\nconst agent = new Agora({ agentId: "${id}", apiKey: process.env.AGORA_KEY })\nawait agent.connect()`
      : `<script src="https://cdn.agora.io/widget.js"\n  data-agent="${id}"\n  data-mode="voice"\n  async></script>`

  const goLive = () =>
    toast.success(`${name.trim() || "Deployment"} is live`)

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-2">
      {/* ── Persona summary bar — collapsed identity, set once ─────────────── */}
      <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          {agentName.charAt(0)}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{agentName}</span>
          {` · ${persona.tone} · ${persona.language}${persona.brand ? ` · ${persona.brand}` : ""}`}
        </p>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="shrink-0 gap-1 text-muted-foreground">
              Edit persona
              <ChevronRight className="size-3.5" />
            </Button>
          </SheetTrigger>
          <PersonaSheet persona={persona} set={set} />
        </Sheet>
      </div>

      {/* ── Channel hero — the task, foregrounded ──────────────────────────── */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Choose how it goes live</h2>
          <p className="text-sm text-muted-foreground">
            One agent, one channel. Pick where {agentName} should start taking traffic.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {CHANNELS.map((c) => {
            const active = channel === c.id
            const Icon = c.icon
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                aria-pressed={active}
                className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  active
                    ? "border-primary bg-primary/5"
                    : "bg-card hover:border-foreground/20 hover:bg-accent/40"
                }`}
              >
                <Icon
                  className={`size-5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="flex-1 text-sm font-medium">{c.label}</span>
                {active && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Inline config for the selected channel ─────────────────────────── */}
      <div className="space-y-5 border-t pt-6">
        {isCall ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Deployment name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={channel === "inbound" ? "Support line" : "Q3 outreach"}
                />
              </Field>
              <Field label="Phone number">
                <Select value={number} onValueChange={setNumber}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a number" />
                  </SelectTrigger>
                  <SelectContent>
                    {openNumbers.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.number} · {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Greeting">
              <Textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Hi, thanks for calling — how can I help today?"
                rows={2}
              />
            </Field>
            <Field label="Prompt">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what this deployment should accomplish on every call…"
                rows={4}
              />
            </Field>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Drop this into your {channel === "code" ? "app" : "site"} — {agentName} goes live the
              moment it loads.
            </p>
            <CodeBlock
              language={channel === "code" ? "typescript" : "html"}
              filename={channel === "code" ? "agent.ts" : "widget.html"}
            >
              {snippet}
            </CodeBlock>
          </div>
        )}

        {/* ── Go live ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <p className="text-xs text-muted-foreground">
            {isNew
              ? "Save this agent before going live."
              : isCall
                ? "Goes live immediately and starts taking calls."
                : "Snippet activates as soon as it loads in your environment."}
          </p>
          <Button onClick={goLive} disabled={isNew} className="gap-1.5">
            <Sparkles className="size-4" />
            Go live
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Field — label + control, consistent spacing ──────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

// ── Persona sheet — the full identity form, opened from the summary bar ───────
function PersonaSheet({
  persona,
  set,
}: {
  persona: Persona
  set: (patch: Partial<Persona>) => void
}) {
  return (
    <SheetContent className="w-full gap-0 sm:max-w-md">
      <SheetHeader className="border-b">
        <SheetTitle>Edit persona</SheetTitle>
        <SheetDescription>
          Who the agent is — its voice and identity. Set once, reused everywhere it deploys.
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tone">
            <Select value={persona.tone} onValueChange={(tone) => set({ tone })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Language">
            <Select value={persona.language} onValueChange={(language) => set({ language })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Personality">
          <Textarea
            value={persona.personality}
            onChange={(e) => set({ personality: e.target.value })}
            placeholder="Warm, patient, solution-first…"
            rows={4}
          />
        </Field>
        <Field label="Brand">
          <Input
            value={persona.brand}
            onChange={(e) => set({ brand: e.target.value })}
            placeholder="Acme"
          />
        </Field>
      </div>
      <SheetFooter className="border-t">
        <SheetClose asChild>
          <Button className="w-full">Done</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  )
}
