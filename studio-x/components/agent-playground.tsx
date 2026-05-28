"use client"

import * as React from "react"
import {
  Mic, MicOff, Phone, PhoneOff, Volume2, Settings2,
  Activity, Clock, Zap, MessageSquare, User, Bot, RotateCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { track, Events } from "@/lib/analytics"
import { markActivationStep } from "@/components/activation-checklist"

// ─── stub transcript stream — in production this comes from the agent runtime
// over WebRTC + a websocket. We simulate timing here so the wireframe shows
// what the playground feels like during real conversation.

type Turn = {
  speaker: "agent" | "user"
  text: string
  /** ms since call start */
  at: number
}

const SCRIPT: Turn[] = [
  { speaker: "agent", text: "Hi! Thanks for calling Acme support. How can I help you today?", at: 800 },
  { speaker: "user",  text: "Hi, I'm trying to reschedule my appointment for next week.",      at: 4200 },
  { speaker: "agent", text: "Sure — can you tell me the email address on the booking?",        at: 6100 },
  { speaker: "user",  text: "It's shakti@example.com",                                          at: 9300 },
  { speaker: "agent", text: "Found it. You have a 30-minute call with Dr. Lee on Tuesday at 2pm. What time would you like to move to?", at: 11700 },
]

const ROLLING_METRICS = [
  { label: "End-to-end latency", at: 0,    value: "—",      sub: "Not started" },
  { label: "End-to-end latency", at: 4500, value: "612 ms", sub: "p50 — voice path" },
  { label: "End-to-end latency", at: 9500, value: "598 ms", sub: "p50 — voice path" },
]

// ─── component ───────────────────────────────────────────────────────────────

type CallState = "idle" | "ringing" | "active" | "ended"

export function AgentPlayground({ agentId }: { agentId: string }) {
  const [state, setState] = React.useState<CallState>("idle")
  const [muted, setMuted] = React.useState(false)
  const [device, setDevice] = React.useState("default")
  const [voice, setVoice] = React.useState("eleven_multilingual_v2")
  const [transcript, setTranscript] = React.useState<Turn[]>([])
  const [elapsed, setElapsed] = React.useState(0)
  const startRef = React.useRef<number | null>(null)
  const tickRef = React.useRef<NodeJS.Timeout | null>(null)
  const transcriptScrollRef = React.useRef<HTMLDivElement>(null)

  // Drive the simulated transcript + clock when active
  React.useEffect(() => {
    if (state !== "active") return
    startRef.current = Date.now()
    tickRef.current = setInterval(() => {
      const now = Date.now()
      const ms = startRef.current ? now - startRef.current : 0
      setElapsed(ms)
      setTranscript(SCRIPT.filter((t) => t.at <= ms))
      if (ms > SCRIPT[SCRIPT.length - 1].at + 4000) {
        // Conversation finished naturally — end the call
        endCall("Conversation completed")
      }
    }, 200)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // Auto-scroll transcript
  React.useEffect(() => {
    transcriptScrollRef.current?.scrollTo({
      top: transcriptScrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [transcript])

  const startCall = () => {
    setTranscript([])
    setElapsed(0)
    setState("ringing")
    track(Events.agent_test_started, { agent_id: agentId })
    setTimeout(() => setState("active"), 900)
  }

  const endCall = (reason?: string) => {
    setState("ended")
    markActivationStep("test")
    toast(reason ?? "Call ended", {
      description: `${transcript.length} turns · ${(elapsed / 1000).toFixed(1)}s`,
    })
  }

  const resetCall = () => {
    setState("idle")
    setTranscript([])
    setElapsed(0)
  }

  const formatMs = (ms: number) => {
    const total = Math.floor(ms / 1000)
    const min = Math.floor(total / 60)
    const sec = total % 60
    return `${min}:${sec.toString().padStart(2, "0")}`
  }

  // Pick current latency snapshot
  const latency = ROLLING_METRICS.reduce<typeof ROLLING_METRICS[number]>(
    (acc, m) => (elapsed >= m.at ? m : acc),
    ROLLING_METRICS[0],
  )

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] min-h-0">
      {/* ─── LEFT — call surface ─────────────────────────────────────────── */}
      <div className="space-y-5">
        {/* Mic orb + state */}
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-6">
            <div
              className={cn(
                "relative w-44 h-44 rounded-full flex items-center justify-center transition-all duration-300",
                state === "idle" && "bg-gradient-to-br from-zinc-300 via-zinc-200 to-zinc-100 dark:from-zinc-600 dark:via-zinc-700 dark:to-zinc-800",
                state === "ringing" && "bg-gradient-to-br from-amber-400/60 via-amber-300/40 to-transparent shadow-[0_0_80px_-10px_hsl(38_92%_55%/0.5)] animate-pulse",
                state === "active" && "bg-gradient-to-br from-primary/60 via-primary/30 to-transparent shadow-[0_0_80px_-10px_hsl(var(--primary)/0.5)]",
                state === "ended" && "bg-gradient-to-br from-emerald-400/40 via-emerald-300/20 to-transparent",
              )}
            >
              <div
                className={cn(
                  "w-28 h-28 rounded-full transition-all",
                  state === "active" && "bg-gradient-to-br from-primary/80 to-primary/40 animate-pulse",
                  state !== "active" && "bg-gradient-to-br from-zinc-400 to-zinc-600 dark:from-zinc-500 dark:to-zinc-700",
                )}
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-medium">
                {state === "idle"   && "Ready to call"}
                {state === "ringing"&& "Connecting…"}
                {state === "active" && "Agent listening"}
                {state === "ended"  && "Call ended"}
              </p>
              {state === "active" && (
                <p className="text-xs text-muted-foreground tabular-nums mt-1">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {formatMs(elapsed)}
                </p>
              )}
            </div>

            {/* Call controls */}
            <div className="flex items-center gap-3">
              {state === "idle" && (
                <Button size="lg" className="gap-2" onClick={startCall}>
                  <Phone className="h-4 w-4" /> Start test call
                </Button>
              )}
              {state === "ringing" && (
                <Button size="lg" variant="destructive" className="gap-2" onClick={() => endCall("Cancelled")}>
                  <PhoneOff className="h-4 w-4" /> Cancel
                </Button>
              )}
              {state === "active" && (
                <>
                  <Button
                    size="lg"
                    variant={muted ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => setMuted((v) => !v)}
                  >
                    {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {muted ? "Unmute" : "Mute"}
                  </Button>
                  <Button size="lg" variant="destructive" className="gap-2" onClick={() => endCall()}>
                    <PhoneOff className="h-4 w-4" /> End call
                  </Button>
                </>
              )}
              {state === "ended" && (
                <Button size="lg" variant="outline" className="gap-2" onClick={resetCall}>
                  <RotateCw className="h-4 w-4" /> Test again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transcript */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Live transcript
              {state === "active" && (
                <Badge variant="default" className="text-xs gap-1 ml-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  recording
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={transcriptScrollRef}
              className="space-y-3 max-h-[260px] overflow-y-auto pr-2"
            >
              {transcript.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {state === "idle"
                    ? "Start a test call to see the live transcript here."
                    : "Listening…"}
                </p>
              ) : (
                transcript.map((t, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full shrink-0 mt-0.5",
                        t.speaker === "agent" ? "bg-primary/15" : "bg-muted",
                      )}
                    >
                      {t.speaker === "agent"
                        ? <Bot className="h-3 w-3 text-primary" />
                        : <User className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {t.speaker === "agent" ? "Agent" : "You"}
                        <span className="text-muted-foreground/60 normal-case font-normal tabular-nums ml-2">
                          {formatMs(t.at)}
                        </span>
                      </p>
                      <p className="text-sm leading-relaxed mt-0.5">{t.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── RIGHT — settings + metrics ──────────────────────────────────── */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {/* Live metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Live metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">End-to-end latency</p>
              <p className="text-xl font-semibold tabular-nums mt-0.5">{latency.value}</p>
              <p className="text-xs text-muted-foreground">{latency.sub}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "LLM",  value: state === "active" ? "184 ms" : "—" },
                { label: "ASR",  value: state === "active" ? "92 ms"  : "—" },
                { label: "TTS",  value: state === "active" ? "210 ms" : "—" },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p>
                  <p className="text-sm font-semibold tabular-nums mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" /> Turns</span>
                <span className="font-medium tabular-nums">{transcript.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tokens used</span>
                <span className="font-medium tabular-nums">{transcript.length * 28}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated cost</span>
                <span className="font-medium tabular-nums">${(transcript.length * 0.0023).toFixed(4)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              Test settings
            </CardTitle>
            <CardDescription>These only affect the playground — not production.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Microphone</p>
              <Select value={device} onValueChange={setDevice}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">System default</SelectItem>
                  <SelectItem value="airpods">AirPods Pro</SelectItem>
                  <SelectItem value="built-in">MacBook built-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium flex items-center gap-1"><Volume2 className="h-3 w-3" /> Voice</p>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="eleven_multilingual_v2">ElevenLabs · Multilingual v2</SelectItem>
                  <SelectItem value="openai_alloy">OpenAI · Alloy</SelectItem>
                  <SelectItem value="agora_native">Agora · Native</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Help tip */}
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="py-3 px-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Trouble hearing the agent?</p>
            <p>Allow microphone access in your browser. The first call may take 1–2s to connect while the audio worker warms up.</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
