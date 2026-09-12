"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  BADGE_LABEL, BADGE_TITLE, fmtClock,
  type ReplayBadge, type ReplayTimeline,
} from "@/lib/transcript-alignment"

/**
 * AlignedTranscript — the transcript on the recording's clock (Design
 * Tracker 10, verdict A). An `<ol>` of lines: a time button that seeks, the
 * speaker, the words, and the Engine's end-type as a chip with a word.
 *
 * Timed and untimed calls share the same grammar — the untimed one gets a
 * dead time column and one stated line, not a banner and not invented times.
 */

/** End-type chip — the word is the Engine's enum; the title is `caused_by`. */
export function TurnBadge({ kind, title, className }: { kind: ReplayBadge; title?: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      title={title ?? BADGE_TITLE[kind]}
      className={cn(
        "h-5 px-1.5 text-xs font-normal",
        kind === "error" && "border-destructive/50 text-destructive",
        kind === "interrupted" && "border-warning/50 text-warning",
        className,
      )}
    >
      {BADGE_LABEL[kind]}
    </Badge>
  )
}

export function AlignedTranscript({
  timeline,
  pos,
  playing,
  seekable,
  onSeek,
  className,
}: {
  timeline: ReplayTimeline
  /** Playhead, seconds. */
  pos: number
  playing: boolean
  /** False when there is no playable audio — times still show, seeking is off. */
  seekable: boolean
  onSeek: (sec: number) => void
  className?: string
}) {
  const timed = timeline.alignment === "timed"
  const listRef = React.useRef<HTMLOListElement>(null)
  const lineRefs = React.useRef<Record<number, HTMLLIElement | null>>({})
  // Auto-scroll follows playback only while the user hasn't scrolled the list
  // themselves; a seek or a fresh play hands control back to the clock.
  const userScrolledRef = React.useRef(false)

  // The line under the playhead — the last one that has started.
  const activeIndex = React.useMemo(() => {
    if (!timed) return -1
    let idx = -1
    timeline.lines.forEach((l, i) => { if (l.atSec != null && l.atSec <= pos) idx = i })
    return idx
  }, [timed, timeline.lines, pos])
  const active = playing ? activeIndex : -1

  React.useEffect(() => {
    if (!playing) { userScrolledRef.current = false; return }
    const el = listRef.current
    if (!el) return
    const markScrolled = () => { userScrolledRef.current = true }
    el.addEventListener("wheel", markScrolled, { passive: true })
    el.addEventListener("touchmove", markScrolled, { passive: true })
    return () => {
      el.removeEventListener("wheel", markScrolled)
      el.removeEventListener("touchmove", markScrolled)
    }
  }, [playing])

  React.useEffect(() => {
    if (active < 0 || userScrolledRef.current) return
    lineRefs.current[active]?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [active])

  return (
    <div className={cn("space-y-2", className)}>
      {!timed && (
        <p className="text-xs text-muted-foreground">No timestamps for this call</p>
      )}
      <ol ref={listRef} className="space-y-1.5" aria-label="Transcript">
        {timeline.lines.map((line, i) => {
          const isAgent = line.speaker === "Agent"
          const isActive = i === active
          const canSeek = timed && seekable && line.atSec != null
          return (
            <li
              key={line.index}
              ref={(el) => { lineRefs.current[i] = el }}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "scroll-mt-24 flex items-start gap-3 rounded-lg border px-3 py-2 transition-colors",
                isActive ? "border-primary bg-primary/5" : "border-border",
                !isAgent && !isActive && "bg-muted/30",
              )}
            >
              <button
                type="button"
                disabled={!canSeek}
                onClick={canSeek ? () => { userScrolledRef.current = false; onSeek(line.atSec as number) } : undefined}
                aria-label={line.atSec != null ? `Jump to ${fmtClock(line.atSec)}` : undefined}
                className={cn(
                  "w-11 shrink-0 pt-0.5 text-left font-mono text-xs tabular-nums text-muted-foreground",
                  canSeek && "hover:text-primary hover:underline underline-offset-4",
                  !timed && "select-none",
                )}
              >
                {line.atSec != null ? fmtClock(line.atSec) : ", "}
              </button>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-xs font-medium", isAgent ? "text-primary" : "text-muted-foreground")}>
                    {line.speaker}
                  </span>
                  {line.badge && <TurnBadge kind={line.badge} title={line.badgeTitle} />}
                </div>
                <p className="text-sm leading-relaxed">{line.text}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
