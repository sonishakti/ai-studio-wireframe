"use client"

import * as React from "react"
import { Rocket, Check, AlertTriangle, ArrowRight, Waypoints, FileText, AudioLines, Cpu, ClipboardCheck, Users, Globe, FlaskConical, PhoneOff } from "lucide-react"
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { InfoHint } from "@/components/wizard/info-hint"
import { cn } from "@/lib/utils"
import {
  publishBlocks, channelTarget, campaignMissingVars, activeCampaigns, hasChannel, draftHosting,
  MOCK_CSV_ROWS, DEFAULT_ANALYSIS, DEFAULT_CALL_BEHAVIOR, type AgentDraft, type CampaignDraft,
} from "@/lib/wizard-draft"
import { hostingSummary, isPinned } from "@/lib/hosting-regions"
import { ladderLine, ruleIssues } from "@/lib/call-rules"
import { openAdvanced } from "@/components/wizard/advanced-settings-sheet"
import { stackLine, stackEstimateFor, extractVars, PHONE_NUMBERS, type RunMode } from "@/lib/campaign-data"
import { latestRun } from "@/lib/eval-runs"
import { hasCriteria, readScorecard } from "@/lib/scorecard"

/**
 * DeployPreflight — the validation moment (owner 2026-07-24: "when user
 * clicks Deploy we need a summary for the deploy to be validated").
 *
 * EVERY deploy — not just batch — opens a pre-flight: a systems check that
 * verifies the real config row by row, ticking in sequence. Anything unmet
 * appears IN the checklist as an amber row with its own Fix → jump. Batch
 * carries one row + manifest line PER CAMPAIGN (multi-campaign IA,
 * 2026-07-28), with "Talk to it first" as the safer exit.
 */

interface CheckRow {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  state: "ok" | "warn"
  /** Journey section (1 Voice · 2 Channel · 3 Context · 4 Go Live) that fixes a warn row. */
  fixStep?: number
  fixLabel?: string
  /** For a row whose fix lives behind a door rather than in a section. */
  fixAction?: () => void
}

function campaignWarn(draft: AgentDraft, c: CampaignDraft): { value: string; fixStep: number; fixLabel: string } | null {
  if (!c.numberId) return { value: `"${c.name}" needs a phone number.`, fixStep: 5, fixLabel: "Pick a number" }
  if (!c.csvName) return { value: `"${c.name}" is missing its contacts CSV.`, fixStep: 5, fixLabel: "Add contacts" }
  if (c.launch?.mode === "scheduled" && !(c.launch.startDate && c.launch.startTime && c.launch.timezone)) {
    return { value: `"${c.name}" is scheduled but has no start time.`, fixStep: 5, fixLabel: "Set schedule" }
  }
  const missing = campaignMissingVars(draft, c)
  if (missing.length) {
    return {
      value: `"${c.name}": ${missing.length} {{variable}}${missing.length > 1 ? "s" : ""} missing a CSV column`,
      fixStep: 3,
      fixLabel: "Edit prompt",
    }
  }
  return null
}

function buildRows(
  draft: AgentDraft,
  simSummary?: { passed: number; failed: number; total: number; mode?: RunMode } | null,
): CheckRow[] {
  const blocks = publishBlocks(draft)
  const blockFor = (step: number) => blocks.find((b) => b.step === step)
  const rows: CheckRow[] = []

  // Channel(s)
  const chBlock = blockFor(2)
  rows.push({
    id: "channel", icon: Waypoints, label: "Deployment",
    value: chBlock ? chBlock.reason : channelTarget(draft),
    state: chBlock ? "warn" : "ok",
    fixStep: chBlock ? 2 : undefined, fixLabel: chBlock?.action,
  })

  // Batch: one row per active campaign — the lists are what the deploy DIALS.
  if (hasChannel(draft, "batch")) {
    const active = activeCampaigns(draft)
    if (active.length === 0) {
      rows.push({
        id: "campaigns", icon: Users, label: "Batch",
        value: draft.channels.length === 1
          ? "Create a campaign run to start batch calling."
          : "No runs yet: batch stays idle until you create one.",
        state: draft.channels.length === 1 ? "warn" : "ok",
        fixStep: draft.channels.length === 1 ? 5 : undefined,
        fixLabel: draft.channels.length === 1 ? "New run" : undefined,
      })
    }
    active.forEach((c, i) => {
      const warn = campaignWarn(draft, c)
      rows.push({
        id: `campaign-${c.id}`, icon: Users, label: i === 0 ? "Batch" : "",
        value: warn
          ? warn.value
          : `${c.name} · ${c.contacts ?? MOCK_CSV_ROWS} contacts · ${c.csvName} · variables covered`,
        state: warn ? "warn" : "ok",
        fixStep: warn?.fixStep, fixLabel: warn?.fixLabel,
      })
    })
  }

  // Prompt (Context)
  const prBlock = blockFor(3)
  const vars = extractVars(`${draft.systemPrompt} ${draft.greeting}`)
  rows.push({
    id: "prompt", icon: FileText, label: "Prompt",
    value: prBlock
      ? prBlock.reason
      : `${draft.systemPrompt.trim().length.toLocaleString()} chars${vars.length ? ` · ${vars.length} {{variable}}${vars.length > 1 ? "s" : ""}` : ""} · greeting ${draft.greeting.trim() ? "set" : "default"}`,
    state: prBlock ? "warn" : "ok",
    fixStep: prBlock ? 3 : undefined, fixLabel: prBlock?.action,
  })

  // Voice (section 1)
  const vBlock = blockFor(1)
  rows.push({
    id: "voice", icon: AudioLines, label: "Voice",
    value: vBlock ? vBlock.reason : `${draft.stack.tts.voice} · ${draft.stack.tts.vendor} · ${draft.stack.language ?? "English"}`,
    state: vBlock ? "warn" : "ok",
    fixStep: vBlock ? 1 : undefined, fixLabel: vBlock?.action,
  })

  // Models (defaults always validate — the row shows WHAT deploys)
  const est = stackEstimateFor(draft.stack)
  rows.push({
    id: "models", icon: Cpu, label: "Models",
    value: `${stackLine(draft.stack)} · ~${est.latencyMs} ms · ~$${est.costPerMin.toFixed(2)}/min`,
    state: "ok",
  })

  // Hosting region — never a blocker (Automatic is valid), but a deploy that
  // silently ignores a residency requirement is exactly the mistake a
  // pre-flight exists to catch, so it always shows what will ship.
  const hosting = draftHosting(draft)
  rows.push({
    id: "hosting", icon: Globe, label: "Hosting",
    value: isPinned(hosting)
      ? `${hostingSummary(hosting)}. The agent will not start outside it`
      : hostingSummary(hosting),
    state: "ok",
  })

  // Tests (D graft, 2026-09-16). The gate already echoed a pass count; what it
  // never said is WHICH MACHINE produced it. A suite that passed in text has
  // proved the words and nothing about how the call sounds — going live on
  // that is a decision, so the pre-flight makes it one instead of a silent tick.
  // The stored run is preferred over the strip's in-memory verdict (14, 2026-09-17):
  // the strip forgets its run when the tab closes, and the gate then reported no
  // test at all. A run records HOW MANY times each case ran, so the row can state
  // the sample size a rate is worth reading against.
  const stored = latestRun(draft.agentId ?? "draft")
  const summary = stored
    ? {
        passed: stored.results.filter((r) => r.result.verdict === "pass").length,
        failed: stored.results.filter((r) => r.result.verdict !== "pass").length,
        total: stored.results.length,
        mode: stored.mode,
        repeats: stored.repeats,
      }
    : simSummary
      ? { ...simSummary, repeats: 1 }
      : null

  if (summary && summary.total > 0) {
    const textOnly = summary.mode !== "audio"
    const how = textOnly
      ? summary.repeats > 1 ? `over ${summary.repeats} text runs each` : "as text"
      : "with audio"
    rows.push({
      id: "tests", icon: FlaskConical, label: "Tests",
      value: summary.failed > 0
        ? `${summary.failed} of ${summary.total} failing ${how}`
        : textOnly
          ? `${summary.passed} of ${summary.total} passed ${how}. Not yet heard with audio`
          : `${summary.passed} of ${summary.total} passed with audio`,
      state: summary.failed > 0 || textOnly ? "warn" : "ok",
      fixStep: summary.failed > 0 || textOnly ? 4 : undefined,
      fixLabel: summary.failed > 0 ? "Open tests" : "Run with audio",
    })
  } else {
    rows.push({
      id: "tests", icon: FlaskConical, label: "Tests",
      value: "No test has been run against this agent",
      state: "warn", fixStep: 4, fixLabel: "Open tests",
    })
  }

  // Call rules (design 05). The gate is where a rule that can never fire has
  // to be caught: a reminder set after the hang-up costs nothing until the
  // first real caller goes quiet, and then it costs the call.
  const cb = { ...DEFAULT_CALL_BEHAVIOR, ...draft.callBehavior }
  const ruleProblems = ruleIssues(cb, { telephony: hasChannel(draft, "inbound") || hasChannel(draft, "batch") })
  const blocker = ruleProblems.find((i) => i.level === "blocker") ?? ruleProblems[0]
  rows.push({
    id: "call-rules", icon: PhoneOff, label: "Call rules",
    value: blocker ? blocker.message : ladderLine(cb),
    state: blocker ? "warn" : "ok",
    fixLabel: blocker ? "Open call rules" : undefined,
    fixAction: blocker ? () => openAdvanced("call") : undefined,
  })

  // Structured outputs
  const an = { ...DEFAULT_ANALYSIS, ...draft.analysis }
  // The scorecard's criteria ARE the attach state (14): a switch could be on
  // over an empty box, so the row now names what grades this agent and counts it.
  const sc = readScorecard(draft.agentId ?? "draft")
  const scored = hasCriteria(sc)
  rows.push({
    id: "capture", icon: ClipboardCheck, label: "Outputs",
    value: [
      an.transcribe ? "transcripts" : null,
      an.record ? "recording" : null,
      scored ? sc.name : null,
      scored ? `${sc.criteria.length} criteri${sc.criteria.length === 1 ? "on" : "a"}` : null,
      an.dataPoints.length ? `${an.dataPoints.length} data point${an.dataPoints.length > 1 ? "s" : ""}` : null,
    ].filter(Boolean).join(" · ") || "off",
    state: "ok",
  })

  return rows
}

export function DeployPreflight({
  open,
  onOpenChange,
  draft,
  ctaLabel,
  liveInboundNumber,
  onConfirm,
  onFix,
  onTalkFirst,
  simSummary,
  onViewSims,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  draft: AgentDraft
  /** The truthful CTA ("Launch batch calls" / "Redeploy" / "Deploy"). */
  ctaLabel: string
  /** Set when a redeploy takes a live inbound line dark. */
  liveInboundNumber?: string
  onConfirm: () => void
  /** Close + jump to the section that fixes a warn row. */
  onFix: (step: number) => void
  onTalkFirst: () => void
  /** The Test strip's last sim verdict — echoed here so the gate and the
   *  strip tell the SAME story (user-test 2026-07-29: nobody deploys past a
   *  red run unseen). */
  simSummary?: { passed: number; failed: number; total: number; mode?: RunMode } | null
  /** Close + open the sims panel. */
  onViewSims?: () => void
}) {
  const rows = React.useMemo(() => (open ? buildRows(draft, simSummary) : []), [open, draft, simSummary])
  const warns = rows.filter((r) => r.state === "warn")
  const allGo = warns.length === 0
  const batch = hasChannel(draft, "batch")
  const ready = batch ? activeCampaigns(draft).filter((c) => !campaignWarn(draft, c)) : []
  const totalContacts = ready.reduce((sum, c) => sum + (c.contacts ?? MOCK_CSV_ROWS), 0)
  const est = stackEstimateFor(draft.stack)
  const stagger = 140

  // The footer verdict lands AFTER the last row ticks — the countdown resolves.
  const settleMs = rows.length * stagger + 250
  const [settled, setSettled] = React.useState(false)
  React.useEffect(() => {
    if (!open) { setSettled(false); return }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setSettled(true); return }
    const t = window.setTimeout(() => setSettled(true), settleMs)
    return () => window.clearTimeout(t)
  }, [open, settleMs])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-muted-foreground" aria-hidden />
            {batch && ready.length > 0
              ? `Pre-flight check · ${ready.length} run${ready.length > 1 ? "s" : ""} · ${totalContacts.toLocaleString()} contacts`
              : "Pre-flight check"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {batch && ready.length > 0
              ? `${draft.name || "Your agent"} will call every contact on the list.`
              : `What ${draft.name || "your agent"} goes live with:`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* The systems check — rows arrive staggered, verdicts tick in
            sequence (key={open} restarts the beat each time). */}
        <ul className="space-y-1.5" key={String(open)}>
          {rows.map((r, i) => (
            <li
              key={r.id}
              className={cn(
                "sx-check-in grid grid-cols-[1rem_6rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md border px-3 py-2",
                r.state === "warn" ? "border-warning/40 bg-warning/5" : "border-border bg-background/50",
              )}
              style={{ animationDelay: `${i * stagger}ms` }}
            >
              <r.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate font-mono text-xs uppercase tracking-wider text-muted-foreground">{r.label}</span>
              <span className="min-w-0 truncate text-sm" title={r.value}>{r.value}</span>
              {r.state === "ok" ? (
                <Check
                  className="sx-tick-pop h-4 w-4 shrink-0 text-success"
                  style={{ animationDelay: `${i * stagger + 120}ms` }}
                  aria-label="Checks out"
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 shrink-0 gap-1 px-1.5 text-xs text-warning hover:text-warning"
                  onClick={() => {
                    onOpenChange(false)
                    if (r.fixAction) r.fixAction()
                    else if (r.fixStep) onFix(r.fixStep)
                  }}
                >
                  <AlertTriangle className="h-3 w-3" aria-hidden /> {r.fixLabel ?? "Fix"} <ArrowRight className="h-3 w-3" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>

        {/* Sim verdict echo — same line the Test strip carries, linked to the
            sims panel. A red run must be visible AT the gate, not only above it. */}
        {onViewSims && (
          <button
            type="button"
            onClick={() => { onOpenChange(false); onViewSims() }}
            className={cn(
              "self-start rounded text-left text-xs underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              simSummary && simSummary.failed > 0
                ? "text-warning hover:text-warning"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {simSummary
              ? `Last run: ${simSummary.passed}/${simSummary.total} passed`
              : "No test runs yet"}
          </button>
        )}

        {/* Batch manifest — the numbers that matter at the moment of spend,
            one line per ready campaign. */}
        {batch && ready.length > 0 && (
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground marker:text-muted-foreground/60">
            {liveInboundNumber && (
              <li>{draft.name || "Your agent"} stops answering {liveInboundNumber} while on Batch calls</li>
            )}
            {ready.map((c) => {
              // Per-run cost projection (user-test 2026-07-28: the only money
              // number anywhere was per-minute — at the moment of dialing a
              // whole list): contacts × ~2 min × tier $/min.
              const contacts = c.contacts ?? MOCK_CSV_ROWS
              return (
                <li key={c.id} className="tabular-nums">
                  {c.name}: {PHONE_NUMBERS.find((n) => n.id === c.numberId)?.number ?? "selected number"} ·{" "}
                  {c.launch?.mode === "scheduled"
                    ? `starts ${c.launch.startDate} ${c.launch.startTime ?? ""} ${c.launch.timezone ? `(${c.launch.timezone})` : ""}`
                    : "starts on deploy"} ·{" "}
                  {c.callWindow === "anytime" ? "anytime" : c.callWindow === "extended" ? "extended hours" : "business hours"} ·
                  up to {c.maxConcurrent ?? 10} at once ·{" "}
                  ≈ ${Math.round(contacts * 2 * est.costPerMin)} ({contacts.toLocaleString()} contacts × ~2 min × ${est.costPerMin.toFixed(2)}/min)
                </li>
              )
            })}
            <li className="tabular-nums">
              {ready.length > 1 && (
                <>About ${Math.round(totalContacts * 2 * est.costPerMin)} in total.{" "}</>
              )}
              <InfoHint label="What is in this estimate?">
                Agora platform minutes at ${est.costPerMin.toFixed(2)} a minute, assuming about two minutes a
                call. Carrier charges from your own SIP trunk are not included. Real spend appears in
                Billing, Usage, as calls complete.
              </InfoHint>
            </li>
            {/* Post-launch orientation (user-test 2026-07-24: the pre-flight
                committed a 500-call batch without saying where to WATCH it) —
                a real link, not a sentence (user-test 2026-07-29 P1). */}
            <li>
              Watch them live in{" "}
              <a href="/calls" className="underline underline-offset-2 hover:text-foreground">
                Monitor › Call History
              </a>{" "}
              once dialing starts
            </li>
          </ul>
        )}

        {/* Verdict — lands after the countdown resolves. */}
        <p
          aria-live="polite"
          className={cn(
            "text-sm transition-opacity duration-300",
            settled ? "opacity-100" : "opacity-0",
            allGo ? "text-success" : "text-warning",
          )}
        >
          {/* Configuration-scoped verdict (user-test 2026-07-24: "All systems
              go" dressed a client-side config check as server verification). */}
          {allGo
            ? "Configuration complete: ready to launch."
            : `${warns.length} check${warns.length > 1 ? "s" : ""} need${warns.length > 1 ? "" : "s"} attention before launch.`}
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => { onOpenChange(false); onTalkFirst() }}>
            Talk to it first
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not yet
          </Button>
          {allGo ? (
            <Button className="sx-rocket-hover gap-1.5" onClick={() => { onOpenChange(false); onConfirm() }}>
              <Rocket className="h-4 w-4" aria-hidden /> {ctaLabel}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="gap-1.5"
              onClick={() => { const first = warns[0]; onOpenChange(false); first?.fixStep && onFix(first.fixStep) }}
            >
              Review fixes <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
