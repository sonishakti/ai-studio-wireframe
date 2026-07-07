"use client"

import * as React from "react"
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Mic,
  Phone,
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

const LANGUAGES = [
  { id: "english", label: "English" },
  { id: "spanish", label: "Spanish" },
  { id: "french", label: "French" },
  { id: "german", label: "German" },
  { id: "hindi", label: "Hindi" },
]

const AGENT_TYPES = [
  { id: "batch", label: "Batch calls", desc: "Your agent dials a contact list" },
  { id: "inbound", label: "Inbound", desc: "Answers calls and web chats" },
  { id: "code", label: "Code / SDK", desc: "Runs inside your app" },
]

const NUMBER = "+1 (628) 555-0188"

export function ConceptC3({ mode }: { mode: ProtoMode }) {
  const { agent, steps, live, deploy } = dataFor(mode)

  const [step, setStep] = React.useState(1)
  const [voice, setVoice] = React.useState<string | undefined>(mode === "live" ? "aria" : undefined)
  const [preset, setPreset] = React.useState<string | undefined>(mode === "live" ? "balanced" : undefined)
  const [language, setLanguage] = React.useState("english")
  const [modelsOpen, setModelsOpen] = React.useState(false)
  const [name, setName] = React.useState<string>(agent.name)
  const [agentType, setAgentType] = React.useState<string | undefined>(mode === "live" ? "inbound" : undefined)
  const [prompt, setPrompt] = React.useState(mode === "live" ? agent.prompt : "")
  const [greeting, setGreeting] = React.useState(mode === "live" ? agent.greeting : "")
  const [channel, setChannel] = React.useState<string | undefined>(mode === "live" ? "phone" : undefined)
  const [number, setNumber] = React.useState<string | undefined>(mode === "live" ? "n1" : undefined)

  // Reset local state if the judging harness flips mode without remounting.
  const [prevMode, setPrevMode] = React.useState(mode)
  if (prevMode !== mode) {
    setPrevMode(mode)
    setStep(1)
    setVoice(mode === "live" ? "aria" : undefined)
    setPreset(mode === "live" ? "balanced" : undefined)
    setLanguage("english")
    setModelsOpen(false)
    setName(mode === "live" ? "Aria" : "")
    setAgentType(mode === "live" ? "inbound" : undefined)
    setPrompt(mode === "live" ? agent.prompt : "")
    setGreeting(mode === "live" ? agent.greeting : "")
    setChannel(mode === "live" ? "phone" : undefined)
    setNumber(mode === "live" ? "n1" : undefined)
  }

  const voiceObj = VOICES.find((v) => v.id === voice)
  const presetObj = PRESETS.find((p) => p.id === preset)
  const langLabel = LANGUAGES.find((l) => l.id === language)?.label ?? "English"
  const typeObj = AGENT_TYPES.find((t) => t.id === agentType)

  const done: Record<number, boolean> = {
    1: !!(voiceObj && presetObj),
    2: !!typeObj,
    3: prompt.trim().length > 0,
    4: channel === "web" || (channel === "phone" && !!number),
    5: live,
  }
  const doneCount = [1, 2, 3, 4, 5].filter((n) => done[n]).length
  const allSet = done[1] && done[2] && done[3] && done[4]

  function valueFor(n: number): string {
    if (!done[n]) return ""
    switch (n) {
      case 1:
        return `${voiceObj?.name} · ${presetObj?.label} · ${langLabel}`
      case 2:
        return typeObj?.label ?? ""
      case 3:
        return greeting.trim() ? "Prompt set · Greeting set" : "Prompt set"
      case 4:
        return channel === "web" ? "Web widget" : NUMBER
      case 5:
        return deploy.headline
      default:
        return ""
    }
  }

  function undoStep() {
    switch (step) {
      case 1:
        setVoice(live ? "aria" : undefined)
        setPreset(live ? "balanced" : undefined)
        setLanguage("english")
        setModelsOpen(false)
        break
      case 2:
        setAgentType(live ? "inbound" : undefined)
        break
      case 3:
        setPrompt(live ? agent.prompt : "")
        setGreeting(live ? agent.greeting : "")
        break
      case 4:
        setChannel(live ? "phone" : undefined)
        setNumber(live ? "n1" : undefined)
        break
    }
  }

  const current = steps[step - 1]
  const next = step < 5 ? steps[step] : undefined

  return (
    <div className="w-full px-4 py-6 sm:px-6 xl:px-10 2xl:px-14">
      <div className="flex flex-col items-start gap-4 lg:flex-row">
        {/* LEFT: one composed card. Agent, steps, deploy. */}
        <aside className="w-full shrink-0 self-start rounded-xl border border-border bg-card lg:sticky lg:top-16 lg:w-80">
          {/* Agent lockup */}
          <div className="flex items-start gap-3 border-b border-border p-4">
            <Orb size={40} active={live} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {live ? (
                  <p className="truncate text-sm font-semibold" title={agent.name}>
                    {agent.name}
                  </p>
                ) : (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name your agent"
                    aria-label="Agent name"
                    className="h-8 min-w-0 flex-1 text-sm"
                  />
                )}
                <Badge
                  variant={live ? "outline" : "secondary"}
                  className={cn(live && "border-success/40 bg-success/10 text-success")}
                >
                  {agent.status}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground" title={agent.role}>
                {agent.role}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Talk to your agent"
              title="Talk to your agent"
            >
              <Mic />
            </Button>
          </div>

          {/* Step rail */}
          <nav aria-label="Setup steps">
            <ol className="py-1.5">
              {steps.map((s) => {
                const isSel = s.n === step
                const isDone = done[s.n]
                const sub = valueFor(s.n) || s.manifest
                return (
                  <li key={s.n}>
                    <button
                      type="button"
                      onClick={() => setStep(s.n)}
                      aria-current={isSel ? "step" : undefined}
                      className={cn(
                        "flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
                        isSel ? "bg-accent/50" : "hover:bg-accent/30"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-success" aria-hidden />
                      ) : (
                        <span
                          aria-hidden
                          className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full border border-border text-xs text-muted-foreground"
                        >
                          {s.n}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{s.title}</span>
                        <span className="line-clamp-1 block text-xs text-muted-foreground" title={sub}>
                          {sub}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "mt-2 size-1.5 shrink-0 rounded-full",
                          isDone ? "bg-success" : "bg-muted-foreground/40"
                        )}
                      />
                      <span className="sr-only">{isDone ? "Done" : "Pending"}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>

          {/* Deploy block */}
          <div className="space-y-3 border-t border-border p-4">
            {live ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-success/40 bg-success/10 p-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{deploy.headline}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{deploy.sub}</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">{deploy.headline}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{deploy.sub}</p>
              </div>
            )}
            <Button
              className="w-full"
              disabled={!live && !allSet}
              title={!live && !allSet ? "Finish the steps above first" : undefined}
            >
              {deploy.cta}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{doneCount} of 5 done</p>
          </div>
        </aside>

        {/* RIGHT: form card */}
        <section className="min-w-0 flex-1 self-stretch rounded-xl border border-border bg-card">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold">{current.title}</h2>
                <Badge
                  variant="outline"
                  className={cn(
                    done[step] ? "border-success/40 bg-success/10 text-success" : "text-muted-foreground"
                  )}
                >
                  {done[step] ? "Done" : "Pending"}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Step {step} of 5</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous step"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next step"
              disabled={step === 5}
              onClick={() => setStep((s) => Math.min(5, s + 1))}
            >
              <ChevronRight />
            </Button>
          </div>

          {/* Body */}
          <div className="px-4 py-5 sm:px-5">
            {step === 1 && (
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="c3-voice">Voice</Label>
                    <Button variant="ghost" size="xs" className="text-muted-foreground">
                      Customize in playground
                    </Button>
                  </div>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger id="c3-voice" className="w-full">
                      <SelectValue placeholder="Pick a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICES.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <span className="flex items-center gap-1.5">
                            <span className="font-medium">{v.name}</span>
                            <span className="text-muted-foreground">{v.tagline}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="c3-lang" className="py-1.5">
                    Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="c3-lang" className="w-full">
                      <SelectValue placeholder="Pick a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 xl:col-span-2">
                  <Label>Model stack</Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PRESETS.map((p) => {
                      const sel = p.id === preset
                      return (
                        <button
                          key={p.id}
                          type="button"
                          aria-pressed={sel}
                          onClick={() => setPreset(p.id)}
                          className={cn(
                            "rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                            sel ? "border-primary bg-accent/50" : "border-border hover:bg-accent/30"
                          )}
                        >
                          <span className="block text-sm font-medium">{p.label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{p.hint}</span>
                          <span className="mt-1.5 block text-xs">{p.est}</span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {presetObj ? `Suggested stack: ${presetObj.stack}` : "Pick a preset to see cost and latency."}
                  </p>
                  {presetObj && <p className="text-xs text-muted-foreground">Estimated {presetObj.est}</p>}
                </div>

                <div className="xl:col-span-2">
                  <Button variant="ghost" size="sm" onClick={() => setModelsOpen((o) => !o)} aria-expanded={modelsOpen}>
                    <ChevronDown className={cn("transition-transform", modelsOpen && "rotate-180")} />
                    Customize models
                  </Button>
                  {modelsOpen && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="c3-stt">Transcription</Label>
                        <Select defaultValue="nova-2">
                          <SelectTrigger id="c3-stt" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nova-2">nova-2</SelectItem>
                            <SelectItem value="whisper-large">whisper-large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c3-llm">Language model</Label>
                        <Select defaultValue="gpt-4o-mini">
                          <SelectTrigger id="c3-llm" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                            <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                            <SelectItem value="gemini-flash">gemini-flash</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c3-tts">Voice engine</Label>
                        <Select defaultValue="turbo">
                          <SelectTrigger id="c3-tts" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="turbo">turbo</SelectItem>
                            <SelectItem value="standard">standard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="c3-sample">Sample line</Label>
                  <Textarea
                    id="c3-sample"
                    readOnly
                    value={voiceObj?.sample ?? ""}
                    placeholder="Pick a voice to preview a sample line."
                    className="min-h-20 resize-none"
                  />
                  {voiceObj && (
                    <p className="text-xs text-muted-foreground">This is how {voiceObj.name} opens a call.</p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label>Agent type</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {AGENT_TYPES.map((t) => {
                    const sel = t.id === agentType
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={sel}
                        onClick={() => setAgentType(t.id)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                          sel ? "border-primary bg-accent/50" : "border-border hover:bg-accent/30"
                        )}
                      >
                        <span className="block text-sm font-medium">{t.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{t.desc}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {typeObj ? `${typeObj.label}: ${typeObj.desc.toLowerCase()}.` : "Pick how your agent takes work."}
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="c3-prompt">System prompt</Label>
                  <Textarea
                    id="c3-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Tell your agent who it is and what to do."
                    className="min-h-28"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c3-greeting">Greeting</Label>
                  <Input
                    id="c3-greeting"
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder="The first thing callers hear."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tools</Label>
                  <div className="flex flex-wrap gap-2 py-0.5">
                    <Button variant="outline" size="sm">
                      <BookOpen />
                      Add knowledge base
                    </Button>
                    <Button variant="outline" size="sm">
                      <Plug />
                      Add MCP connector
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={channel ?? ""}
                    onValueChange={(v) => v && setChannel(v)}
                  >
                    <ToggleGroupItem value="phone" aria-label="Phone number">
                      <Phone />
                      Phone number
                    </ToggleGroupItem>
                    <ToggleGroupItem value="web" aria-label="Web widget">
                      <Globe />
                      Web widget
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                {channel !== "web" && (
                  <div className="space-y-2">
                    <Label htmlFor="c3-number">Number</Label>
                    <Select value={number} onValueChange={setNumber}>
                      <SelectTrigger id="c3-number" className="w-full">
                        <SelectValue placeholder="Pick a number" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="n1">
                          <span className="flex items-center gap-1.5">
                            <span>{NUMBER}</span>
                            {live && <span className="text-muted-foreground">Current</span>}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Calls to this number reach your agent.</p>
                  </div>
                )}
                {channel === "web" && (
                  <div className="flex items-end pb-1">
                    <p className="text-xs text-muted-foreground">
                      The widget lives on your site. You get the embed code after deploy.
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                {live && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-success/40 bg-success/10 p-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{deploy.headline}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{deploy.sub}</p>
                    </div>
                  </div>
                )}
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {steps.slice(0, 4).map((s) => {
                    const v = valueFor(s.n)
                    return (
                      <li key={s.n} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{s.title}</p>
                          <p
                            className={cn("line-clamp-1 text-sm", !v && "text-muted-foreground")}
                            title={v || "Not set"}
                          >
                            {v || "Not set"}
                          </p>
                        </div>
                        <Button variant="ghost" size="xs" onClick={() => setStep(s.n)}>
                          Edit
                        </Button>
                      </li>
                    )
                  })}
                </ul>
                <Button
                  className="w-full sm:w-auto"
                  disabled={!live && !allSet}
                  title={!live && !allSet ? "Finish the steps above first" : undefined}
                >
                  {deploy.cta}
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={undoStep}>
              <Undo2 className="h-3.5 w-3.5" /> Undo
            </Button>
            <div className="flex items-center gap-3">
              {next && (
                <span className="hidden text-xs text-muted-foreground sm:inline">Up next: {next.title}</span>
              )}
              {step < 5 ? (
                <Button size="sm" onClick={() => setStep((s) => Math.min(5, s + 1))}>
                  Continue
                </Button>
              ) : (
                <Button size="sm" disabled={!live && !allSet}>
                  {deploy.cta}
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
