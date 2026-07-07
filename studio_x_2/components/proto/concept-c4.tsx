"use client"

/**
 * Concept 4 "Inspector": settings-page feel. Sticky step nav on the left,
 * open sections in the center, persistent test/identity panel at 2xl.
 * Throwaway judging prototype. No em dashes anywhere in copy.
 */

import { useState } from "react"
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  Code2,
  Globe,
  Mic,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Plug,
  Rocket,
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
import {
  dataFor,
  Orb,
  PRESETS,
  VOICES,
  type ProtoMode,
} from "@/components/proto/shared"

const TYPE_OPTIONS = [
  { id: "batch", label: "Batch calls", desc: "Your agent dials a contact list", icon: PhoneOutgoing },
  { id: "inbound", label: "Inbound", desc: "Answers calls and web chats", icon: PhoneIncoming },
  { id: "code", label: "Code / SDK", desc: "Runs inside your app", icon: Code2 },
] as const

const LANGUAGES = ["English", "Spanish", "French", "German", "Hindi"]

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: "Pick who your agent sounds like and what it runs on.",
  2: "Pick how this agent takes work.",
  3: "Tell your agent what to do and how to open the call.",
  4: "Give callers a way in. Route a number or use the web widget.",
  5: "Check each step, then push it live.",
}

const cardBtn =
  "rounded-md border border-border bg-transparent px-3 py-2.5 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
const cardBtnActive = "border-primary bg-accent/50"

export function ConceptC4({ mode }: { mode: ProtoMode }) {
  const { agent, steps, live, deploy } = dataFor(mode)

  const init = {
    voice: live ? "aria" : undefined,
    preset: live ? "balanced" : undefined,
    type: live ? "inbound" : undefined,
    prompt: live ? (agent.prompt as string) : "",
    greeting: live ? (agent.greeting as string) : "",
    number: live ? "main" : undefined,
  }

  const [step, setStep] = useState(1)
  const [name, setName] = useState<string>(agent.name)
  const [voice, setVoice] = useState<string | undefined>(init.voice)
  const [preset, setPreset] = useState<string | undefined>(init.preset)
  const [language, setLanguage] = useState<string>(agent.language)
  const [modelsOpen, setModelsOpen] = useState(false)
  const [stt, setStt] = useState("nova-2")
  const [llm, setLlm] = useState("gpt-4o-mini")
  const [tts, setTts] = useState("turbo")
  const [agentType, setAgentType] = useState<string | undefined>(init.type)
  const [prompt, setPrompt] = useState<string>(init.prompt)
  const [greeting, setGreeting] = useState<string>(init.greeting)
  const [channel, setChannel] = useState<"phone" | "web">("phone")
  const [numberSel, setNumberSel] = useState<string | undefined>(init.number)

  const voiceObj = VOICES.find((v) => v.id === voice)
  const presetObj = PRESETS.find((p) => p.id === preset)
  const typeObj = TYPE_OPTIONS.find((t) => t.id === agentType)

  const doneList = [
    Boolean(voiceObj && presetObj),
    Boolean(typeObj),
    prompt.trim().length > 0 && greeting.trim().length > 0,
    channel === "web" || Boolean(numberSel),
    live,
  ]
  const doneCount = doneList.filter(Boolean).length

  function stepValue(n: number): string {
    switch (n) {
      case 1:
        return voiceObj && presetObj ? `${voiceObj.name} · ${presetObj.label} · ${language}` : ""
      case 2:
        return typeObj?.label ?? ""
      case 3: {
        const bits = []
        if (prompt.trim()) bits.push("Prompt set")
        if (greeting.trim()) bits.push("Greeting set")
        return bits.join(" · ")
      }
      case 4:
        if (channel === "web") return "Web widget"
        return numberSel ? agent.channelTarget : ""
      case 5:
        return live ? steps[4].value : ""
      default:
        return ""
    }
  }

  function resetStep() {
    switch (step) {
      case 1:
        setVoice(init.voice)
        setPreset(init.preset)
        setLanguage(agent.language)
        setStt("nova-2")
        setLlm("gpt-4o-mini")
        setTts("turbo")
        setModelsOpen(false)
        break
      case 2:
        setAgentType(init.type)
        break
      case 3:
        setPrompt(init.prompt)
        setGreeting(init.greeting)
        break
      case 4:
        setChannel("phone")
        setNumberSel(init.number)
        break
    }
  }

  const current = steps[step - 1]
  const talkName = name.trim() || "your agent"

  const statusBadge = live ? (
    <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
      {agent.status}
    </Badge>
  ) : (
    <Badge variant="secondary">{agent.status}</Badge>
  )

  const deployBlock = (
    <div className="mt-4 border-t border-border pt-4">
      {live ? (
        <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2.5">
          <p className="text-sm font-medium text-success">{deploy.headline}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{deploy.sub}</p>
        </div>
      ) : (
        <div className="px-1">
          <p className="text-sm font-medium">{deploy.headline}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{deploy.sub}</p>
        </div>
      )}
      <Button variant={live ? "outline" : "default"} className="mt-3 w-full gap-1.5">
        <Rocket className="h-3.5 w-3.5" />
        {deploy.cta}
      </Button>
    </div>
  )

  return (
    <div className="w-full px-4 py-6 sm:px-6 xl:px-10 2xl:px-14">
      {/* Mobile agent header */}
      <div className="mb-4 flex items-center gap-3 lg:hidden">
        <Orb size={36} active={live} />
        <div className="min-w-0 flex-1">
          {live ? (
            <div className="flex items-center gap-2">
              <span className="line-clamp-1 text-sm font-semibold" title={agent.name}>
                {agent.name}
              </span>
              {statusBadge}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your agent"
                aria-label="Agent name"
                className="h-8 text-sm"
              />
              {statusBadge}
            </div>
          )}
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground" title={agent.role}>
            {agent.role}
          </p>
        </div>
      </div>

      {/* Mobile sticky step strip */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex items-center gap-1 overflow-x-auto">
          {steps.map((s, i) => (
            <button
              key={s.n}
              type="button"
              onClick={() => setStep(s.n)}
              aria-current={step === s.n ? "step" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                step === s.n ? "bg-accent/60 font-medium" : "text-muted-foreground"
              )}
            >
              {doneList[i] ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {s.title}
            </button>
          ))}
          <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground">
            {doneCount} of 5 done
          </span>
        </div>
      </div>

      <div className="flex gap-8">
        {/* LEFT: sticky step nav, no card chrome */}
        <aside className="hidden w-70 shrink-0 lg:sticky lg:top-16 lg:block lg:self-start">
          <div className="flex items-center gap-3 px-3 pb-4">
            <Orb size={36} active={live} />
            <div className="min-w-0 flex-1">
              {live ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1 text-sm font-semibold" title={agent.name}>
                      {agent.name}
                    </span>
                    {statusBadge}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground" title={agent.role}>
                    {agent.role}
                  </p>
                </>
              ) : (
                <>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name your agent"
                    aria-label="Agent name"
                    className="h-8 text-sm"
                  />
                  <div className="mt-1.5 flex items-center gap-2">
                    {statusBadge}
                    <span className="line-clamp-1 text-xs text-muted-foreground" title={agent.role}>
                      {agent.role}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <nav aria-label="Setup steps" className="space-y-0.5">
            {steps.map((s, i) => {
              const val = stepValue(s.n) || s.manifest
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setStep(s.n)}
                  aria-current={step === s.n ? "step" : undefined}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    step === s.n && "bg-accent/60"
                  )}
                >
                  <span className="mt-0.5 shrink-0">
                    {doneList[i] ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border text-xs leading-none text-muted-foreground">
                        {s.n}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm", step === s.n && "font-medium")}>
                      {s.title}
                    </span>
                    <span className="line-clamp-1 block text-xs text-muted-foreground" title={val}>
                      {val}
                    </span>
                  </span>
                </button>
              )
            })}
          </nav>
          <p className="px-3 pt-3 text-xs text-muted-foreground">{doneCount} of 5 done</p>
        </aside>

        {/* CENTER: the selected step as an open settings section */}
        <main className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold">{current.title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{STEP_DESCRIPTIONS[step]}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 2xl:hidden">
              <Mic className="h-3.5 w-3.5" />
              Talk to {talkName}
            </Button>
          </div>

          {step === 1 && (
            <div className="mt-6 space-y-6">
              <section className="grid gap-5 border-b border-border pb-6 xl:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="c4-voice">Voice</Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs font-normal text-muted-foreground"
                    >
                      Customize in playground
                    </Button>
                  </div>
                  <Select value={voice ?? ""} onValueChange={setVoice}>
                    <SelectTrigger id="c4-voice" className="w-full">
                      <SelectValue placeholder="Pick a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICES.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <span className="flex items-baseline gap-2">
                            <span className="font-medium">{v.name}</span>
                            <span className="text-xs text-muted-foreground">{v.tagline}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c4-language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="c4-language" className="w-full">
                      <SelectValue placeholder="Pick a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <section className="space-y-3 border-b border-border pb-6">
                <div>
                  <p className="text-sm font-medium">Model preset</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    One pick sets speed, cost, and quality.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={preset === p.id}
                      onClick={() => setPreset(p.id)}
                      className={cn(cardBtn, preset === p.id && cardBtnActive)}
                    >
                      <span className="block text-sm font-medium">{p.label}</span>
                      <span className="block text-xs text-muted-foreground">{p.hint}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{p.est}</span>
                    </button>
                  ))}
                </div>
                {presetObj ? (
                  <p className="text-xs text-muted-foreground">
                    Runs on {presetObj.stack}. Expect {presetObj.est}.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Pick one to see the suggested stack.</p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setModelsOpen((o) => !o)}
                  aria-expanded={modelsOpen}
                  aria-controls="c4-models"
                  className="gap-1.5 px-2 text-muted-foreground"
                >
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", modelsOpen && "rotate-180")}
                  />
                  Customize models
                </Button>
                {modelsOpen && (
                  <div id="c4-models" className="grid gap-5 pt-1 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="c4-stt">Speech to text</Label>
                      <Select value={stt} onValueChange={setStt}>
                        <SelectTrigger id="c4-stt" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nova-2">Deepgram nova-2</SelectItem>
                          <SelectItem value="whisper">Whisper large v3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c4-llm">Language model</Label>
                      <Select value={llm} onValueChange={setLlm}>
                        <SelectTrigger id="c4-llm" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                          <SelectItem value="gemini-flash">gemini-flash</SelectItem>
                          <SelectItem value="claude-haiku">claude-haiku</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c4-tts">Text to speech</Label>
                      <Select value={tts} onValueChange={setTts}>
                        <SelectTrigger id="c4-tts" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="turbo">ElevenLabs turbo</SelectItem>
                          <SelectItem value="standard">ElevenLabs standard</SelectItem>
                          <SelectItem value="playht">PlayHT 2.0</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sample line</p>
                  <div className="rounded-md border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground">
                    {voiceObj ? `"${voiceObj.sample}"` : "Pick a voice to hear how it opens."}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="c4-prompt-preview">Prompt preview</Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs font-normal text-muted-foreground"
                      onClick={() => setStep(3)}
                    >
                      Edit in Prompt & tools
                    </Button>
                  </div>
                  <Textarea
                    id="c4-prompt-preview"
                    readOnly
                    rows={6}
                    value={prompt}
                    placeholder="Your prompt shows up here after step 3."
                    className="resize-none text-sm"
                  />
                </div>
              </section>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={agentType === t.id}
                  onClick={() => setAgentType(t.id)}
                  className={cn(cardBtn, "flex flex-col gap-1", agentType === t.id && cardBtnActive)}
                >
                  <t.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t.label}</span>
                  <span className="text-xs text-muted-foreground">{t.desc}</span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c4-prompt">System prompt</Label>
                <Textarea
                  id="c4-prompt"
                  rows={8}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What should your agent do? Who does it talk to? What is off limits?"
                  className="text-sm"
                />
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="c4-greeting">Greeting</Label>
                  <Input
                    id="c4-greeting"
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder="The first thing callers hear"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tools</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      Add knowledge base
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Plug className="h-3.5 w-3.5" />
                      Add MCP connector
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Channel</p>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={channel}
                  onValueChange={(v) => {
                    if (v) setChannel(v as "phone" | "web")
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="phone" className="gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Phone number
                  </ToggleGroupItem>
                  <ToggleGroupItem value="web" className="gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    Web widget
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              {channel === "phone" ? (
                <div className="space-y-2">
                  <Label htmlFor="c4-number">Number</Label>
                  <Select value={numberSel ?? ""} onValueChange={setNumberSel}>
                    <SelectTrigger id="c4-number" className="w-full">
                      <SelectValue placeholder="Pick a number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">
                        <span className="flex items-baseline gap-2">
                          <span className="font-medium">+1 (628) 555-0188</span>
                          {live && <span className="text-xs text-success">Current</span>}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Calls to this number reach your agent.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Web widget</p>
                  <p className="text-sm text-muted-foreground">
                    Copy one script tag into your site. The agent answers in the browser.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="mt-6 space-y-5">
              {live && (
                <div className="flex items-start gap-2.5 rounded-md border border-success/40 bg-success/10 px-3 py-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <div>
                    <p className="text-sm font-medium text-success">{deploy.headline}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{deploy.sub}</p>
                  </div>
                </div>
              )}
              <div className="grid gap-x-8 xl:grid-cols-2">
                {[1, 2, 3, 4].map((n) => {
                  const val = stepValue(n)
                  return (
                    <div
                      key={n}
                      className="flex items-center gap-3 border-b border-border py-2.5"
                    >
                      {doneList[n - 1] ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="w-28 shrink-0 text-xs text-muted-foreground">
                        {steps[n - 1].title}
                      </span>
                      <span
                        className={cn(
                          "line-clamp-1 min-w-0 flex-1 text-sm",
                          !val && "text-muted-foreground"
                        )}
                        title={val || "Not set"}
                      >
                        {val || "Not set"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 px-2 text-xs"
                        onClick={() => setStep(n)}
                      >
                        Edit
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section footer */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={resetStep}>
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </Button>
            {step < 5 ? (
              <Button size="sm" onClick={() => setStep(step + 1)}>
                Continue
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5">
                <Rocket className="h-3.5 w-3.5" />
                {deploy.cta}
              </Button>
            )}
          </div>
        </main>

        {/* RIGHT: test/identity panel, 2xl only */}
        <aside className="hidden w-80 shrink-0 2xl:sticky 2xl:top-16 2xl:block 2xl:self-start">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-col items-center text-center">
              <Orb size={72} active={live} />
              <p className={cn("mt-3 text-base font-semibold", !name.trim() && "text-muted-foreground")}>
                {name.trim() || "New agent"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{agent.role}</p>
              <div className="mt-2">{statusBadge}</div>
            </div>
            <dl className="mt-4">
              {[
                ["Channel", `${agent.channelLabel} · ${agent.channelTarget}`],
                ["Cost", agent.cost],
                ["Latency", agent.latency],
                ["Language", language],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
                >
                  <dt className="shrink-0 text-xs text-muted-foreground">{k}</dt>
                  <dd className="line-clamp-1 min-w-0 text-sm" title={v}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <Button className="mt-4 w-full gap-2">
              <Mic className="h-4 w-4" />
              Talk to {talkName}
            </Button>
            {deployBlock}
          </div>
        </aside>
      </div>

      {/* Slim deploy bar, only below 2xl (the right panel carries deploy state above) */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 xl:-mx-10 xl:px-10 2xl:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p
              className={cn("line-clamp-1 text-sm font-medium", live && "text-success")}
              title={deploy.headline}
            >
              {deploy.headline}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground" title={deploy.sub}>
              {deploy.sub}
            </p>
          </div>
          <Button size="sm" variant={live ? "outline" : "default"} className="shrink-0 gap-1.5">
            <Rocket className="h-3.5 w-3.5" />
            {deploy.cta}
          </Button>
        </div>
      </div>
    </div>
  )
}
