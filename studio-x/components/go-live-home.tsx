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
 * 2026-06-19 — Option E layout (wireframe-driven). The page IS the agent:
 * Aria is the h1 (identity bar). Below it the two top-level jobs sit side by
 * side as equal panels — TEST IT (talk + phone tests) and PUT IT LIVE (deploy
 * channels) — so the whole job-to-be-done is visible in one glance.
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

const DEFAULT_AGENT = getDefaultAgent()

export function GoLiveHome() {
  const agentParam = `?agent=${DEFAULT_AGENT.id}`

  React.useEffect(() => {
    track(Events.default_agent_provisioned, { agent_id: DEFAULT_AGENT.id })
  }, [])

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <AriaHeader />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TestPanel />
          <DeployPanel agentParam={agentParam} />
        </div>
        <AlreadyLive />
      </div>
    </main>
  )
}

// ─── Aria identity bar — the agent is the page (h1) ─────────────────────────────

function AriaHeader() {
  const est = stackEstimate(DEFAULT_AGENT)
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-5 py-3.5">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight">{DEFAULT_AGENT.name}</h1>
      <Badge variant="default" className="text-xs">Ready</Badge>
      <span className="text-sm text-muted-foreground">{DEFAULT_AGENT.role ?? "General assistant"}</span>
      <span className="hidden items-center gap-2 font-mono text-xs text-muted-foreground lg:flex">
        <span>· {stackSummary(DEFAULT_AGENT)}</span>
        <span className="inline-flex items-center gap-1"><Gauge className="h-3 w-3" />~{est.latencyMs}ms</span>
        <span className="tabular-nums">${est.costPerMin.toFixed(2)}/min</span>
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href={`/agents/${DEFAULT_AGENT.id}/edit`}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </Button>
        <ImportAgentSheet>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload className="h-4 w-4" /> Import agent
          </Button>
        </ImportAgentSheet>
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/agents/new/edit">
            <Plus className="h-4 w-4" /> New agent
          </Link>
        </Button>
      </div>
    </div>
  )
}

// ─── Test it — one hero action (Talk), phone tests secondary ─────────────────────

function TestPanel() {
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

  function selectMethod(next: Method) {
    setMethod(next)
    setPhoneError(null)
  }

  const speak = React.useCallback(
    (text: string) => {
      setSpeaking(true)
      setLines((l) => [...l, { role: "agent", text }])
      after(1400, () => setSpeaking(false))
    },
    [after],
  )

  // ── Talk here (in-browser, free) — the primary path ──
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

  // ── Call my phone (outbound: agent → your phone) ──
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

  // ── Dial a number (inbound: your phone → agent) ──
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

  // ── End (any method) → the test→tweak→deploy hinge ──
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
        ? method === "getcall"
          ? `Calling ${phoneNumber || "your phone"}…`
          : "Connecting…"
        : live
          ? method === "talk"
            ? speaking
              ? `${DEFAULT_AGENT.name} is speaking`
              : "Listening… tap Talk"
            : "Connected — talk on your phone"
          : method === "talk"
            ? "Free, in your browser"
            : method === "getcall"
              ? "We'll ring your phone"
              : "Dial in from your phone"

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">Test it</h2>
        <p className="text-xs text-muted-foreground">Hear {DEFAULT_AGENT.name} work before you ship it.</p>
      </div>

      {/* Stage */}
      <div className="flex flex-1 flex-col items-center px-5 py-6 text-center">
        <div className="mb-3">
          {connecting ? (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <AgentSphere size={96} active={live && (method !== "talk" || speaking)} />
          )}
        </div>

        <p className="text-xs font-medium text-muted-foreground">{statusText}</p>

        {/* idle — talk hero (primary) + phone tests (secondary) */}
        {phase === "idle" && method === "talk" && (
          <div className="mt-3 flex flex-col items-center gap-3">
            <Button size="lg" className="gap-2" onClick={startTalk}>
              <Mic className="h-4 w-4" /> Talk to {DEFAULT_AGENT.name}
            </Button>
            <p className="text-xs text-muted-foreground">
              Prefer a real call?{" "}
              <button
                type="button"
                onClick={() => selectMethod("getcall")}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                Call my phone
              </button>{" "}
              ·{" "}
              <button
                type="button"
                onClick={() => selectMethod("callin")}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                get a test number
              </button>
            </p>
          </div>
        )}

        {/* idle — call my phone (outbound) */}
        {phase === "idle" && method === "getcall" && (
          <div className="mt-3 w-full max-w-xs space-y-2">
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
              />
              <Button onClick={startGetCall} className="shrink-0 gap-1.5">
                <PhoneCall className="h-4 w-4" /> Call me
              </Button>
            </div>
            {phoneError && <p className="text-left text-xs text-destructive">{phoneError}</p>}
            <button
              type="button"
              onClick={() => selectMethod("talk")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          </div>
        )}

        {/* idle — dial a number (inbound) */}
        {phase === "idle" && method === "callin" && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-semibold tabular-nums">{TEST_INBOUND_NUMBER}</span>
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={copyNumber}>
                {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Call this sandbox line from your phone — free while testing.</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={simulateCallIn}>
                <PhoneCall className="h-3.5 w-3.5" /> Simulate the call
              </Button>
              <button
                type="button"
                onClick={() => selectMethod("talk")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* connecting */}
        {connecting && (
          <Button size="lg" className="mt-3 gap-2" disabled>
            <Loader2 className="h-4 w-4 animate-spin" />
            {method === "talk" ? "Connecting…" : method === "getcall" ? "Calling…" : "Connecting…"}
          </Button>
        )}

        {/* live */}
        {live && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {method === "talk" && (
                <Button size="sm" className="gap-1.5" onClick={talk} disabled={speaking}>
                  <Mic className="h-3.5 w-3.5" /> Talk
                </Button>
              )}
              <Button size="sm" variant="destructive" className="gap-1.5" onClick={endTest}>
                <PhoneOff className="h-3.5 w-3.5" /> End test
              </Button>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{method === "talk" ? "Agora RTC" : "On your phone"}</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{fmtTime(elapsed)}</span>
              <span>·</span>
              <span className="tabular-nums">{liveUsedMin} / {PLAN_USAGE.freeMinutesIncluded} min</span>
            </p>
          </div>
        )}

        {/* ended — the hinge */}
        {phase === "ended" && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <p className="text-sm">
              <span className="font-semibold">How did that go?</span>{" "}
              <span className="text-muted-foreground">Put it live, or fine-tune it first.</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
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
          <div className="mt-4 max-h-40 w-full space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3 text-left">
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

// ─── Put it live — deploy channels (the second top-level job) ────────────────────

function DeployPanel({ agentParam }: { agentParam: string }) {
  return (
    <div id="deploy" className="flex flex-col overflow-hidden rounded-xl border border-border bg-card scroll-mt-6">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">Put it live</h2>
        <p className="text-xs text-muted-foreground">When it's ready, pick a channel.</p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <DeployRow
          href={`/deploy/batch-calls/new${agentParam}`}
          channel="campaign"
          icon={PhoneOutgoing}
          title="Launch a campaign"
          desc="Upload contacts — your agent calls each one."
          recommended
        />
        <DeployRow
          href={`/deploy/inbound/new${agentParam}`}
          channel="inbound"
          icon={PhoneIncoming}
          title="Answer a number"
          desc="Picks up every inbound call, 24/7."
        />
        <DeployRow
          href="/deploy/web-widget"
          channel="web"
          icon={Globe}
          title="Embed on your site"
          desc="Click-to-talk widget — no number needed."
        />
      </div>
    </div>
  )
}

function DeployRow({
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
        "group flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm",
        recommended
          ? "border-primary/40 bg-primary/5 hover:border-primary/60"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          recommended ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          {recommended && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
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
