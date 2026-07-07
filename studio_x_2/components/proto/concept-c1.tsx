"use client"

/**
 * Concept C1 "Cockpit rail" (throwaway judging proto).
 * One sticky left rail card holds everything persistent: agent header,
 * the 5 steps as dense rows, and a pinned deploy footer. The right side
 * is a single fluid form region that switches per step.
 */

import * as React from "react"
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code,
  Gauge,
  Globe,
  Mic,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Plug,
  Undo2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { dataFor, Orb, PRESETS, VOICES, type ProtoMode } from "@/components/proto/shared"

const AGENT_TYPES = [
  { id: "batch", title: "Batch calls", desc: "Your agent dials a contact list", icon: PhoneOutgoing },
  { id: "inbound", title: "Inbound", desc: "Answers calls and web chats", icon: PhoneIncoming },
  { id: "code", title: "Code / SDK", desc: "Runs inside your app", icon: Code },
] as const

export function ConceptC1({ mode }: { mode: ProtoMode }) {
  const live = mode === "live"
  const { agent, steps, deploy } = dataFor(mode)

  const [step, setStep] = React.useState(1)
  const [voice, setVoice] = React.useState<string | undefined>(live ? "aria" : undefined)
  const [preset, setPreset] = React.useState<string | undefined>(live ? "balanced" : undefined)
  const [showModels, setShowModels] = React.useState(false)
  const [agentType, setAgentType] = React.useState<string | undefined>(live ? "inbound" : undefined)
  const [channel, setChannel] = React.useState("phone")
  const [number, setNumber] = React.useState(live ? "n1" : "")
  const [name, setName] = React.useState<string>(agent.name)

  const selVoice = VOICES.find((v) => v.id === voice)
  const selPreset = PRESETS.find((p) => p.id === preset)
  const current = steps.find((s) => s.n === step) ?? steps[0]
  const next = steps.find((s) => s.n === step + 1)
  const doneCount = steps.filter((s) => s.done).length

  return (
    <div className="w-full px-4 py-6 sm:px-6 xl:px-10 2xl:px-14">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        {/* ---------- Cockpit rail ---------- */}
        <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card lg:sticky lg:top-16 lg:w-80 lg:self-start">
          {/* Agent header */}
          <div className="flex items-start gap-3 p-4">
            <Orb size={40} active={live} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {live ? (
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={agent.name}>
                    {agent.name}
                  </span>
                ) : (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name your agent"
                    aria-label="Agent name"
                    className="h-8 min-w-0 flex-1 text-sm"
                  />
                )}
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5" disabled={!live}>
                  <Mic className="h-3.5 w-3.5" /> Talk
                </Button>
              </div>
              <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                <Badge
                  variant={live ? "outline" : "secondary"}
                  className={cn("shrink-0", live && "border-success/40 bg-success/10 text-success")}
                >
                  {agent.status}
                </Badge>
                <span className="truncate text-xs text-muted-foreground" title={agent.role}>
                  {agent.role}
                </span>
              </div>
            </div>
          </div>

          {/* Step rows */}
          <nav aria-label="Setup steps" className="border-t border-border">
            {steps.map((s) => {
              const selected = s.n === step
              const detail = s.value || s.manifest
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setStep(s.n)}
                  aria-current={selected ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 border-l-2 px-4 py-2.5 text-left outline-none transition-colors",
                    "focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected
                      ? "border-l-primary bg-accent/50"
                      : "border-l-transparent hover:bg-accent/30"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                      s.done
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {s.done ? <Check className="h-3.5 w-3.5" /> : s.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{s.title}</span>
                    <span
                      className={cn("block text-xs line-clamp-1", s.done ? "text-muted-foreground" : "text-muted-foreground/70")}
                      title={detail}
                    >
                      {detail}
                    </span>
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Pinned deploy footer */}
          <div
            className={cn(
              "mt-auto border-t p-4",
              live ? "border-success/40 bg-success/10" : "border-border"
            )}
          >
            <p className={cn("text-sm font-semibold", live && "text-success")}>{deploy.headline}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{deploy.sub}</p>
            <Button size="sm" className="mt-3 w-full">
              {deploy.cta}
            </Button>
            <div className="mt-3">
              <div className="flex gap-1" aria-hidden="true">
                {steps.map((s) => (
                  <span
                    key={s.n}
                    className={cn("h-1 flex-1 rounded-full", s.done ? "bg-success" : "bg-border")}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{doneCount} of 5 done</p>
            </div>
          </div>
        </aside>

        {/* ---------- Form region ---------- */}
        <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-border bg-card">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
            <h2 className="min-w-0 truncate text-sm font-semibold" title={current.title}>
              {current.title}
            </h2>
            {current.done ? (
              <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
                Done
              </Badge>
            ) : (
              <Badge variant="secondary">Pending</Badge>
            )}
            <span className="ml-auto text-xs text-muted-foreground">Step {step} of 5</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Previous step"
                disabled={step === 1}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Next step"
                disabled={step === 5}
                onClick={() => setStep((s) => Math.min(5, s + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 px-4 py-5 sm:px-6">
            {/* Step 1: Voice & models */}
            {step === 1 && (
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="c1-voice">Voice</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="text-muted-foreground"
                      >
                        Customize in playground
                      </Button>
                    </div>
                    <Select value={voice ?? ""} onValueChange={setVoice}>
                      <SelectTrigger
                        id="c1-voice"
                        className="w-full data-[size=default]:h-auto py-2"
                      >
                        {selVoice ? (
                          <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
                            <span className="text-sm font-medium">{selVoice.name}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1" title={selVoice.tagline}>
                              {selVoice.tagline}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Pick a voice</span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {VOICES.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            <span className="flex flex-col items-start gap-0.5">
                              <span className="font-medium">{v.name}</span>
                              <span className="text-xs text-muted-foreground">{v.tagline}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="c1-language">Language</Label>
                    <Select defaultValue={agent.language}>
                      <SelectTrigger id="c1-language" className="w-full">
                        <SelectValue placeholder="Pick a language" />
                      </SelectTrigger>
                      <SelectContent>
                        {["English", "Spanish", "French", "German", "Hindi", "Mandarin"].map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="c1-sample">Opening line</Label>
                    <Textarea
                      id="c1-sample"
                      readOnly
                      value={selVoice?.sample ?? ""}
                      placeholder="Pick a voice to hear its opening line."
                      className="min-h-24 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Your agent says this when it picks up.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label>Speed and cost</Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {PRESETS.map((p) => {
                        const on = p.id === preset
                        return (
                          <button
                            key={p.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setPreset(p.id)}
                            className={cn(
                              "rounded-lg border p-3 text-left outline-none transition-colors",
                              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                              on
                                ? "border-primary bg-accent/50"
                                : "border-border hover:bg-accent/30"
                            )}
                          >
                            <span className="block text-sm font-medium">{p.label}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">{p.hint}</span>
                            <span className="mt-2 block text-xs text-muted-foreground line-clamp-1" title={p.est}>
                              {p.est}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selPreset ? `Suggested stack: ${selPreset.stack}` : "Pick one. Models come picked for you."}
                    </p>
                  </div>

                  {selPreset && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-accent/30 px-3 py-2.5">
                      <Gauge className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm">Estimate {selPreset.est}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="-ml-2 gap-1.5 text-muted-foreground"
                      aria-expanded={showModels}
                      onClick={() => setShowModels((v) => !v)}
                    >
                      <ChevronDown
                        className={cn("h-3.5 w-3.5 transition-transform", showModels && "rotate-180")}
                        aria-hidden="true"
                      />
                      Customize models
                    </Button>
                    {showModels && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="c1-stt">Speech to text</Label>
                          <Select defaultValue="nova-2">
                            <SelectTrigger id="c1-stt" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nova-2">Deepgram nova-2</SelectItem>
                              <SelectItem value="whisper">Whisper</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="c1-llm">Language model</Label>
                          <Select defaultValue="gpt-4o-mini">
                            <SelectTrigger id="c1-llm" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                              <SelectItem value="gemini-flash">gemini-flash</SelectItem>
                              <SelectItem value="claude-haiku">claude-haiku</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="c1-tts">Text to speech</Label>
                          <Select defaultValue="turbo">
                            <SelectTrigger id="c1-tts" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="turbo">ElevenLabs turbo</SelectItem>
                              <SelectItem value="standard">ElevenLabs standard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Agent type */}
            {step === 2 && (
              <div className="grid gap-2.5 sm:grid-cols-3">
                {AGENT_TYPES.map((t) => {
                  const on = t.id === agentType
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setAgentType(t.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 text-left outline-none transition-colors",
                        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        on ? "border-primary bg-accent/50" : "border-border hover:bg-accent/30"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                          on ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{t.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{t.desc}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Step 3: Prompt & tools */}
            {step === 3 && (
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="c1-prompt">System prompt</Label>
                  <Textarea
                    id="c1-prompt"
                    defaultValue={live ? agent.prompt : ""}
                    placeholder="Who is your agent and what should it do on every call?"
                    className="min-h-36 text-sm"
                  />
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="c1-greeting">Greeting</Label>
                    <Textarea
                      id="c1-greeting"
                      defaultValue={live ? agent.greeting : ""}
                      placeholder="The first thing your agent says"
                      className="min-h-20 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tools</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" className="gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" /> Add knowledge base
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="gap-1.5">
                        <Plug className="h-3.5 w-3.5" /> Add MCP connector
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Phone number / channel */}
            {step === 4 && (
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Channel</Label>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={channel}
                    onValueChange={(v) => v && setChannel(v)}
                  >
                    <ToggleGroupItem value="phone" className="gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Phone number
                    </ToggleGroupItem>
                    <ToggleGroupItem value="widget" className="gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> Web widget
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                {channel === "phone" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="c1-number">Number</Label>
                    <Select value={number} onValueChange={setNumber}>
                      <SelectTrigger id="c1-number" className="w-full">
                        <SelectValue placeholder="Pick a number" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="n1">
                          <span className="flex items-center gap-2">
                            +1 (628) 555-0188
                            {live && (
                              <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
                                Current
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Inbound calls on this number ring your agent.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-accent/30 p-3">
                    <p className="text-sm font-medium">Drop the widget on your site</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">One script tag. Works on any page.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Deploy */}
            {step === 5 && (
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>What goes live</Label>
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {steps.slice(0, 4).map((s) => (
                      <div key={s.n} className="flex items-center gap-2.5 px-3 py-2.5">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            s.done
                              ? "border-success/40 bg-success/10 text-success"
                              : "border-border text-muted-foreground"
                          )}
                        >
                          {s.done && <Check className="h-3 w-3" />}
                        </span>
                        <span className="w-32 shrink-0 text-xs text-muted-foreground">{s.title}</span>
                        <span
                          className="min-w-0 flex-1 text-sm line-clamp-1"
                          title={s.value || "Not set"}
                        >
                          {s.value || "Not set"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {live ? (
                    <div className="rounded-lg border border-success/40 bg-success/10 p-3">
                      <p className="text-sm font-medium text-success">{deploy.headline}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{deploy.sub}</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-accent/30 p-3">
                      <p className="text-sm font-medium">{deploy.headline}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{deploy.sub}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                    <Gauge className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm">
                      {agent.cost} · {agent.latency} to first word
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 border-t border-border px-4 py-3 sm:px-6">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Undo2 className="h-3.5 w-3.5" /> Undo
            </Button>
            <span
              className="ml-auto hidden min-w-0 text-xs text-muted-foreground line-clamp-1 sm:block"
              title={next ? `Up next: ${next.title}` : "Last step"}
            >
              {next ? `Up next: ${next.title}` : "Last step"}
            </span>
            {step < 5 ? (
              <Button size="sm" className={cn(!next && "ml-auto", "gap-1")} onClick={() => setStep((s) => Math.min(5, s + 1))}>
                Continue <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm">{deploy.cta}</Button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
