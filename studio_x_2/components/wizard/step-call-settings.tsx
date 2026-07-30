"use client"

import * as React from "react"
import { PhoneOff, PhoneForwarded, Timer } from "lucide-react"
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
import { InfoHint } from "@/components/wizard/info-hint"
import { AddLinesSheet } from "@/components/concurrency-card"
import { CONCURRENCY, concurrencyStats } from "@/lib/campaign-data"
import {
  DEFAULT_CALL_BEHAVIOR,
  type CallBehaviorConfig,
  type CampaignDraft,
  type LaunchConfig,
} from "@/lib/wizard-draft"
import { type StepProps } from "@/components/wizard/types"

/**
 * Call settings (v4 IA, 2026-07-28) — split two ways:
 *   • PER-CAMPAIGN (Go Live › campaign editor): launch timing + dialing
 *     window/concurrency/retries — `CampaignLaunchFields` / `CampaignDialingFields`
 *     take `(campaign, onChange)` since a batch agent runs SEVERAL campaigns.
 *   • AGENT-LEVEL (`draft.callBehavior`): hang-up rules, ring/pacing, and
 *     transfer-to-human — `HangupSettings` / `PacingSettings` /
 *     `TransferSettings` render in the Go Live "Batch call behavior" sheet;
 *     `InboundCallSettings` renders inline in Go Live for inbound agents.
 */

// ─── Inbound — how answered calls end (inline in Go Live) ─────────────────────

export function InboundCallSettings({ draft, update }: StepProps) {
  const cb = { ...DEFAULT_CALL_BEHAVIOR, ...draft.callBehavior }
  const patch = (p: Partial<CallBehaviorConfig>) => update({ callBehavior: { ...cb, ...p } })

  return (
    <>
      <SectionRow id="wz-4-inbound" label="Inbound call settings" hint="How answered calls end.">
        <BehaviorToggle
          label="End of conversation"
          desc="Hang up when the conversation naturally ends."
          checked={cb.endOfConversation}
          onChange={(endOfConversation) => patch({ endOfConversation })}
        />
        <BehaviorToggle
          label="Voicemail detection"
          desc="Allows the agent to detect voicemail systems and hang up the call."
          checked={cb.voicemailDetection}
          onChange={(voicemailDetection) => patch({ voicemailDetection })}
        />
        <div className="space-y-1.5">
          <Label htmlFor="ib-max" className="text-sm font-medium">Max call duration (seconds)</Label>
          <Input
            id="ib-max"
            type="number"
            value={cb.maxDurationSec}
            onChange={(e) => patch({ maxDurationSec: Number(e.target.value) })}
            className="max-w-[200px] text-sm font-mono"
          />
        </div>
        <BehaviorToggle
          label="Silence hangup"
          desc="End the call after a period of silence."
          checked={cb.silenceHangup}
          onChange={(silenceHangup) => patch({ silenceHangup })}
        />
        {cb.silenceHangup && (
          <div className="space-y-1.5">
            <Label htmlFor="ib-silence" className="text-sm font-medium">Silence timeout (seconds)</Label>
            <Input
              id="ib-silence"
              type="number"
              value={cb.silenceTimeoutSec}
              onChange={(e) => patch({ silenceTimeoutSec: Number(e.target.value) })}
              className="max-w-[200px] text-sm font-mono"
            />
            <p className="text-xs text-muted-foreground">Call ends after {cb.silenceTimeoutSec}s of no response.</p>
          </div>
        )}
      </SectionRow>
      <TransferSettings draft={draft} update={update} />
    </>
  )
}

// ─── Per-campaign: launch timing (now vs scheduled) ───────────────────────────

const TIMEZONES = [
  "US Pacific (PT)", "US Mountain (MT)", "US Central (CT)", "US Eastern (ET)",
  "UTC", "Europe — London", "Europe — Berlin", "India (IST)", "Singapore (SGT)",
]

export function CampaignLaunchFields({
  campaign, onChange,
}: {
  campaign: CampaignDraft
  onChange: (patch: Partial<CampaignDraft>) => void
}) {
  const launch: LaunchConfig = campaign.launch ?? { mode: "now" }
  const patch = (p: Partial<LaunchConfig>) => onChange({ launch: { ...launch, ...p } })

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Launch timing</Label>
      <RadioCardGroup
        value={launch.mode}
        onValueChange={(v) => v && patch({ mode: v as LaunchConfig["mode"] })}
        aria-label="When the campaign starts"
        className="gap-3 @lg:grid-cols-2"
      >
        <RadioCard value="now" title="Launch on deploy" />
        <RadioCard value="scheduled" title="Schedule for later" />
      </RadioCardGroup>

      {launch.mode === "scheduled" && (
        <div className="space-y-3">
          {/* Date · time · timezone are one parallel decision row — side-by-side. */}
          <div className="grid grid-cols-1 gap-3 @lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor={`lt-date-${campaign.id}`} className="text-sm font-medium">Start date</Label>
              <Input
                id={`lt-date-${campaign.id}`}
                type="date"
                value={launch.startDate ?? ""}
                onChange={(e) => patch({ startDate: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`lt-time-${campaign.id}`} className="text-sm font-medium">Start time</Label>
              <Input
                id={`lt-time-${campaign.id}`}
                type="time"
                value={launch.startTime ?? ""}
                onChange={(e) => patch({ startTime: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Timezone</Label>
              <Select value={launch.timezone ?? ""} onValueChange={(timezone) => patch({ timezone })}>
                <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <InfoHint label="How scheduling meets the call window">
            The campaign begins at this time; the call window still bounds each day&apos;s dialing.
          </InfoHint>
        </div>
      )}
    </div>
  )
}

// ─── Per-campaign: dialing window · concurrency · retries ─────────────────────

export function CampaignDialingFields({
  campaign, onChange, disabled,
}: {
  campaign: CampaignDraft
  onChange: (patch: Partial<CampaignDraft>) => void
  /** Locked rerun: real `disabled` on every control — a pointer-events wrapper
   *  alone leaves them keyboard-editable (review 2026-07-28). */
  disabled?: boolean
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Dialing</Label>
      <div className="grid grid-cols-1 gap-3 @lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Call window</Label>
          <Select
            disabled={disabled}
            value={campaign.callWindow ?? "business"}
            onValueChange={(v) => onChange({ callWindow: v as CampaignDraft["callWindow"] })}
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
          {/* Free entry (user-test 2026-07-28 P1): any count works — 40 is a
              real answer, not a menu miss. The capacity note below explains
              queueing when it lands above the account's lines. */}
          <Label htmlFor={`dl-max-${campaign.id}`} className="text-xs text-muted-foreground">Max concurrent</Label>
          <Input
            id={`dl-max-${campaign.id}`}
            type="number"
            min={1}
            disabled={disabled}
            value={campaign.maxConcurrent ?? 10}
            onChange={(e) => onChange({ maxConcurrent: Math.max(1, Number(e.target.value) || 1) })}
            className="text-sm font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Retry unanswered</Label>
          <Select
            disabled={disabled}
            value={String(campaign.retries ?? 1)}
            onValueChange={(v) => onChange({ retries: Number(v) })}
          >
            <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Don&apos;t retry</SelectItem>
              <SelectItem value="1">Once</SelectItem>
              <SelectItem value="2">Twice</SelectItem>
            </SelectContent>
          </Select>
          {/* One composite decision — "Once, after 30 min". */}
          {(campaign.retries ?? 1) > 0 && (
            <Select
              disabled={disabled}
              value={String(campaign.retryIntervalMin ?? 30)}
              onValueChange={(v) => onChange({ retryIntervalMin: Number(v) })}
            >
              <SelectTrigger className="w-full text-sm" aria-label="Retry interval"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">after 15 min</SelectItem>
                <SelectItem value="30">after 30 min</SelectItem>
                <SelectItem value="60">after 1 hour</SelectItem>
                <SelectItem value="240">after 4 hours</SelectItem>
                <SelectItem value="1440">next day</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <CampaignCapacityNote maxConcurrent={campaign.maxConcurrent ?? 10} />
    </div>
  )
}

// ─── Agent-level: hang-up · pacing · transfer (the batch-behavior sheet) ──────

export function HangupSettings({ draft, update }: StepProps) {
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
          <Label htmlFor="hu-silence" className="text-sm font-medium">Hang-up silence timeout (seconds)</Label>
          <Input
            id="hu-silence"
            type="number"
            value={cb.silenceTimeoutSec}
            onChange={(e) => patch({ silenceTimeoutSec: Number(e.target.value) })}
            className="max-w-[200px] text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Call ends after {cb.silenceTimeoutSec} seconds of no response.{" "}
            <InfoHint label="Two silence settings?">
              Different from the turn-taking silence in Voice & Models › Advanced — that one shapes
              when the agent replies; this one ends the call.
            </InfoHint>
          </p>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="hu-max" className="text-sm font-medium">Max call duration (seconds)</Label>
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

/** Ring + pacing — agent-level batch dialing rhythm (applies to every
 *  campaign; per-campaign concurrency lives in the campaign editor). */
export function PacingSettings({ draft, update }: StepProps) {
  const cb = { ...DEFAULT_CALL_BEHAVIOR, ...draft.callBehavior }
  const patch = (p: Partial<CallBehaviorConfig>) => update({ callBehavior: { ...cb, ...p } })

  return (
    <SectionRow
      label={<span className="flex items-center gap-2"><Timer className="h-4 w-4 text-muted-foreground" aria-hidden /> Ring &amp; pacing</span>}
      hint="Applies to every campaign this agent runs."
    >
      <div className="space-y-1.5">
        <Label htmlFor="pc-ring" className="text-sm font-medium">Ring duration (seconds)</Label>
        <Input
          id="pc-ring"
          type="number"
          value={cb.ringDurationSec}
          onChange={(e) => patch({ ringDurationSec: Number(e.target.value) })}
          className="max-w-[200px] text-sm font-mono"
        />
        <p className="text-xs text-muted-foreground">Give up dialing after this long ringing.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pc-interval" className="text-sm font-medium">Minimum interval between calls (ms)</Label>
        <Input
          id="pc-interval"
          type="number"
          value={cb.minIntervalMs}
          onChange={(e) => patch({ minIntervalMs: Number(e.target.value) })}
          className="max-w-[200px] text-sm font-mono"
        />
        <p className="text-xs text-muted-foreground">
          One call every {cb.minIntervalMs || 1000} ms ({(1000 / (cb.minIntervalMs || 1000)).toFixed(1)} call{1000 / (cb.minIntervalMs || 1000) === 1 ? "" : "s"} per second).
        </p>
      </div>
    </SectionRow>
  )
}

// ─── Transfer to human (Figma "Transfer Call to Human") ───────────────────────

export function TransferSettings({ draft, update }: StepProps) {
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
            <Label htmlFor="tr-dest" className="text-sm font-medium">Transfer destination</Label>
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
            <Label htmlFor="tr-criteria" className="text-sm font-medium">Transfer criteria</Label>
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

/** At-the-wall purchase moment (A6): picking a max-concurrent above the
 *  project's line capacity is where the limit is FELT — so the unlock lives
 *  here, inline, per campaign. UN-GATED (user-test 2026-07-28 P1): the
 *  line-capacity/queueing note always rides beside the free-entry input —
 *  a typed 40 must never queue silently. */
function CampaignCapacityNote({ maxConcurrent }: { maxConcurrent: number }) {
  const [purchasedBoost, setPurchasedBoost] = React.useState(0)
  const [linesOpen, setLinesOpen] = React.useState(false)
  const stats = concurrencyStats({ ...CONCURRENCY, purchased: CONCURRENCY.purchased + purchasedBoost })
  const overBy = Math.max(0, maxConcurrent - stats.totalLines)

  return (
    <>
      {overBy > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/[0.04] px-3 py-2.5">
          <p className="flex-1 min-w-0 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {maxConcurrent} at once is above your {stats.totalLines} concurrent lines.
            </span>{" "}
            Calls beyond {stats.totalLines} queue until a line frees — nothing drops. +{overBy}{" "}
            lines (${overBy * stats.pricePerLineMo}/mo, prorated today) removes the queue.
          </p>
          <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => setLinesOpen(true)}>
            Add lines
          </Button>
        </div>
      ) : null}
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
