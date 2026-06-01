"use client"

import * as React from "react"
import {
  Mic,
  MicOff,
  PhoneOff,
  Keyboard,
  Captions,
  CaptionsOff,
  Activity,
  Bot,
  Loader2,
  Signal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AgentSphere } from "@/components/agent-test-panel"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VoiceTurn {
  id: string
  role: "you" | "composer"
  text: string
}

type Phase = "connecting" | "active"
type Turn = "idle" | "you" | "composer"

interface ComposerVoiceCallProps {
  compact?: boolean
  /** Called when the user ends or switches back to text. Returns the transcript. */
  onExit: (transcript: VoiceTurn[], reason: "ended" | "text") => void
  /** Fired when the assistant updates the live agent draft. */
  onDraftUpdate?: (note: string) => void
}

// ─── Scripted demo dialog (wireframe — no real ASR/LLM/TTS) ──────────────────

const GREETING =
  "Hey — I'm Composer. Tell me what kind of agent you want to build, and I'll set it up while we talk."

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
  "Nice — I added a transfer-to-human fallback when sentiment turns negative. Your draft looks solid. Want me to open it in the editor?",
]

const DRAFT_NOTES = [
  "Set model to gpt-4o + DeepGram + ElevenLabs",
  "Tone: warm · response cap 50 words",
  "Added tools: Order lookup, Start return",
  "Added guardrail: transfer to human on negative sentiment",
]

const FALLBACK_COMPOSER = "Mm-hmm — anything else you'd like it to handle?"

let _uid = 0
const uid = () => `vt_${Date.now()}_${_uid++}`

// ─── Component ───────────────────────────────────────────────────────────────

export function ComposerVoiceCall({ compact = false, onExit, onDraftUpdate }: ComposerVoiceCallProps) {
  const [phase, setPhase] = React.useState<Phase>("connecting")
  const [turn, setTurn] = React.useState<Turn>("idle")
  const [muted, setMuted] = React.useState(false)
  const [captionsOn, setCaptionsOn] = React.useState(true)
  const [debugOpen, setDebugOpen] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const [transcript, setTranscript] = React.useState<VoiceTurn[]>([])
  const [liveText, setLiveText] = React.useState("")
  const [listening, setListening] = React.useState(false)
  const [level, setLevel] = React.useState(0)
  const [metrics, setMetrics] = React.useState<Metrics>(BASE_METRICS)

  const userIdx = React.useRef(0)
  const timers = React.useRef<number[]>([])
  const intervals = React.useRef<number[]>([])
  const transcriptRef = React.useRef<VoiceTurn[]>([])
  const scrollRef = React.useRef<HTMLDivElement>(null)

  transcriptRef.current = transcript

  const after = React.useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }, [])

  const clearAll = React.useCallback(() => {
    timers.current.forEach(clearTimeout)
    intervals.current.forEach(clearInterval)
    timers.current = []
    intervals.current = []
  }, [])

  // ─── Composer speaks (typewriter captions) ──────────────────────────────────
  const composerSpeak = React.useCallback(
    (text: string, draftNote?: string) => {
      setTurn("composer")
      setLiveText("")
      let i = 0
      const step = () => {
        i += 2 + Math.floor(Math.random() * 3)
        setLiveText(text.slice(0, i))
        if (i < text.length) {
          after(26, step)
        } else {
          setLiveText("")
          setTranscript((t) => [...t, { id: uid(), role: "composer", text }])
          setTurn("idle")
          if (draftNote) {
            onDraftUpdate?.(draftNote)
            toast.success("Draft updated", { description: draftNote })
          }
        }
      }
      after(220, step)
    },
    [after, onDraftUpdate],
  )

  // ─── Connect sequence ───────────────────────────────────────────────────────
  React.useEffect(() => {
    track(Events.composer_voice_started, {})
    // Connecting → active
    after(1600, () => {
      setPhase("active")
      // call timer
      const t = window.setInterval(() => setElapsed((e) => e + 1), 1000)
      intervals.current.push(t)
      // live metrics jitter
      const m = window.setInterval(() => setMetrics(jitterMetrics), 1200)
      intervals.current.push(m)
      // greeting
      after(500, () => composerSpeak(GREETING))
    })
    return clearAll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll transcript
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [transcript, liveText])

  // ─── Tap-to-talk ────────────────────────────────────────────────────────────
  const startListening = () => {
    if (phase !== "active" || turn !== "idle" || muted) return
    setListening(true)
    setTurn("you")
    // animate input level
    const lv = window.setInterval(() => setLevel(0.25 + Math.random() * 0.7), 120)
    intervals.current.push(lv)
  }

  const stopListening = () => {
    if (!listening) return
    setListening(false)
    setLevel(0)
    // stop level interval (clear the most recent)
    intervals.current.forEach(clearInterval)
    intervals.current = intervals.current.filter(() => false)
    // restart the persistent timers (elapsed + metrics) since we cleared them
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    const m = window.setInterval(() => setMetrics(jitterMetrics), 1200)
    intervals.current.push(t, m)

    const idx = userIdx.current
    const line = USER_LINES[idx] ?? "Okay, that's it for now."
    setTranscript((tr) => [...tr, { id: uid(), role: "you", text: line }])
    setTurn("idle")

    after(420, () => {
      const reply = COMPOSER_LINES[idx] ?? FALLBACK_COMPOSER
      const note = DRAFT_NOTES[idx]
      composerSpeak(reply, note)
      userIdx.current = idx + 1
    })
  }

  // ─── Controls ────────────────────────────────────────────────────────────────
  const toggleMute = () => {
    setMuted((m) => {
      track(Events.composer_voice_muted, { muted: !m })
      return !m
    })
  }
  const toggleCaptions = () => {
    setCaptionsOn((c) => {
      track(Events.composer_voice_captions_toggled, { on: !c })
      return !c
    })
  }
  const toggleDebug = () => {
    setDebugOpen((d) => {
      track(Events.composer_voice_debug_toggled, { open: !d })
      return !d
    })
  }
  const end = (reason: "ended" | "text") => {
    clearAll()
    track(Events.composer_voice_ended, { duration_sec: elapsed, turns: transcriptRef.current.length })
    onExit(transcriptRef.current, reason)
  }

  const sphereSize = compact ? 96 : 132
  const statusLabel =
    phase === "connecting"
      ? "Connecting…"
      : turn === "composer"
        ? "Composer is speaking"
        : listening
          ? "Listening…"
          : "Tap the mic and talk"

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Connection status bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {phase === "connecting" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          )}
          <span className="text-xs font-medium truncate">
            {phase === "connecting" ? "Connecting to Agora RTC…" : "Connected · Agora RTC"}
          </span>
          {phase === "active" && (
            <span className="text-xs text-muted-foreground hidden sm:inline">· us-west-2</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SignalBars quality={metrics.loss < 0.3 ? 3 : metrics.loss < 0.6 ? 2 : 1} />
          <span className="text-xs font-mono tabular-nums text-muted-foreground">
            {fmtTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Sphere + live caption */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-6 min-h-0 overflow-hidden">
        <div className="relative flex items-center justify-center">
          {/* Listening rings */}
          {listening && (
            <>
              <span
                className="absolute rounded-full border border-primary/40"
                style={{ width: sphereSize + 28, height: sphereSize + 28, animation: "sx-ring 1.6s ease-out infinite" }}
              />
              <span
                className="absolute rounded-full border border-primary/30"
                style={{ width: sphereSize + 28, height: sphereSize + 28, animation: "sx-ring 1.6s ease-out infinite 0.5s" }}
              />
            </>
          )}
          <AgentSphere size={sphereSize} active={turn === "composer"} />
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <Badge variant="outline" className="text-xs gap-1.5">
            <Bot className="h-3 w-3" /> Composer
          </Badge>
          <p className="text-xs text-muted-foreground">{statusLabel}</p>
        </div>

        {/* Input level meter (while listening) */}
        {listening && (
          <div className="flex items-end gap-0.5 h-6" aria-hidden>
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-primary transition-[height] duration-100"
                style={{ height: `${8 + level * 16 * (0.5 + Math.abs(4 - i) / 8)}px` }}
              />
            ))}
          </div>
        )}

        {/* Live caption bar */}
        {captionsOn && (
          <div
            className={cn(
              "min-h-[3.5rem] w-full max-w-lg rounded-lg border border-border bg-card px-4 py-3 text-center",
              !liveText && !listening && "opacity-50",
            )}
          >
            {liveText ? (
              <p className="text-sm leading-relaxed">
                {liveText}
                <span className="inline-block w-1.5 h-4 -mb-0.5 ml-0.5 bg-primary animate-pulse" />
              </p>
            ) : listening ? (
              <p className="text-sm text-muted-foreground">Listening… speak now</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Live captions on · everything said on the call appears here
              </p>
            )}
          </div>
        )}
      </div>

      {/* Debug panel */}
      {debugOpen && <DebugPanel metrics={metrics} compact={compact} />}

      {/* Transcript (collapsible scroll) — hidden in compact to save space */}
      {!compact && transcript.length > 0 && (
        <div className="border-t border-border shrink-0">
          <div ref={scrollRef} className="max-h-32 overflow-y-auto px-4 py-2 space-y-1.5">
            {transcript.map((t) => (
              <p key={t.id} className="text-xs leading-relaxed">
                <span className={cn("font-medium", t.role === "you" ? "text-foreground" : "text-primary")}>
                  {t.role === "you" ? "You" : "Composer"}:
                </span>{" "}
                <span className="text-muted-foreground">{t.text}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 shrink-0">
        {/* Left: captions + debug */}
        <div className="flex items-center gap-1">
          <ControlButton
            active={captionsOn}
            onClick={toggleCaptions}
            title={captionsOn ? "Hide captions" : "Show captions"}
          >
            {captionsOn ? <Captions className="h-4 w-4" /> : <CaptionsOff className="h-4 w-4" />}
          </ControlButton>
          <ControlButton active={debugOpen} onClick={toggleDebug} title="Debug">
            <Activity className="h-4 w-4" />
          </ControlButton>
        </div>

        {/* Center: tap-to-talk mic */}
        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          disabled={phase !== "active" || muted || (turn === "composer" && !listening)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed",
            listening
              ? "bg-primary text-primary-foreground ring-4 ring-primary/30 scale-105"
              : "bg-primary/10 text-primary hover:bg-primary/20",
          )}
          title={listening ? "Stop talking" : "Tap to talk"}
        >
          <Mic className="h-5 w-5" />
        </button>

        {/* Right: mute + switch-to-text + end */}
        <div className="flex items-center gap-1">
          <ControlButton active={muted} danger={muted} onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
            {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </ControlButton>
          <ControlButton onClick={() => end("text")} title="Switch to text">
            <Keyboard className="h-4 w-4" />
          </ControlButton>
          <button
            type="button"
            onClick={() => end("ended")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            title="End conversation"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Controls ────────────────────────────────────────────────────────────────

function ControlButton({
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
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
        danger
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : active
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function SignalBars({ quality }: { quality: 1 | 2 | 3 }) {
  return (
    <span className="flex items-end gap-0.5 h-3.5" title={`Connection: ${["", "poor", "fair", "good"][quality]}`}>
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={cn(
            "w-1 rounded-full",
            bar <= quality ? "bg-emerald-500" : "bg-muted",
          )}
          style={{ height: `${bar * 4 + 2}px` }}
        />
      ))}
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
    <div className="border-t border-border bg-muted/30 px-4 py-3 shrink-0">
      <div className="flex items-center gap-1.5 mb-2">
        <Signal className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold">Call diagnostics</p>
        <Badge variant="outline" className="text-xs ml-auto">Live</Badge>
      </div>

      {/* AI pipeline */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pipeline</p>
        <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-4")}>
          <Stat label="End-to-end" value={`${metrics.e2e} ms`} highlight />
          <Stat label="LLM TTFT" value={`${metrics.ttft} ms`} />
          <Stat label="ASR (DeepGram)" value={`${metrics.asr} ms`} />
          <Stat label="TTS (ElevenLabs)" value={`${metrics.tts} ms`} />
        </div>
      </div>

      {/* RTC transport */}
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

function Stat({
  label,
  value,
  highlight,
  warn,
}: {
  label: string
  value: string
  highlight?: boolean
  warn?: boolean
}) {
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-1.5">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          highlight && "text-primary",
          warn && "text-amber-600",
        )}
      >
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
