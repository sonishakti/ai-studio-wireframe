"use client"

import * as React from "react"
import { Rocket, Check, AlertTriangle, ArrowRight, Waypoints, FileText, AudioLines, Cpu, ClipboardCheck, Users } from "lucide-react"
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  publishBlocks, channelTarget, typeLabel, outboundMissingVars,
  MOCK_CSV_ROWS, DEFAULT_ANALYSIS, type AgentDraft,
} from "@/lib/wizard-draft"
import { stackLine, stackEstimateFor, extractVars, PHONE_NUMBERS } from "@/lib/campaign-data"

/**
 * DeployPreflight — the validation moment (owner 2026-07-24: "when user
 * clicks Deploy we need a summary for the deploy to be validated").
 *
 * EVERY deploy — not just batch — opens a pre-flight: a systems check that
 * verifies the real config row by row, ticking in sequence (the launch-
 * countdown aha). Anything unmet appears IN the checklist as an amber row
 * with its own Fix → jump, so validation isn't a scolding toast — it's the
 * interaction. Batch keeps its full manifest (contacts · window · concurrency
 * · honest cost estimate) inside the same surface, with "Talk to it first"
 * as the safer exit. Confirm arms only what's true: "All systems go" or
 * "Review fixes".
 */

interface CheckRow {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  state: "ok" | "warn"
  /** Journey section that fixes a warn row. */
  fixStep?: number
  fixLabel?: string
}

function buildRows(draft: AgentDraft): CheckRow[] {
  const blocks = publishBlocks(draft)
  const blockFor = (step: number) => blocks.find((b) => b.step === step)
  const rows: CheckRow[] = []

  // 1 · Channel
  const chBlock = blockFor(1)
  rows.push({
    id: "channel", icon: Waypoints, label: "Channel",
    value: chBlock ? chBlock.reason : `${draft.type ? typeLabel(draft.type) : ""} · ${channelTarget(draft)}`,
    state: chBlock ? "warn" : "ok",
    fixStep: chBlock ? 1 : undefined, fixLabel: chBlock?.action,
  })

  // batch · Contacts (its own row — the list is what the deploy DIALS)
  if (draft.type === "outbound") {
    const csv = draft.config.outbound?.csvName
    const missing = csv ? outboundMissingVars(draft) : []
    rows.push({
      id: "contacts", icon: Users, label: "Contacts",
      value: !csv
        ? "Upload a contacts CSV."
        : missing.length
          ? `${missing.length} {{variable}}${missing.length > 1 ? "s" : ""} missing a CSV column`
          : `${MOCK_CSV_ROWS} contacts · ${csv} · variables covered`,
      state: !csv || missing.length ? "warn" : "ok",
      fixStep: !csv ? 1 : missing.length ? 2 : undefined,
      fixLabel: !csv ? "Add contacts" : missing.length ? "Edit prompt" : undefined,
    })
  }

  // 2 · Prompt
  const prBlock = blockFor(2)
  const vars = extractVars(`${draft.systemPrompt} ${draft.greeting}`)
  rows.push({
    id: "prompt", icon: FileText, label: "Prompt",
    value: prBlock
      ? prBlock.reason
      : `${draft.systemPrompt.trim().length.toLocaleString()} chars${vars.length ? ` · ${vars.length} {{variable}}${vars.length > 1 ? "s" : ""}` : ""} · greeting ${draft.greeting.trim() ? "set" : "default"}`,
    state: prBlock ? "warn" : "ok",
    fixStep: prBlock ? 2 : undefined, fixLabel: prBlock?.action,
  })

  // 4 · Voice
  const vBlock = blockFor(4)
  rows.push({
    id: "voice", icon: AudioLines, label: "Voice",
    value: vBlock ? vBlock.reason : `${draft.stack.tts.voice} · ${draft.stack.tts.vendor} · ${draft.stack.language ?? "English"}`,
    state: vBlock ? "warn" : "ok",
    fixStep: vBlock ? 4 : undefined, fixLabel: vBlock?.action,
  })

  // 3 · Models (defaults always validate — the row shows WHAT deploys)
  const est = stackEstimateFor(draft.stack)
  rows.push({
    id: "models", icon: Cpu, label: "Models",
    value: `${stackLine(draft.stack)} · ~${est.latencyMs} ms · ~$${est.costPerMin.toFixed(2)}/min`,
    state: "ok",
  })

  // 7 · Capture
  const an = { ...DEFAULT_ANALYSIS, ...draft.analysis }
  rows.push({
    id: "capture", icon: ClipboardCheck, label: "Capture",
    value: [
      an.transcribe ? "transcripts" : null,
      an.record ? "recording" : null,
      an.successEval ? "success eval" : null,
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
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  draft: AgentDraft
  /** The truthful CTA ("Launch batch calls" / "Redeploy" / "Deploy"). */
  ctaLabel: string
  /** Set when launching a batch takes a live inbound line dark. */
  liveInboundNumber?: string
  onConfirm: () => void
  /** Close + jump to the section that fixes a warn row. */
  onFix: (step: number) => void
  onTalkFirst: () => void
}) {
  const rows = React.useMemo(() => (open ? buildRows(draft) : []), [open, draft])
  const warns = rows.filter((r) => r.state === "warn")
  const allGo = warns.length === 0
  const batch = draft.type === "outbound"
  const est = stackEstimateFor(draft.stack)
  const out = draft.config.outbound
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
            {batch ? `Pre-flight check — ${MOCK_CSV_ROWS} contacts` : "Pre-flight check"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {batch
              ? `Deploying starts the batch — ${draft.name || "your agent"} dials every contact in your list. Checking the configuration first:`
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
                "sx-check-in flex items-center gap-2.5 rounded-md border px-3 py-2",
                r.state === "warn" ? "border-warning/40 bg-warning/5" : "border-border bg-background/50",
              )}
              style={{ animationDelay: `${i * stagger}ms` }}
            >
              <r.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="w-16 shrink-0 font-mono text-xs uppercase tracking-wider text-muted-foreground">{r.label}</span>
              <span className="min-w-0 flex-1 truncate text-sm" title={r.value}>{r.value}</span>
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
                  onClick={() => { onOpenChange(false); r.fixStep && onFix(r.fixStep) }}
                >
                  <AlertTriangle className="h-3 w-3" aria-hidden /> {r.fixLabel ?? "Fix"} <ArrowRight className="h-3 w-3" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>

        {/* Batch manifest — the numbers that matter at the moment of spend. */}
        {batch && (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {liveInboundNumber && (
              <li>· {draft.name || "Your agent"} stops answering {liveInboundNumber} while on Batch calls</li>
            )}
            {out?.launch?.mode === "scheduled" && (
              <li>
                · Starts: {out.launch.startDate ?? "date not set"} {out.launch.startTime ?? ""}{" "}
                {out.launch.timezone ? `(${out.launch.timezone})` : ""}
              </li>
            )}
            <li>
              · Caller ID: {PHONE_NUMBERS.find((n) => n.id === out?.numberId)?.number ?? "selected number"} ·{" "}
              {out?.callWindow === "anytime" ? "anytime" : out?.callWindow === "extended" ? "extended hours" : "business hours (contact's local time)"} ·
              up to {out?.maxConcurrent ?? 10} at once
            </li>
            <li className="tabular-nums">
              · Estimate: ~${Math.round(MOCK_CSV_ROWS * 2 * est.costPerMin)} if every call runs ~2 min at ${est.costPerMin.toFixed(2)}/min — actual cost follows real talk time
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
          {allGo
            ? "All systems go."
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
