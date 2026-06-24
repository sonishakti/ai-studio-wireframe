"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  PhoneIncoming, PhoneOutgoing, Code2, Globe,
  Check, ArrowLeft, ArrowRight, Rocket, User2, Radio, ClipboardCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CodeBlock } from "@/components/code-block"
import { PHONE_NUMBERS, type Agent } from "@/lib/campaign-data"
import { cn } from "@/lib/utils"

const TONES = ["Friendly", "Professional", "Neutral", "Playful"]
const LANGUAGES = ["en-US", "en-GB", "es-ES", "hi-IN", "ja-JP"]

type ChannelKey = "inbound" | "batch" | "code" | "web"
const CHANNELS: { key: ChannelKey; label: string; icon: typeof Code2 }[] = [
  { key: "inbound", label: "Answer a phone number", icon: PhoneIncoming },
  { key: "batch", label: "Launch batch calls", icon: PhoneOutgoing },
  { key: "code", label: "Embed in your app", icon: Code2 },
  { key: "web", label: "Web widget", icon: Globe },
]

const STEPS = [
  { label: "Persona", hint: "Who", icon: User2 },
  { label: "Channel", hint: "Where", icon: Radio },
  { label: "Launch", hint: "Confirm", icon: ClipboardCheck },
]

const AVAILABLE_NUMBERS = PHONE_NUMBERS.filter((n) => n.assignedTo.length === 0)

/** Variant D — STEPPER: Persona → Channel → Launch.
 *  Sequential mental model: define WHO, then WHERE, then confirm. */
export function DeployVariantD({ id, agent }: { id: string; agent?: Agent }) {
  const isNew = id === "new"

  // Persona — WHO the agent is (stable, set once, reusable)
  const [tone, setTone] = React.useState(agent?.persona.tone ?? "Friendly")
  const [language, setLanguage] = React.useState(agent?.persona.language ?? "en-US")
  const [personality, setPersonality] = React.useState(agent?.persona.personality ?? "")
  const [brand, setBrand] = React.useState(agent?.persona.brand ?? "")

  // Channel — WHERE/HOW it goes live (variable, the doing)
  const [channel, setChannel] = React.useState<ChannelKey>("inbound")
  const [name, setName] = React.useState("")
  const [number, setNumber] = React.useState("")
  const [greeting, setGreeting] = React.useState("")
  const [prompt, setPrompt] = React.useState("")

  const [step, setStep] = React.useState<0 | 1 | 2>(0)

  const isCall = channel === "inbound" || channel === "batch"
  const activeChannel = CHANNELS.find((c) => c.key === channel)!

  const snippet =
    channel === "web"
      ? `<script
  src="https://cdn.agora.io/widget.js"
  data-agent="${id}"
  data-channel="web"
  async
></script>`
      : `import { Agora } from "@agora/sdk"

const agent = Agora.connect({
  agentId: "${id}",
  channel: "voice",
})`

  function launch() {
    toast.success(`${name || "Deployment"} is live`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Stepper — slim numbered 1·2·3 with connecting line */}
      <nav aria-label="Deploy steps" className="flex items-center">
        {STEPS.map((s, i) => {
          const done = i < step
          const current = i === step
          return (
            <React.Fragment key={s.label}>
              <button
                type="button"
                onClick={() => i < step && setStep(i as 0 | 1 | 2)}
                disabled={i > step}
                className={cn(
                  "flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors",
                  i < step && "cursor-pointer hover:text-foreground",
                  i > step && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                    done && "border-primary bg-primary text-primary-foreground",
                    current && "border-primary text-primary",
                    !done && !current && "border-border text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="hidden sm:flex flex-col leading-tight">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      current ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{s.hint}</span>
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "mx-2 h-px flex-1 transition-colors",
                    i < step ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </nav>

      {/* ── Step 1 · Persona — WHO ─────────────────────────────── */}
      {step === 0 && (
        <section className="space-y-5">
          <header className="space-y-1">
            <h3 className="text-base font-semibold">Persona</h3>
            <p className="text-sm text-muted-foreground">
              Who the agent is — its identity and voice. Set once, reused across every channel.
            </p>
          </header>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tone" htmlFor="vd-tone">
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="vd-tone"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Language" htmlFor="vd-lang">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="vd-lang"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Personality" htmlFor="vd-personality">
            <Textarea
              id="vd-personality"
              rows={3}
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Warm, patient, solution-first…"
            />
          </Field>
          <Field label="Brand" htmlFor="vd-brand">
            <Input
              id="vd-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Acme"
            />
          </Field>
        </section>
      )}

      {/* ── Step 2 · Channel — WHERE ───────────────────────────── */}
      {step === 1 && (
        <section className="space-y-5">
          <header className="space-y-1">
            <h3 className="text-base font-semibold">Channel</h3>
            <p className="text-sm text-muted-foreground">
              Where and how it goes live. Pick one surface, then configure it.
            </p>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHANNELS.map((c) => {
              const Icon = c.icon
              const selected = channel === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setChannel(c.key)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/20 hover:bg-muted/40",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="text-sm font-medium">{c.label}</span>
                </button>
              )
            })}
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
            {isCall ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Deployment name" htmlFor="vd-name">
                    <Input
                      id="vd-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Support Line"
                    />
                  </Field>
                  <Field label="Phone number" htmlFor="vd-number">
                    <Select value={number} onValueChange={setNumber}>
                      <SelectTrigger id="vd-number">
                        <SelectValue placeholder="Select a number" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_NUMBERS.map((n) => (
                          <SelectItem key={n.id} value={n.number}>
                            {n.number} · {n.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Greeting" htmlFor="vd-greeting">
                  <Textarea
                    id="vd-greeting"
                    rows={2}
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder="Hi! Thanks for calling Acme…"
                  />
                </Field>
                <Field label="Prompt" htmlFor="vd-prompt">
                  <Textarea
                    id="vd-prompt"
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="# Role&#10;You answer billing questions and book callbacks…"
                  />
                </Field>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Drop this into your {channel === "web" ? "page" : "app"} — it carries the persona above.
                </p>
                <CodeBlock
                  language={channel === "web" ? "html" : "typescript"}
                  filename={channel === "web" ? "index.html" : "agent.ts"}
                >
                  {snippet}
                </CodeBlock>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Step 3 · Launch — REVIEW ───────────────────────────── */}
      {step === 2 && (
        <section className="space-y-5">
          <header className="space-y-1">
            <h3 className="text-base font-semibold">Launch</h3>
            <p className="text-sm text-muted-foreground">
              Review who goes live, where, then ship it.
            </p>
          </header>

          {/* Persona — read-only chips */}
          <ReviewRow label="Persona">
            <div className="flex flex-wrap gap-1.5">
              <Chip>{tone}</Chip>
              <Chip>{language}</Chip>
              {brand && <Chip>{brand}</Chip>}
            </div>
          </ReviewRow>

          {/* Channel + key settings */}
          <ReviewRow label="Channel">
            <div className="flex items-center gap-2 text-sm">
              <activeChannel.icon className="h-4 w-4 text-primary" />
              <span className="font-medium">{activeChannel.label}</span>
            </div>
            <dl className="mt-2 space-y-1 text-sm">
              {isCall ? (
                <>
                  <SummaryLine k="Name" v={name || "Untitled"} />
                  <SummaryLine k="Number" v={number || "Not selected"} />
                  {greeting && <SummaryLine k="Greeting" v={greeting} />}
                </>
              ) : (
                <SummaryLine k="Snippet" v={channel === "web" ? "index.html" : "agent.ts"} />
              )}
            </dl>
          </ReviewRow>

          {isNew && (
            <p className="text-sm text-muted-foreground">
              Save the agent first to launch a live deployment.
            </p>
          )}
          <Button size="lg" className="w-full gap-2" disabled={isNew} onClick={launch}>
            <Rocket className="h-4 w-4" /> Go live
          </Button>
        </section>
      )}

      {/* Step nav — Back / Next */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="ghost"
          className="gap-1.5"
          disabled={step === 0}
          onClick={() => setStep((s) => (s - 1) as 0 | 1 | 2)}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < 2 && (
          <Button className="gap-1.5" onClick={() => setStep((s) => (s + 1) as 0 | 1 | 2)}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs font-medium">
      {children}
    </span>
  )
}

function SummaryLine({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-muted-foreground">{k}</dt>
      <dd className="truncate text-foreground">{v}</dd>
    </div>
  )
}
