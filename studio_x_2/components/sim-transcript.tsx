"use client"

import * as React from "react"
import { Ear, Brain, AudioLines, CheckCircle2, XCircle, FlaskConical, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { EvalTurn } from "@/lib/campaign-data"

/**
 * SimTranscript — the orb-replacement (F-Eval, 2026-07-09). For THREE user-test
 * sessions the Talk/test surface was a pulsing sphere with no transcript, no
 * state, no "simulated" label — the #1 recurring trust break. The fix, per
 * research: transcript-as-proof-of-work + an explicit listening/thinking/
 * speaking state + a loud "Simulated" banner and a verdict. Reused by the eval
 * run view AND the real Talk surface so "is this thing on / did it work?" is
 * answered by watching the conversation, never inferred from silence.
 */

export type SimState = "listening" | "thinking" | "speaking" | "ended"

const STATE_META: Record<SimState, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  listening: { label: "Listening", icon: Ear },
  thinking: { label: "Thinking", icon: Brain },
  speaking: { label: "Speaking", icon: AudioLines },
  ended: { label: "Call ended", icon: CheckCircle2 },
}

/** The explicit agent-state chip — replaces "infer it from a pulsing blob". */
export function AgentStateChips({ state }: { state: SimState }) {
  const order: SimState[] = ["listening", "thinking", "speaking"]
  return (
    <div className="flex items-center gap-1.5" role="status" aria-live="polite">
      {order.map((s) => {
        const { label, icon: Icon } = STATE_META[s]
        const active = state === s
        const done = state === "ended"
        return (
          <span
            key={s}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
              active ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground/60",
              done && "opacity-50",
            )}
          >
            <Icon className={cn("h-3 w-3", active && "motion-safe:animate-pulse")} />
            {label}
          </span>
        )
      })}
      <span className="sr-only">{STATE_META[state].label}</span>
    </div>
  )
}

/** The "this is a test, not a real call" banner — never let a sim look real. */
export function SimulatedBanner({ label = "Simulated call" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/[0.06] px-3 py-2 text-xs">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-warning" />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">· no minutes billed, no real number dialed</span>
    </div>
  )
}

/**
 * A streaming (or static) transcript. Passing `stream` reveals turns one at a
 * time on a timer (respecting reduced motion); otherwise all turns show. Turns
 * carrying a `note` (e.g. a tool call or a flagged hallucination) render it
 * inline — the evidence sits ON the turn.
 */
export function SimTranscript({
  turns,
  stream = false,
  onState,
  flaggedIndex,
  compact = false,
}: {
  turns: EvalTurn[]
  stream?: boolean
  /** Report the live state up to a caller that shows chips elsewhere. */
  onState?: (s: SimState) => void
  /** Index of a turn to flag destructive (the failing turn). */
  flaggedIndex?: number
  compact?: boolean
}) {
  const [shown, setShown] = React.useState(stream ? 0 : turns.length)

  React.useEffect(() => {
    if (!stream) { setShown(turns.length); return }
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce) { setShown(turns.length); onState?.("ended"); return }
    setShown(0)
    let i = 0
    const timers: number[] = []
    const step = () => {
      if (i >= turns.length) { onState?.("ended"); return }
      const t = turns[i]
      onState?.(t.role === "caller" ? "listening" : "thinking")
      timers.push(window.setTimeout(() => {
        if (t.role === "agent") onState?.("speaking")
        setShown(i + 1)
        i += 1
        timers.push(window.setTimeout(step, 700))
      }, 500))
    }
    step()
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream])

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Conversation transcript"
      className={cn("space-y-2 overflow-y-auto", compact ? "text-xs" : "text-sm")}
    >
      {turns.slice(0, shown).map((t, i) => {
        const flagged = i === flaggedIndex
        const isAgent = t.role === "agent"
        return (
          <div key={i} className={cn("flex", isAgent ? "justify-start" : "justify-end")}>
            <div className={cn("max-w-[85%] space-y-1")}>
              <p className="px-1 text-xs text-muted-foreground">{isAgent ? "Agent" : "Caller"}</p>
              <div
                className={cn(
                  "rounded-2xl px-3 py-2",
                  isAgent ? "bg-muted" : "bg-primary/10",
                  flagged && "border border-destructive/50 bg-destructive/[0.06]",
                )}
              >
                {t.text}
                {t.note && (
                  <p className={cn(
                    "mt-1 flex items-center gap-1 text-xs",
                    flagged ? "text-destructive" : "text-muted-foreground",
                  )}>
                    {flagged ? <XCircle className="h-3 w-3 shrink-0" /> : <Wrench className="h-3 w-3 shrink-0" />}
                    {t.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
      {stream && shown < turns.length && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-muted px-3 py-2 text-muted-foreground">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce [animation-delay:240ms]" />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
