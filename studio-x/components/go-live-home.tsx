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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AgentSphere } from "@/components/agent-test-panel"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import {
  getDefaultAgent,
  stackSummary,
  stackEstimate,
  TEST_INBOUND_NUMBER,
  PLAN_USAGE,
  DEPLOYMENTS,
} from "@/lib/campaign-data"
import { track, Events } from "@/lib/analytics"

/**
 * GoLiveHome — the "Go Live" home (Deploy hub Overview).
 * ────────────────────────────────────────────────────────────────
 * 2026-06-19 — deploy-first home matching the user's Figma:
 *   • Title "Deploy an AI agent in minutes".
 *   • 3 deploy-channel cards up top (Launch batch calls · Answer a phone number ·
 *     Code), each with icon'd sub-action links — the primary job, front & center.
 *   • One rich agent card below: orb + identity on the left, "What should it do?"
 *     re-skin radios on the right, and Talk here · Get a call · Call in test tabs
 *     with the active method's controls beneath.
 */

// ─── 1-tap intent re-skin ──────────────────────────────────────────────────────

type Intent = {
  id: string
  label: string
  greeting: string
  you: string
  agent: string
}

const DEFAULT_GREETING =
  "Hi! I'm Aria, your Agora assistant. Ask me anything — or pick what you'd like me to handle for your customers."

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
type Channel = "campaign" | "inbound" | "web" | "code"

const DEFAULT_AGENT = getDefaultAgent()

const TEST_TABS: { id: Method; label: string }[] = [
  { id: "talk", label: "Talk here" },
  { id: "getcall", label: "Get a call" },
  { id: "callin", label: "Call in" },
]

export function GoLiveHome() {
  const agentParam = `?agent=${DEFAULT_AGENT.id}`

  React.useEffect(() => {
    track(Events.default_agent_provisioned, { agent_id: DEFAULT_AGENT.id })
  }, [])

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <DeployHeader />
        <ChannelHero agentParam={agentParam} />
        <AgentCard />
        <AlreadyLive />
      </div>
    </main>
  )
}

// ─── Header — deploy is the headline ────────────────────────────────────────────

function DeployHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <h1 className="text-2xl font-semibold tracking-tight">Deploy an AI agent in minutes</h1>
      <div className="flex items-center gap-2">
        <ImportAgentSheet>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload className="h-4 w-4" /> Import agent
          </Button>
        </ImportAgentSheet>
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/agents/new/edit">
            <Plus className="h-4 w-4" /> Create blank agent
          </Link>
        </Button>
      </div>
    </div>
  )
}

// ─── Channel hero — the primary job: pick where to deploy ────────────────────────

function ChannelHero({ agentParam }: { agentParam: string }) {
  return (
    <section id="channels" className="grid scroll-mt-6 grid-cols-1 gap-4 md:grid-cols-3">
      <ChannelCard
        href={`/deploy/batch-calls/new${agentParam}`}
        channel="campaign"
        icon={PhoneOutgoing}
        title="Launch batch calls"
        desc="Upload a list of contacts and your agent calls each one."
        subActions={[{ label: "Batch Calling", icon: Phone, href: `/deploy/batch-calls/new${agentParam}`, channel: "campaign" }]}
      />
      <ChannelCard
        href={`/deploy/inbound/new${agentParam}`}
        channel="inbound"
        icon={PhoneIncoming}
        title="Answer a phone number"
        desc="Your agent picks up every inbound call, 24/7."
        subActions={[
          { label: "Web Widget", icon: Globe, href: "/deploy/web-widget", channel: "web" },
          { label: "Phone Number", icon: Phone, href: "/deploy/phone-numbers" },
        ]}
      />
      <ChannelCard
        href="/deploy/code"
        channel="code"
        icon={Code2}
        title="Code"
        desc="Export your agent to any stack."
        subActions={[
          { label: "cURL", icon: Code2, href: "/deploy/code" },
          { label: "Python", icon: Code2, href: "/deploy/code" },
          { label: "Node", icon: Code2, href: "/deploy/code" },
        ]}
      />
    </section>
  )
}

function ChannelCard({
  href,
  channel,
  icon: Icon,
  title,
  desc,
  subActions,
}: {
  href: string
  channel: Channel
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  subActions: { label: string; icon: React.ComponentType<{ className?: string }>; href: string; channel?: Channel }[]
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>

      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm">
        {subActions.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            onClick={() => s.channel && track(Events.put_to_work_selected, { channel: s.channel })}
            className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
          >
            <s.icon className="h-4 w-4 text-muted-foreground" />
            {s.label}
          </Link>
        ))}
      </div>

      {/* Whole card → the channel's primary route (sub-links sit above via z-10). */}
      <Link
        href={href}
        onClick={() => track(Events.put_to_work_selected, { channel })}
        aria-label={title}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}

// ─── Agent card — orb + identity + "what should it do?" + test tabs ──────────────

function AgentCard() {
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

  const intent = INTENTS.find((i) => i.id === intentId) ?? null
  const greeting = intent?.greeting ?? DEFAULT_GREETING
  const est = stackEstimate(DEFAULT_AGENT)

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

  function switchMethod(next: Method) {
    if (next === method || phase === "connecting" || phase === "live") return
    reset()
    setMethod(next)
  }

  const speak = React.useCallback(
    (text: string) => {
      setSpeaking(true)
      setLines((l) => [...l, { role: "agent", text }])
      after(1400, () => setSpeaking(false))
    },
    [after],
  )

  const startTalk = React.useCallback(() => {
    setPhase("connecting")
    track(Events.web_test_call_started, { agent_id: DEFAULT_AGENT.id, intent: intentId ?? "general" })
    after(1200, () => {
      setPhase("live")
      startTimer()
      after(400, () => speak(greeting))
    })
  }, [intentId, greeting, after, speak, startTimer])

  const talk = React.useCallback(() => {
    if (phase !== "live" || speaking) return
    const t = turns
    setTurns(t + 1)
    if (t === 0 && intent) {
      setLines((l) => [...l, { role: "you", text: intent.you }])
      after(900, () => speak(intent.agent))
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
  }, [phase, speaking, turns, intent, after, speak])

  const startGetCall = React.useCallback(() => {
    if (digits(phoneNumber).length < 10) {
      setPhoneError("Enter a valid phone number — at least 10 digits.")
      return
    }
    setPhoneError(null)
    setPhase("connecting")
    track(Events.phone_test_call_started, { direction: "outbound" })
    after(1800, () => {
      setPhase("live")
      startTimer()
      track(Events.phone_test_call_connected, { direction: "outbound" })
    })
  }, [phoneNumber, after, startTimer])

  const copyNumber = React.useCallback(() => {
    navigator.clipboard?.writeText(TEST_INBOUND_NUMBER).catch(() => {})
    setCopied(true)
    track(Events.test_number_copied)
    after(1600, () => setCopied(false))
  }, [after])

  const simulateCallIn = React.useCallback(() => {
    setPhase("connecting")
    track(Events.phone_test_call_started, { direction: "inbound" })
    after(1800, () => {
      setPhase("live")
      startTimer()
      track(Events.phone_test_call_connected, { direction: "inbound" })
    })
  }, [after, startTimer])

  const endTest = React.useCallback(() => {
    cleanup()
    setSpeaking(false)
    if (method === "talk") {
      track(Events.web_test_call_ended, { duration_sec: elapsed })
    } else {
      track(Events.phone_test_call_ended, {
        direction: method === "getcall" ? "outbound" : "inbound",
        duration_sec: elapsed,
      })
    }
    setPhase("ended")
  }, [cleanup, method, elapsed])

  function pickIntent(id: string) {
    const next = intentId === id ? null : id
    setIntentId(next)
    if (next) track(Events.agent_intent_selected, { intent: next })
  }

  function chooseOutcome(outcome: "tweak" | "deploy") {
    track(Events.test_outcome_selected, { outcome })
    if (outcome === "deploy") {
      document.getElementById("channels")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const connecting = phase === "connecting"
  const live = phase === "live"
  const liveUsedMin = (PLAN_USAGE.freeMinutesUsed + elapsed / 60).toFixed(1)

  const statusBadge =
    phase === "ended" ? "Test ended" : connecting ? "Connecting…" : live ? "Live" : "Ready to talk"

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Top — orb + identity (left) · what should it do (right) */}
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            {connecting ? (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : (
              <AgentSphere size={128} active={live && (method !== "talk" || speaking)} />
            )}
          </div>
          <div>
            <Badge variant="outline" className="gap-1.5 text-xs font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {statusBadge}
            </Badge>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{DEFAULT_AGENT.name}</h2>
            <p className="text-sm text-muted-foreground">{DEFAULT_AGENT.role ?? "General assistant"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{est.latencyMs}ms</span>
              <span className="tabular-nums">${est.costPerMin.toFixed(2)}/min</span>
              <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{stackSummary(DEFAULT_AGENT)}</span>
            </div>
          </div>
        </div>

        {/* What should it do? — re-skin radios */}
        <div className="md:w-56 md:shrink-0">
          <h3 className="text-base font-semibold">What should it do?</h3>
          <div className="mt-2 space-y-1.5" role="radiogroup" aria-label="What should it do?">
            {INTENTS.map((i) => {
              const active = intentId === i.id
              return (
                <button
                  key={i.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => pickIntent(i.id)}
                  className="flex w-full items-center gap-2.5 text-left text-sm"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                      active ? "border-primary" : "border-muted-foreground/40",
                    )}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </span>
                  <span className={active ? "text-foreground" : "text-muted-foreground"}>{i.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Test tabs */}
      <div className="flex border-t border-border">
        {TEST_TABS.map((t) => {
          const active = method === t.id
          return (
            <button
              key={t.id}
              type="button"
              disabled={connecting || live}
              onClick={() => switchMethod(t.id)}
              className={cn(
                "-mb-px flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="px-6 py-5">
        {/* idle — talk */}
        {phase === "idle" && method === "talk" && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button className="gap-2" onClick={startTalk}>
              <Mic className="h-4 w-4" /> Talk to {DEFAULT_AGENT.name}
            </Button>
            <p className="text-sm text-muted-foreground">Talk to it right here in your browser — uses your free minutes.</p>
          </div>
        )}

        {/* idle — get a call */}
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
                {DEFAULT_AGENT.name} rings your phone so you can hear it on a real call. Uses your free minutes.
              </p>
            )}
          </div>
        )}

        {/* idle — call in */}
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
            <p className="text-sm text-muted-foreground">It's a sandbox line routed to {DEFAULT_AGENT.name} — free while you're testing.</p>
          </div>
        )}

        {/* connecting */}
        {connecting && (
          <Button className="gap-2" disabled>
            <Loader2 className="h-4 w-4 animate-spin" />
            {method === "getcall" ? "Calling your phone…" : "Connecting…"}
          </Button>
        )}

        {/* live */}
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
              <span className="tabular-nums">{liveUsedMin} / {PLAN_USAGE.freeMinutesIncluded} min</span>
            </p>
          </div>
        )}

        {/* ended — hinge back up to deploy */}
        {phase === "ended" && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-sm">
              <span className="font-semibold">Sounds good?</span>{" "}
              <span className="text-muted-foreground">Deploy {DEFAULT_AGENT.name}, or fine-tune it first.</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="gap-1.5" onClick={() => chooseOutcome("deploy")}>
                Deploy it <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-1.5" onClick={() => chooseOutcome("tweak")}>
                <Link href={`/agents/${DEFAULT_AGENT.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" /> Tweak
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
