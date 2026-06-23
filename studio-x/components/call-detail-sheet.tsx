"use client"

import * as React from "react"
import Link from "next/link"
import {
  Copy, PhoneIncoming, PhoneOutgoing, Download, Play, Pause, Wrench, ShieldCheck, RefreshCw,
} from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getAgent, getDeployment } from "@/lib/campaign-data"
import { buildSignals, diagnoseCall, healthOf, fixHref, type Issue } from "@/lib/diagnostics"
import { SeverityBadge } from "@/components/severity-badge"
import { HealthDot } from "@/components/health-dot"
import {
  track, Events, remediationKey, recordRemediation, listRemediations, clearRemediation,
} from "@/lib/analytics"

export interface CallTranscriptTurn {
  speaker: "Agent" | "Customer"
  text: string
}

export interface CallDetail {
  id: string
  type: "Inbound" | "Outbound"
  from: string
  to: string
  campaign: string
  agent: string
  timestamp: string
  durationSec: number
  outcome: "Successful" | "Failed" | "Cannot Predict"
  transcript: CallTranscriptTurn[]
  /** Deployment + agent this call ran on — lets the Diagnosis tab build fix links. */
  deploymentId?: string
  agentId?: string
}

const OUTCOME_BADGE: Record<CallDetail["outcome"], "default" | "destructive" | "secondary"> = {
  Successful: "default",
  Failed: "destructive",
  "Cannot Predict": "secondary",
}

// ─── deterministic mock derivation (seeded by call id) ───────────────────────
// The wireframe synthesizes per-call latency / structured output / events from
// the call id so the same call always renders the same numbers — no caller
// changes needed (the /calls page keeps passing the same CallDetail shape).

interface LatencyTurn { turn: number; asr: number; llm: number; tts: number; e2e: number }
interface CallEvent { time: string; label: string; tone: "info" | "warn" }
interface StructuredField { label: string; value: string }

function seeded(id: string): () => number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) }
  let s = h >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function buildLatency(id: string): LatencyTurn[] {
  const rnd = seeded(id + "lat")
  const count = 12 + Math.floor(rnd() * 18) // 12–30 turns
  const turns: LatencyTurn[] = []
  for (let i = 1; i <= count; i++) {
    const asr = 90 + Math.round(rnd() * 180)
    const llm = 200 + Math.round(rnd() * 420)
    const tts = 70 + Math.round(rnd() * 150)
    turns.push({ turn: i, asr, llm, tts, e2e: asr + llm + tts })
  }
  return turns
}

function buildStructured(call: CallDetail): StructuredField[] {
  const rnd = seeded(call.id + "so")
  const uk = call.from.startsWith("+44") || call.to.startsWith("+44")
  return [
    { label: "Primary intent", value: call.type === "Inbound" ? "Support request" : "Sales outreach" },
    { label: "Sentiment", value: call.outcome === "Successful" ? "Positive" : call.outcome === "Failed" ? "Negative" : "Neutral" },
    { label: "Disposition", value: call.outcome === "Successful" ? "Resolved" : "Needs follow-up" },
    { label: "Caller verified", value: rnd() > 0.4 ? "Yes" : "No" },
    { label: "Language", value: uk ? "English (UK)" : "English (US)" },
    { label: "Follow-up required", value: call.outcome === "Successful" ? "No" : "Yes" },
  ]
}

function buildEvents(call: CallDetail): CallEvent[] {
  const rnd = seeded(call.id + "ev")
  const dur = call.durationSec > 0 ? call.durationSec : 90
  const events: CallEvent[] = []
  if (rnd() > 0.3) events.push({ time: fmtTime(Math.round(dur * 0.18)), label: "User interruption detected", tone: "info" })
  if (rnd() > 0.5) events.push({ time: fmtTime(Math.round(dur * 0.46)), label: "Knowledge base lookup", tone: "info" })
  if (call.outcome === "Failed") events.push({ time: fmtTime(Math.round(dur * 0.72)), label: "Escalation flagged", tone: "warn" })
  if (events.length === 0) events.push({ time: fmtTime(Math.round(dur * 0.5)), label: "Intent re-classified", tone: "info" })
  return events
}

const SERIES = [
  { key: "asr" as const, label: "ASR", bar: "bg-primary", dot: "bg-primary", text: "text-primary" },
  { key: "llm" as const, label: "LLM", bar: "bg-violet-500", dot: "bg-violet-500", text: "text-violet-500" },
  { key: "tts" as const, label: "TTS", bar: "bg-amber-500", dot: "bg-amber-500", text: "text-amber-500" },
]

export function CallDetailSheet({
  call,
  open,
  onOpenChange,
}: {
  call: CallDetail | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:sm:max-w-[720px] overflow-y-auto p-0">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle>Call Details</SheetTitle>
        </SheetHeader>
        {/* Keyed by id so scrubber / tab / hover state resets per call. */}
        {call && <CallDetailBody key={call.id} call={call} />}
      </SheetContent>
    </Sheet>
  )
}

function CallDetailBody({ call }: { call: CallDetail }) {
  const latency = React.useMemo(() => buildLatency(call.id), [call])
  const structured = React.useMemo(() => buildStructured(call), [call])
  const events = React.useMemo(() => buildEvents(call), [call])

  // Diagnosis — rule-based, seeded by call id so it's stable. Resolves the
  // deployment + agent so each issue's "Fix this" can deep-link to the config.
  const deployment = React.useMemo(() => (call.deploymentId ? getDeployment(call.deploymentId) : undefined), [call])
  const agent = React.useMemo(
    () => (call.agentId ? getAgent(call.agentId) : deployment ? getAgent(deployment.agentId) : undefined),
    [call, deployment],
  )
  const issues = React.useMemo(
    () => diagnoseCall(buildSignals(call.id, { outcome: call.outcome, durationSec: call.durationSec }), { agent, deployment }),
    [call, agent, deployment],
  )
  const health = healthOf(issues)
  React.useEffect(() => {
    track(Events.call_diagnosis_viewed, { call_id: call.id, criticals: health.criticals, warnings: health.warnings })
    const drift = issues.find((i) => i.ruleId === "config_drift")
    if (drift) track(Events.config_drift_detected, { level: drift.fixTarget.level, id: drift.fixTarget.id, ran_version: 0, current_version: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.id])

  const avg = React.useMemo(() => {
    const n = latency.length || 1
    const sum = latency.reduce(
      (a, t) => ({ asr: a.asr + t.asr, llm: a.llm + t.llm, tts: a.tts + t.tts, e2e: a.e2e + t.e2e }),
      { asr: 0, llm: 0, tts: 0, e2e: 0 },
    )
    return { asr: Math.round(sum.asr / n), llm: Math.round(sum.llm / n), tts: Math.round(sum.tts / n), e2e: Math.round(sum.e2e / n) }
  }, [latency])

  // Audio scrubber (mock playback)
  const total = call.durationSec > 0 ? call.durationSec : 90
  const [pos, setPos] = React.useState(Math.round(total * 0.13))
  const [playing, setPlaying] = React.useState(false)

  return (
    <div className="px-5 py-4 space-y-4">
      {/* Metadata */}
      <div className="space-y-2.5">
        <Field label="Call ID" value={call.id} copyable />
        <Field
          label="Call Type"
          custom={
            <Badge variant="outline" className="gap-1">
              {call.type === "Inbound" ? <PhoneIncoming className="h-3 w-3" /> : <PhoneOutgoing className="h-3 w-3" />}
              {call.type}
            </Badge>
          }
        />
        <Field label="From" value={call.from} copyable />
        <Field label="To" value={call.to} copyable />
        <Field label="Campaign" value={call.campaign} />
        <Field label="Agent" value={call.agent} />
        <Field label="Timestamp" value={call.timestamp} />
        <Field label="Call Duration" value={`${call.durationSec} seconds`} />
        <Field label="Call Outcome" custom={<Badge variant={OUTCOME_BADGE[call.outcome]}>{call.outcome}</Badge>} />
      </div>

      {/* Audio Recording */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Audio Recording</p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline" size="icon" className="h-8 w-8 shrink-0"
            onClick={() => setPlaying((p) => !p)}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="sr-only">{playing ? "Pause recording" : "Play recording"}</span>
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground shrink-0">{fmtTime(pos)} / {fmtTime(total)}</span>
          <button
            type="button"
            className="relative flex-1 h-1.5 rounded-full bg-muted"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
              setPos(Math.round(ratio * total))
            }}
            aria-label="Seek recording position"
          >
            <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${(pos / total) * 100}%` }} />
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
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="diagnosis" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="diagnosis" className="gap-1.5">
            Diagnosis
            {issues.length > 0 && (
              <Badge
                variant={health.criticals > 0 ? "destructive" : "warning"}
                className="h-5 px-1.5 text-xs tabular-nums"
              >
                {issues.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="structured">Structured Output</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5">
            Events
            <Badge variant="secondary" className="h-5 px-1.5 text-xs tabular-nums">{events.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="latency">Latency</TabsTrigger>
        </TabsList>

        {/* Diagnosis — rule-based issues + suggested fixes (the remediation atom) */}
        <TabsContent value="diagnosis" className="mt-3 space-y-2.5">
          {issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
              <ShieldCheck className="h-7 w-7 text-primary" />
              <p className="text-sm font-medium">No issues detected</p>
              <p className="text-xs text-muted-foreground">This call ran cleanly — no critical or warning signals.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <HealthDot status={health.status} />
                <p className="text-sm font-medium">
                  {[
                    health.criticals ? `${health.criticals} critical` : null,
                    health.warnings ? `${health.warnings} warning${health.warnings > 1 ? "s" : ""}` : null,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
              {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} surface="call_sheet" deploymentId={call.deploymentId} />
              ))}
            </>
          )}
        </TabsContent>

        {/* Transcript */}
        <TabsContent value="transcript" className="mt-3 space-y-2">
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            {call.transcript.map((t, i) => (
              <div key={i} className="space-y-0.5">
                <p className={t.speaker === "Agent" ? "text-xs font-medium text-primary" : "text-xs font-medium text-muted-foreground"}>
                  {t.speaker}
                </p>
                <p className="text-sm leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => toast.success("Mock: transcript downloaded")}>
            <Download className="h-3.5 w-3.5" /> Download transcript
          </Button>
        </TabsContent>

        {/* Structured Output */}
        <TabsContent value="structured" className="mt-3">
          <div className="rounded-lg border border-border divide-y divide-border">
            {structured.map((f) => (
              <div key={f.label} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-xs text-muted-foreground">{f.label}</span>
                <span className="text-sm font-medium text-right">{f.value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Data points extracted by the agent during the call.</p>
        </TabsContent>

        {/* Events */}
        <TabsContent value="events" className="mt-3">
          <div className="space-y-3">
            {events.map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xs tabular-nums text-muted-foreground w-12 shrink-0 pt-0.5">{e.time}</span>
                <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", e.tone === "warn" ? "bg-amber-500" : "bg-primary")} />
                <span className="text-sm">{e.label}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Latency */}
        <TabsContent value="latency" className="mt-3 space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">Average Latency</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <LatCard label="Total (E2E)" value={avg.e2e} />
              <LatCard label="ASR (TTFW)" value={avg.asr} />
              <LatCard label="LLM (TTFT)" value={avg.llm} />
              <LatCard label="TTS (TTFA)" value={avg.tts} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Latency Per Turn (ms)</p>
              <span className="text-xs text-muted-foreground">Total {latency.length} Turns</span>
            </div>
            <LatencyChart turns={latency} />
            <div className="flex items-center gap-4 mt-2">
              {SERIES.map((s) => (
                <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn("h-2 w-2 rounded-full", s.dot)} /> {s.label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turn</TableHead>
                  <TableHead className="text-right">ASR</TableHead>
                  <TableHead className="text-right">LLM</TableHead>
                  <TableHead className="text-right">TTS</TableHead>
                  <TableHead className="text-right">Total (E2E)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latency.map((t) => (
                  <TableRow key={t.turn}>
                    <TableCell className="text-sm">#{t.turn}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{t.asr}ms</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{t.llm}ms</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{t.tts}ms</TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-medium">{t.e2e}ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums mt-0.5">{value}ms</p>
    </div>
  )
}

function LatencyChart({ turns }: { turns: LatencyTurn[] }) {
  const [hover, setHover] = React.useState<number | null>(null)
  const maxVal = Math.max(...turns.flatMap((t) => [t.asr, t.llm, t.tts]))
  const scaleMax = Math.max(1000, Math.ceil(maxVal / 250) * 250)
  const yTicks = [scaleMax, scaleMax * 0.75, scaleMax * 0.5, scaleMax * 0.25, 0]

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start gap-2">
        {/* y-axis */}
        <div className="flex flex-col justify-between h-40 shrink-0 pr-1" aria-hidden>
          {yTicks.map((v) => (
            <span key={v} className="text-xs tabular-nums text-muted-foreground leading-none">{Math.round(v)}</span>
          ))}
        </div>
        {/* bars — horizontally scrollable when there are many turns */}
        <div className="flex-1 overflow-x-auto">
          <div
            className="flex items-end gap-3 min-w-max"
            role="img"
            aria-label={`Per-turn latency for ${turns.length} turns, in milliseconds, split across ASR, LLM and TTS`}
          >
            {turns.map((t) => (
              <div
                key={t.turn}
                className="relative flex flex-col items-center gap-1"
                onMouseEnter={() => setHover(t.turn)}
                onMouseLeave={() => setHover((h) => (h === t.turn ? null : h))}
              >
                <div className="flex items-end gap-0.5 h-40">
                  {SERIES.map((s) => (
                    <span
                      key={s.key}
                      className={cn("w-1.5 rounded-t", s.bar)}
                      style={{ height: `${(t[s.key] / scaleMax) * 100}%` }}
                    />
                  ))}
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">T{t.turn}</span>
                {hover === t.turn && (
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 rounded-md border border-border bg-popover px-2 py-1.5 text-xs shadow-md whitespace-nowrap">
                    <p className="font-medium mb-0.5">E2E : {t.e2e} ms</p>
                    {SERIES.map((s) => (
                      <p key={s.key} className={s.text}>{s.label} : {t[s.key]} ms</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  custom,
  copyable,
}: {
  label: string
  value?: string
  custom?: React.ReactNode
  copyable?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      {custom ?? (
        <span className="inline-flex items-center gap-1.5 text-sm text-right">
          <span className="truncate">{value}</span>
          {copyable && (
            <button
              type="button"
              onClick={() => {
                if (value) void navigator.clipboard.writeText(value)
                toast.success(`${label} copied`)
              }}
              className="text-muted-foreground hover:text-foreground"
              title={`Copy ${label}`}
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
        </span>
      )}
    </div>
  )
}

/** One diagnosed issue: severity · root cause · suggested fix · deep-link to the
 *  fix, plus the confirm step that closes the loop. Reused on the call Diagnosis
 *  tab AND the Observe › Diagnostics queue, so rootCause shows in both. */
export function IssueCard({
  issue,
  surface,
  deploymentId,
  deploymentName,
  count,
}: {
  issue: Issue
  surface: "call_sheet" | "queue"
  deploymentId?: string
  deploymentName?: string
  count?: number
}) {
  const remKey = remediationKey(issue.ruleId, deploymentId ?? issue.fixTarget.id)
  const [recheck, setRecheck] = React.useState(false)

  // Confirm step: if the user clicked Fix earlier (persisted) and returns here,
  // show "re-running checks", then fire remediation_resolved and clear it.
  React.useEffect(() => {
    if (!listRemediations().includes(remKey)) return
    setRecheck(true)
    const t = setTimeout(() => {
      track(Events.remediation_resolved, {
        rule_id: issue.ruleId,
        level: issue.fixTarget.level,
        target_id: issue.fixTarget.id,
        deployment_id: deploymentId,
      })
      clearRemediation(remKey)
      setRecheck(false)
    }, 2200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remKey])

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <SeverityBadge severity={issue.severity} />
          <p className="text-sm font-medium truncate">{issue.title}</p>
        </div>
        {issue.turn != null ? (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            turn {issue.turn}{issue.timestamp ? ` · ${issue.timestamp}` : ""}
          </span>
        ) : count != null && count > 1 ? (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}×</span>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">{issue.rootCause}</p>
      <p className="text-xs text-foreground/80">
        <span className="font-medium">Suggested fix: </span>{issue.suggestedFix}
      </p>
      {deploymentName && (
        <p className="text-xs text-muted-foreground">
          Affects <span className="font-medium text-foreground">{deploymentName}</span>
        </p>
      )}
      {recheck ? (
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Marked fixed — re-running checks…
        </div>
      ) : (
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link
            href={fixHref(issue.fixTarget)}
            onClick={() => {
              track(Events.remediation_link_clicked, {
                rule_id: issue.ruleId,
                severity: issue.severity,
                level: issue.fixTarget.level,
                target_id: issue.fixTarget.id,
                section: issue.fixTarget.section,
                surface,
              })
              recordRemediation(remKey)
            }}
          >
            <Wrench className="h-3.5 w-3.5" /> Fix this
          </Link>
        </Button>
      )}
    </div>
  )
}
