"use client"

import * as React from "react"
import { Check, CalendarClock, PhoneOff, PhoneForwarded } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { RadioCard, RadioCardGroup } from "@/components/wizard/radio-cards"
import { SectionRow } from "@/components/wizard/section-row"
import { AddLinesSheet } from "@/components/concurrency-card"
import { CONCURRENCY, concurrencyStats } from "@/lib/campaign-data"
import { useFutureScope } from "@/lib/future-scope"
import {
  DEFAULT_CALL_BEHAVIOR,
  type CallBehaviorConfig,
  type LaunchConfig,
} from "@/lib/wizard-draft"
import { type StepProps } from "@/components/wizard/types"

/**
 * Call settings — the batch deployment's full run config (Figma "Create New
 * Campaign", node 2593-101785, adopted 2026-07-21): launch timing (now vs
 * scheduled) · dialing (window, concurrency, retries, ring, pacing) · hang-up
 * rules · transfer-to-human. Values live on the DRAFT (config.outbound.launch
 * + draft.callBehavior), never section-local state, so they survive
 * close/reopen and feed the deploy pre-flight manifest.
 *
 * Returns a FRAGMENT of SectionRows ([label | content], owner 2026-07-21) —
 * the host's <SectionRows> owns the container; each group names itself on the
 * LHS, so the RHS is pure controls.
 */
export function CallSettings({ draft, update }: StepProps) {
  if (draft.type !== "outbound") {
    // Explorable, not hidden (builder philosophy): say who this is for
    // instead of vanishing the row for non-batch agents.
    return (
      <SectionRow id="wz-1-callsettings" label="Call settings">
        <p className="text-sm text-muted-foreground">
          These settings apply to Batch calls. Pick <span className="font-medium text-foreground">Batch calls</span> above
          to schedule the launch, dialing, and hang-up rules.
        </p>
      </SectionRow>
    )
  }
  return (
    <>
      <LaunchTiming draft={draft} update={update} />
      <DialingSettings draft={draft} update={update} />
      <HangupSettings draft={draft} update={update} />
      <TransferSettings draft={draft} update={update} />
    </>
  )
}

// ─── Launch timing — now vs scheduled (Figma "Launch Timing") ─────────────────

const TIMEZONES = [
  "US Pacific (PT)", "US Mountain (MT)", "US Central (CT)", "US Eastern (ET)",
  "UTC", "Europe — London", "Europe — Berlin", "India (IST)", "Singapore (SGT)",
]

function LaunchTiming({ draft, update }: StepProps) {
  const out = draft.config.outbound
  const launch: LaunchConfig = out?.launch ?? { mode: "now" }
  const patch = (p: Partial<LaunchConfig>) =>
    update({ config: { ...draft.config, outbound: { ...out, launch: { ...launch, ...p } } } })

  return (
    <SectionRow
      id="wz-1-callsettings"
      label={<span className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden /> Launch timing</span>}
      hint="When the batch starts dialing."
    >
      <RadioCardGroup
        value={launch.mode}
        onValueChange={(v) => v && patch({ mode: v as LaunchConfig["mode"] })}
        aria-label="When the batch starts"
        className="gap-4 @2xl:grid-cols-2"
      >
        <RadioCard value="now" title="Launch on deploy" description="Start calling contacts the moment you deploy" />
        <RadioCard value="scheduled" title="Schedule for later" description="Pick a specific start time" />
      </RadioCardGroup>

      {launch.mode === "scheduled" && (
        <div className="space-y-4">
          {/* Date · time · timezone are one parallel decision row, not a
              sequence — side-by-side (layout rule 2026-06). */}
          <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="lt-date" className="text-xs text-muted-foreground">Start date</Label>
              <Input
                id="lt-date"
                type="date"
                value={launch.startDate ?? ""}
                onChange={(e) => patch({ startDate: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lt-time" className="text-xs text-muted-foreground">Start time</Label>
              <Input
                id="lt-time"
                type="time"
                value={launch.startTime ?? ""}
                onChange={(e) => patch({ startTime: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Timezone</Label>
              <Select value={launch.timezone ?? ""} onValueChange={(timezone) => patch({ timezone })}>
                <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The batch begins at this time; the call window below still bounds each day&apos;s dialing.
          </p>
        </div>
      )}
    </SectionRow>
  )
}

// ─── Dialing — window · concurrency · retries · ring · pacing ─────────────────

// Batch settings — stored on the DRAFT (not section-local state) so they
// survive close/reopen and appear in the rail recap, the deploy review, and
// the config JSON (heuristic-eval finding #7).
function DialingSettings({ draft, update }: StepProps) {
  const out = draft.config.outbound
  const patch = (p: Partial<NonNullable<typeof out>>) =>
    update({ config: { ...draft.config, outbound: { ...out, ...p } } })
  const cb = { ...DEFAULT_CALL_BEHAVIOR, ...draft.callBehavior }
  const patchCb = (p: Partial<CallBehaviorConfig>) => update({ callBehavior: { ...cb, ...p } })

  return (
    <SectionRow label="Dialing" hint="Window, concurrency, retries, and pacing.">
      {/* grid-cols-1 is load-bearing: an implicit column is min-content-sized,
          and the nowrap Select values (e.g. "Business hours (9–5…)") would
          force ~300px and overflow a starved center column. */}
      <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Call window</Label>
          <Select
            value={out?.callWindow ?? "business"}
            onValueChange={(v) => patch({ callWindow: v as "business" | "extended" | "anytime" })}
          >
            <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {/* Whose 9–5 matters on a call campaign — say it (user-test S3). */}
              <SelectItem value="business">Business hours (9–5, contact&apos;s local time)</SelectItem>
              <SelectItem value="extended">Extended (8–8, contact&apos;s local time)</SelectItem>
              <SelectItem value="anytime">Anytime</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Max concurrent</Label>
          <Select
            value={String(out?.maxConcurrent ?? 10)}
            onValueChange={(v) => patch({ maxConcurrent: Number(v) })}
          >
            <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["5", "10", "25", "50"].map((c) => <SelectItem key={c} value={c}>{c} calls</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Retry unanswered</Label>
          <Select
            value={String(out?.retries ?? 1)}
            onValueChange={(v) => patch({ retries: Number(v) })}
          >
            <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Don&apos;t retry</SelectItem>
              <SelectItem value="1">Once</SelectItem>
              <SelectItem value="2">Twice</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dl-ring" className="text-xs text-muted-foreground">Ring duration (seconds)</Label>
          <Input
            id="dl-ring"
            type="number"
            value={cb.ringDurationSec}
            onChange={(e) => patchCb({ ringDurationSec: Number(e.target.value) })}
            className="text-sm font-mono"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dl-interval" className="text-xs text-muted-foreground">Minimum interval between calls (ms)</Label>
        <Input
          id="dl-interval"
          type="number"
          value={cb.minIntervalMs}
          onChange={(e) => patchCb({ minIntervalMs: Number(e.target.value) })}
          className="max-w-[200px] text-sm font-mono"
        />
        <p className="text-xs text-muted-foreground">
          One call every {cb.minIntervalMs || 1000} ms ({(1000 / (cb.minIntervalMs || 1000)).toFixed(1)} call{1000 / (cb.minIntervalMs || 1000) === 1 ? "" : "s"} per second).
        </p>
      </div>
      {/* Capacity comment rides the row that owns max-concurrent. */}
      <OutboundCapacityNote draft={draft} />
    </SectionRow>
  )
}

// ─── Hang-up configuration (Figma "Hang-up Configuration") ────────────────────

function HangupSettings({ draft, update }: StepProps) {
  const cb = { ...DEFAULT_CALL_BEHAVIOR, ...draft.callBehavior }
  const patch = (p: Partial<CallBehaviorConfig>) => update({ callBehavior: { ...cb, ...p } })

  return (
    <SectionRow
      label={<span className="flex items-center gap-2"><PhoneOff className="h-4 w-4 text-muted-foreground" aria-hidden /> Hang-up configuration</span>}
      hint="How and when calls end."
    >
      <BehaviorToggle
        label="End call"
        desc="Gives the agent the ability to end the call with the user."
        checked={cb.endCall}
        onChange={(endCall) => patch({ endCall })}
      />
      <BehaviorToggle
        label="End of conversation"
        desc="Hang up when the conversation concludes naturally."
        checked={cb.endOfConversation}
        onChange={(endOfConversation) => patch({ endOfConversation })}
      />
      <BehaviorToggle
        label="Voicemail detection"
        desc="Detect answering machines and hang up instead of leaving dead air."
        checked={cb.voicemailDetection}
        onChange={(voicemailDetection) => patch({ voicemailDetection })}
      />
      <BehaviorToggle
        label="Silence hangup"
        desc="End the call after a period of silence."
        checked={cb.silenceHangup}
        onChange={(silenceHangup) => patch({ silenceHangup })}
      />
      {cb.silenceHangup && (
        <div className="space-y-1.5">
          <Label htmlFor="hu-silence" className="text-xs text-muted-foreground">Hang-up silence timeout (seconds)</Label>
          <Input
            id="hu-silence"
            type="number"
            value={cb.silenceTimeoutSec}
            onChange={(e) => patch({ silenceTimeoutSec: Number(e.target.value) })}
            className="max-w-[200px] text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Call ends after {cb.silenceTimeoutSec} seconds of no response. Different from the
            turn-taking silence in Voice &amp; speech › Advanced — that one shapes when the agent
            replies; this one ends the call.
          </p>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="hu-max" className="text-xs text-muted-foreground">Max call duration (seconds)</Label>
        <Input
          id="hu-max"
          type="number"
          value={cb.maxDurationSec}
          onChange={(e) => patch({ maxDurationSec: Number(e.target.value) })}
          className="max-w-[200px] text-sm font-mono"
        />
        <p className="text-xs text-muted-foreground">Maximum length for a conversation.</p>
      </div>
    </SectionRow>
  )
}

// ─── Transfer to human (Figma "Transfer Call to Human") ───────────────────────

function TransferSettings({ draft, update }: StepProps) {
  const cb = { ...DEFAULT_CALL_BEHAVIOR, ...draft.callBehavior }
  const patch = (p: Partial<CallBehaviorConfig>) => update({ callBehavior: { ...cb, ...p } })

  return (
    <SectionRow
      label={<span className="flex items-center gap-2"><PhoneForwarded className="h-4 w-4 text-muted-foreground" aria-hidden /> Transfer to human</span>}
      hint="Hand the call to a person when needed."
    >
      <BehaviorToggle
        label="Transfer call to human"
        desc="Transfers to a human agent when needed or asked for."
        checked={cb.transfer}
        onChange={(transfer) => patch({ transfer })}
      />
      {cb.transfer && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="tr-dest" className="text-xs text-muted-foreground">Transfer destination</Label>
            <Input
              id="tr-dest"
              value={cb.transferDest}
              onChange={(e) => patch({ transferDest: e.target.value })}
              placeholder="5550001234, or E.164 +15550001234, or SIP address"
              className="text-sm font-mono"
            />
            <p className="text-xs text-muted-foreground">Detects automatically between Phone, E.164, and SIP.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-criteria" className="text-xs text-muted-foreground">Transfer criteria</Label>
            <Textarea
              id="tr-criteria"
              value={cb.transferCriteria}
              onChange={(e) => patch({ transferCriteria: e.target.value })}
              placeholder="Describe when calls should be transferred to a human…"
              className="min-h-[64px] text-sm"
            />
          </div>
        </>
      )}
    </SectionRow>
  )
}

function BehaviorToggle({
  label, desc, checked, onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" aria-label={label} />
    </div>
  )
}

/** At-the-wall purchase moment (A6, graft from the judge round's variant C):
 *  picking a max-concurrent above the project's line capacity is where the
 *  limit is FELT — so the unlock lives here, inline, not on a billing page
 *  the operator would have to go find. One component owns ALL capacity
 *  communication for batch calls (a split select-suffix + note drifted). */
function OutboundCapacityNote({ draft }: { draft: StepProps["draft"] }) {
  const [purchasedBoost, setPurchasedBoost] = React.useState(0)
  const [linesOpen, setLinesOpen] = React.useState(false)
  const [future] = useFutureScope()
  const stats = concurrencyStats({ ...CONCURRENCY, purchased: CONCURRENCY.purchased + purchasedBoost })
  const chosen = draft.config.outbound?.maxConcurrent ?? 10
  const overBy = Math.max(0, chosen - stats.totalLines)

  // A6 (self-serve concurrency) is future-scope-gated.
  if (!future) return null
  if (overBy === 0 && purchasedBoost === 0) return null

  return (
    <>
      {overBy > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/[0.04] px-3 py-2.5">
          <p className="flex-1 min-w-0 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {chosen} at once is above your {stats.totalLines} concurrent lines.
            </span>{" "}
            Calls beyond {stats.totalLines} queue until a line frees — nothing drops. +{overBy}{" "}
            lines (${overBy * stats.pricePerLineMo}/mo, prorated today) removes the queue.
          </p>
          <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => setLinesOpen(true)}>
            Add lines
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-2.5">
          <Check className="h-4 w-4 shrink-0 text-success" />
          <p className="text-xs text-muted-foreground">
            {stats.totalLines} concurrent lines — your max of {chosen} runs without queuing.
          </p>
        </div>
      )}
      <AddLinesSheet
        open={linesOpen}
        onOpenChange={setLinesOpen}
        purchased={CONCURRENCY.purchased + purchasedBoost}
        queued={0}
        totalLines={stats.totalLines}
        capHeadroomUsd={null}
        onCommit={(qty) => { setPurchasedBoost((b) => Math.max(0, b + qty)); setLinesOpen(false) }}
      />
    </>
  )
}
