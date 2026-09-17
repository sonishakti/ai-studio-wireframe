"use client"

import * as React from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SectionRow, SectionRows } from "@/components/wizard/section-row"
import { CATEGORIES } from "@/lib/notifications-data"
import {
  METRIC_DEFS, formatMetric, priorWindowValue, windowValue,
  type MetricKey, type MonitorSummary,
} from "@/lib/monitor-metrics"
import {
  COMPARISONS, WATCH_LIMIT, WINDOW_HOURS, WINDOW_PHRASE,
  describeWatch, listWatches, removeWatch, saveWatch,
  type Watch, type WatchBasis, type WatchComparison, type WatchFrequency,
} from "@/lib/monitor-watches"

/**
 * MetricWatchSheet — the rule form (design 13, direction B).
 *
 * The threshold is a property of a number, so it is set where the number is
 * read: the tile carries the control, this sheet carries the rule. It is the
 * spend cap's anatomy re-pointed at a metric — a threshold, presets, a recap
 * line that reads back what you set, and an all-clear promised up front — laid
 * out with SectionRows/SectionRow, so the label column carries the question and
 * the control column carries only controls.
 *
 * The cap's WALL does not travel. A spend cap enforces something: it pauses new
 * calls, so it owes you a warning "before anything pauses" and an "At the cap"
 * block. A metric watch enforces nothing. It tells you, and it tells you again
 * when the number recovers. Promising a consequence it cannot deliver would be
 * the same lie this design exists to remove.
 *
 * Delivery stays where delivery lives: the channels are Project notifications'
 * "Monitor watches" row, read here and linked back to. Two doors onto one
 * setting would break the standing rule.
 *
 * Why not extend the sibling: SpendControlsSheet is a non-exported function
 * inside components/usage-spend-card.tsx, bound to PLAN_USAGE and cap
 * semantics, and cannot be imported.
 */

// ─── Words ────────────────────────────────────────────────────────────────────

const CONDITION_LABEL: Record<WatchComparison, string> = {
  below: "Drops below",
  above: "Rises above",
  no_calls: "No calls at all",
}

const BASIS_LABEL: Record<WatchBasis, string> = {
  value: "A number I set",
  previous: "The period before",
}

const FREQUENCY_LABEL: Record<WatchFrequency, string> = {
  "15m_1h": "Every 15 minutes, over the last hour",
  "1h_24h": "Every hour, over the last 24 hours",
  "1d_7d": "Every day, over the last 7 days",
}

/** The two halves of a frequency, for the recap sentence. */
const CADENCE: Record<WatchFrequency, string> = {
  "15m_1h": "every 15 minutes",
  "1h_24h": "every hour",
  "1d_7d": "every day",
}

/** What the threshold field holds, so the number and its unit never disagree. */
const THRESHOLD_UNIT: Record<MetricKey, string> = {
  total_calls: "calls",
  answered_calls: "calls",
  answer_rate: "percent",
  handle_time: "seconds",
}

const CHANNEL_WORD: { key: "email" | "inApp" | "slack" | "webhook"; word: string }[] = [
  { key: "email", word: "email" },
  { key: "inApp", word: "in-app" },
  { key: "slack", word: "Slack" },
  { key: "webhook", word: "webhook" },
]

const NOTIFICATIONS_HREF = "/project/notifications"

/** Chips, not fills: the selected preset is ink-tinted (owner rule, standing),
 *  the same string the spend cap's two preset rows carry. */
const CHIP = "h-7 px-3 text-xs font-medium data-[state=on]:bg-primary/10 data-[state=on]:text-primary"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mintId = () => `wt_${Date.now().toString(36)}`

/** Round a suggested threshold to a number a person would have typed. */
function nice(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0
  if (n >= 1000) return Math.round(n / 100) * 100
  if (n >= 100) return Math.round(n / 10) * 10
  return Math.max(1, Math.round(n))
}

/** Three starting points for the threshold. A rate and a handle time have
 *  absolute lines worth offering; a count only has the traffic it is running
 *  at, so its presets are cut from the live number. */
function presetsFor(key: MetricKey, live: number | null): number[] {
  if (key === "answer_rate") return [70, 80, 90]
  if (key === "handle_time") return [180, 240, 300]
  if (live === null || live <= 0) return [10, 50, 100]
  return [nice(live * 0.5), nice(live * 0.75), nice(live)].filter((v, i, a) => v > 0 && a.indexOf(v) === i)
}

/** "Email and in-app" — the channels that are on, in the order the delivery
 *  table lists them. */
function channelPhrase(): string {
  const row = CATEGORIES.find((c) => c.id === "watches")
  if (!row) return ""
  const on = CHANNEL_WORD.filter((c) => row[c.key]).map((c) => c.word)
  if (on.length === 0) return ""
  const joined =
    on.length === 1 ? on[0] : `${on.slice(0, -1).join(", ")} and ${on[on.length - 1]}`
  return joined.charAt(0).toUpperCase() + joined.slice(1)
}

function emailIsOn(): boolean {
  return CATEGORIES.find((c) => c.id === "watches")?.email === true
}

// ─── The sheet ────────────────────────────────────────────────────────────────

export function MetricWatchSheet({
  open,
  onOpenChange,
  metricKey,
  deploymentId,
  summary,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  metricKey: MetricKey
  /** Preselected scope: whatever the Monitor deployment filter names, or null
   *  when it is set to all deployments. */
  deploymentId: string | null
  summary: MonitorSummary
  onSaved?: () => void
}) {
  const def = METRIC_DEFS[metricKey]
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-base">Watch {def.label.toLowerCase()}</SheetTitle>
          <SheetDescription>
            You get a message when this number crosses your line, and one more when it
            recovers.
          </SheetDescription>
        </SheetHeader>

        {/* The form is its own component, keyed by what it is a form FOR: the
            sheet's body only exists while the sheet is open, so every open
            mounts it fresh and it seeds from the stored watch in its state
            initialisers. No effect, and no render-time read on the server,
            because nothing here renders until the control is pressed. */}
        <WatchForm
          key={`${metricKey}:${deploymentId ?? ""}`}
          metricKey={metricKey}
          deploymentId={deploymentId}
          summary={summary}
          onDone={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </SheetContent>
    </Sheet>
  )
}

function WatchForm({
  metricKey,
  deploymentId,
  summary,
  onDone,
  onSaved,
}: {
  metricKey: MetricKey
  deploymentId: string | null
  summary: MonitorSummary
  onDone: () => void
  onSaved?: () => void
}) {
  const def = METRIC_DEFS[metricKey]
  const conditions = COMPARISONS[metricKey]

  const [saved] = React.useState<Watch[]>(listWatches)
  const seedScope = deploymentId ?? ""
  const seed = seedScope
    ? saved.find((w) => w.metricKey === metricKey && w.deploymentId === seedScope)
    : undefined

  const [scope, setScope] = React.useState(seedScope)
  const [comparison, setComparison] = React.useState<WatchComparison>(seed?.comparison ?? conditions[0])
  const [basis, setBasis] = React.useState<WatchBasis>(seed?.basis ?? "value")
  const [frequency, setFrequency] = React.useState<WatchFrequency>(seed?.frequency ?? "1h_24h")
  const [threshold, setThreshold] = React.useState(() => {
    if (seed) return String(seed.threshold)
    const live = seedScope ? windowValue(seedScope, metricKey, WINDOW_HOURS["1h_24h"]) : null
    return String(presetsFor(metricKey, live)[1] ?? 0)
  })
  const [scopeError, setScopeError] = React.useState(false)

  // Only deployments this number can be read on: the answer rate is an outbound
  // aggregate, so an inbound scope would be a watch that can never fire.
  const scopeOptions = def.outboundOnly
    ? summary.deployments.filter((d) => d.kind === "batch")
    : summary.deployments

  // Derived, never held in state: one watch per number per deployment, so
  // changing the scope inside the sheet finds the rule already on that
  // deployment and Save edits it rather than minting a second one beside it.
  const existing = scope
    ? saved.find((w) => w.metricKey === metricKey && w.deploymentId === scope)
    : undefined

  const hours = WINDOW_HOURS[frequency]
  const live = scope ? windowValue(scope, metricKey, hours) : null
  // A missing earlier window is a real state: the evaluator refuses to compare
  // against it rather than reading it as a zero, and the row says so.
  const noPrior = !!scope && priorWindowValue(scope, metricKey, hours) === null
  const presets = presetsFor(metricKey, live)
  const thresholdNum = Number(threshold || 0)
  const atCap = !existing && saved.length >= WATCH_LIMIT
  const needsThreshold = comparison !== "no_calls" && basis === "value"

  const draft: Watch = {
    id: existing?.id ?? "draft",
    metricKey,
    deploymentId: scope,
    comparison,
    basis,
    threshold: thresholdNum,
    frequency,
  }

  const handleSave = () => {
    if (!scope) { setScopeError(true); return }
    if (atCap) return
    saveWatch({ ...draft, id: existing?.id ?? mintId() })
    onSaved?.()
    onDone()
  }

  const handleRemove = () => {
    if (!existing) return
    removeWatch(existing.id)
    onSaved?.()
    onDone()
  }

  const channels = channelPhrase()
  // The held-back count only exists on a watch that is firing, and a firing
  // watch always carries the time of its last message.
  const heldBack = existing?.lastState === "open" ? (existing.suppressed ?? 0) : 0
  const heldBackSince = existing?.lastNotifiedAt

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <SectionRows>
          <SectionRow
            label="Condition"
            className="pt-5 pb-5 first:pt-0 last:pb-0"
            hint={
              live !== null ? `Now ${formatMetric(metricKey, live)} ${WINDOW_PHRASE[frequency]}.` : undefined
            }
          >
            <ToggleGroup
              type="single"
              value={comparison}
              onValueChange={(v) => { if (v) setComparison(v as WatchComparison) }}
              variant="outline"
              aria-label="Condition"
            >
              {conditions.map((c) => (
                <ToggleGroupItem key={c} value={c} className={CHIP}>
                  {CONDITION_LABEL[c]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {needsThreshold ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    inputMode="numeric"
                    className="h-8 w-28 text-sm tabular-nums"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value.replace(/[^\d]/g, ""))}
                    aria-label={`${def.label} threshold in ${THRESHOLD_UNIT[metricKey]}`}
                  />
                  <span className="text-xs text-muted-foreground">{THRESHOLD_UNIT[metricKey]}</span>
                </div>
                <ToggleGroup
                  type="single"
                  value={presets.includes(thresholdNum) ? String(thresholdNum) : ""}
                  onValueChange={(v) => { if (v) setThreshold(v) }}
                  variant="outline"
                  aria-label="Threshold presets"
                >
                  {presets.map((p) => (
                    <ToggleGroupItem key={p} value={String(p)} className={`${CHIP} tabular-nums`}>
                      {formatMetric(metricKey, p)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            ) : null}
          </SectionRow>

          {comparison !== "no_calls" ? (
            <SectionRow
              label="Compare with"
              className="pt-5 pb-5 first:pt-0 last:pb-0"
              hint={noPrior ? "This deployment has no earlier period yet." : undefined}
            >
              <ToggleGroup
                type="single"
                value={basis}
                onValueChange={(v) => { if (v) setBasis(v as WatchBasis) }}
                variant="outline"
                aria-label="Compare with"
              >
                {(["value", "previous"] as WatchBasis[]).map((b) => (
                  <ToggleGroupItem key={b} value={b} className={CHIP}>
                    {BASIS_LABEL[b]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </SectionRow>
          ) : null}

          <SectionRow label="Frequency" className="pt-5 pb-5 first:pt-0 last:pb-0">
            <Select value={frequency} onValueChange={(v) => setFrequency(v as WatchFrequency)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FREQUENCY_LABEL) as WatchFrequency[]).map((f) => (
                  <SelectItem key={f} value={f}>{FREQUENCY_LABEL[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SectionRow>

          <SectionRow label="Scope" className="pt-5 pb-5 first:pt-0 last:pb-0">
            <Select
              value={scope}
              onValueChange={(v) => { setScope(v); setScopeError(false) }}
            >
              <SelectTrigger className="w-full" aria-invalid={scopeError || undefined}>
                <SelectValue placeholder="Pick a deployment" />
              </SelectTrigger>
              <SelectContent>
                {scopeOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {scopeError ? (
              <p role="alert" className="text-xs text-destructive">
                Pick the deployment this watch covers.
              </p>
            ) : null}
          </SectionRow>

          <SectionRow label="Sent to" className="pt-5 pb-5 first:pt-0 last:pb-0">
            {channels ? (
              <p className="text-sm">
                {channels} ·{" "}
                <Link href={NOTIFICATIONS_HREF} className="text-primary underline-offset-2 hover:underline">
                  Change in Project notifications
                </Link>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No channel is on yet.{" "}
                <Link href={NOTIFICATIONS_HREF} className="text-primary underline-offset-2 hover:underline">
                  Turn one on in Project notifications.
                </Link>
              </p>
            )}
          </SectionRow>

          <SectionRow
            label="Delivery record"
            className="pt-5 pb-5 first:pt-0 last:pb-0"
            hint="Agora reports no receipt when a message is delivered."
          >
            <p className="text-sm text-muted-foreground">Requires Engine</p>
          </SectionRow>

          {heldBack > 0 && heldBackSince ? (
            <SectionRow label="Held back" className="pt-5 pb-5 first:pt-0 last:pb-0">
              <p className="text-sm text-muted-foreground">
                {heldBack} more {heldBack === 1 ? "breach" : "breaches"} since{" "}
                {new Date(heldBackSince).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                . You get one message a day for each watch.
              </p>
            </SectionRow>
          ) : null}
        </SectionRows>

        {/* The recap: what you just set, read back in the order it happens. */}
        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {recap(draft, def.label, emailIsOn())}
          </p>
        </div>

        {atCap ? (
          <p role="alert" className="mt-3 text-xs text-warning">
            You have {WATCH_LIMIT} watches. Remove one to add another.
          </p>
        ) : null}
      </div>

      <SheetFooter className="shrink-0 border-t border-border px-5 py-3">
        {existing ? (
          <Button variant="outline" onClick={handleRemove}>Remove watch</Button>
        ) : null}
        <Button onClick={handleSave} disabled={atCap}>Save watch</Button>
      </SheetFooter>
    </>
  )
}

/** One sentence for the whole rule, built from the same `describeWatch` the
 *  tile's chip reads, so the sheet and the tile cannot drift. */
function recap(w: Watch, label: string, email: boolean): string {
  const metric = label.toLowerCase()
  const message = email ? "an email" : "a message"
  const verb = w.comparison === "no_calls" ? "records" : w.comparison === "below" ? "drops" : "rises"
  const recovery =
    w.comparison === "no_calls"
      ? "calls come back"
      : w.comparison === "below"
        ? "it is back above"
        : "it is back below"
  const condition = describeWatch(w)
  // A previous-period rule already names its window in the condition, so the
  // sentence does not say it twice.
  const span = w.basis === "previous" && w.comparison !== "no_calls" ? "" : ` ${WINDOW_PHRASE[w.frequency]}`
  return `We check ${metric} ${CADENCE[w.frequency]}. You get ${message} when it ${verb} ${condition}${span}, and one more when ${recovery}.`
}

/**
 * WatchButton — one control with two states: "Watch" when this number has no
 * watch on it, and the condition itself once it does. Both open the same sheet,
 * so there is one door per action.
 */
export function WatchButton({
  watch,
  focusId,
  onClick,
}: {
  watch?: Watch
  /** `data-design-focus` id — a review link (`?focus=<id>`) opens here. */
  focusId?: string
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={onClick}
      data-design-focus={focusId}
      className="ml-auto text-xs font-normal text-muted-foreground hover:text-foreground"
    >
      {watch ? `Watch · ${describeWatch(watch)}` : "Watch"}
    </Button>
  )
}
