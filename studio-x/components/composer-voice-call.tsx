"use client"

import * as React from "react"
import {
  Mic,
  MicOff,
  PhoneOff,
  Captions,
  CaptionsOff,
  Activity,
  Loader2,
  ChevronDown,
  Signal,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AgentSphere } from "@/components/agent-test-panel"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"

/**
 * Voice session — Slack-Huddle model.
 * ────────────────────────────────────
 * Voice does NOT take over the screen. `useVoiceSession` owns the call state
 * and streams spoken turns into the SAME chat thread via `onMessage`, so there
 * is one unified conversation. `VoiceCallDock` is a slim persistent bar that
 * sits above the thread while the call is live; the chat input stays usable
 * below it (type or attach docs mid-call).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type VoicePhase = "idle" | "connecting" | "active" | "failed"
export type VoiceTurnState = "idle" | "you" | "composer"

export interface VoiceSession {
  phase: VoicePhase
  active: boolean
  connecting: boolean
  failed: boolean
  turn: VoiceTurnState
  muted: boolean
  captionsOn: boolean
  debugOpen: boolean
  listening: boolean
  level: number
  elapsed: number
  /** Composer's in-flight streamed caption (empty when not speaking). */
  livePartial: string
  metrics: Metrics
  start: () => void
  retry: () => void
  end: () => void
  toggleMute: () => void
  toggleCaptions: () => void
  toggleDebug: () => void
  /** Advance a simulated user turn (tap-to-talk). */
  talk: () => void
  /** Make Composer say an arbitrary line (e.g. acknowledging an attachment). */
  say: (text: string, draftNote?: string) => void
}

interface UseVoiceSessionArgs {
  onMessage: (role: "user" | "assistant", text: string) => void
  onDraftUpdate?: (note: string) => void
}

// ─── Scripted demo dialog (wireframe — no real ASR/LLM/TTS) ──────────────────

const GREETING =
  "Hey — I'm Composer. Tell me what kind of agent you want to build, and I'll set it up while we talk. You can attach a doc any time too."

const USER_LINES = [
  "I want a support agent for my online store that can handle order questions.",
  "Give it a warm, friendly voice and keep the answers short.",
  "It should look up orders and be able to start a return.",
  "And transfer to a human if the customer sounds upset.",
]

const COMPOSER_LINES = [
  "Got it — a customer-support voice agent for e-commerce. I'll start it on gpt-4o with DeepGram for speech and an ElevenLabs voice. What should it sound like?",
  "Warm and concise — done. I capped responses around 50 words so it stays snappy on a call.",
  "Added two tools: order lookup by phone, and start-a-return. They're showing in the draft on the right.",
  "Nice — I added a transfer-to-human fallback when sentiment turns negative. Want me to open it in the editor?",
]

const DRAFT_NOTES = [
  "Set model to gpt-4o + DeepGram + ElevenLabs",
  "Tone: warm · response cap 50 words",
  "Added tools: Order lookup, Start return",
  "Added guardrail: transfer to human on negative sentiment",
]

const FALLBACK_COMPOSER = "Mm-hmm — anything else you'd like it to handle?"

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useVoiceSession({ onMessage, onDraftUpdate }: UseVoiceSessionArgs): VoiceSession {
  const [phase, setPhase] = React.useState<VoicePhase>("idle")
  const [turn, setTurn] = React.useState<VoiceTurnState>("idle")
  const [muted, setMuted] = React.useState(false)
  const [captionsOn, setCaptionsOn] = React.useState(true)
  const [debugOpen, setDebugOpen] = React.useState(false)
  const [listening, setListening] = React.useState(false)
  const [level, setLevel] = React.useState(0)
  const [elapsed, setElapsed] = React.useState(0)
  const [livePartial, setLivePartial] = React.useState("")
  const [metrics, setMetrics] = React.useState<Metrics>(BASE_METRICS)

  const userIdx = React.useRef(0)
  // Demo: surface the connection-failure path once per session, then connect on
  // retry — so the unhappy RTC state is reachable without random flakiness.
  const failOnce = React.useRef(true)
  const timers = React.useRef<number[]>([])
  const elapsedIv = React.useRef<number | null>(null)
  const metricsIv = React.useRef<number | null>(null)
  const levelIv = React.useRef<number | null>(null)

  const after = React.useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }, [])

  const stopAll = React.useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    ;[elapsedIv, metricsIv, levelIv].forEach((r) => {
      if (r.current !== null) {
        clearInterval(r.current)
        r.current = null
      }
    })
  }, [])

  React.useEffect(() => stopAll, [stopAll])

  // Composer speaks: stream caption into livePartial, then finalize to a message.
  const say = React.useCallback(
    (text: string, draftNote?: string) => {
      setTurn("composer")
      setLivePartial("")
      let i = 0
      const step = () => {
        i += 2 + Math.floor(Math.random() * 3)
        setLivePartial(text.slice(0, i))
        if (i < text.length) {
          after(26, step)
        } else {
          setLivePartial("")
          setTurn("idle")
          onMessage("assistant", text)
          if (draftNote) {
            onDraftUpdate?.(draftNote)
            toast.success("Draft updated", { description: draftNote })
          }
        }
      }
      after(220, step)
    },
    [after, onMessage, onDraftUpdate],
  )

  const connect = React.useCallback(() => {
    setPhase("connecting")
    after(1500, () => {
      if (failOnce.current) {
        failOnce.current = false
        setPhase("failed")
        return
      }
      setPhase("active")
      elapsedIv.current = window.setInterval(() => setElapsed((e) => e + 1), 1000)
      metricsIv.current = window.setInterval(() => setMetrics(jitterMetrics), 1200)
      after(500, () => say(GREETING))
    })
  }, [after, say])

  const start = React.useCallback(() => {
    if (phase !== "idle") return
    track(Events.composer_voice_started, {})
    connect()
  }, [phase, connect])

  const retry = React.useCallback(() => {
    if (phase !== "failed") return
    connect()
  }, [phase, connect])

  const end = React.useCallback(() => {
    stopAll()
    track(Events.composer_voice_ended, { duration_sec: elapsed, turns: userIdx.current })
    setPhase("idle")
    setTurn("idle")
    setListening(false)
    setLivePartial("")
    setElapsed(0)
    setMuted(false)
    setDebugOpen(false)
    userIdx.current = 0
    failOnce.current = true
  }, [stopAll, elapsed])

  const talk = React.useCallback(() => {
    if (phase !== "active" || muted) return
    if (listening) {
      // stop → finalize the simulated user turn
      setListening(false)
      setLevel(0)
      if (levelIv.current !== null) {
        clearInterval(levelIv.current)
        levelIv.current = null
      }
      const idx = userIdx.current
      const line = USER_LINES[idx] ?? "Okay, that's everything for now."
      onMessage("user", line)
      track(Events.composer_voice_talk_turn, { turn: idx + 1 })
      setTurn("idle")
      after(420, () => {
        say(COMPOSER_LINES[idx] ?? FALLBACK_COMPOSER, DRAFT_NOTES[idx])
        userIdx.current = idx + 1
      })
    } else {
      if (turn !== "idle") return
      setListening(true)
      setTurn("you")
      levelIv.current = window.setInterval(() => setLevel(0.25 + Math.random() * 0.7), 120)
    }
  }, [phase, muted, listening, turn, onMessage, after, say])

  const toggleMute = React.useCallback(() => {
    setMuted((m) => {
      track(Events.composer_voice_muted, { muted: !m })
      return !m
    })
  }, [])
  const toggleCaptions = React.useCallback(() => {
    setCaptionsOn((c) => {
      track(Events.composer_voice_captions_toggled, { on: !c })
      return !c
    })
  }, [])
  const toggleDebug = React.useCallback(() => {
    setDebugOpen((d) => {
      track(Events.composer_voice_debug_toggled, { open: !d })
      return !d
    })
  }, [])

  return {
    phase,
    active: phase === "active",
    connecting: phase === "connecting",
    failed: phase === "failed",
    turn,
    muted,
    captionsOn,
    debugOpen,
    listening,
    level,
    elapsed,
    livePartial,
    metrics,
    start,
    retry,
    end,
    toggleMute,
    toggleCaptions,
    toggleDebug,
    talk,
    say,
  }
}

// ─── Call dock (slim persistent bar) ─────────────────────────────────────────

export function VoiceCallDock({ session, compact = false }: { session: VoiceSession; compact?: boolean }) {
  const { connecting, failed, turn, muted, captionsOn, debugOpen, listening, level, elapsed, metrics } = session

  // Connection failed — dedicated unhappy-path bar with retry/end.
  if (failed) {
    return (
      <div className="shrink-0 border-b border-destructive/40 bg-destructive/10" role="alert">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 shrink-0">
            <PhoneOff className="h-4 w-4 text-destructive" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Couldn&apos;t connect</p>
            <p className="text-xs text-muted-foreground truncate">
              The voice connection failed. Check your network and try again.
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={session.retry}
              className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              aria-label="Retry connection"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              {!compact && <span>Retry</span>}
            </button>
            <button
              type="button"
              onClick={session.end}
              className="flex h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              aria-label="Dismiss"
            >
              <PhoneOff className="h-3.5 w-3.5" aria-hidden />
              {!compact && <span>Dismiss</span>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const status = connecting
    ? "Connecting…"
    : turn === "composer"
      ? "Composer is speaking"
      : listening
        ? "Listening… tap to send"
        : "Tap the mic to talk"

  return (
    <div className="shrink-0 border-b border-border bg-card/50">
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Orb + listening rings */}
        <div className="relative flex items-center justify-center shrink-0" style={{ width: 40, height: 40 }}>
          {listening && (
            <>
              <span className="absolute rounded-full border border-primary/40" style={{ width: 52, height: 52, animation: "sx-ring 1.6s ease-out infinite" }} />
              <span className="absolute rounded-full border border-primary/30" style={{ width: 52, height: 52, animation: "sx-ring 1.6s ease-out infinite 0.5s" }} />
            </>
          )}
          {connecting ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </span>
          ) : (
            <AgentSphere size={40} active={turn === "composer"} />
          )}
        </div>

        {/* Status + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate" aria-live="polite">{status}</span>
            {listening && (
              <span className="flex items-end gap-0.5 h-3" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-0.5 rounded-full bg-primary transition-[height] duration-100"
                    style={{ height: `${4 + level * 8 * (0.6 + Math.abs(2 - i) / 4)}px` }}
                  />
                ))}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              Agora RTC
            </span>
            <span>·</span>
            <SignalBars quality={metrics.loss < 0.3 ? 3 : metrics.loss < 0.6 ? 2 : 1} />
            <span>·</span>
            <span className="font-mono tabular-nums">{fmtTime(elapsed)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Tap-to-talk */}
          <button
            type="button"
            onClick={session.talk}
            disabled={connecting || muted || turn === "composer"}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              listening
                ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                : "bg-primary/10 text-primary hover:bg-primary/20",
            )}
            aria-label={listening ? "Send turn" : "Tap to talk"}
            title={listening ? "Send" : "Tap to talk"}
          >
            <Mic className="h-3.5 w-3.5" />
            {!compact && <span>{listening ? "Send" : "Talk"}</span>}
          </button>

          <DockIcon active={muted} danger={muted} onClick={session.toggleMute} title={muted ? "Unmute" : "Mute"}>
            {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </DockIcon>
          <DockIcon active={captionsOn} onClick={session.toggleCaptions} title={captionsOn ? "Hide captions" : "Show captions"}>
            {captionsOn ? <Captions className="h-4 w-4" /> : <CaptionsOff className="h-4 w-4" />}
          </DockIcon>
          <DockIcon active={debugOpen} onClick={session.toggleDebug} title="Diagnostics">
            <Activity className="h-4 w-4" />
            <ChevronDown className={cn("h-3 w-3 transition-transform", debugOpen && "rotate-180")} />
          </DockIcon>

          <button
            type="button"
            onClick={session.end}
            className="flex h-9 items-center gap-1.5 rounded-full bg-destructive px-3 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            aria-label="End conversation"
            title="End conversation"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            {!compact && <span>End</span>}
          </button>
        </div>
      </div>

      {/* Diagnostics (expandable) */}
      {debugOpen && <DebugPanel metrics={metrics} compact={compact} />}
    </div>
  )
}

function DockIcon({
  children,
  onClick,
  active,
  danger,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  danger?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-9 items-center gap-0.5 rounded-full px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        danger
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function SignalBars({ quality }: { quality: 1 | 2 | 3 }) {
  const label = ["", "poor", "fair", "good"][quality]
  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={`Connection: ${label}`}
      title={`Connection: ${label}`}
    >
      <span className="inline-flex items-end gap-0.5 h-3" aria-hidden>
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={cn("w-0.5 rounded-full", bar <= quality ? "bg-success" : "bg-muted-foreground/30")}
            style={{ height: `${bar * 3 + 2}px` }}
          />
        ))}
      </span>
      <span className="capitalize">{label}</span>
    </span>
  )
}

// ─── Debug panel ───────────────────────────────────────────────────────────────

interface Metrics {
  e2e: number
  ttft: number
  asr: number
  tts: number
  bitrate: number
  loss: number
  jitter: number
  rtt: number
}

const BASE_METRICS: Metrics = {
  e2e: 540, ttft: 320, asr: 110, tts: 210, bitrate: 56, loss: 0.2, jitter: 14, rtt: 52,
}

function jitterMetrics(): Metrics {
  const j = (base: number, spread: number) => Math.max(0, Math.round(base + (Math.random() - 0.5) * spread))
  return {
    e2e: j(540, 120),
    ttft: j(320, 80),
    asr: j(110, 50),
    tts: j(210, 60),
    bitrate: j(56, 16),
    loss: Math.max(0, +(0.2 + (Math.random() - 0.5) * 0.6).toFixed(2)),
    jitter: j(14, 14),
    rtt: j(52, 28),
  }
}

function DebugPanel({ metrics, compact }: { metrics: Metrics; compact: boolean }) {
  return (
    <div className="border-t border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Signal className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold">Call diagnostics</p>
        <Badge variant="outline" className="text-xs ml-auto">Live</Badge>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">AI pipeline</p>
        <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-4")}>
          <Stat label="End-to-end" value={`${metrics.e2e} ms`} highlight />
          <Stat label="LLM TTFT" value={`${metrics.ttft} ms`} />
          <Stat label="ASR (DeepGram)" value={`${metrics.asr} ms`} />
          <Stat label="TTS (ElevenLabs)" value={`${metrics.tts} ms`} />
        </div>
      </div>
      <div className="space-y-1.5 mt-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Agora RTC transport</p>
        <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-4")}>
          <Stat label="Bitrate" value={`${metrics.bitrate} kbps`} />
          <Stat label="Packet loss" value={`${metrics.loss}%`} warn={metrics.loss > 0.5} />
          <Stat label="Jitter" value={`${metrics.jitter} ms`} />
          <Stat label="Round-trip" value={`${metrics.rtt} ms`} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight, warn }: { label: string; value: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-1.5">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums", highlight && "text-primary", warn && "text-warning")}>
        {value}
      </p>
    </div>
  )
}

// ─── utils ───────────────────────────────────────────────────────────────────

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}
