"use client"

/**
 * DeployVariantE — THROWAWAY PROTOTYPE.
 * Direction: "LEFT-RAIL SECTIONS: Persona / Channel / Review" (settings-page model).
 *
 * The Deploy step's failure is conflating two mental models in one scroll:
 *   PERSONA = WHO the agent is (identity/voice — stable, set once, reusable).
 *   CHANNEL = WHERE/HOW it goes live (the deployment action — variable, "the doing").
 * Fix: make them DISTINCT NAVIGABLE SECTIONS. A minimal left rail (Persona ·
 * Channel · Review) routes the wide content pane — spatial separation, like a
 * settings page. Low-chrome, neutral, one accent (--primary).
 */

import { useState } from "react"
import {
  User,
  Radio,
  CheckCircle2,
  PhoneIncoming,
  PhoneOutgoing,
  Code2,
  Globe,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { Agent } from "@/lib/campaign-data"
import { PHONE_NUMBERS } from "@/lib/campaign-data"
import { cn } from "@/lib/utils"
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

const TONES = ["Friendly", "Professional", "Neutral", "Playful"]
const LANGUAGES = ["en-US", "en-GB", "es-ES", "hi-IN", "ja-JP"]

type ChannelId = "inbound" | "batch" | "code" | "web"
const CHANNELS: { id: ChannelId; label: string; icon: LucideIcon; config: "telephony" | "snippet" }[] = [
  { id: "inbound", label: "Answer a phone number", icon: PhoneIncoming, config: "telephony" },
  { id: "batch", label: "Launch batch calls", icon: PhoneOutgoing, config: "telephony" },
  { id: "code", label: "Embed in your app", icon: Code2, config: "snippet" },
  { id: "web", label: "Web widget", icon: Globe, config: "snippet" },
]

type SectionId = "persona" | "channel" | "review"
const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; hint: string }[] = [
  { id: "persona", label: "Persona", icon: User, hint: "Who the agent is" },
  { id: "channel", label: "Channel", icon: Radio, hint: "Where it goes live" },
  { id: "review", label: "Review", icon: CheckCircle2, hint: "Confirm & go live" },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export function DeployVariantE({ id, agent }: { id: string; agent?: Agent }) {
  const isNew = id === "new"
  const [section, setSection] = useState<SectionId>("persona")

  // PERSONA — identity. Stable, set once, reusable.
  const [tone, setTone] = useState(agent?.persona.tone ?? "Friendly")
  const [language, setLanguage] = useState(agent?.persona.language ?? "en-US")
  const [personality, setPersonality] = useState(agent?.persona.personality ?? "")
  const [brand, setBrand] = useState(agent?.persona.brand ?? "")

  // CHANNEL — the deployment action. Variable.
  const [channel, setChannel] = useState<ChannelId>("inbound")
  const [name, setName] = useState("")
  const [number, setNumber] = useState("")
  const [greeting, setGreeting] = useState("")
  const [prompt, setPrompt] = useState("")

  const activeChannel = CHANNELS.find((c) => c.id === channel)!
  const openNumbers = PHONE_NUMBERS.filter((n) => n.assignedTo.length === 0)
  const snippet =
    channel === "web"
      ? `<script src="https://cdn.agora.io/widget.js"\n  data-agent="${id}"\n  data-greeting="Hi! How can I help?">\n</script>`
      : `import { Agent } from "@agora/sdk"\n\nconst agent = new Agent({ id: "${id}" })\nawait agent.start()`

  function goLive() {
    toast.success(`${name || "Deployment"} is live`)
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* LEFT RAIL — section sub-nav (minimal: text + active indicator). */}
      <nav
        aria-label="Deploy sections"
        className="flex shrink-0 gap-1 overflow-x-auto md:w-48 md:flex-col md:overflow-visible"
      >
        {SECTIONS.map((s) => {
          const active = section === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors md:w-full",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <s.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              <span className="flex flex-col">
                <span>{s.label}</span>
                <span className="hidden text-xs font-normal text-muted-foreground md:block">
                  {s.hint}
                </span>
              </span>
            </button>
          )
        })}
      </nav>

      {/* RIGHT PANE — active section content. */}
      <div className="min-w-0 flex-1">
        {/* ── PERSONA: WHO the agent is. ───────────────────────────── */}
        {section === "persona" && (
          <section className="max-w-xl space-y-5">
            <header className="space-y-1">
              <h3 className="text-base font-semibold">Persona</h3>
              <p className="text-sm text-muted-foreground">
                Who your agent is — its voice and identity. Set once; reused across every channel.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tone">
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
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
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
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
                placeholder="Acme Inc."
              />
            </Field>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSection("channel")}>
                Next: Channel
              </Button>
            </div>
          </section>
        )}

        {/* ── CHANNEL: WHERE/HOW it goes live. ─────────────────────── */}
        {section === "channel" && (
          <section className="space-y-5">
            <header className="space-y-1">
              <h3 className="text-base font-semibold">Channel</h3>
              <p className="text-sm text-muted-foreground">
                Where this agent goes live. Pick one, then configure it.
              </p>
            </header>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {CHANNELS.map((c) => {
                const active = channel === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/5"
                        : "hover:border-foreground/20 hover:bg-muted/40"
                    )}
                  >
                    <c.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn(active && "font-medium")}>{c.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              {activeChannel.config === "telephony" ? (
                <div className="max-w-xl space-y-4">
                  <Field label="Deployment name">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Support line"
                    />
                  </Field>
                  <Field label="Phone number">
                    <Select value={number} onValueChange={setNumber}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an available number" />
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
                  <Field label="Greeting">
                    <Textarea
                      value={greeting}
                      onChange={(e) => setGreeting(e.target.value)}
                      placeholder="Thanks for calling — how can I help?"
                      rows={2}
                    />
                  </Field>
                  <Field label="Prompt">
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="You are answering calls for…"
                      rows={3}
                    />
                  </Field>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Drop this into your {channel === "web" ? "page" : "app"} to go live.
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
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSection("review")}>
                Next: Review
              </Button>
            </div>
          </section>
        )}

        {/* ── REVIEW: persona + channel summary, then go live. ─────── */}
        {section === "review" && (
          <section className="max-w-xl space-y-5">
            <header className="space-y-1">
              <h3 className="text-base font-semibold">Review</h3>
              <p className="text-sm text-muted-foreground">
                Confirm the identity and the channel, then go live.
              </p>
            </header>

            <dl className="divide-y rounded-lg border text-sm">
              <SummaryRow label="Tone" value={tone} />
              <SummaryRow label="Language" value={language} />
              <SummaryRow label="Personality" value={personality || "—"} />
              <SummaryRow label="Brand" value={brand || "—"} />
              <SummaryRow label="Channel" value={activeChannel.label} />
              {activeChannel.config === "telephony" && (
                <>
                  <SummaryRow label="Name" value={name || "—"} />
                  <SummaryRow
                    label="Number"
                    value={openNumbers.find((n) => n.id === number)?.number ?? "—"}
                  />
                </>
              )}
            </dl>

            {isNew && (
              <p className="text-sm text-muted-foreground">
                Save this agent first to enable go-live.
              </p>
            )}
            <Button className="w-full" disabled={isNew} onClick={goLive}>
              Go live
            </Button>
          </section>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-4 py-2.5">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-foreground">{value}</dd>
    </div>
  )
}
