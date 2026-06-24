"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  PhoneIncoming,
  PhoneOutgoing,
  Code2,
  Globe,
  Pencil,
  Rocket,
  Check,
} from "lucide-react"
import type { Agent } from "@/lib/campaign-data"
import { PHONE_NUMBERS } from "@/lib/campaign-data"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CodeBlock } from "@/components/code-block"

const TONES = ["Friendly", "Professional", "Neutral", "Playful"]
const LANGUAGES = ["en-US", "en-GB", "es-ES", "hi-IN", "ja-JP"]

type ChannelKey = "inbound" | "batch" | "code" | "web"
const CHANNELS: { key: ChannelKey; label: string; icon: typeof PhoneIncoming }[] = [
  { key: "inbound", label: "Answer a phone number", icon: PhoneIncoming },
  { key: "batch", label: "Launch batch calls", icon: PhoneOutgoing },
  { key: "code", label: "Embed in your app", icon: Code2 },
  { key: "web", label: "Web widget", icon: Globe },
]

/** Throwaway prototype — Variant B: "Tabs: Persona · Go live".
 *  Two mental models, one at a time. Persona = WHO (identity). Go live = WHERE (action). */
export function DeployVariantB({ id, agent }: { id: string; agent?: Agent }) {
  const unsaved = id === "new"

  // Persona — WHO the agent is. Stable, set once, reusable.
  const [tone, setTone] = React.useState(agent?.persona.tone ?? "Friendly")
  const [language, setLanguage] = React.useState(agent?.persona.language ?? "en-US")
  const [personality, setPersonality] = React.useState(agent?.persona.personality ?? "")
  const [brand, setBrand] = React.useState(agent?.persona.brand ?? "")

  // Go live — WHERE/HOW it ships. Variable, the "doing".
  const [tab, setTab] = React.useState("golive")
  const [channel, setChannel] = React.useState<ChannelKey>("inbound")
  const [name, setName] = React.useState("")
  const [number, setNumber] = React.useState("")
  const [greeting, setGreeting] = React.useState("")
  const [prompt, setPrompt] = React.useState("")

  const agentName = agent?.name ?? "Aria"
  const available = PHONE_NUMBERS.filter((n) => n.status === "unassigned")
  const isCall = channel === "inbound" || channel === "batch"

  const snippet =
    channel === "code"
      ? `import { Agora } from "@agora/agent-sdk"

const session = await Agora.deploy({
  agentId: "${id}",
  channel: "voice",
})`
      : `<script
  src="https://cdn.agora.io/widget.js"
  data-agent="${id}"
  async
></script>`

  function goLive() {
    toast.success(`${name || "Deployment"} is live`)
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Deploy {agentName}</h2>
        <p className="text-sm text-muted-foreground">
          Set who the agent is, then choose where it goes live.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="persona">Persona</TabsTrigger>
          <TabsTrigger value="golive">Go live</TabsTrigger>
        </TabsList>

        {/* PERSONA — identity only, clean and focused */}
        <TabsContent value="persona" className="mt-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Who {agentName} is — voice and personality. Set once; every deployment reuses it.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tone">
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a tone" />
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
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a language" />
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
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Warm, patient, solution-first…"
              rows={3}
            />
          </Field>
          <Field label="Brand">
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Acme"
            />
          </Field>
          <Button variant="outline" onClick={() => setTab("golive")}>
            <Check /> Done — choose a channel
          </Button>
        </TabsContent>

        {/* GO LIVE — channel chooser + inline config + the action */}
        <TabsContent value="golive" className="mt-6 space-y-5">
          {/* Persona summary: identity is SET, but lives in its own place */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium">{agentName}</span>
            <Dot /> <span className="text-muted-foreground">{tone}</span>
            <Dot /> <span className="text-muted-foreground">{language}</span>
            {brand && (
              <>
                <Dot /> <span className="text-muted-foreground">{brand}</span>
              </>
            )}
            <Button
              variant="link"
              size="sm"
              className="ml-auto h-auto p-0 text-xs"
              onClick={() => setTab("persona")}
            >
              <Pencil className="size-3" /> Edit persona
            </Button>
          </div>

          {/* Channel chooser — WHERE it goes live */}
          <div className="grid gap-2 sm:grid-cols-2">
            {CHANNELS.map(({ key, label, icon: Icon }) => {
              const active = channel === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChannel(key)}
                  aria-pressed={active}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  <Icon className={`size-4 shrink-0 ${active ? "text-primary" : ""}`} />
                  <span className="font-medium">{label}</span>
                </button>
              )
            })}
          </div>

          <Separator />

          {/* Inline config for the chosen channel */}
          {isCall ? (
            <div className="space-y-4">
              <Field label="Deployment name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={channel === "inbound" ? "Support line" : "Black Friday outreach"}
                />
              </Field>
              <Field label="Phone number">
                <Select value={number} onValueChange={setNumber}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an available number" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((n) => (
                      <SelectItem key={n.id} value={n.number}>
                        {n.number} — {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Greeting">
                <Textarea
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Hi! Thanks for calling Acme — how can I help?"
                  rows={2}
                />
              </Field>
              <Field label="Prompt">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the task this deployment should handle…"
                  rows={4}
                />
              </Field>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Drop this into your {channel === "code" ? "app" : "site"} to put {agentName} live.
              </p>
              <CodeBlock
                language={channel === "code" ? "typescript" : "html"}
                filename={channel === "code" ? "deploy.ts" : "widget.html"}
              >
                {snippet}
              </CodeBlock>
            </div>
          )}

          {/* The action — gated until persona is saved */}
          {isCall && (
            <div className="space-y-2 pt-1">
              <Button onClick={goLive} disabled={unsaved} className="w-full sm:w-auto">
                <Rocket /> Go live
              </Button>
              {unsaved && (
                <p className="text-xs text-muted-foreground">
                  Save this agent first to go live.
                </p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Dot() {
  return <span className="text-muted-foreground/40">·</span>
}
