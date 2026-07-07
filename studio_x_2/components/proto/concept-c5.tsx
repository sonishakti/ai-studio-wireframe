"use client"

/**
 * Concept 5: Scroll-spy one-pager. Zero selection clicks.
 * All 5 steps stack on one scrolling page; a sticky left mini-nav
 * (agent lockup + scroll-spy list + deploy block) tracks position.
 * THROWAWAY judging prototype.
 */

import * as React from "react"
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Globe,
  PhoneCall,
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
import {
  dataFor,
  Orb,
  PRESETS,
  VOICES,
  type ProtoMode,
} from "@/components/proto/shared"

const STEP_TITLES = [
  "Voice & models",
  "Agent type",
  "Prompt & tools",
  "Phone number",
  "Deploy",
] as const

const AGENT_TYPES = [
  { id: "batch", label: "Batch calls", hint: "Your agent dials a contact list", icon: PhoneOutgoing },
  { id: "inbound", label: "Inbound", hint: "Answers calls and web chats", icon: PhoneIncoming },
  { id: "code", label: "Code / SDK", hint: "Runs inside your app", icon: Code2 },
] as const

const NUMBER = "+1 (628) 555-0188"

function stepId(n: number) {
  return `c5-step-${n}`
}

export function ConceptC5({ mode }: { mode: ProtoMode }) {
  const { agent, deploy, live } = dataFor(mode)

  // Step 1
  const [voice, setVoice] = React.useState<string | undefined>(
    mode === "live" ? "aria" : undefined
  )
  const [preset, setPreset] = React.useState<string | undefined>(
    mode === "live" ? "balanced" : undefined
  )
  const [language, setLanguage] = React.useState("english")
  const [showModels, setShowModels] = React.useState(false)
  const [stt, setStt] = React.useState("nova-2")
  const [llm, setLlm] = React.useState("gpt-4o-mini")
  const [tts, setTts] = React.useState("turbo")
  // Step 2
  const [agentType, setAgentType] = React.useState<string | undefined>(
    mode === "live" ? "inbound" : undefined
  )
  // Step 3
  const [prompt, setPrompt] = React.useState(mode === "live" ? agent.prompt : "")
  const [greeting, setGreeting] = React.useState(mode === "live" ? agent.greeting : "")
  // Step 4
  const [channelKind, setChannelKind] = React.useState<string>(
    mode === "live" ? "phone" : ""
  )
  const [numberSel, setNumberSel] = React.useState<string | undefined>(
    mode === "live" ? "n1" : undefined
  )
  // Draft naming
  const [draftName, setDraftName] = React.useState("")
  // Scroll-spy
  const [activeStep, setActiveStep] = React.useState(1)

  const voiceObj = VOICES.find((v) => v.id === voice)
  const presetObj = PRESETS.find((p) => p.id === preset)
  const typeObj = AGENT_TYPES.find((t) => t.id === agentType)

  const done = [
    Boolean(voice && preset),
    Boolean(agentType),
    prompt.trim().length > 0 && greeting.trim().length > 0,
    channelKind === "web" || (channelKind === "phone" && Boolean(numberSel)),
    live,
  ]
  const doneCount = done.filter(Boolean).length
  const readyToDeploy = done[0] && done[1] && done[2] && done[3]

  React.useEffect(() => {
    const sections = [1, 2, 3, 4, 5]
      .map((n) => document.getElementById(stepId(n)))
      .filter((el): el is HTMLElement => el !== null)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        )
        const n = Number(top.target.getAttribute("data-step"))
        if (n >= 1 && n <= 5) setActiveStep(n)
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: 0 }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  function jumpTo(n: number) {
    document
      .getElementById(stepId(n))
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function resetStep(n: number) {
    if (n === 1) {
      setVoice(mode === "live" ? "aria" : undefined)
      setPreset(mode === "live" ? "balanced" : undefined)
      setLanguage("english")
      setStt("nova-2")
      setLlm("gpt-4o-mini")
      setTts("turbo")
      setShowModels(false)
    } else if (n === 2) {
      setAgentType(mode === "live" ? "inbound" : undefined)
    } else if (n === 3) {
      setPrompt(mode === "live" ? agent.prompt : "")
      setGreeting(mode === "live" ? agent.greeting : "")
    } else if (n === 4) {
      setChannelKind(mode === "live" ? "phone" : "")
      setNumberSel(mode === "live" ? "n1" : undefined)
    }
  }

  const reviewRows: { label: string; value: string }[] = [
    {
      label: "Voice & models",
      value:
        voiceObj && presetObj
          ? `${voiceObj.name} · ${presetObj.label} · ${language.charAt(0).toUpperCase()}${language.slice(1)}`
          : "Not set",
    },
    { label: "Agent type", value: typeObj ? typeObj.label : "Not set" },
    {
      label: "Prompt & tools",
      value: done[2] ? "Prompt set · Greeting set" : "Not set",
    },
    {
      label: "Channel",
      value:
        channelKind === "web"
          ? "Web widget"
          : numberSel
            ? NUMBER
            : "Not set",
    },
  ]

  return (
    <div className="w-full px-4 py-6 sm:px-6 xl:px-10 2xl:px-14">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* ---- Sticky mini-nav ---- */}
        <aside className="w-full shrink-0 lg:sticky lg:top-16 lg:w-64 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-4">
            {/* Agent lockup */}
            <div className="flex items-center gap-3">
              <Orb size={40} active={live} />
              <div className="min-w-0 flex-1">
                {live ? (
                  <div className="flex items-center gap-2">
                    <p className="line-clamp-1 text-sm font-semibold" title={agent.name}>
                      {agent.name}
                    </p>
                    <Badge
                      variant="outline"
                      className="border-success/40 bg-success/10 text-success"
                    >
                      {agent.status}
                    </Badge>
                  </div>
                ) : (
                  <Input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Name your agent"
                    aria-label="Agent name"
                    className="h-8 text-sm"
                  />
                )}
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground" title={agent.role}>
                  {agent.role}
                </p>
              </div>
            </div>

            {/* Scroll-spy list */}
            <nav aria-label="Setup steps" className="mt-4 flex flex-col gap-0.5">
              {STEP_TITLES.map((title, i) => {
                const n = i + 1
                const isActive = activeStep === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => jumpTo(n)}
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        done[i] ? "bg-success" : "bg-muted-foreground/30"
                      )}
                    />
                    <span className="line-clamp-1" title={title}>
                      {title}
                    </span>
                    {done[i] && (
                      <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-success" />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Deploy block */}
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground">
                {doneCount} of 5 done
              </p>
              {live ? (
                <p className="mt-1.5 line-clamp-1 text-sm font-medium text-success" title={deploy.headline}>
                  {deploy.headline}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">{deploy.sub}</p>
              <Button
                size="sm"
                className="mt-3 w-full"
                disabled={!readyToDeploy}
                onClick={() => jumpTo(5)}
              >
                {deploy.cta}
              </Button>
            </div>
          </div>
        </aside>

        {/* ---- Stacked sections ---- */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 pb-24">
          {/* Step 1: Voice & models */}
          <Section n={1} title={STEP_TITLES[0]} done={done[0]} onUndo={resetStep}>
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="c5-voice">Voice</Label>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                      Customize in playground
                    </Button>
                  </div>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger id="c5-voice" className="w-full">
                      <SelectValue placeholder="Pick a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICES.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <span className="font-medium">{v.name}</span>
                          <span className="text-xs text-muted-foreground">{v.tagline}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {voiceObj && (
                    <p className="line-clamp-1 text-xs text-muted-foreground" title={voiceObj.sample}>
                      Says: &ldquo;{voiceObj.sample}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="c5-language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="c5-language" className="w-full">
                      <SelectValue placeholder="Pick a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Speed and cost</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {PRESETS.map((p) => {
                      const selected = preset === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setPreset(p.id)}
                          className={cn(
                            "flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/40"
                          )}
                        >
                          <span className="text-sm font-medium">{p.label}</span>
                          <span className="text-xs text-muted-foreground">{p.hint}</span>
                          <span className="text-xs text-muted-foreground">{p.est}</span>
                        </button>
                      )
                    })}
                  </div>
                  {presetObj && (
                    <p className="text-xs text-muted-foreground">
                      Suggested stack: {presetObj.stack}
                    </p>
                  )}
                </div>

                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground"
                    aria-expanded={showModels}
                    onClick={() => setShowModels((v) => !v)}
                  >
                    Customize models
                    {showModels ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  {showModels && (
                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="c5-stt" className="text-xs">Speech to text</Label>
                        <Select value={stt} onValueChange={setStt}>
                          <SelectTrigger id="c5-stt" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nova-2">nova-2</SelectItem>
                            <SelectItem value="whisper">whisper</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="c5-llm" className="text-xs">Language model</Label>
                        <Select value={llm} onValueChange={setLlm}>
                          <SelectTrigger id="c5-llm" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                            <SelectItem value="gemini-flash">gemini-flash</SelectItem>
                            <SelectItem value="claude-haiku">claude-haiku</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="c5-tts" className="text-xs">Text to speech</Label>
                        <Select value={tts} onValueChange={setTts}>
                          <SelectTrigger id="c5-tts" className="w-full">
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
              </div>
            </div>
          </Section>

          {/* Step 2: Agent type */}
          <Section n={2} title={STEP_TITLES[1]} done={done[1]} onUndo={resetStep}>
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
                      "flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40"
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{t.label}</span>
                      <span className="text-xs text-muted-foreground">{t.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Step 3: Prompt & tools */}
          <Section n={3} title={STEP_TITLES[2]} done={done[2]} onUndo={resetStep}>
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c5-prompt">System prompt</Label>
                <Textarea
                  id="c5-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell your agent how to behave"
                  rows={6}
                  className="text-sm"
                />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="c5-greeting">Greeting</Label>
                  <Input
                    id="c5-greeting"
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder="First thing your agent says"
                    className="text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Tools</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Add knowledge base
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Plug className="h-3.5 w-3.5" /> Add MCP connector
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Step 4: Phone number */}
          <Section n={4} title={STEP_TITLES[3]} done={done[3]} onUndo={resetStep}>
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Where calls land</Label>
                <ToggleGroup
                  type="single"
                  value={channelKind}
                  onValueChange={(v) => {
                    if (v) setChannelKind(v)
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="phone" aria-label="Phone number" className="gap-1.5">
                    <PhoneCall className="h-3.5 w-3.5" /> Phone number
                  </ToggleGroupItem>
                  <ToggleGroupItem value="web" aria-label="Web widget" className="gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Web widget
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex flex-col gap-1.5">
                {channelKind === "phone" && (
                  <>
                    <Label htmlFor="c5-number">Number</Label>
                    <Select value={numberSel} onValueChange={setNumberSel}>
                      <SelectTrigger id="c5-number" className="w-full">
                        <SelectValue placeholder="Pick a number" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="n1">
                          <span className="font-medium">{NUMBER}</span>
                          {live && (
                            <span className="text-xs text-muted-foreground">Current</span>
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                {channelKind === "web" && (
                  <p className="text-sm text-muted-foreground">
                    A chat widget you can drop on any page. Grab the embed code after deploy.
                  </p>
                )}
              </div>
            </div>
          </Section>

          {/* Step 5: Deploy */}
          <Section n={5} title={STEP_TITLES[4]} done={done[4]} onUndo={resetStep} hideUndo>
            <div className="flex flex-col gap-4">
              <ul className="divide-y divide-border rounded-lg border border-border">
                {reviewRows.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-4 px-3 py-2.5"
                  >
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <span className="line-clamp-1 text-right text-sm" title={row.value}>
                      {row.value}
                    </span>
                  </li>
                ))}
              </ul>
              {live && (
                <div className="flex items-start gap-2.5 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-success">{deploy.headline}</p>
                    <p className="text-xs text-muted-foreground">{deploy.sub}</p>
                  </div>
                </div>
              )}
              <div>
                <Button disabled={!readyToDeploy}>{deploy.cta}</Button>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({
  n,
  title,
  done,
  onUndo,
  hideUndo,
  children,
}: {
  n: number
  title: string
  done: boolean
  onUndo: (n: number) => void
  hideUndo?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      id={stepId(n)}
      data-step={n}
      aria-labelledby={`${stepId(n)}-title`}
      className="scroll-mt-20 rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {done ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          ) : (
            <span
              aria-hidden
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground"
            >
              {n}
            </span>
          )}
          <h2
            id={`${stepId(n)}-title`}
            className="line-clamp-1 text-sm font-medium"
            title={title}
          >
            {title}
          </h2>
          <Badge
            variant="outline"
            className={cn(
              done
                ? "border-success/40 bg-success/10 text-success"
                : "text-muted-foreground"
            )}
          >
            {done ? "Done" : "Pending"}
          </Badge>
        </div>
        {!hideUndo && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onUndo(n)}
          >
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </Button>
        )}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  )
}
