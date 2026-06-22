"use client"

import * as React from "react"
import Link from "next/link"
import {
  Mic,
  PhoneOff,
  Loader2,
  ArrowRight,
  PhoneOutgoing,
  PhoneIncoming,
  Phone,
  Globe,
  ArrowLeftRight,
  Pencil,
  Check,
  Zap,
  PhoneCall,
  Copy,
  Gauge,
  Layers,
  RotateCcw,
  Upload,
  Plus,
  Code2,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AgentSphere } from "@/components/agent-test-panel"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { AddPhoneNumberSheet } from "@/components/add-phone-number-sheet"
import { FreeMinutesNudge } from "@/components/free-minutes-nudge"
import {
  getDefaultAgent,
  AGENTS,
  stackSummary,
  stackEstimate,
  TEST_INBOUND_NUMBER,
  PLAN_USAGE,
  DEPLOYMENTS,
  type Agent,
  type ImportedAgentConfig,
} from "@/lib/campaign-data"
import { track, Events } from "@/lib/analytics"

/**
 * GoLiveHome — the "Go Live" home (Deploy hub Overview).
 * ────────────────────────────────────────────────────────────────
 * 2026-06-19 — deploy-first home + the 5 agent jobs (workflow-designed,
 * adversarially reviewed). The page deploys ONE agent at a time; the selected
 * agent is lifted to GoLiveHome so the channel cards and the test always follow
 * it. The agent name is a switcher (edit · pick another · import · create), and
 * "What should it do?" gains a custom "Something else…" task.
 */

// ─── 1-tap intent re-skin (presets) ─────────────────────────────────────────────

type Intent = {
  id: string
  label: string
  greeting: string
  you: string
  agent: string
}

function defaultGreeting(name: string) {
  return `Hi! I'm ${name}, your Agora assistant. Ask me anything — or pick what you'd like me to handle for your customers.`
}

const INTENTS: Intent[] = [
  {
    id: "support",
    label: "Customer support",
    greeting: "Hi, thanks for reaching out to support — what can I help you sort out today?",
    you: "My order hasn't arrived yet.",
    agent: "I'm sorry about that. I can check the status and arrange a reship or a refund — what's your order number?",
  },
  {
    id: "appointments",
    label: "Appointment reminders",
    greeting: "Hi! A quick reminder about your upcoming appointment — is now a good time?",
    you: "Yes, can I move it to Friday?",
    agent: "Of course — I've got Friday at 2:00 or 4:30. Which works better for you?",
  },
  {
    id: "surveys",
    label: "Surveys & feedback",
    greeting: "Hi! I've got two quick questions about your recent experience — got 60 seconds?",
    you: "Sure, go ahead.",
    agent: "Great — on a scale of 0 to 10, how likely are you to recommend us to a friend?",
  },
  {
    id: "sales",
    label: "Sales follow-up",
    greeting: "Hi! Following up on your interest — happy to answer questions or get you set up. What's on your mind?",
    you: "What does pricing look like?",
    agent: "Plans start free with 300 minutes a month, then scale with usage. Want me to size it to your call volume?",
  },
]

// ─── test state machine (wireframe — no real ASR/LLM/TTS/telephony) ─────────────

type Method = "talk" | "getcall" | "callin"
type Phase = "idle" | "connecting" | "live" | "ended"
type Line = { role: "agent" | "you"; text: string }

export function GoLiveHome() {
  const [selectedAgentId, setSelectedAgentId] = React.useState(() => getDefaultAgent().id)
  const [extraAgents, setExtraAgents] = React.useState<Agent[]>([])

  const agents = React.useMemo(() => [...AGENTS, ...extraAgents], [extraAgents])
  const agent = agents.find((a) => a.id === selectedAgentId) ?? getDefaultAgent()

  React.useEffect(() => {
    track(Events.default_agent_provisioned, { agent_id: getDefaultAgent().id })
  }, [])

  // Import → synthesize a draft on Agora's bundled stack and select it, carrying
  // the FULL config (voice · model · prompt · first message) so the imported
  // agent actually drives the in-browser test — the dev-switch promise made real.
  function handleImported(config: ImportedAgentConfig) {
    const base = getDefaultAgent()
    const id = `agt_imported_${extraAgents.length + 1}`
    const imported: Agent = {
      id,
      name: config.name,
      role: config.source ? `Imported from ${config.source}` : "Imported agent",
      status: "draft",
      persona: {
        personality: config.systemPrompt?.trim() || base.persona.personality,
        tone: base.persona.tone,
        language: config.language || base.persona.language,
        firstMessage: config.firstMessage,
      },
      stack: {
        ...base.stack,
        llm: config.llmModel ? { ...base.stack.llm, model: config.llmModel } : base.stack.llm,
        tts: config.voice ? { ...base.stack.tts, voice: config.voice } : base.stack.tts,
      },
      knowledge: [],
      actions: [],
    }
    setExtraAgents((prev) => [...prev, imported])
    setSelectedAgentId(id)
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <DeployHeader />
        <SwitcherRail onImported={handleImported} />
        <FreeMinutesNudge />
        <ChannelHero agent={agent} />
        <AgentCard
          agent={agent}
          agents={agents}
          onSwitch={setSelectedAgentId}
          onImported={handleImported}
        />
        <AlreadyLive />
      </div>
    </main>
  )
}

// ─── Switcher rail — surface the import seam for developers leaving a rival ──────

function SwitcherRail({ onImported }: { onImported: (config: ImportedAgentConfig) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <ArrowLeftRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">
          Coming from <span className="font-medium text-foreground">Vapi, Retell, Bland</span> or ElevenLabs?
          Import your agent — we map the voice, prompt, model and tools.
        </span>
      </div>
      <ImportAgentSheet onImported={onImported}>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
          <Upload className="h-3.5 w-3.5" /> Import agent
        </Button>
      </ImportAgentSheet>
    </div>
  )
}

// ─── Header — deploy is the headline ────────────────────────────────────────────

function DeployHeader() {
  return <h1 className="text-2xl font-semibold tracking-tight">Deploy an AI agent in minutes</h1>
}

// ─── Channel hero — the primary job: pick where to deploy ────────────────────────

function ChannelHero({ agent }: { agent: Agent }) {
  const p = `?agent=${agent.id}`
  return (
    <section id="channels" className="scroll-mt-6 space-y-3">
      {agent.status !== "live" && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{agent.name}</span> isn&apos;t live yet —
          deploying it to a channel will publish it. Going live is free.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChannelCard
          href={`/deploy/inbound/new${p}`}
          channel="inbound"
          agentId={agent.id}
          icon={PhoneIncoming}
          title="Answer a phone number"
          desc="Your agent picks up every inbound call, 24/7."
          footer={<SipConnect />}
        />
        <ChannelCard
          href={`/deploy/batch-calls/new${p}`}
          channel="campaign"
          agentId={agent.id}
          icon={PhoneOutgoing}
          title="Launch batch calls"
          desc="Upload a list of contacts and your agent dials each one."
          footer={<SipConnect />}
        />
        <ChannelCard
          href="/deploy/code"
          channel="code"
          agentId={agent.id}
          icon={Code2}
          title="Embed in your app"
          desc="Drop in the web widget or call the API — no number needed."
          footer={
            <Link
              href="/deploy/web-widget"
              className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
            >
              <Globe className="h-4 w-4 text-muted-foreground" /> Web widget
            </Link>
          }
        />
      </div>
    </section>
  )
}

// Bring-your-own number via SIP — Agora doesn't sell or port numbers, so the
// realistic telephony step is connecting a carrier number (Twilio/Telnyx/…).
function SipConnect() {
  return (
    <AddPhoneNumberSheet>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
      >
        <Phone className="h-4 w-4 text-muted-foreground" /> Connect your number (SIP)
      </button>
    </AddPhoneNumberSheet>
  )
}

function ChannelCard({
  href,
  channel,
  agentId,
  icon: Icon,
  title,
  desc,
  footer,
}: {
  href: string
  channel: "campaign" | "inbound" | "code"
  agentId: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  footer: React.ReactNode
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm">
        {footer}
      </div>
      <Link
        href={href}
        onClick={() => track(Events.put_to_work_selected, { channel, agent_id: agentId })}
        aria-label={title}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}

// ─── Agent card — switcher + use-case + test ─────────────────────────────────────

function AgentCard({
  agent,
  agents,
  onSwitch,
  onImported,
}: {
  agent: Agent
  agents: Agent[]
  onSwitch: (id: string) => void
  onImported: (config: ImportedAgentConfig) => void
}) {
  const [method, setMethod] = React.useState<Method>("talk")
  const [intentId, setIntentId] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [speaking, setSpeaking] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const [lines, setLines] = React.useState<Line[]>([])
  const [turns, setTurns] = React.useState(0)
  const [phoneNumber, setPhoneNumber] = React.useState("")
  const [phoneError, setPhoneError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const timers = React.useRef<number[]>([])
  const tick = React.useRef<number | null>(null)

  const preset = INTENTS.find((i) => i.id === intentId) ?? null
  const est = stackEstimate(agent)

  const after = React.useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
  }, [])

  const cleanup = React.useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (tick.current !== null) {
      clearInterval(tick.current)
      tick.current = null
    }
  }, [])

  React.useEffect(() => cleanup, [cleanup])

  const startTimer = React.useCallback(() => {
    tick.current = window.setInterval(() => setElapsed((e) => e + 1), 1000)
  }, [])

  const reset = React.useCallback(() => {
    cleanup()
    setPhase("idle")
    setSpeaking(false)
    setElapsed(0)
    setLines([])
    setTurns(0)
    setPhoneError(null)
  }, [cleanup])

  // Agent changed (switch or import) → reset the test + drop the preset re-skin.
  React.useEffect(() => {
    reset()
    setIntentId(null)
  }, [agent.id, reset])

  function switchMethod(next: Method) {
    if (next === method || phase === "connecting" || phase === "live") return
    reset()
    setMethod(next)
  }

  function handleSwitch(id: string) {
    if (id === agent.id || phase === "connecting" || phase === "live") return
    const next = agents.find((a) => a.id === id)
    if (!next) return
    track(Events.agent_switched, { to_id: id, status: next.status })
    onSwitch(id)
  }

  function pickIntent(id: string) {
    setIntentId((cur) => (cur === id ? null : id))
  }

  function currentGreeting() {
    // Imported agents carry their own first_message — play it so a switcher hears
    // their OWN greeting on Agora. Presets still win when one is actively chosen.
    return preset?.greeting ?? agent.persona.firstMessage ?? defaultGreeting(agent.name)
  }

  const speak = React.useCallback(
    (text: string) => {
      setSpeaking(true)
      setLines((l) => [...l, { role: "agent", text }])
      after(1400, () => setSpeaking(false))
    },
    [after],
  )

  function startTalk() {
    if (phase !== "idle") return
    const greeting = currentGreeting() // snapshot at click — mid-call edits don't retro-change it
    setPhase("connecting")
    track(Events.agent_test_started, { channel: "web", agent_id: agent.id, intent: intentId ?? "general" })
    after(1200, () => {
      setPhase("live")
      startTimer()
      after(400, () => speak(greeting))
    })
  }

  const talk = React.useCallback(() => {
    if (phase !== "live" || speaking) return
    const t = turns
    setTurns(t + 1)
    if (t === 0 && preset) {
      setLines((l) => [...l, { role: "you", text: preset.you }])
      after(900, () => speak(preset.agent))
    } else if (t === 0) {
      setLines((l) => [...l, { role: "you", text: "What can you actually do?" }])
      after(900, () =>
        speak(
          "I can answer calls, qualify leads, book appointments, or run surveys — on a phone number, your website, or a batch of outbound calls.",
        ),
      )
    } else {
      setLines((l) => [...l, { role: "you", text: "Got it — that's everything." }])
      after(800, () => speak("Anytime. Put me to work whenever you're ready."))
    }
  }, [phase, speaking, turns, preset, after, speak])

  function startGetCall() {
    if (phase !== "idle") return
    if (digits(phoneNumber).length < 10) {
      setPhoneError("Enter a valid phone number — at least 10 digits.")
      return
    }
    setPhoneError(null)
    setPhase("connecting")
    track(Events.agent_test_started, { channel: "phone", direction: "outbound", agent_id: agent.id, intent: intentId ?? "general" })
    after(1800, () => {
      setPhase("live")
      startTimer()
    })
  }

  function copyNumber() {
    // Only show "Copied" on a real success — never lie if the clipboard is blocked.
    navigator.clipboard?.writeText(TEST_INBOUND_NUMBER).then(
      () => {
        setCopied(true)
        after(1600, () => setCopied(false))
      },
      () => {},
    )
  }

  function simulateCallIn() {
    if (phase !== "idle") return
    setPhase("connecting")
    track(Events.agent_test_started, { channel: "phone", direction: "inbound", agent_id: agent.id, intent: intentId ?? "general" })
    after(1800, () => {
      setPhase("live")
      startTimer()
    })
  }

  function endTest() {
    cleanup()
    setSpeaking(false)
    track(Events.agent_test_ended, {
      channel: method === "talk" ? "web" : "phone",
      agent_id: agent.id,
      duration_sec: elapsed,
      ...(method !== "talk" && { direction: method === "getcall" ? "outbound" : "inbound" }),
    })
    setPhase("ended")
  }

  function chooseOutcome(outcome: "tweak" | "deploy") {
    track(Events.test_outcome_selected, { outcome, agent_id: agent.id })
    if (outcome === "deploy") {
      // Make the deploy hand-off land: scroll to the channels AND move focus onto
      // the first one, so the click resolves to a real next action (not a no-op).
      const el = document.getElementById("channels")
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
      after(reduce ? 0 : 350, () => el?.querySelector<HTMLElement>("a[href]")?.focus())
    }
  }

  const connecting = phase === "connecting"
  const live = phase === "live"
  const busy = connecting || live
  const isLive = agent.status === "live"
  const liveUsedMin = (PLAN_USAGE.freeMinutesUsed + elapsed / 60).toFixed(1)
  // Free cap shown in the meter: the ungated 150 until a card unlocks the rest.
  const freeCap = PLAN_USAGE.cardOnFile ? PLAN_USAGE.freeMinutesIncluded : PLAN_USAGE.freeMinutesUngated

  const idleBadge = isLive
    ? "Ready to deploy"
    : agent.status === "draft"
      ? "Draft — not carrying traffic"
      : "Paused"
  const statusBadge =
    phase === "ended" ? "Test ended" : connecting ? "Connecting…" : live ? "Live" : idleBadge

  const liveAgents = agents.filter((a) => a.status === "live")
  const otherAgents = agents.filter((a) => a.status !== "live")

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Top — orb + identity (left) · the test (right) */}
      <div className="flex flex-col gap-6 p-6 md:flex-row md:gap-8">
        <div className="flex items-center gap-5 md:w-1/2 md:shrink-0">
          <div className="shrink-0">
            {connecting ? (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-7 w-7 animate-spin text-primary motion-reduce:animate-none" />
              </div>
            ) : (
              <AgentSphere size={128} active={live && (method !== "talk" || speaking)} />
            )}
          </div>

          <div className="min-w-0">
            <Badge variant="outline" className="gap-1.5 text-xs font-medium">
              {isLive ? (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              )}
              {statusBadge}
            </Badge>

            {/* Name = agent switcher (edit · pick another · import · create) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={busy}
                  title={busy ? "End the test to switch agents" : undefined}
                  aria-label={`Change agent — currently ${agent.name}`}
                  className="mt-2 flex max-w-full items-center gap-1.5 rounded-md text-3xl font-semibold tracking-tight transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-70"
                >
                  <span className="truncate" title={agent.name}>{agent.name}</span>
                  <ChevronDown className="h-6 w-6 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
                <DropdownMenuItem asChild>
                  <Link href={`/agents/${agent.id}/edit`}>
                    <Pencil className="h-4 w-4" /> Edit {shortName(agent.name)}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={agent.id} onValueChange={handleSwitch}>
                  <DropdownMenuLabel>Switch agent</DropdownMenuLabel>
                  {liveAgents.map((a) => (
                    <AgentMenuItem key={a.id} a={a} />
                  ))}
                  {otherAgents.length > 0 && <DropdownMenuLabel>Not live yet</DropdownMenuLabel>}
                  {otherAgents.map((a) => (
                    <AgentMenuItem key={a.id} a={a} />
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <ImportAgentSheet onImported={onImported}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Upload className="h-4 w-4" /> Import an agent
                    <span className="ml-auto text-xs text-muted-foreground">Vapi, Retell…</span>
                  </DropdownMenuItem>
                </ImportAgentSheet>
                <DropdownMenuItem asChild>
                  <Link href="/agents/new/edit">
                    <Plus className="h-4 w-4" /> Create a blank agent
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <p className="text-sm text-muted-foreground">{agent.role ?? "General assistant"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{est.latencyMs}ms</span>
              <span className="tabular-nums">${est.costPerMin.toFixed(2)}/min</span>
              <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{stackSummary(agent)}</span>
            </div>
          </div>
        </div>

        {/* Right — the test (tabs + active method) */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex border-b border-border">
          {(["talk", "getcall", "callin"] as Method[]).map((m) => {
            const labels: Record<Method, string> = { talk: "Talk here", getcall: "Get a call", callin: "Call in" }
            const active = method === m
            return (
              <button
                key={m}
                type="button"
                disabled={busy}
                title={busy ? "End the test to switch" : undefined}
                onClick={() => switchMethod(m)}
                className={cn(
                  "-mb-px flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50",
                  active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {labels[m]}
              </button>
            )
          })}
          </div>
          <div className="pt-5">
        {phase === "idle" && method === "talk" && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button className="gap-2" onClick={startTalk}>
              <Mic className="h-4 w-4" /> Talk to {shortName(agent.name)}
            </Button>
            <p className="text-sm text-muted-foreground">Talk to it right here in your browser — uses your free minutes.</p>
          </div>
        )}

        {phase === "idle" && method === "getcall" && (
          <div className="max-w-lg space-y-2">
            <label htmlFor="test-phone" className="text-sm font-medium">Your phone number</label>
            <div className="flex gap-2">
              <Input
                id="test-phone"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value)
                  if (phoneError) setPhoneError(null)
                }}
                inputMode="tel"
                placeholder="+1 (555) 123-4567"
                aria-invalid={!!phoneError}
                onKeyDown={(e) => e.key === "Enter" && startGetCall()}
              />
              <Button onClick={startGetCall} className="shrink-0 gap-1.5">
                <PhoneCall className="h-4 w-4" /> Call me
              </Button>
            </div>
            {phoneError ? (
              <p role="alert" className="text-sm text-destructive">{phoneError}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {agent.name} rings your phone so you can hear it on a real call. Uses your free minutes.
              </p>
            )}
          </div>
        )}

        {phase === "idle" && method === "callin" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Dial this number from your phone</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-lg font-semibold tabular-nums">{TEST_INBOUND_NUMBER}</span>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={copyNumber}>
                {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={simulateCallIn}>
                <PhoneCall className="h-3.5 w-3.5" /> Simulate the call
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">It's a sandbox line routed to {agent.name} — free while you're testing.</p>
          </div>
        )}

        {connecting && (
          <Button className="gap-2" disabled>
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            {method === "getcall" ? "Calling your phone…" : "Connecting…"}
          </Button>
        )}

        {live && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {method === "talk" && (
              <Button size="sm" className="gap-1.5" onClick={talk} disabled={speaking}>
                <Mic className="h-3.5 w-3.5" /> Talk
              </Button>
            )}
            <Button size="sm" variant="destructive" className="gap-1.5" onClick={endTest}>
              <PhoneOff className="h-3.5 w-3.5" /> End test
            </Button>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{method === "talk" ? "Agora RTC" : "On your phone"}</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{fmtTime(elapsed)}</span>
              <span>·</span>
              <span className="tabular-nums">{liveUsedMin} / {freeCap} min</span>
            </p>
          </div>
        )}

        {phase === "ended" && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-sm">
              <span className="font-semibold">Sounds good?</span>{" "}
              <span className="text-muted-foreground">Deploy {agent.name}, or fine-tune it first.</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="gap-1.5" onClick={() => chooseOutcome("deploy")}>
                Deploy it <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-1.5" onClick={() => chooseOutcome("tweak")}>
                <Link href={`/agents/${agent.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" /> Test again
              </Button>
            </div>
          </div>
        )}

        {/* Transcript (talk only) */}
        {method === "talk" && (live || phase === "ended") && lines.length > 0 && (
          <div className="mt-4 max-h-44 w-full max-w-lg space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3">
            {lines.map((l, i) => (
              <div key={i} className={cn("flex", l.role === "you" ? "justify-end" : "justify-start")}>
                <span
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-1.5 text-xs",
                    l.role === "you" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {l.text}
                </span>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Try it as — ephemeral preset re-skin of the test. "Something else" routes to
          Edit (the editor), where a custom job actually persists. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-border px-6 py-3.5 text-sm" role="radiogroup" aria-label="Try the agent as">
        <span className="mr-1 text-muted-foreground">Try it as</span>
        {INTENTS.map((i) => {
          const active = intentId === i.id
          return (
            <button
              key={i.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={busy}
              onClick={() => pickIntent(i.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {i.label}
            </button>
          )
        })}
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <Link
          href={`/agents/${agent.id}/edit#behavior`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Something else <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

function AgentMenuItem({ a }: { a: Agent }) {
  const notLive = a.status !== "live"
  return (
    <DropdownMenuRadioItem value={a.id} className={cn(notLive && "text-muted-foreground")}>
      <div className="flex w-full items-center gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{a.name}</div>
          <div className="truncate text-xs text-muted-foreground">{a.role ?? "Agent"}</div>
        </div>
        {notLive && <Badge variant="outline" className="ml-auto shrink-0 text-xs capitalize">{a.status}</Badge>}
      </div>
    </DropdownMenuRadioItem>
  )
}

// ─── Already-live glance (returning accounts) ───────────────────────────────────

function AlreadyLive() {
  const liveCount = DEPLOYMENTS.filter(
    (d) => d.status === "active" || d.status === "in_progress",
  ).length
  const conversations = DEPLOYMENTS.reduce((sum, d) => sum + d.metrics.calls, 0)

  if (liveCount === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm">
        <Zap className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium tabular-nums">{liveCount}</span>
        <span className="text-muted-foreground">
          live {liveCount === 1 ? "deployment" : "deployments"} ·
        </span>
        <span className="font-medium tabular-nums">{conversations.toLocaleString()}</span>
        <span className="text-muted-foreground">conversations handled</span>
      </div>
      <Button variant="outline" size="sm" asChild className="h-7 gap-1 text-xs">
        <Link href="/monitor">Open Monitor <ArrowRight className="h-3 w-3" /></Link>
      </Button>
    </div>
  )
}

// ─── utils ──────────────────────────────────────────────────────────────────────

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function digits(s: string): string {
  return s.replace(/\D/g, "")
}

function shortName(name: string): string {
  return name.length > 22 ? `${name.slice(0, 21).trimEnd()}…` : name
}
