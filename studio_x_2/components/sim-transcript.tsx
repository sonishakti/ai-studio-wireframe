"use client"

import * as React from "react"
import { Ear, Brain, AudioLines, CheckCircle2, XCircle, FlaskConical, Wrench, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { EvalTurn, RunMode } from "@/lib/campaign-data"

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

/**
 * The "this is a test, not a real call" banner — never let a sim look real.
 *
 * `mode` decides what the banner is allowed to deny (14, 2026-09-17). An audio
 * run DOES bill agent minutes: the button that opened this sheet quoted the
 * price, and a banner denying it on the same screen made one of the two a lie.
 * No minutes is a claim only a text run can make.
 */
export function SimulatedBanner({ label = "Test call", mode }: { label?: string; mode?: RunMode }) {
  const billed = mode === "audio"
  return (
    <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/[0.06] px-3 py-2 text-xs">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-warning" />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">
        {billed ? "· no real number dialed" : "· no minutes billed, no real number dialed"}
      </span>
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
                {isAgent && t.retrieval && <RetrievalReceipt retrieval={t.retrieval} />}
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

/**
 * What the agent read before it answered (design 20). The two retrieval dials
 * on the knowledge row are dead controls without this: a threshold is only
 * teachable when the chunks it let through are on the turn they produced.
 *
 * Nothing here is invented. The chunks come from `mockRetrieval`, so a chunk
 * carries its source, its score and its text and no age: a mock source is not
 * a source record and cannot be dated. It appears only in the Test rail, under
 * the banner that already reads no minutes billed, no real number dialed.
 */
function RetrievalReceipt({
  retrieval,
}: {
  retrieval: NonNullable<EvalTurn["retrieval"]>
}) {
  const [open, setOpen] = React.useState(false)
  const n = retrieval.chunks.length
  return (
    <div className="mt-1.5 border-t border-border/60 pt-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-90")} aria-hidden />
        What it read · {n} {n === 1 ? "chunk" : "chunks"}
      </button>
      {open && (
        n === 0 ? (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Nothing matched. Lower the threshold or raise the chunk count.
          </p>
        ) : (
          <div className="mt-1.5 space-y-1.5">
            {retrieval.chunks.map((c, i) => (
              <div key={i} className="rounded-lg border border-border bg-background/60 p-2">
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[11px] text-muted-foreground">{c.source}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {c.score.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">{c.text}</p>
              </div>
            ))}
            {/* The wording already shipped on the external index's own test:
                latency is the honest per-turn price of retrieval, and the
                Agora bill is flat whatever the index holds. */}
            <p className="text-[11px] text-muted-foreground">
              {n} {n === 1 ? "chunk" : "chunks"} in {retrieval.ms} ms · retrieval adds this to every
              turn&apos;s latency
            </p>
          </div>
        )
      )}
    </div>
  )
}
