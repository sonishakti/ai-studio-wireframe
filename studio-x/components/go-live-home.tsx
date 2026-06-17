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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AgentSphere } from "@/components/agent-test-panel"
import {
  getDefaultAgent,
  stackSummary,
  PLAN_USAGE,
  DEPLOYMENTS,
} from "@/lib/campaign-data"
import { track, Events } from "@/lib/analytics"

/**
 * GoLiveHome — the first-run "Go Live" home (Deploy hub Overview).
 * ────────────────────────────────────────────────────────────────
 * 2026-06-17 activation-revenue realignment. The agent is already provisioned
 * and live; the user's job is no longer "build an agent" but "hear it work, then
 * put it on real traffic." Believe-then-scale:
 *
 *   BELIEVE  — talk to the live default agent in-browser (<60s, free minutes)
 *   SCALE    — "Put it to work" → launch a campaign (flagship) · number · widget
 *
 * Revenue lives past the old "published" line: minutes consumed → free tier
 * exhausted → paid. The free-minutes meter is visible from minute one.
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

// ─── talk state machine (wireframe — no real ASR/LLM/TTS) ───────────────────────

type Phase = "idle" | "connecting" | "live"
type Line = { role: "agent" | "you"; text: string }

const DEFAULT_AGENT = getDefaultAgent()

export function GoLiveHome() {
  const agentParam = `?agent=${DEFAULT_AGENT.id}`

  // Default agent is provisioned & live on arrival — record it once.
  React.useEffect(() => {
    track(Events.default_agent_provisioned, { agent_id: DEFAULT_AGENT.id })
  }, [])

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <FreeMinutesStrip />
        <HeroTalk />
        <PutToWork agentParam={agentParam} />
        <AlreadyLive />
      </div>
    </main>
  )
}

// ─── Free-minutes meter ─────────────────────────────────────────────────────────

function FreeMinutesStrip() {
  const pct = Math.min(
    100,
    Math.round((PLAN_USAGE.freeMinutesUsed / PLAN_USAGE.freeMinutesIncluded) * 100),
  )
  const remaining = PLAN_USAGE.freeMinutesIncluded - PLAN_USAGE.freeMinutesUsed

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{PLAN_USAGE.plan} plan</Badge>
          <p className="text-sm font-medium">
            <span className="tabular-nums">{PLAN_USAGE.freeMinutesUsed}</span>
            {" / "}
            <span className="tabular-nums">{PLAN_USAGE.freeMinutesIncluded}</span> free minutes used
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-7 gap-1 text-xs">
          <Link
            href="/billing/usage"
            onClick={() => track(Events.quota_warning_clicked, { meter: "free_minutes", pct_used: pct })}
          >
            View usage <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {remaining.toLocaleString()} minutes left this month. Your first campaign turns these into
        live conversations — that&apos;s when an agent starts earning its keep.
      </p>
    </div>
  )
}

// ─── Hero: talk to the live default agent ───────────────────────────────────────

function HeroTalk() {
  const [intentId, setIntentId] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [speaking, setSpeaking] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const [lines, setLines] = React.useState<Line[]>([])
  const [turns, setTurns] = React.useState(0)

  const timers = React.useRef<number[]>([])
  const tick = React.useRef<number | null>(null)

  const intent = INTENTS.find((i) => i.id === intentId) ?? null
  const role = intent?.role ?? DEFAULT_AGENT.role ?? "General assistant"
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

  // Agent "speaks" a line: brief pulse on the orb, then commit to the transcript.
  const speak = React.useCallback(
    (text: string) => {
      setSpeaking(true)
      setLines((l) => [...l, { role: "agent", text }])
      after(1400, () => setSpeaking(false))
    },
    [after],
  )

  const startCall = React.useCallback(() => {
    if (phase !== "idle") return
    setPhase("connecting")
    track(Events.web_test_call_started, { agent_id: DEFAULT_AGENT.id, intent: intentId ?? "general" })
    after(1200, () => {
      setPhase("live")
      tick.current = window.setInterval(() => setElapsed((e) => e + 1), 1000)
      after(400, () => speak(greeting))
    })
  }, [phase, intentId, greeting, after, speak])

  const endCall = React.useCallback(() => {
    cleanup()
    track(Events.web_test_call_ended, { duration_sec: elapsed })
    setPhase("idle")
    setSpeaking(false)
    setElapsed(0)
    setLines([])
    setTurns(0)
  }, [cleanup, elapsed])

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

  function pickIntent(id: string) {
    const next = intentId === id ? null : id
    setIntentId(next)
    if (next) track(Events.agent_intent_selected, { intent: next })
  }

  const liveUsedMin = (PLAN_USAGE.freeMinutesUsed + elapsed / 60).toFixed(1)

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
      {/* Left — identity + intent re-skin */}
      <div className="bg-card p-6">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Your agent is live
        </div>

        <div className="mt-3 flex items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">{DEFAULT_AGENT.name}</h2>
          <Badge variant="default" className="text-xs">Live</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{role}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{stackSummary(DEFAULT_AGENT)}</p>

        <p className="mt-4 text-sm text-foreground/90">
          We&apos;ve set up a working agent for you — no build required. Talk to it now, then point it
          at real traffic.
        </p>

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
              <>Aria is set up for <span className="text-foreground">{intent.label.toLowerCase()}</span>. One tap, no rebuild.</>
            ) : (
              "Pick one to re-skin Aria instantly — or keep the general assistant."
            )}
          </p>
        </div>

        <Button variant="ghost" size="sm" asChild className="mt-5 gap-1.5 px-0 text-xs text-muted-foreground hover:text-foreground">
          <Link href={`/agents/${DEFAULT_AGENT.id}/edit`}>
            <Pencil className="h-3.5 w-3.5" /> Edit the agent
          </Link>
        </Button>
      </div>

      {/* Right — the orb + talk affordance */}
      <div className="flex flex-col items-center bg-card/40 p-6">
        <p className="text-xs font-medium text-muted-foreground">
          {phase === "connecting" ? "Connecting…" : phase === "live" ? (speaking ? "Aria is speaking" : "Listening… tap to talk") : "Agent ready"}
        </p>

        <div className="my-5 flex items-center justify-center">
          {phase === "connecting" ? (
            <div className="flex h-[132px] w-[132px] items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : (
            <AgentSphere size={132} active={speaking} />
          )}
        </div>

        {phase === "idle" && (
          <Button size="lg" className="gap-2" onClick={startCall}>
            <Mic className="h-4 w-4" /> Talk to your agent
          </Button>
        )}

        {phase === "live" && (
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5" onClick={talk} disabled={speaking}>
              <Mic className="h-3.5 w-3.5" /> Talk
            </Button>
            <Button size="sm" variant="destructive" className="gap-1.5" onClick={endCall}>
              <PhoneOff className="h-3.5 w-3.5" /> End
            </Button>
          </div>
        )}

        {phase === "connecting" && (
          <Button size="lg" className="gap-2" disabled>
            <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
          </Button>
        )}

        {phase === "idle" ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Runs in your browser — no phone number needed. Uses your free minutes.
          </p>
        ) : (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Agora RTC
            </span>
            <span>·</span>
            <span className="font-mono tabular-nums">{fmtTime(elapsed)}</span>
            <span>·</span>
            <span className="tabular-nums">{liveUsedMin} / {PLAN_USAGE.freeMinutesIncluded} min</span>
          </div>
        )}

        {/* Transcript */}
        {lines.length > 0 && (
          <div className="mt-5 max-h-44 w-full space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3">
            {lines.map((l, i) => (
              <div key={i} className={cn("flex", l.role === "you" ? "justify-end" : "justify-start")}>
                <span
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-1.5 text-xs",
                    l.role === "you"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
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

// ─── Put it to work — believe → scale escalation ────────────────────────────────

function PutToWork({ agentParam }: { agentParam: string }) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Put it to work</h3>
        <p className="text-sm text-muted-foreground">
          Belief is free. Revenue starts when your agent carries real traffic — point it somewhere.
        </p>
      </div>

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
            <h4 className="text-sm font-semibold">Launch a campaign</h4>
            <Badge variant="secondary" className="text-xs">Fastest to results</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Dial a list of contacts from a CSV. Hundreds of calls in minutes — the quickest way to
            put your free minutes to work and reach real customers.
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
      <h4 className="text-sm font-semibold">{title}</h4>
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
