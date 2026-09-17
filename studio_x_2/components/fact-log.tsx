"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

/**
 * FactLog — the timestamped work log the add-a-number sheet shows instead of a
 * spinner (A3, 2026-07-09; lifted here for 16 · phone number purchase,
 * 2026-09-17). Taken from `sip-quick-connect.tsx:89-92` and its renderer at
 * `:222-235`, because two branches of one sheet must show the same wait and a
 * second copy forks the timestamp format the day either branch is touched.
 * Exporting it from `sip-quick-connect.tsx` instead would make the
 * quick-connect branch the owner of a primitive the buy branch depends on.
 *
 * `pushLine` is pure and derives the stamp from the line INDEX, so the log
 * never reads a clock in render. The log asserts no duration: it states the
 * work that finished, never how long the next step takes.
 */

export interface LogLine { t: string; text: string; ok?: boolean }

/** Append a line. Same deterministic stamp as `sip-quick-connect.tsx:91`. */
export function pushLine(lines: LogLine[], text: string, ok = true): LogLine[] {
  const t = `${String(9 + Math.floor(lines.length / 6)).padStart(2, "0")}:${String((lines.length * 7) % 60).padStart(2, "0")}`
  return [...lines, { t, text, ok }]
}

export function FactLog({ lines, working }: { lines: LogLine[]; working?: boolean }) {
  // Nothing has happened yet and nothing is happening: an empty bordered box
  // would be a widget describing itself.
  if (lines.length === 0 && !working) return null

  return (
    <div
      role="log"
      aria-live="polite"
      className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs"
    >
      {lines.map((l, i) => (
        <p key={i} className="flex items-start gap-2">
          <span className="shrink-0 text-muted-foreground tabular-nums">{l.t}</span>
          {l.ok === false
            ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />}
          <span className="min-w-0 flex-1">{l.text}</span>
        </p>
      ))}
      {working && (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" /> working…
        </p>
      )}
    </div>
  )
}
