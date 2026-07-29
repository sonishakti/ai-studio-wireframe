"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft, Copy, Download, Play, Pause, ChevronRight, Zap, Braces, Check,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  CHANNEL_LABEL, SPAN_STYLE, SPAN_FIX, LATENCY_TARGET_MS, traceToJson,
  type SessionTrace, type SessionTurn, type TraceSpan,
} from "@/lib/session-trace"
import { buildSignals, diagnoseCall, healthOf } from "@/lib/diagnostics"
import { HealthDot } from "@/components/health-dot"
import { SeverityBadge } from "@/components/severity-badge"
import { track, Events } from "@/lib/analytics"

/**
 * Session detail — the run-level view a developer opens to answer "what
 * happened, and where did the time go?".
 *
 * Q3 roadmap, three items in one surface:
 *   • "Show Studio Engine session details and logs beyond telephony" (P1) —
 *     the page is CHANNEL-AGNOSTIC; the endpoint block is what varies, so a
 *     web or chat run is a first-class session, not a call with empty fields.
 *   • "Expose component-level latency metrics to developers" (P0) — a real
 *     WATERFALL on a time axis, not the grouped bars the call sheet shows.
 *     Grouped bars compare turns; a waterfall shows a turn's SEQUENCE, which
 *     is the question ("which hop ate the second?").
 *   • "Expose STT, LLM, and TTS payloads in session logs" (P1) — the raw
 *     provider request/response per turn, collapsed by default.
 *
 * The transcript is timestamp-aligned: clicking a line seeks the recording,
 * and the line under the playhead is highlighted while playing.
 */

const fmtTime = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function SessionDetail({ trace }: { trace: SessionTrace }) {
  const [pos, setPos] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [expandAll, setExpandAll] = React.useState(false)
  const turnRefs = React.useRef<Record<number, HTMLDivElement | null>>({})

  const voice = trace.channel !== "chat"
  const hasRecording = voice && trace.durationSec > 0
  const total = trace.durationSec

  React.useEffect(() => {
    track(Events.session_detail_viewed, {
      session_id: trace.id,
      channel: trace.channel,
      turns: trace.stats.turnCount,
      p95_ms: trace.stats.p95Ms,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace.id])

  // Mock playback — advances the playhead so transcript sync is demonstrable.
  React.useEffect(() => {
    if (!playing || !hasRecording) return
    const t = setInterval(() => {
      setPos((p) => {
        if (p >= total) { setPlaying(false); return total }
        return p + 1
      })
    }, 500)
    return () => clearInterval(t)
  }, [playing, hasRecording, total])

  // The turn under the playhead — the last one that has started.
  const activeIndex = React.useMemo(() => {
    let idx = -1
    trace.turns.forEach((t, i) => { if (t.atSec <= pos) idx = i })
    return idx
  }, [pos, trace.turns])

  // One scale for every waterfall on the page, so turn 3 being twice as long
  // as turn 1 is legible at a glance rather than re-normalised per row.
  const scaleMs = Math.max(trace.stats.maxMs, LATENCY_TARGET_MS)

  // A failed session got a duration of "≤ 0s" and nothing else, while a failed
  // CALL got a full diagnosis — same failure, two levels of service. Reuse the
  // existing rule engine so the two surfaces finally agree.
  const issues = React.useMemo(
    () => diagnoseCall(
      buildSignals(trace.id, {
        outcome: trace.status === "Failed" ? "Failed" : "Successful",
        durationSec: trace.durationSec,
      }),
      {},
    ),
    [trace.id, trace.status, trace.durationSec],
  )
  const health = healthOf(issues)

  const slowest = trace.turns.find((t) => t.slowest)
  const jumpToSlowest = () => {
    if (!slowest) return
    track(Events.session_jump_to_slowest, { session_id: trace.id, turn: slowest.index })
    setPos(slowest.atSec)
    turnRefs.current[slowest.index]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const exportJson = () => {
    track(Events.session_trace_exported, { session_id: trace.id })
    const blob = new Blob([traceToJson(trace)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `session-${trace.id}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Session trace downloaded")
  }

  return (
    <div className="flex-1 space-y-5 p-6 pt-4">
      {/* ── Header ── */}
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2 h-7 gap-1.5 text-muted-foreground">
          <Link href="/sessions"><ArrowLeft className="h-3.5 w-3.5" /> All sessions</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-lg font-semibold tracking-tight">{trace.id}</h1>
          <Button
            variant="ghost" size="icon" className="h-6 w-6"
            onClick={() => { navigator.clipboard?.writeText(trace.id); toast.success("Session ID copied") }}
            title="Copy session ID"
          >
            <Copy className="h-3 w-3" />
            <span className="sr-only">Copy session ID</span>
          </Button>
          <Badge variant="outline" className="font-normal">{CHANNEL_LABEL[trace.channel]}</Badge>
          <Badge variant={trace.status === "Failed" ? "destructive" : "default"}>{trace.status}</Badge>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {trace.agent} · {trace.startTime} · {fmtTime(trace.durationSec)}
          </p>
          <div className="flex items-center gap-2">
            {slowest && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={jumpToSlowest}>
                <Zap className="h-3.5 w-3.5" /> Jump to slowest turn
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportJson}>
              <Download className="h-3.5 w-3.5" /> Trace JSON
            </Button>
          </div>
        </div>
      </div>

      {/* ── Diagnosis — a failed session now explains itself ── */}
      {issues.length > 0 && (
        <Card className={cn(health.criticals > 0 && "border-destructive/40")}>
          <CardContent className="space-y-2.5 p-4">
            <div className="flex items-center gap-2">
              <HealthDot status={health.status} />
              <p className="text-sm font-medium">
                {[
                  health.criticals ? `${health.criticals} critical` : null,
                  health.warnings ? `${health.warnings} warning${health.warnings > 1 ? "s" : ""}` : null,
                ].filter(Boolean).join(" · ")}
              </p>
            </div>
            {issues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
                <SeverityBadge severity={issue.severity} />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-medium">
                    {issue.title}
                    {issue.timestamp && (
                      <span className="ml-2 text-xs font-normal tabular-nums text-muted-foreground">
                        {issue.timestamp}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{issue.rootCause}</p>
                  <p className="text-xs">{issue.suggestedFix}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Latency roll-up ── */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="p50 response" value={trace.stats.p50Ms} target />
            <Stat label="p95 response" value={trace.stats.p95Ms} target />
            <Stat label="Slowest turn" value={trace.stats.maxMs} target />
            <Stat label="Agent turns" value={trace.stats.turnCount} unit="" />
          </div>

          {trace.stats.turnCount > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Where the time goes — average per turn</p>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {trace.stats.byComponent.map((c) => (
                  <span
                    key={c.key}
                    className={cn("h-full", SPAN_STYLE[c.key].bar)}
                    style={{ width: `${c.pct}%` }}
                    title={`${c.label}: ${c.avgMs} ms (${c.pct}%)`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {trace.stats.byComponent.map((c) => (
                  <span key={c.key} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", SPAN_STYLE[c.key].dot)} />
                    {c.label}
                    <span className="tabular-nums font-medium text-foreground">{c.avgMs} ms</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Endpoint + correlation. The endpoint block is channel-specific —
             that IS what "beyond telephony" means; a web run is a first-class
             session, not a call with empty phone fields. The correlation block
             is what lets an Agora-native developer join this to their logs. ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-0">
            <p className="border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
              {CHANNEL_LABEL[trace.channel]} endpoint
            </p>
            <div className="divide-y divide-border">
              {trace.endpoint.map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">{f.label}</span>
                  <span className="truncate text-sm font-medium">{f.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
              Correlation
            </p>
            <div className="divide-y divide-border">
              {trace.correlation.map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="shrink-0 text-xs text-muted-foreground">{f.label}</span>
                  <span className="flex min-w-0 items-center gap-1">
                    <span className="truncate font-mono text-xs">{f.value}</span>
                    {f.copyable && (
                      <Button
                        variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                        onClick={() => { navigator.clipboard?.writeText(f.value); toast.success(`${f.label} copied`) }}
                        title={`Copy ${f.label}`}
                      >
                        <Copy className="h-3 w-3" />
                        <span className="sr-only">Copy {f.label}</span>
                      </Button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recording ── */}
      {voice && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Recording</p>
          {hasRecording ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline" size="icon" className="h-8 w-8 shrink-0"
                onClick={() => setPlaying((p) => !p)}
                title={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span className="sr-only">{playing ? "Pause recording" : "Play recording"}</span>
              </Button>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {fmtTime(pos)} / {fmtTime(total)}
              </span>
              <button
                type="button"
                className="relative h-1.5 flex-1 rounded-full bg-muted"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
                  setPos(Math.round(ratio * total))
                }}
                aria-label="Seek recording position"
              >
                <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${(pos / total) * 100}%` }} />
                {/* Turn ticks — every turn is findable on the scrubber itself. */}
                {trace.turns.map((t) => (
                  <span
                    key={t.index}
                    className="absolute top-1/2 h-2 w-0.5 -translate-y-1/2 rounded-full bg-foreground/25"
                    style={{ left: `${(t.atSec / total) * 100}%` }}
                    aria-hidden
                  />
                ))}
              </button>
              <Button
                variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                onClick={() => toast.success("Mock: recording downloaded")}
                title="Download recording"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="sr-only">Download recording</span>
              </Button>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
              No recording — this session never connected.
            </p>
          )}
        </div>
      )}

      <Separator />

      {/* ── Transcript + per-turn trace ── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Conversation &amp; trace</h2>
            <p className="text-xs text-muted-foreground">
              {hasRecording ? "Click any line to jump the recording there. " : ""}
              Each agent turn shows the hops that produced it.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setExpandAll((v) => !v)}>
            <Braces className="h-3.5 w-3.5" />
            {expandAll ? "Hide all payloads" : "Show all payloads"}
          </Button>
        </div>

        <div className="space-y-2">
          {trace.turns.map((turn, i) => (
            <TurnRow
              key={turn.index}
              ref={(el) => { turnRefs.current[turn.index] = el }}
              turn={turn}
              scaleMs={scaleMs}
              active={i === activeIndex && playing}
              seekable={hasRecording}
              expandAll={expandAll}
              onSeek={() => { setPos(turn.atSec); track(Events.session_transcript_seek, { session_id: trace.id, turn: turn.index }) }}
              sessionId={trace.id}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── pieces ──────────────────────────────────────────────────────────────────

function Stat({ label, value, unit = "ms", target }: { label: string; value: number; unit?: string; target?: boolean }) {
  const over = target && value > LATENCY_TARGET_MS
  return (
    <div className="rounded-lg border border-border p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-lg font-semibold tabular-nums", over && "text-warning")}>
        {value.toLocaleString()}{unit && <span className="ml-0.5 text-sm font-normal">{unit}</span>}
      </p>
      {target && (
        <p className="text-xs text-muted-foreground">
          {over ? `over ${LATENCY_TARGET_MS} ms target` : `under ${LATENCY_TARGET_MS} ms target`}
        </p>
      )}
    </div>
  )
}

const TurnRow = React.forwardRef<HTMLDivElement, {
  turn: SessionTurn
  scaleMs: number
  active: boolean
  seekable: boolean
  expandAll: boolean
  onSeek: () => void
  sessionId: string
}>(function TurnRow({ turn, scaleMs, active, seekable, expandAll, onSeek, sessionId }, ref) {
  const isAgent = turn.speaker === "Agent"
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => { setOpen(expandAll) }, [expandAll])

  const hasPayloads = Boolean(turn.payloads.stt || turn.payloads.llm || turn.payloads.tts)

  return (
    <div
      ref={ref}
      className={cn(
        "scroll-mt-24 rounded-lg border px-3 py-2.5 transition-colors",
        active ? "border-primary bg-primary/5" : "border-border",
        turn.slowest && !active && "border-warning/50",
        !isAgent && "bg-muted/30",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={seekable ? onSeek : undefined}
          disabled={!seekable}
          className={cn(
            "shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground",
            seekable && "hover:text-primary hover:underline underline-offset-4",
          )}
          title={seekable ? "Jump the recording to this turn" : undefined}
        >
          {fmtTime(turn.atSec)}
        </button>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-xs font-medium", isAgent ? "text-primary" : "text-muted-foreground")}>
              {turn.speaker}
            </span>
            {isAgent && (
              <span className={cn(
                "text-xs tabular-nums",
                turn.e2eMs > LATENCY_TARGET_MS ? "text-warning" : "text-muted-foreground",
              )}>
                {turn.e2eMs} ms
              </span>
            )}
            {turn.slowest && (
              <Badge variant="warning" className="h-5 gap-1 px-1.5 text-xs">
                <Zap className="h-3 w-3" /> Slowest turn
              </Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed">{turn.text}</p>

          {isAgent && turn.spans.length > 0 && (
            <Waterfall spans={turn.spans} scaleMs={scaleMs} totalMs={turn.e2eMs} sessionId={sessionId} />
          )}

          {isAgent && hasPayloads && (
            <Collapsible open={open} onOpenChange={(o) => {
              setOpen(o)
              if (o) track(Events.session_payload_opened, { session_id: sessionId, turn: turn.index })
            }}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="-ml-2 h-7 gap-1 text-xs text-muted-foreground">
                  <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
                  Payloads
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-1.5">
                {turn.payloads.stt != null && <PayloadBlock label="STT" data={turn.payloads.stt} />}
                {turn.payloads.llm != null && <PayloadBlock label="LLM" data={turn.payloads.llm} />}
                {turn.payloads.tts != null && <PayloadBlock label="TTS" data={turn.payloads.tts} />}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  )
})

/** The waterfall — spans laid out on a shared time axis by start offset, so a
 *  turn reads as a SEQUENCE (endpointing → STT → LLM → tool → TTS), not a
 *  stack. Grouped bars, which this replaces, imply the hops run in parallel.
 *
 *  Two things earn their keep here beyond the shape:
 *   • Modeled spans are hatched — a trace that mixes measured and modeled
 *     values without saying which is which is worse than no trace (D3).
 *   • The legend chips are BUTTONS where a fix exists: click the LLM span and
 *     land on the model picker. That closes trace → cause → fix, which the
 *     focus group named the one move no competitor makes. */
function Waterfall({
  spans, scaleMs, totalMs, sessionId,
}: {
  spans: TraceSpan[]
  scaleMs: number
  totalMs: number
  sessionId: string
}) {
  return (
    <div className="space-y-1">
      <div
        className="relative h-5 w-full rounded bg-muted/60"
        role="img"
        aria-label={
          `Turn latency ${totalMs} ms: ` +
          spans.map((s) => `${s.label} ${s.durationMs} ms${s.measured ? "" : " (modeled)"}`).join(", ")
        }
      >
        {spans.map((s) => (
          <span
            key={s.key}
            className={cn("absolute inset-y-0 rounded-sm", SPAN_STYLE[s.key].bar, !s.measured && "opacity-50")}
            style={{
              left: `${(s.startMs / scaleMs) * 100}%`,
              width: `${Math.max(0.8, (s.durationMs / scaleMs) * 100)}%`,
              // Hatch derived from the background token so it reads in both
              // themes — a hardcoded black would vanish on the dark ground.
              ...(s.measured ? {} : {
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 2px, color-mix(in oklch, var(--background) 55%, transparent) 2px, color-mix(in oklch, var(--background) 55%, transparent) 4px)",
              }),
            }}
            title={`${s.label}: ${s.durationMs} ms${s.measured ? "" : " (modeled)"}${s.detail ? ` · ${s.detail}` : ""}`}
          />
        ))}
        {/* The target line — a developer sees the budget, not just the number. */}
        {scaleMs > LATENCY_TARGET_MS && (
          <span
            className="absolute inset-y-0 w-px bg-foreground/30"
            style={{ left: `${(LATENCY_TARGET_MS / scaleMs) * 100}%` }}
            title={`${LATENCY_TARGET_MS} ms target`}
            aria-hidden
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        {spans.map((s) => {
          const fix = SPAN_FIX[s.key]
          const body = (
            <>
              <span className={cn("h-1.5 w-1.5 rounded-full", SPAN_STYLE[s.key].dot)} />
              {s.label}
              {s.detail && <span className="font-mono">{s.detail}</span>}
              <span className="tabular-nums">{s.durationMs}</span>
              {!s.measured && <span className="italic">modeled</span>}
            </>
          )
          return fix ? (
            <Link
              key={s.key}
              href={fix.href}
              onClick={() => track(Events.session_span_fix_clicked, { session_id: sessionId, span: s.key })}
              title={fix.label}
              className="inline-flex items-center gap-1 rounded text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {body}
            </Link>
          ) : (
            <span key={s.key} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              {body}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function PayloadBlock({ label, data }: { label: string; data: unknown }) {
  const json = React.useMemo(() => JSON.stringify(data, null, 2), [data])
  const [copied, setCopied] = React.useState(false)
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-1.5">
        <span className="text-xs font-medium">{label}</span>
        <Button
          variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
          onClick={() => {
            navigator.clipboard?.writeText(json)
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-64 overflow-auto bg-card px-3 py-2 text-xs leading-relaxed">
        <code>{json}</code>
      </pre>
    </div>
  )
}
