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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AgentSphere } from "@/components/agent-test-panel"
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
 * The agent is auto-provisioned and live. The home walks the new user through
 * the real journey (2026-06-19, journey pass):
 *
 *   1 · TEST    — call the agent three ways: in-browser, "get a call" (agent
 *                 dials your phone — outbound), or "call in" (you dial a sandbox
 *                 number — inbound). Each is a proper stateful flow.
 *   ↳   TWEAK   — reskin in one tap ("what should it do?") or open the editor.
 *   2 · DEPLOY  — happy with it? put it on a channel (campaign · number · web).
 *
 * The test widget mirrors the two deploy paths: "get a call" → outbound campaign,
 * "call in" → answer-a-number. Believe-then-scale: minutes consumed → free tier
 * exhausted → paid (the meter is visible from minute one).
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

  // Default agent is provisioned & live on arrival — record it once.
  React.useEffect(() => {
    track(Events.default_agent_provisioned, { agent_id: DEFAULT_AGENT.id })
  }, [])

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <HomeHeader />

        {/* 1 · Test — call the live agent three ways, tweak until it's right. */}
        <section className="space-y-3">
          <SectionHeading
            step={1}
            title="Test your agent"
            hint={`Call ${DEFAULT_AGENT.name} over the web or a real phone, then tweak it until it's right.`}
          />
          <TestAgent />
        </section>

        {/* 2 · Deploy — put it on a channel (anchor for the "Deploy it" hinge). */}
        <PutToWork agentParam={agentParam} />

        <AlreadyLive />
      </div>
    </main>
  )
}

// ─── Section heading (shared rhythm + optional step chip) ────────────────────────

function SectionHeading({ step, title, hint }: { step?: number; title: string; hint?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {step !== undefined && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">
            {step}
          </span>
        )}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────────
// Free-minutes meter moved to the account menu + avatar ring (2026-06-19).

function HomeHeader() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        {DEFAULT_AGENT.name} is live and ready. Test it over the web or a real phone, fine-tune it,
        then put it on real traffic.
      </p>
    </div>
  )
}

// ─── Test the agent — 3 stateful modes + the test→tweak→deploy hinge ─────────────

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

  // Agent "speaks" a line: brief pulse on the orb, then commit to the transcript.
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
            ? "Ready when you are"
            : mode === "getcall"
              ? "Enter your number to get a call"
              : "Call the number to reach it"

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
      {/* Left — agent identity + 1-tap re-skin (the "tweak") */}
      <div className="bg-card p-6">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live · ready to test
        </div>

        <div className="mt-3 flex items-center gap-2">
          <h3 className="text-2xl font-semibold tracking-tight">{DEFAULT_AGENT.name}</h3>
          <Badge variant="default" className="text-xs">Ready</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{role}</p>

        {/* Stack + speed + cost — the tradeoff, before you commit */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono">{stackSummary(DEFAULT_AGENT)}</span>
          <span className="inline-flex items-center gap-1">
            <Gauge className="h-3 w-3" /> ~{est.latencyMs}ms
          </span>
          <span className="tabular-nums">${est.costPerMin.toFixed(2)}/min</span>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            What should it do?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTENTS.map((i) => {
              const active = intentId === i.id
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => pickIntent(i.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  {i.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {intent ? (
              <>Set up for <span className="text-foreground">{intent.label.toLowerCase()}</span>. Change it anytime.</>
            ) : (
              "Pick a job to tailor it — or keep it general."
            )}
          </p>
        </div>

        <Button variant="ghost" size="sm" asChild className="mt-5 gap-1.5 px-0 text-xs text-muted-foreground hover:text-foreground">
          <Link href={`/agents/${DEFAULT_AGENT.id}/edit`}>
            <Pencil className="h-3.5 w-3.5" /> Edit the full agent
          </Link>
        </Button>
      </div>

      {/* Right — the test stage: pick a mode, each a proper stateful flow */}
      <div className="flex flex-col bg-card/40 p-6">
        {/* Mode switcher — reveals what each test needs (locked during a call) */}
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

        <div className="mt-5 flex flex-1 flex-col items-center">
          <p className="text-center text-xs font-medium text-muted-foreground">{statusText}</p>

          {/* Orb / connecting spinner */}
          <div className="my-5 flex items-center justify-center">
            {connecting ? (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : (
              <AgentSphere size={128} active={live && (mode !== "talk" || speaking)} />
            )}
          </div>

          {/* ── idle bodies (mode-specific) ── */}
          {phase === "idle" && mode === "talk" && (
            <>
              <Button size="lg" className="gap-2" onClick={startTalk}>
                <Mic className="h-4 w-4" /> Talk to {DEFAULT_AGENT.name}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                No phone number needed — talk to it right here, free.
              </p>
            </>
          )}

          {phase === "idle" && mode === "getcall" && (
            <div className="w-full max-w-xs space-y-2">
              <label htmlFor="test-phone" className="text-xs font-medium text-muted-foreground">
                Your phone number
              </label>
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
                <p className="text-xs text-destructive">{phoneError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {DEFAULT_AGENT.name} rings your phone so you can hear it on a real call. Uses your free minutes.
                </p>
              )}
            </div>
          )}

          {phase === "idle" && mode === "callin" && (
            <div className="w-full max-w-xs space-y-3 text-center">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Dial this number
                </p>
                <div className="mt-1.5 flex items-center justify-center gap-2">
                  <span className="font-mono text-lg font-semibold tabular-nums">{TEST_INBOUND_NUMBER}</span>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={copyNumber}>
                    {copied ? (
                      <><Check className="h-3 w-3" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy</>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Call this sandbox line from your phone to reach {DEFAULT_AGENT.name} — free while you&apos;re testing.
              </p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={simulateCallIn}>
                <PhoneCall className="h-3.5 w-3.5" /> Simulate the call
              </Button>
            </div>
          )}

          {/* ── connecting ── */}
          {connecting && (
            <Button size="lg" className="gap-2" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "talk" ? "Connecting…" : mode === "getcall" ? "Calling your phone…" : "Connecting your call…"}
            </Button>
          )}

          {/* ── live ── */}
          {live && (
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
          )}

          {live && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {mode === "talk" ? "Agora RTC" : "On your phone"}
              </span>
              <span>·</span>
              <span className="font-mono tabular-nums">{fmtTime(elapsed)}</span>
              <span>·</span>
              <span className="tabular-nums">{liveUsedMin} / {PLAN_USAGE.freeMinutesIncluded} min</span>
            </div>
          )}

          {/* ── ended → the test→tweak→deploy hinge ── */}
          {phase === "ended" && (
            <div className="w-full max-w-xs space-y-3 text-center">
              <div>
                <p className="text-sm font-semibold">How did that go?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Happy with {DEFAULT_AGENT.name}? Put it live — or fine-tune it first.
                </p>
              </div>
              <div className="space-y-2">
                <Button className="w-full gap-1.5" onClick={() => chooseOutcome("deploy")}>
                  Deploy it <ArrowRight className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1 gap-1.5" onClick={() => chooseOutcome("tweak")}>
                    <Link href={`/agents/${DEFAULT_AGENT.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" /> Tweak
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 gap-1.5" onClick={reset}>
                    <RotateCcw className="h-3.5 w-3.5" /> Test again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Transcript (talk mode only) */}
          {mode === "talk" && (live || phase === "ended") && lines.length > 0 && (
            <div className="mt-5 max-h-44 w-full space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3">
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
  )
}

// ─── 2 · Put it live — the deploy step (anchor target for the "Deploy it" hinge) ──

function PutToWork({ agentParam }: { agentParam: string }) {
  return (
    <section id="deploy" className="space-y-3 scroll-mt-6">
      <SectionHeading
        step={2}
        title="Put it live"
        hint="Happy with it? Deploy your agent to a calling campaign, a phone number, or your website."
      />

      {/* Flagship — outbound campaign (fastest path to paid volume) */}
      <Link
        href={`/deploy/batch-calls/new${agentParam}`}
        onClick={() => track(Events.put_to_work_selected, { channel: "campaign" })}
        className="group flex items-start gap-4 rounded-xl border border-primary/40 bg-primary/5 p-5 transition-all hover:border-primary/60 hover:shadow-sm"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PhoneOutgoing className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Launch a campaign</h3>
            <Badge variant="secondary" className="text-xs">Recommended</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a list of contacts and your agent calls each one — hundreds of calls in minutes.
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>

      {/* Secondary — always-on channels */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SecondaryChannel
          href={`/deploy/inbound/new${agentParam}`}
          channel="inbound"
          icon={PhoneIncoming}
          title="Answer a phone number"
          desc="Put your agent on a number so it picks up every inbound call, 24/7."
        />
        <SecondaryChannel
          href="/deploy/web-widget"
          channel="web"
          icon={Globe}
          title="Embed on your site"
          desc="Drop a click-to-talk widget on your website — no phone number needed."
        />
      </div>
    </section>
  )
}

function SecondaryChannel({
  href,
  channel,
  icon: Icon,
  title,
  desc,
}: {
  href: string
  channel: "inbound" | "web"
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      onClick={() => track(Events.put_to_work_selected, { channel })}
      className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-foreground" />
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
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
