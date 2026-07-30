"use client"

import * as React from "react"
import { Copy, ChevronRight, TriangleAlert, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  SIP_PARTY_LABEL, BLAME_LABEL,
  type SipTrace, type SipMessage,
} from "@/lib/sip-trace"

/**
 * SipLadder — the signaling ladder diagram for one call (Q3 roadmap P0,
 * 2026-08). Participants are columns; time runs down; each message is an arrow
 * between two columns, labelled with the method or response code.
 *
 * Two things carry the design beyond "draw the arrows":
 *
 *  • **The failure is explained before it is diagrammed.** A bare "503" is
 *    unactionable to anyone who isn't a telecom engineer, and most people
 *    reading this screen aren't. The block above the ladder says what happened
 *    in plain language, whose side the fault is on, and what to do — the
 *    diagram is the evidence underneath that answer, not the answer itself.
 *
 *  • **Raw headers stay raw.** They're collapsed per message, and when opened
 *    they're verbatim monospace. The audience for headers is the one that will
 *    paste them into a carrier support ticket, and reformatting them into
 *    pretty cards destroys exactly that use.
 */

const KIND_STYLE: Record<SipMessage["kind"], { line: string; text: string; dot: string }> = {
  request: { line: "bg-foreground/40", text: "text-foreground", dot: "bg-foreground/40" },
  provisional: { line: "bg-muted-foreground/50", text: "text-muted-foreground", dot: "bg-muted-foreground/50" },
  success: { line: "bg-primary", text: "text-primary", dot: "bg-primary" },
  failure: { line: "bg-destructive", text: "text-destructive", dot: "bg-destructive" },
}

const fmtMs = (ms: number) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`)

export function SipLadder({ trace }: { trace: SipTrace }) {
  const [openAll, setOpenAll] = React.useState(false)
  const cols = trace.parties

  return (
    <div className="space-y-4">
      {/* ── The answer, before the evidence ── */}
      {trace.failure ? (
        <div className="space-y-2.5 rounded-lg border border-destructive/40 bg-destructive/5 p-3.5">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">
                SIP {trace.failure.code} {trace.failure.reason}
                <Badge variant="outline" className="ml-2 align-middle text-xs font-normal">
                  {BLAME_LABEL[trace.failure.blame]}
                </Badge>
              </p>
              <p className="text-sm text-muted-foreground">{trace.failure.explain}</p>
              <p className="text-sm">{trace.failure.fix}</p>
            </div>
          </div>
          {trace.failure.fixHref && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={trace.failure.fixHref}>
                Go fix this <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 px-3.5 py-2.5">
          <p className="text-sm">
            Signaling completed normally — the call was answered and ended with a BYE.
          </p>
        </div>
      )}

      {/* ── Dialog facts. The SIP Call-ID is the first thing a carrier asks
             for, so it gets a copy button rather than being buried in headers. ── */}
      <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
        <Fact label="SIP Call-ID" value={trace.sipCallId} copyable />
        <Fact label="Post-dial delay" value={fmtMs(trace.pddMs)} hint="INVITE → first ring or answer" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Signaling</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpenAll((v) => !v)}>
          {openAll ? "Hide all headers" : "Show all headers"}
        </Button>
      </div>

      {/* ── The ladder ── */}
      <div className="overflow-x-auto rounded-lg border border-border">
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
              {trace.messages.map((m, i) => (
                <MessageRow
                  key={i}
                  msg={m}
                  cols={cols}
                  openAll={openAll}
                  prevMs={i > 0 ? trace.messages[i - 1].atMs : 0}
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageRow({
  msg, cols, openAll, prevMs,
}: {
  msg: SipMessage
  cols: SipTrace["parties"]
  openAll: boolean
  prevMs: number
}) {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => { setOpen(openAll) }, [openAll])

  const fromIdx = cols.indexOf(msg.from)
  const toIdx = cols.indexOf(msg.to)
  const left = Math.min(fromIdx, toIdx)
  const span = Math.max(1, Math.abs(toIdx - fromIdx))
  const rightward = toIdx > fromIdx
  const style = KIND_STYLE[msg.kind]
  const gap = msg.atMs - prevMs

  return (
    <li>
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
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="-ml-2 h-6 gap-1 px-2 text-xs text-muted-foreground">
              <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
              Headers
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
