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
  Globe,
  Pencil,
  Check,
  Zap,
  Phone,
  PhoneCall,
  Copy,
  Gauge,
  RotateCcw,
  Upload,
  Plus,
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
 * 2026-06-19 UX optimization pass (/optimize + /shadcn): lower cognitive load,
 * deploy above the fold, and three ways to start an agent surfaced up front —
 * test the auto-provisioned Aria, IMPORT one from a competitor, or build new.
 *
 *   START   — Import agent (migrate) · New agent · or just test the live Aria
 *   TEST    — compact card: Talk here · Get a call · Call in (stateful)
 *   ↳ TWEAK — quiet "Tailor it" chips + Edit agent
 *   DEPLOY  — 3 compact channel cards, visible without scrolling
 */

// ─── 1-tap intent re-skin ──────────────────────────────────────────────────────

type Intent = {
  id: string
  label: string
  role: string
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
    role: "Customer support agent",
    greeting: "Hi, thanks for reaching out to support — what can I help you sort out today?",
    you: "My order hasn't arrived yet.",
    agent: "I'm sorry about that. I can check the status and arrange a reship or a refund — what's your order number?",
  },
  {
    id: "appointments",
    label: "Appointment reminders",
    role: "Appointment reminder agent",
    greeting: "Hi! A quick reminder about your upcoming appointment — is now a good time?",
    you: "Yes, can I move it to Friday?",
    agent: "Of course — I've got Friday at 2:00 or 4:30. Which works better for you?",
  },
  {
    id: "surveys",
    label: "Surveys & feedback",
    role: "Survey agent",
    greeting: "Hi! I've got two quick questions about your recent experience — got 60 seconds?",
    you: "Sure, go ahead.",
    agent: "Great — on a scale of 0 to 10, how likely are you to recommend us to a friend?",
  },
  {
    id: "sales",
    label: "Sales follow-up",
    role: "Sales follow-up agent",
    greeting: "Hi! Following up on your interest — happy to answer questions or get you set up. What's on your mind?",
    you: "What does pricing look like?",
    agent: "Plans start free with 300 minutes a month, then scale with usage. Want me to size it to your call volume?",
  },
]

// ─── test state machine (wireframe — no real ASR/LLM/TTS/telephony) ─────────────

type Mode = "talk" | "getcall" | "callin"
type Phase = "idle" | "connecting" | "live" | "ended"
type Line = { role: "agent" | "you"; text: string }

const DEFAULT_AGENT = getDefaultAgent()

const TEST_MODES: { id: Mode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "talk", label: "Talk here", icon: Mic },
  { id: "getcall", label: "Get a call", icon: PhoneCall },
  { id: "callin", label: "Call in", icon: Phone },
]

export function GoLiveHome() {
  const agentParam = `?agent=${DEFAULT_AGENT.id}`

  React.useEffect(() => {
    track(Events.default_agent_provisioned, { agent_id: DEFAULT_AGENT.id })
  }, [])

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <HomeHeader />
        <TestAgent />
        <PutItLive agentParam={agentParam} />
        <AlreadyLive />
      </div>
    </main>
  )
}

// ─── Header — greeting + the three ways to start ────────────────────────────────

function HomeHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          {DEFAULT_AGENT.name} is live — test it, tweak it, then put it live.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ImportAgentSheet>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload className="h-4 w-4" /> Import agent
          </Button>
        </ImportAgentSheet>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/agents/new/edit">
            <Plus className="h-4 w-4" /> New agent
          </Link>
        </Button>
      </div>
    </div>
  )
}

// ─── Test the agent — compact card, 3 stateful modes, tweak→deploy hinge ─────────

function TestAgent() {
  const [mode, setMode] = React.useState<Mode>("talk")
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
  const role = intent?.role ?? DEFAULT_AGENT.role ?? "General assistant"
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

  function switchMode(next: Mode) {
    if (next === mode) return
    reset()
    setMode(next)
  }

  const speak = React.useCallback(
    (text: string) => {
      setSpeaking(true)
      setLines((l) => [...l, { role: "agent", text }])
      after(1400, () => setSpeaking(false))
    },
    [after],
  )

  // ── Talk here (in-browser, free) ──
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

  // ── Get a call (outbound: agent → your phone) ──
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

  // ── Call in (inbound: your phone → agent) ──
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

  // ── End (any mode) → the test→tweak→deploy hinge ──
  const endTest = React.useCallback(() => {
    cleanup()
    setSpeaking(false)
    if (mode === "talk") {
      track(Events.web_test_call_ended, { duration_sec: elapsed })
    } else {
      track(Events.phone_test_call_ended, {
        direction: mode === "getcall" ? "outbound" : "inbound",
        duration_sec: elapsed,
      })
    }
    setPhase("ended")
  }, [cleanup, mode, elapsed])

  function pickIntent(id: string) {
    const next = intentId === id ? null : id
    setIntentId(next)
    if (next) track(Events.agent_intent_selected, { intent: next })
  }

  function chooseOutcome(outcome: "tweak" | "deploy") {
    track(Events.test_outcome_selected, { outcome })
    if (outcome === "deploy") {
      document.getElementById("deploy")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const connecting = phase === "connecting"
  const live = phase === "live"
  const liveUsedMin = (PLAN_USAGE.freeMinutesUsed + elapsed / 60).toFixed(1)

  const statusText =
    phase === "ended"
      ? "Test ended"
      : connecting
        ? mode === "getcall"
          ? `Calling ${phoneNumber || "your phone"}…`
          : "Connecting…"
        : live
          ? mode === "talk"
            ? speaking
              ? `${DEFAULT_AGENT.name} is speaking`
              : "Listening… tap Talk"
            : "Connected — talk on your phone"
          : mode === "talk"
            ? "Talk to it right here, free"
            : mode === "getcall"
              ? "We'll ring your phone"
              : "Dial in from your phone"

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Identity strip — compact, two lines */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <h2 className="text-base font-semibold tracking-tight">{DEFAULT_AGENT.name}</h2>
          <Badge variant="default" className="text-xs">Ready</Badge>
          <span className="truncate text-sm text-muted-foreground">{role}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-xs text-muted-foreground sm:flex">
            <span>{stackSummary(DEFAULT_AGENT)}</span>
            <span className="inline-flex items-center gap-1"><Gauge className="h-3 w-3" />~{est.latencyMs}ms</span>
            <span className="tabular-nums">${est.costPerMin.toFixed(2)}/min</span>
          </span>
          <Button variant="ghost" size="sm" asChild className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground">
            <Link href={`/agents/${DEFAULT_AGENT.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Stage — mode switcher + orb beside controls */}
      <div className="p-5">
        <div className="inline-flex w-full rounded-lg border border-border bg-background p-1">
          {TEST_MODES.map((m) => {
            const active = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                disabled={connecting || live}
                onClick={() => switchMode(m.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center gap-5">
          <div className="shrink-0">
            {connecting ? (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <AgentSphere size={96} active={live && (mode !== "talk" || speaking)} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{statusText}</p>

            <div className="mt-2">
              {/* idle — talk */}
              {phase === "idle" && mode === "talk" && (
                <Button className="gap-2" onClick={startTalk}>
                  <Mic className="h-4 w-4" /> Talk to {DEFAULT_AGENT.name}
                </Button>
              )}

              {/* idle — get a call */}
              {phase === "idle" && mode === "getcall" && (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      aria-label="Your phone number"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value)
                        if (phoneError) setPhoneError(null)
                      }}
                      inputMode="tel"
                      placeholder="+1 (555) 123-4567"
                      aria-invalid={!!phoneError}
                      onKeyDown={(e) => e.key === "Enter" && startGetCall()}
                      className="max-w-[12rem]"
                    />
                    <Button onClick={startGetCall} className="shrink-0 gap-1.5">
                      <PhoneCall className="h-4 w-4" /> Call me
                    </Button>
                  </div>
                  {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                </div>
              )}

              {/* idle — call in */}
              {phase === "idle" && mode === "callin" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-semibold tabular-nums">{TEST_INBOUND_NUMBER}</span>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={copyNumber}>
                      {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={simulateCallIn}>
                    <PhoneCall className="h-3.5 w-3.5" /> Simulate the call
                  </Button>
                </div>
              )}

              {/* connecting */}
              {connecting && (
                <Button className="gap-2" disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "talk" ? "Connecting…" : mode === "getcall" ? "Calling…" : "Connecting…"}
                </Button>
              )}

              {/* live */}
              {live && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {mode === "talk" && (
                      <Button size="sm" className="gap-1.5" onClick={talk} disabled={speaking}>
                        <Mic className="h-3.5 w-3.5" /> Talk
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" className="gap-1.5" onClick={endTest}>
                      <PhoneOff className="h-3.5 w-3.5" /> End test
                    </Button>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{mode === "talk" ? "Agora RTC" : "On your phone"}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">{fmtTime(elapsed)}</span>
                    <span>·</span>
                    <span className="tabular-nums">{liveUsedMin} / {PLAN_USAGE.freeMinutesIncluded} min</span>
                  </p>
                </div>
              )}

              {/* ended — the hinge */}
              {phase === "ended" && (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">How did that go?</span>{" "}
                    <span className="text-muted-foreground">Put it live, or fine-tune it first.</span>
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
            </div>
          </div>
        </div>

        {/* Transcript (talk only) */}
        {mode === "talk" && (live || phase === "ended") && lines.length > 0 && (
          <div className="mt-4 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3">
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

      {/* Tailor footer — quiet 1-tap re-skin */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/30 px-5 py-3">
        <span className="text-xs font-medium text-muted-foreground">Tailor it:</span>
        {INTENTS.map((i) => {
          const active = intentId === i.id
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => pickIntent(i.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {active && <Check className="h-3 w-3" />}
              {i.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Put it live — 3 compact channel cards (above the fold) ──────────────────────

function PutItLive({ agentParam }: { agentParam: string }) {
  return (
    <section id="deploy" className="scroll-mt-6 space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold">Put it live</h2>
        <span className="text-sm text-muted-foreground">— pick a channel when it's ready</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DeployCard
          href={`/deploy/batch-calls/new${agentParam}`}
          channel="campaign"
          icon={PhoneOutgoing}
          title="Launch a campaign"
          desc="Upload contacts — your agent calls each one."
          recommended
        />
        <DeployCard
          href={`/deploy/inbound/new${agentParam}`}
          channel="inbound"
          icon={PhoneIncoming}
          title="Answer a number"
          desc="Picks up every inbound call, 24/7."
        />
        <DeployCard
          href="/deploy/web-widget"
          channel="web"
          icon={Globe}
          title="Embed on your site"
          desc="Click-to-talk widget — no number needed."
        />
      </div>
    </section>
  )
}

function DeployCard({
  href,
  channel,
  icon: Icon,
  title,
  desc,
  recommended,
}: {
  href: string
  channel: "campaign" | "inbound" | "web"
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  recommended?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={() => track(Events.put_to_work_selected, { channel })}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border p-4 transition-all hover:shadow-sm",
        recommended
          ? "border-primary/40 bg-primary/5 hover:border-primary/60"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            recommended ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {recommended && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
      </div>
      <div>
        <h3 className="flex items-center gap-1 text-sm font-semibold">
          {title}
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
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
        <span className="text-muted-foreground">live deployments ·</span>
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
