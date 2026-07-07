"use client"

/**
 * Concept C2 "Command strip": no left column. A sticky top strip carries the
 * agent identity, the 5 steps as chips, progress, and the deploy CTA. The
 * selected step form uses the full viewport width in a 12-col grid.
 * Throwaway judging prototype. Do not ship.
 */

import * as React from "react"
import {
  Check,
  ChevronDown,
  Code2,
  Globe,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
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

type AgentType = "batch" | "inbound" | "code"
type Channel = "phone" | "web"

const AGENT_TYPES: { id: AgentType; label: string; sub: string; icon: React.ElementType }[] = [
  { id: "batch", label: "Batch calls", sub: "Your agent dials a contact list", icon: PhoneOutgoing },
  { id: "inbound", label: "Inbound", sub: "Answers calls and web chats", icon: PhoneIncoming },
  { id: "code", label: "Code / SDK", sub: "Runs inside your app", icon: Code2 },
]

const NUMBER = "+1 (628) 555-0188"

const STEP_HINTS: Record<number, string> = {
  1: "Pick how your agent sounds and thinks.",
  2: "Pick the work this agent does.",
  3: "Set what it says and knows.",
  4: "Pick where it answers.",
  5: "Check the setup and go.",
}

export function ConceptC2({ mode }: { mode: ProtoMode }) {
  const live = mode === "live"
  const { agent, steps, deploy } = dataFor(mode)

  const [step, setStep] = React.useState(1)
  const [voiceId, setVoiceId] = React.useState<string | undefined>(live ? "aria" : undefined)
  const [presetId, setPresetId] = React.useState<string | undefined>(live ? "balanced" : undefined)
  const [language, setLanguage] = React.useState<string>(agent.language)
  const [showModels, setShowModels] = React.useState(false)
  const [agentType, setAgentType] = React.useState<AgentType | undefined>(live ? "inbound" : undefined)
  const [channel, setChannel] = React.useState<Channel | undefined>(live ? "phone" : undefined)
  const [numberVal, setNumberVal] = React.useState<string | undefined>(live ? NUMBER : undefined)

  const voice = VOICES.find((v) => v.id === voiceId)
  const preset = PRESETS.find((p) => p.id === presetId)
  const typeInfo = AGENT_TYPES.find((t) => t.id === agentType)

  function stepDone(n: number): boolean {
    switch (n) {
      case 1:
        return Boolean(voiceId && presetId)
      case 2:
        return Boolean(agentType)
      case 3:
        return steps[2].done
      case 4:
        return channel === "web" || (channel === "phone" && Boolean(numberVal))
      case 5:
        return steps[4].done
      default:
        return false
    }
  }

  function chipText(n: number): string {
    const s = steps[n - 1]
    if (n === 1 && voice && preset) return live ? s.value : `${voice.name} · ${preset.label}`
    if (n === 2 && typeInfo) return typeInfo.label
    if (n === 4 && channel) return channel === "web" ? "Web widget" : (numberVal ?? "Pick a number")
    return stepDone(n) ? s.value : s.manifest
  }

  const doneCount = [1, 2, 3, 4, 5].filter(stepDone).length

  return (
    <div className="w-full">
      {/* ===== Command strip ===== */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:px-6 xl:px-10 2xl:px-14">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Agent identity */}
          <div className="flex shrink-0 items-center gap-2.5">
            <Orb size={32} active={live} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {live ? (
                  <span className="text-sm font-medium">{agent.name}</span>
                ) : (
                  <Input
                    aria-label="Agent name"
                    placeholder="Name your agent"
                    className="h-8 w-36 text-sm sm:w-44"
                  />
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    live
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {agent.status}
                </Badge>
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">{agent.role}</p>
            </div>
          </div>

          {/* Step chips */}
          <nav
            aria-label="Setup steps"
            className="order-3 -mx-1 flex w-full min-w-0 items-center gap-1.5 overflow-x-auto px-1 lg:order-none lg:w-auto lg:flex-1 lg:justify-center"
          >
            {steps.map((s) => {
              const done = stepDone(s.n)
              const selected = step === s.n
              const value = chipText(s.n)
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setStep(s.n)}
                  aria-current={selected ? "step" : undefined}
                  className={cn(
                    "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {done ? (
                    <Check
                      className={cn("h-3.5 w-3.5", selected ? "text-primary-foreground" : "text-success")}
                    />
                  ) : (
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs",
                        selected ? "border-primary-foreground/50" : "border-border"
                      )}
                    >
                      {s.n}
                    </span>
                  )}
                  <span className="whitespace-nowrap">{s.title}</span>
                  <span
                    title={value}
                    className={cn(
                      "hidden max-w-28 text-left text-xs xl:line-clamp-1",
                      selected ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {value}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Progress + deploy */}
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <span className="text-xs text-muted-foreground">{doneCount} of 5 done</span>
            <Button
              size="sm"
              variant={live ? "outline" : "default"}
              className={cn(live && "border-success/40 bg-success/10 text-success hover:bg-success/10")}
              onClick={() => setStep(5)}
            >
              {deploy.cta}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Step canvas ===== */}
      <div className="px-4 py-6 sm:px-6 xl:px-10 2xl:px-14">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Main form */}
          <div className="min-w-0 xl:col-span-8">
            <div className="mb-5">
              <h2 className="text-base font-semibold">{steps[step - 1].title}</h2>
              <p className="text-xs text-muted-foreground">{STEP_HINTS[step]}</p>
            </div>

            {step === 1 && (
              <div className="space-y-6">
                {/* Voice + language */}
                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="c2-voice">Voice</Label>
                    <div className="flex items-center gap-2">
                      <Select value={voiceId} onValueChange={setVoiceId}>
                        <SelectTrigger id="c2-voice" className="min-w-0 flex-1">
                          <SelectValue placeholder="Pick a voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {VOICES.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              <span className="flex items-center gap-2">
                                <span className="font-medium">{v.name}</span>
                                <span className="text-xs text-muted-foreground">{v.tagline}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground">
                        Customize in playground
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c2-language">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="c2-language">
                        <SelectValue placeholder="Pick a language" />
                      </SelectTrigger>
                      <SelectContent>
                        {["English", "Spanish", "French", "German", "Hindi"].map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preset quick pick */}
                <div className="space-y-2">
                  <Label>Stack</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {PRESETS.map((p) => {
                      const selected = presetId === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setPresetId(p.id)}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:bg-accent/50"
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">{p.label}</span>
                            {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{p.hint}</span>
                          <span className="mt-1 block text-xs">{p.est}</span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {preset ? `Runs on ${preset.stack}` : "Pick one to see the suggested stack."}
                  </p>
                </div>

                {/* Models disclosure */}
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    aria-expanded={showModels}
                    onClick={() => setShowModels((v) => !v)}
                  >
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform", showModels && "rotate-180")}
                    />
                    Customize models
                  </Button>
                  {showModels && (
                    <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="c2-stt" className="text-xs">
                          Speech to text
                        </Label>
                        <Select defaultValue="nova-2">
                          <SelectTrigger id="c2-stt">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nova-2">Deepgram nova-2</SelectItem>
                            <SelectItem value="whisper">Whisper large-v3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="c2-llm" className="text-xs">
                          Language model
                        </Label>
                        <Select defaultValue="gpt-4o-mini">
                          <SelectTrigger id="c2-llm">
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
                        <Label htmlFor="c2-tts" className="text-xs">
                          Text to speech
                        </Label>
                        <Select defaultValue="turbo">
                          <SelectTrigger id="c2-tts">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="turbo">ElevenLabs turbo</SelectItem>
                            <SelectItem value="sonic">Cartesia sonic</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sample preview keeps the step tall and scroll-testable */}
                <div className="space-y-2">
                  <Label htmlFor="c2-sample">How it sounds</Label>
                  <Textarea
                    id="c2-sample"
                    readOnly
                    rows={3}
                    value={voice ? voice.sample : "Pick a voice to hear a sample line."}
                    className="resize-none text-sm text-muted-foreground"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  {preset ? `Estimate: ${preset.est}` : "Estimate appears once you pick a stack."}
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {AGENT_TYPES.map((t) => {
                  const selected = agentType === t.id
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setAgentType(t.id)}
                      className={cn(
                        "rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-accent/50"
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{t.label}</span>
                        </span>
                        {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{t.sub}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="c2-prompt">System prompt</Label>
                    <Textarea
                      id="c2-prompt"
                      rows={6}
                      defaultValue={live ? agent.prompt : ""}
                      placeholder="What should this agent do on every call?"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c2-greeting">Greeting</Label>
                    <Textarea
                      id="c2-greeting"
                      rows={3}
                      defaultValue={live ? agent.greeting : ""}
                      placeholder="The first thing callers hear"
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add knowledge base
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add MCP connector
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <ToggleGroup
                    type="single"
                    value={channel ?? ""}
                    onValueChange={(v) => v && setChannel(v as Channel)}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="phone" className="gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Phone number
                    </ToggleGroupItem>
                    <ToggleGroupItem value="web" className="gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> Web widget
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {channel === "phone" && (
                  <div className="max-w-sm space-y-2">
                    <Label htmlFor="c2-number">Number</Label>
                    <Select value={numberVal} onValueChange={setNumberVal}>
                      <SelectTrigger id="c2-number">
                        <SelectValue placeholder="Pick a number" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NUMBER}>
                          <span className="flex items-center gap-2">
                            <span>{NUMBER}</span>
                            {live && <span className="text-xs text-muted-foreground">Current</span>}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {channel === "web" && (
                  <p className="text-xs text-muted-foreground">
                    Add the widget to your site with one script tag.
                  </p>
                )}

                {!channel && (
                  <p className="text-xs text-muted-foreground">Pick a channel to keep going.</p>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                {live && (
                  <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2.5">
                    <p className="text-sm font-medium text-success">{deploy.headline}</p>
                    <p className="text-xs text-muted-foreground">{deploy.sub}</p>
                  </div>
                )}
                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {steps.slice(0, 4).map((s) => {
                    const done = stepDone(s.n)
                    return (
                      <div key={s.n} className="flex items-center gap-3 px-3 py-2.5">
                        {done ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                        ) : (
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground">
                            {s.n}
                          </span>
                        )}
                        <span className="w-32 shrink-0 text-sm">{s.title}</span>
                        <span
                          title={chipText(s.n)}
                          className={cn(
                            "min-w-0 flex-1 text-sm line-clamp-1",
                            done ? "" : "text-muted-foreground"
                          )}
                        >
                          {chipText(s.n)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground"
                          onClick={() => setStep(s.n)}
                        >
                          Edit
                        </Button>
                      </div>
                    )
                  })}
                </div>
                {!live && <p className="text-xs text-muted-foreground">{deploy.sub}</p>}
                <Button disabled={!live && doneCount < 4}>{deploy.cta}</Button>
              </div>
            )}

            {/* Form footer */}
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Undo2 className="h-3.5 w-3.5" /> Undo
              </Button>
              {step < 5 ? (
                <Button size="sm" onClick={() => setStep((s) => Math.min(5, s + 1))}>
                  Continue
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setStep(1)}>
                  Back to start
                </Button>
              )}
            </div>
          </div>

          {/* Context card */}
          <aside className="min-w-0 xl:col-span-4 xl:sticky xl:top-32 xl:self-start">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                At a glance
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium">{steps[step - 1].title}</span>
                {stepDone(step) ? (
                  <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
                    Done
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    Pending
                  </Badge>
                )}
              </div>
              <p
                title={chipText(step)}
                className={cn(
                  "mt-1.5 text-sm line-clamp-1",
                  stepDone(step) ? "" : "text-muted-foreground"
                )}
              >
                {chipText(step)}
              </p>

              {step === 1 && (
                <div className="mt-4 space-y-3 border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimate</p>
                    <p className="text-sm">
                      {preset ? preset.est : "Pick a stack to see cost and latency."}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sample line</p>
                    <blockquote className="mt-1 border-l-2 border-border pl-3 text-sm italic text-muted-foreground">
                      {voice ? voice.sample : "Pick a voice to hear one."}
                    </blockquote>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="text-sm">{doneCount} of 5 done</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
