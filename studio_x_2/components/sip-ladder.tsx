"use client"

import * as React from "react"
import { Copy, ChevronRight, Check } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { SipVerdict } from "@/components/sip-verdict"
import {
  SIP_PARTY_LABEL,
  type SipTrace, type SipMessage,
} from "@/lib/sip-trace"

/**
 * SipLadder — the signaling ladder diagram for one call (Q3 roadmap P0,
 * 2026-08; Design Tracker 11 verdict A + B). Participants are columns; time
 * runs down; each message is an arrow between two columns, labelled with the
 * method or response code.
 *
 * Three things carry the design beyond "draw the arrows":
 *
 *  • **The failure is explained before it is diagrammed** (`SipVerdict`).
 *    The diagram is the evidence underneath that answer, not the answer.
 *
 *  • **The ladder has time.** A strip above it says where the time went per
 *    leg; every row keeps its time gutter; the message that decided the
 *    verdict is marked in every state; identical retry cycles collapse into
 *    one with a count so the ladder fits a screen.
 *
 *  • **Raw headers stay raw.** Collapsed per message, verbatim monospace when
 *    opened — the audience is the one pasting them into a carrier ticket.
 */

const KIND_STYLE: Record<SipMessage["kind"], { line: string; text: string; dot: string }> = {
  request: { line: "bg-foreground/40", text: "text-foreground", dot: "bg-foreground/40" },
  provisional: { line: "bg-muted-foreground/50", text: "text-muted-foreground", dot: "bg-muted-foreground/50" },
  success: { line: "bg-primary", text: "text-primary", dot: "bg-primary" },
  failure: { line: "bg-destructive", text: "text-destructive", dot: "bg-destructive" },
}

const fmtMs = (ms: number) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`)

/** A run of identical consecutive cycles: `count` repeats of `period`
 *  messages starting at `start`. The first cycle stays; the rest collapse. */
interface Repeat { start: number; period: number; count: number }

function findRepeat(labels: string[]): Repeat | null {
  const n = labels.length
  for (let s = 0; s < n; s++) {
    for (let p = 2; s + 2 * p <= n; p++) {
      let k = 1
      while (
        s + (k + 1) * p <= n &&
        labels.slice(s + k * p, s + (k + 1) * p).every((l, i) => l === labels[s + i])
      ) k++
      if (k >= 2) return { start: s, period: p, count: k }
    }
  }
  return null
}

export function SipLadder({ trace }: { trace: SipTrace }) {
  const [openAll, setOpenAll] = React.useState(false)
  const [showAll, setShowAll] = React.useState(false)
  const cols = trace.parties

  const repeat = React.useMemo(
    () => findRepeat(trace.messages.map((m) => m.label)),
    [trace.messages],
  )
  const hiddenFrom = repeat ? repeat.start + repeat.period : -1
  const hiddenTo = repeat ? repeat.start + repeat.period * repeat.count : -1

  // No trace: the verdict block carries every next step; there is no ladder
  // to draw and drawing an empty one would be a lie.
  if (!trace.retained) return <SipVerdict trace={trace} />

  return (
    <div className="space-y-4">
      {/* ── The answer, before the evidence ── */}
      <SipVerdict trace={trace} />

      {/* ── Dialog facts. The SIP Call-ID is the first thing a carrier asks
             for, so it gets a copy button rather than being buried in headers. ── */}
      <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
        <Fact label="SIP Call-ID" value={trace.sipCallId} copyable />
        <Fact label="Post-dial delay" value={fmtMs(trace.pddMs)} hint="INVITE → first ring or answer" />
      </div>

      {/* ── Where the time went — one cell per leg, the slowest named ── */}
      {trace.legs.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">Where the time went</span>
          {trace.legs.map((leg) => (
            <span
              key={leg.label}
              className={cn(
                "inline-flex items-baseline gap-1.5 font-mono text-xs tabular-nums",
                leg.slowest && "font-semibold",
              )}
            >
              <span className={leg.slowest ? "text-foreground" : "text-muted-foreground"}>{leg.label}</span>
              <span>{fmtMs(leg.ms)}</span>
              {leg.slowest && <span className="text-[10px] font-normal text-warning">slowest</span>}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Signaling</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpenAll((v) => !v)}>
          {openAll ? "Hide all headers" : "Show all headers"}
        </Button>
      </div>

      {/* ── The ladder ── */}
      <div className="overflow-x-auto rounded-lg border border-border" data-design-focus="sip-ladder">
        <div className="min-w-[560px] p-4">
          {/* Participant columns */}
          <div
            className="grid gap-2 pb-2"
            style={{ gridTemplateColumns: `4.5rem repeat(${cols.length}, minmax(0,1fr))` }}
          >
            <span />
            {cols.map((p) => (
              <span key={p} className="truncate text-center text-xs font-medium">
                {SIP_PARTY_LABEL[p]}
              </span>
            ))}
          </div>

          <div className="relative">
            {/* Lifelines */}
            <div
              className="pointer-events-none absolute inset-0 grid gap-2"
              style={{ gridTemplateColumns: `4.5rem repeat(${cols.length}, minmax(0,1fr))` }}
              aria-hidden
            >
              <span />
              {cols.map((p) => (
                <span key={p} className="flex justify-center">
                  <span className="h-full w-px bg-border" />
                </span>
              ))}
            </div>

            <ol className="relative space-y-1.5">
              {trace.messages.map((m, i) => {
                if (!showAll && i >= hiddenFrom && i < hiddenTo) return null
                const isRepeatHead = repeat != null && i === repeat.start
                return (
                  <MessageRow
                    key={i}
                    msg={m}
                    cols={cols}
                    openAll={openAll}
                    prevMs={i > 0 ? trace.messages[i - 1].atMs : 0}
                    deciding={i === trace.decidingIndex}
                    repeat={isRepeatHead ? {
                      count: repeat.count,
                      expanded: showAll,
                      onToggle: () => setShowAll((v) => !v),
                    } : undefined}
                  />
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageRow({
  msg, cols, openAll, prevMs, deciding, repeat,
}: {
  msg: SipMessage
  cols: SipTrace["parties"]
  openAll: boolean
  prevMs: number
  /** This message decided the verdict. */
  deciding: boolean
  /** This row heads a run of identical cycles. */
  repeat?: { count: number; expanded: boolean; onToggle: () => void }
}) {
  // "Show all headers" resets every row; a row can still be toggled on its
  // own afterwards. Derived during render, not in an effect.
  const [open, setOpen] = React.useState(false)
  const [seenOpenAll, setSeenOpenAll] = React.useState(openAll)
  if (seenOpenAll !== openAll) {
    setSeenOpenAll(openAll)
    setOpen(openAll)
  }

  const fromIdx = cols.indexOf(msg.from)
  const toIdx = cols.indexOf(msg.to)
  const left = Math.min(fromIdx, toIdx)
  const span = Math.max(1, Math.abs(toIdx - fromIdx))
  const rightward = toIdx > fromIdx
  const style = KIND_STYLE[msg.kind]
  const gap = msg.atMs - prevMs

  return (
    <li className={cn("-ml-2 pl-2 border-l-2", deciding ? "border-destructive" : "border-transparent")}>
      <div
        className="grid items-center gap-2"
        style={{ gridTemplateColumns: `4.5rem repeat(${cols.length}, minmax(0,1fr))` }}
      >
        {/* Time gutter — a long gap between two messages is itself a finding. */}
        <span
          className={cn(
            "text-right text-xs tabular-nums",
            gap > 3000 ? "font-medium text-warning" : "text-muted-foreground",
          )}
          title={gap > 0 ? `+${fmtMs(gap)} since the previous message` : undefined}
        >
          {fmtMs(msg.atMs)}
        </span>

        {/* The arrow, spanning from its source column to its target */}
        <span
          className="relative flex items-center px-2"
          style={{ gridColumnStart: left + 2, gridColumnEnd: `span ${span}` }}
        >
          <span className={cn("h-px flex-1", style.line)} />
          <span
            className={cn(
              "absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rotate-45 border-t border-r",
              rightward ? "right-2" : "left-2 rotate-[225deg]",
              msg.kind === "failure" ? "border-destructive" :
              msg.kind === "success" ? "border-primary" :
              msg.kind === "provisional" ? "border-muted-foreground/50" : "border-foreground/40",
            )}
            aria-hidden
          />
          <span
            className={cn(
              "absolute left-1/2 -translate-x-1/2 -translate-y-3 whitespace-nowrap rounded bg-card px-1.5 text-xs font-medium",
              style.text,
            )}
          >
            {msg.label}
          </span>
        </span>
      </div>

      <div className="pl-[4.5rem]">
        <Collapsible open={open} onOpenChange={setOpen} className="flex flex-wrap items-center gap-x-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="-ml-2 h-6 gap-1 px-2 text-xs text-muted-foreground">
              <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
              Headers
            </Button>
          </CollapsibleTrigger>
          {deciding && (
            <Badge variant="outline" className="h-5 border-destructive/50 px-1.5 text-[10px] font-normal text-destructive">
              decided here
            </Badge>
          )}
          {repeat && (
            <>
              <Badge variant="outline" className="h-5 px-1.5 font-mono text-[10px] font-normal tabular-nums" title={`This cycle repeats ${repeat.count} times`}>
                ×{repeat.count}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={repeat.onToggle}>
                {repeat.expanded ? "Hide repeats" : `Show all ${repeat.count}`}
              </Button>
            </>
          )}
          <CollapsibleContent className="basis-full">
            <div className="relative mt-1 rounded border border-border bg-muted/40">
              <Button
                variant="ghost" size="sm"
                className="absolute right-1 top-1 h-6 gap-1 px-1.5 text-xs text-muted-foreground"
                onClick={() => {
                  navigator.clipboard?.writeText(msg.headers.join("\n"))
                  toast.success("Headers copied")
                }}
              >
                <Copy className="h-3 w-3" /> Copy
              </Button>
              <pre className="overflow-x-auto px-3 py-2 pr-16 text-xs leading-relaxed">
                <code>{msg.headers.join("\n")}</code>
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </li>
  )
}

function Fact({
  label, value, copyable, hint,
}: {
  label: string
  value: string
  copyable?: boolean
  hint?: string
}) {
  const [copied, setCopied] = React.useState(false)
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">
        {label}
        {hint && <span className="ml-1 opacity-70">· {hint}</span>}
      </p>
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate font-mono text-xs">{value}</span>
        {copyable && (
          <Button
            variant="ghost" size="icon" className="h-5 w-5 shrink-0"
            onClick={() => {
              navigator.clipboard?.writeText(value)
              setCopied(true); setTimeout(() => setCopied(false), 1600)
            }}
            title={`Copy ${label}`}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span className="sr-only">Copy {label}</span>
          </Button>
        )}
      </span>
    </div>
  )
}
