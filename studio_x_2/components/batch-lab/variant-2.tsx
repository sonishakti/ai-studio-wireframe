"use client"

// D1 batch-lab · Variant 2 — "Reassurance-first" (the anti-panic design).
// ─────────────────────────────────────────────────────────────────────────────
// THE ONE JOB (spec.ts): a slow-but-throttled batch must read as WORKING, not
// FAILED. This variant answers "is this working?" in ONE sentence, at the very
// top, before any telemetry. The reassuring headline is unmissable; the
// queued/dialing/retry numbers, the disposition breakdown, and the recent-call
// preview are all available BELOW it but deliberately secondary.
//
// Design contract vs the other variants: telemetry does not lead. The single
// StateBanner (reused verbatim from usage-spend-card so tone can never diverge)
// carries the verdict; everything under it is calm supporting evidence.
//
// Requirements met here: R1 queued/dialing/completed tiles · R2 "Paced" badge
// primary-not-warning · R3 concurrency gauge folded into the Dialing tile ·
// R4 retry counter ("34 calls retrying, up to 3 attempts") · R5 full
// disposition set in a collapsible · R6 degraded is a DISTINCT destructive
// banner that links the fix · R7 live ETA from batchEta · R8 every
// zero-progress moment prints batchRuntime.reason verbatim · R9 the A6
// add-lines unlock (AddLinesSheet) is the paced banner's action.

import * as React from "react"
import Link from "next/link"
import {
  Radio,
  CalendarClock,
  OctagonAlert,
  CheckCircle2,
  ChevronDown,
  PhoneOutgoing,
  RotateCcw,
  Users,
  ArrowRight,
  Plus,
  Wrench,
  PlayCircle,
} from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  PACING_META, DISPOSITION_META, batchEta, deploymentHref,
  spendStats, CONCURRENCY,
  type CallDisposition,
} from "@/lib/campaign-data"
import { StateBanner } from "@/components/usage-spend-card"
import { AddLinesSheet } from "@/components/concurrency-card"
import type { BatchVariantProps } from "./spec"

// StateBanner speaks 4 tones (primary/success/warning/destructive); PACING_META
// also knows "muted", which the banner can't render. We map each pacing state to
// the closest banner tone — and crucially keep "paced" at PRIMARY, never warning
// (R2). "scheduled" has no true neutral in the banner, so it borrows primary and
// leans on a calendar icon + "nothing dials yet" copy to read as inert, not busy.
type BannerTone = "primary" | "success" | "warning" | "destructive"

const fmt = (n: number) => n.toLocaleString()

// ETA words from batchEta's minutes — the prompt's "~Xh" is data-driven: at
// 1.9 cps × ~1,579 remaining this is really ~14 min, so we show minutes when
// under an hour and only roll up to hours when the queue is genuinely long.
function etaWords(min: number): string {
  if (min < 1) return "under a minute"
  if (min < 60) return `~${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `~${h}h ${m}m` : `~${h}h`
}

// Deterministic recent-call rows (mock, no per-call batch data exists). Same
// FNV-1a style the Call detail sheet / diagnostics use, keyed by deployment id,
// so a batch always previews the same tail — reproducible for a wireframe.
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

interface RecentCall { num: string; disp: CallDisposition; ago: string }

// Weight the tail by the batch's OWN terminal dispositions so the preview looks
// like the breakdown above it (not a fabricated happy tail).
function recentCalls(id: string, dispositions: Partial<Record<CallDisposition, number>>, n = 6): RecentCall[] {
  const terminal: CallDisposition[] = [
    "completed", "no-answer", "busy", "voicemail",
    "disconnected", "wrong-number", "carrier-failed", "max-retries",
  ]
  const pool = terminal.filter((k) => (dispositions[k] ?? 0) > 0)
  if (pool.length === 0) return []
  const total = pool.reduce((a, k) => a + (dispositions[k] ?? 0), 0)
  const rnd = seeded(id + "tail")
  const rows: RecentCall[] = []
  let ago = 6
  for (let i = 0; i < n; i++) {
    // Weighted pick across the present dispositions.
    let r = rnd() * total
    let disp = pool[0]
    for (const k of pool) { r -= dispositions[k] ?? 0; if (r <= 0) { disp = k; break } }
    const last2 = String(10 + Math.floor(rnd() * 89)).padStart(2, "0")
    rows.push({
      num: `+1 (415) 555-01${last2}`,
      disp,
      ago: ago < 60 ? `${ago}s ago` : `${Math.floor(ago / 60)}m ${ago % 60}s ago`,
    })
    ago += 8 + Math.floor(rnd() * 22)
  }
  return rows
}

// Disposition kind → token. Reassurance-first keeps these quiet: good=success,
// retry=warning, bad=destructive, neutral=muted. No raw hex — tokens only.
const KIND_BAR: Record<string, string> = {
  good: "bg-success",
  retry: "bg-warning",
  bad: "bg-destructive",
  neutral: "bg-muted-foreground/50",
}
const DOT_BY_TONE: Record<string, string> = {
  success: "bg-success",
  primary: "bg-primary",
  muted: "bg-muted-foreground",
  warning: "bg-warning",
  destructive: "bg-destructive",
}

export function Variant2({ scenario }: BatchVariantProps) {
  const d = scenario.deployment
  const rt = d.batchRuntime
  const [linesOpen, setLinesOpen] = React.useState(false)

  // No runtime = nothing to reassure about; a draft batch has no live state.
  if (!rt) {
    return (
      <StateBanner tone="primary" icon={CalendarClock}>
        <p className="text-sm font-medium">{d.name} hasn&apos;t started yet.</p>
        <p className="text-xs text-muted-foreground">This batch is a draft — no calls have been queued.</p>
      </StateBanner>
    )
  }

  const pacing = rt.pacing
  const meta = PACING_META[pacing]
  const completed = d.progress?.completed ?? 0
  const total = d.progress?.total ?? 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  // Degraded/paused BOTH read as "needs attention" here — the only paused
  // fixture is the carrier-failure circuit breaker (R6: distinct from paced).
  const needsAttention = pacing === "degraded" || pacing === "paused"
  const isDone = pacing === "done"
  const isScheduled = pacing === "scheduled"

  // Done-summary math, derived (never hardcoded): connected vs. flagged, where
  // "flagged" = dead numbers we exit rather than retry (spec §5).
  const connected = rt.dispositions.completed ?? 0
  const flagged =
    (rt.dispositions.disconnected ?? 0) +
    (rt.dispositions["wrong-number"] ?? 0) +
    (rt.dispositions["carrier-failed"] ?? 0) +
    (rt.dispositions["max-retries"] ?? 0)

  const eta = batchEta(d) // non-null only while paced/dialing (R7)

  // ── The single reassurance headline, tuned by pacing ──────────────────────
  let tone: BannerTone = "primary"
  let Icon = Radio
  let headline = ""
  let sub: React.ReactNode = rt.reason // default: the reason verbatim (R8)
  let action: React.ReactNode = null

  if (pacing === "paced") {
    tone = "primary"
    Icon = Radio
    headline = "Working — dialing at capacity."
    sub = (
      <>
        {fmt(rt.queued)} queued, none dropped
        {eta ? <> · {etaWords(eta.minutes)} to finish</> : null}.
      </>
    )
    // R9 — the A6 at-the-wall unlock is the paced banner's ONE action.
    action = (
      <Button size="sm" className="gap-1.5" onClick={() => setLinesOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add lines to clear the queue faster
      </Button>
    )
  } else if (pacing === "dialing") {
    tone = "success"
    Icon = PhoneOutgoing
    headline = "Working — dialing with room to spare."
    sub = (
      <>
        {fmt(rt.queued)} queued{eta ? <> · {etaWords(eta.minutes)} to finish</> : null}.
      </>
    )
  } else if (isScheduled) {
    // "muted" isn't a banner tone — primary + a calendar icon + "nothing dials
    // yet" keeps this inert, not busy. Zero progress ALWAYS shows its reason.
    tone = "primary"
    Icon = CalendarClock
    headline = `Starts ${d.startDate} — nothing dials yet.`
    sub = rt.reason
    action = (
      <Button size="sm" variant="outline" asChild>
        <Link href={deploymentHref(d)}>Edit schedule</Link>
      </Button>
    )
  } else if (needsAttention) {
    // R6 — visibly DISTINCT from paced: destructive tone, names the cause
    // (SIP 503 lives in rt.reason), and links the fix (the remediation spine —
    // carrier/trunk issues route to the deployment's channel anchor, exactly
    // where diagnostics.ts sends a network/carrier Issue).
    tone = "destructive"
    Icon = OctagonAlert
    headline = "Paused — carrier failures spiked. Here's why and how to fix it."
    sub = rt.reason
    action = (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-1.5" asChild>
          <Link href={`${deploymentHref(d)}#channel`}>
            <Wrench className="h-3.5 w-3.5" /> Fix trunk settings
          </Link>
        </Button>
        {/* Resume is available but INFORMED — placed after the fix, not before. */}
        <Button size="sm" variant="outline" className="gap-1.5">
          <PlayCircle className="h-3.5 w-3.5" /> Resume anyway
        </Button>
      </div>
    )
  } else if (isDone) {
    tone = "success"
    Icon = CheckCircle2
    headline = `Completed — ${fmt(connected)} connected, ${fmt(flagged)} flagged.`
    sub = rt.reason
    action = (
      <Button size="sm" variant="outline" className="gap-1.5" asChild>
        <Link href={deploymentHref(d)}>
          View all calls <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    )
  } else {
    // draining
    tone = "primary"
    Icon = Radio
    headline = "Wrapping up — finishing the calls already in flight."
    sub = rt.reason
  }

  // Progress-bar tone: reassurance-first keeps the WHOLE-BATCH bar neutral even
  // when paused (the banner owns the alarm) — a red bar would over-signal that
  // the completed calls failed. Active=primary, done=success, else muted.
  const barTone =
    pacing === "paced" || pacing === "dialing" || pacing === "draining"
      ? "bg-primary"
      : isDone
        ? "bg-success"
        : "bg-muted-foreground/50"

  // Full disposition breakdown, sorted desc, zero-counts dropped (R5).
  const dispRows = (Object.entries(rt.dispositions) as [CallDisposition, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
  const dispMax = dispRows.length ? dispRows[0][1] : 1
  const dispSum = dispRows.reduce((a, [, n]) => a + n, 0)

  const tail = recentCalls(d.id, rt.dispositions)

  // AddLinesSheet (A6) headroom — computed the same way ConcurrencyCard does.
  const spend = spendStats()
  const capHeadroomUsd = spend.capUsd != null ? Math.max(0, spend.capUsd - spend.spentUsd) : null

  return (
    <div className="space-y-4">
      {/* Kicker — minimal context so the banner still visually LEADS. Carries
          the R2 Paced badge: neutral/primary dot, never a warning colour. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold">{d.name}</h1>
          <p className="truncate text-xs text-muted-foreground">
            Batch call · {d.agentName} · {d.contacts?.fileName}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", DOT_BY_TONE[meta.tone])} aria-hidden="true" />
          {meta.label}
        </Badge>
      </div>

      {/* ── THE headline: is this working? One sentence, before any telemetry ── */}
      <StateBanner tone={tone} icon={Icon}>
        <p className="text-sm font-medium">{headline}</p>
        <p className="text-xs text-muted-foreground tabular-nums">{sub}</p>
        {action && <div className="mt-2.5">{action}</div>}
      </StateBanner>

      {/* ── Calm progress: the big number, a bar, three quiet stat tiles ────── */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">{fmt(completed)}</span>
                <span className="text-sm text-muted-foreground tabular-nums">of {fmt(total)} calls</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isScheduled ? "Nothing dialed yet — this batch is scheduled." : "Calls placed so far in this batch."}
              </p>
            </div>
            <span className="text-sm font-medium text-muted-foreground tabular-nums">{pct}%</span>
          </div>

          {/* Custom bar (not <Progress>) so tone follows pacing via tokens. */}
          <div
            role="meter"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={completed}
            aria-label={`${fmt(completed)} of ${fmt(total)} calls placed`}
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div className={cn("h-full rounded-full transition-all", barTone)} style={{ width: `${Math.max(pct, isScheduled ? 0 : 1)}%` }} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Queued */}
            <StatTile icon={Users} label="Queued" value={fmt(rt.queued)} hint="waiting for a free line" />

            {/* Dialing — doubles as the R3 concurrency gauge (lines in use). */}
            <StatTile
              icon={PhoneOutgoing}
              label="Dialing now"
              value={fmt(rt.linesInUse)}
              hint={`of ${rt.linesTotal} lines · ${rt.cps.actual} of ${rt.cps.target} calls/sec`}
            >
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${rt.linesTotal > 0 ? Math.round((rt.linesInUse / rt.linesTotal) * 100) : 0}%` }}
                />
              </div>
              {/* At the wall (all lines busy) → offer the A6 unlock inline too. */}
              {pacing === "paced" && rt.linesInUse >= rt.linesTotal && (
                <button
                  type="button"
                  onClick={() => setLinesOpen(true)}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add lines
                </button>
              )}
            </StatTile>

            {/* Retrying — R4 attempt counter, spelled out. */}
            <StatTile
              icon={RotateCcw}
              label="Retrying"
              value={fmt(rt.retry.retrying)}
              hint={rt.retry.retrying > 0 ? `${fmt(rt.retry.retrying)} calls retrying (up to ${rt.retry.max} attempts)` : `up to ${rt.retry.max} attempts each`}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Secondary: the full outcome set, collapsed by default (open on a
          finished batch, where the breakdown IS the point). Hidden entirely
          when there are no outcomes yet — a scheduled batch's reason already
          explains the emptiness above. ──────────────────────────────────── */}
      {dispRows.length > 0 && (
        <Card>
          <Collapsible defaultOpen={isDone}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-6 py-4 text-left [&[data-state=open]>svg]:rotate-180"
              >
                <span className="text-sm font-medium">
                  Call outcomes
                  <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                    {dispRows.length} types · {fmt(dispSum)} calls
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2.5 border-t px-6 py-4">
                {dispRows.map(([disp, n]) => {
                  const dm = DISPOSITION_META[disp]
                  return (
                    <div key={disp} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-xs text-muted-foreground">{dm.label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        {/* tiny inline bar, relative to the largest bucket */}
                        <div
                          className={cn("h-full rounded-full", KIND_BAR[dm.kind])}
                          style={{ width: `${Math.round((n / dispMax) * 100)}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right text-xs tabular-nums">
                        {fmt(n)}
                        <span className="ml-1 text-muted-foreground">
                          {dispSum > 0 ? `${Math.round((n / dispSum) * 100)}%` : "0%"}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* ── Recent calls preview (6). Tertiary — telemetry you CAN read, not
          telemetry you MUST. ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recent calls</CardTitle>
        </CardHeader>
        <CardContent>
          {tail.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">
              {isScheduled
                ? `No calls yet — dialing begins ${d.startDate}.`
                : "No calls to show yet."}
            </p>
          ) : (
            <div className="divide-y">
              {tail.map((c, i) => {
                const dm = DISPOSITION_META[c.disp]
                return (
                  <div key={i} className="flex items-center justify-between gap-3 py-2">
                    <span className="font-mono text-xs tabular-nums">{c.num}</span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className={cn("h-1.5 w-1.5 rounded-full", KIND_BAR[dm.kind])} aria-hidden="true" />
                        {dm.label}
                      </span>
                      <span className="w-20 text-right text-xs text-muted-foreground tabular-nums">{c.ago}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* R9 — the shared at-the-wall unlock. Same sheet the ConcurrencyCard
          (A6) opens, so buying lines is one behaviour app-wide. */}
      <AddLinesSheet
        open={linesOpen}
        onOpenChange={setLinesOpen}
        purchased={CONCURRENCY.purchased}
        queued={rt.queued}
        totalLines={rt.linesTotal}
        capHeadroomUsd={capHeadroomUsd}
        onCommit={() => setLinesOpen(false)}
      />
    </div>
  )
}

// A quiet stat tile — the telemetry that lives UNDER the reassurance headline.
function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{hint}</p>
      {children}
    </div>
  )
}
