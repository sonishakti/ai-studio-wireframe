"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SectionRow } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import { duration, ladderLine, ruleIssues, PENDING_RULES } from "@/lib/call-rules"
import { DEFAULT_CALL_BEHAVIOR, hasChannel, type CallBehaviorConfig } from "@/lib/wizard-draft"
import { PHONE_NUMBERS } from "@/lib/campaign-data"
import type { StepProps } from "@/components/wizard/types"

/**
 * Call rules (design 05).
 *
 * These used to be a column of switches with a number field under some of
 * them: "Silence hangup", "Silence Timeout (seconds)", "Max Call Duration
 * (seconds)". Each one was true on its own and the set said nothing, because
 * what a caller experiences is the ORDER they fire in, and the order was
 * nowhere on screen. Vapi has the same problem one scroll apart; Retell has it
 * across two panels.
 *
 * So each rule is a sentence you can read out loud, and the ladder they add up
 * to sits above them. The pre-flight checks that ladder, because a reminder set
 * after the hang-up is a rule that can never fire, and nothing in the product
 * used to say so.
 */
export function CallRules({ draft, update }: StepProps) {
  const cb: CallBehaviorConfig = { ...DEFAULT_CALL_BEHAVIOR, ...draft.callBehavior }
  const patch = (p: Partial<CallBehaviorConfig>) => update({ callBehavior: { ...cb, ...p } })

  const telephony = hasChannel(draft, "inbound") || hasChannel(draft, "batch")
  const boundNumber = draft.config.inbound?.numberIds?.[0]
  const numberLabel = boundNumber ? PHONE_NUMBERS.find((n) => n.id === boundNumber)?.number ?? null : null
  const issues = ruleIssues(cb, { telephony })

  return (
    <SectionRow
      id="wz-call-rules"
      focusId="call-rules"
      label="Call rules"
      hint="What happens on silence, on voicemail, and when a call runs long."
    >
      {/* The result, before the settings that produce it. */}
      <p className="rounded-md border border-stroke bg-muted/40 px-3 py-2 text-xs">
        <span className="font-medium">On this agent: </span>
        <span className="text-muted-foreground">{ladderLine(cb)}</span>
      </p>

      <div className="space-y-3">
        <Rule
          id="cr-remind"
          on={cb.remind ?? true}
          onToggle={(remind) => patch({ remind })}
        >
          If the caller goes quiet for{" "}
          <Secs id="cr-remind-secs" value={cb.remindAfterSec ?? 8} min={1} max={60} onChange={(remindAfterSec) => patch({ remindAfterSec })} />{" "}
          seconds, say{" "}
          <Line
            id="cr-remind-text"
            value={cb.remindText ?? ""}
            placeholder="Are you still there?"
            onChange={(remindText) => patch({ remindText })}
          />
        </Rule>

        <Rule
          id="cr-silence"
          on={cb.silenceHangup}
          onToggle={(silenceHangup) => patch({ silenceHangup })}
        >
          If nobody speaks for{" "}
          <Secs id="cr-silence-secs" value={cb.silenceTimeoutSec} min={10} max={1800} onChange={(silenceTimeoutSec) => patch({ silenceTimeoutSec })} />{" "}
          seconds, hang up.
        </Rule>

        {/* Owned elsewhere once a number is bound: two editable copies of one
            number is how they drift apart. */}
        {numberLabel ? (
          <p className="flex flex-wrap items-baseline gap-x-1.5 py-1 text-sm">
            <span>Every call stops after <span className="font-medium">{duration(cb.maxDurationSec)}</span>.</span>
            <span className="text-xs text-muted-foreground">
              Set on {numberLabel}.{" "}
              <Link href="/phone-numbers" className="text-foreground underline underline-offset-4">Change it there</Link>
            </span>
          </p>
        ) : (
          <Rule id="cr-cap" on onToggle={null}>
            Every call stops after{" "}
            <Secs id="cr-cap-secs" value={cb.maxDurationSec} min={30} max={10800} onChange={(maxDurationSec) => patch({ maxDurationSec })} />{" "}
            seconds.
          </Rule>
        )}

        <Rule
          id="cr-finish"
          on={cb.finishSpeaking ?? true}
          onToggle={(finishSpeaking) => patch({ finishSpeaking })}
        >
          When the call is stopped, let the agent finish its sentence, for up to{" "}
          <Secs id="cr-finish-secs" value={cb.finishSpeakingSec ?? 30} min={0} max={120} onChange={(finishSpeakingSec) => patch({ finishSpeakingSec })} />{" "}
          seconds.
        </Rule>

        <Rule
          id="cr-conversation"
          on={cb.endOfConversation}
          onToggle={(endOfConversation) => patch({ endOfConversation })}
        >
          Hang up once the conversation has finished.
        </Rule>

        <Rule
          id="cr-endcall"
          on={cb.endCall}
          onToggle={(endCall) => patch({ endCall })}
        >
          Let the agent end the call itself.
        </Rule>

        {telephony && (
          <Rule
            id="cr-voicemail"
            on={cb.voicemailDetection}
            onToggle={(voicemailDetection) => patch({ voicemailDetection })}
          >
            If an answering machine picks up,{" "}
            <Select
              value={cb.voicemailPolicy ?? "hangup"}
              onValueChange={(v) => patch({ voicemailPolicy: v as CallBehaviorConfig["voicemailPolicy"] })}
            >
              <SelectTrigger className="inline-flex h-7 w-auto min-w-0 gap-1 px-2 text-sm" aria-label="What to do on voicemail">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hangup">hang up</SelectItem>
                <SelectItem value="leaveMessage" disabled>leave a message</SelectItem>
              </SelectContent>
            </Select>
            .
          </Rule>
        )}
      </div>

      {/* A rule that cannot fire is a bug you otherwise find on a live call. */}
      {issues.length > 0 && (
        <ul className="space-y-1.5">
          {issues.map((i) => (
            <li
              key={i.id}
              className={cn(
                "flex items-start gap-2 text-xs",
                i.level === "blocker" ? "text-destructive" : "text-warning",
              )}
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>{i.message}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Named, not hidden. Every rival ships both of these, and pretending
          otherwise is worse than an empty row that says why. */}
      <div className="space-y-1.5 border-t border-border pt-3">
        {PENDING_RULES.map((p) => (
          <p key={p.id} className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">{p.label}</span>
            <span>Needs engine support.</span>
            <InfoHint label="Why">{p.why}</InfoHint>
          </p>
        ))}
      </div>
    </SectionRow>
  )
}

/** One rule: a switch, then a sentence with its numbers inside it. */
function Rule({
  id, on, onToggle, children,
}: {
  id: string
  on: boolean
  /** Null for a rule that is always in force, like the hard stop. */
  onToggle: ((v: boolean) => void) | null
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      {onToggle ? (
        <Switch id={id} checked={on} onCheckedChange={onToggle} className="mt-0.5 shrink-0" aria-label="Rule on" />
      ) : (
        <span className="mt-0.5 w-9 shrink-0" aria-hidden />
      )}
      <p className={cn("flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-1.5 text-sm", !on && "opacity-50")}>
        {children}
      </p>
    </div>
  )
}

/** A number that lives inside a sentence, so the sentence stays readable. */
function Secs({
  id, value, min, max, onChange,
}: {
  id: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
}) {
  return (
    <Input
      id={id}
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
      className="inline-block h-7 w-16 px-2 py-0 text-center font-mono text-sm"
      aria-label="Seconds"
    />
  )
}

/** What the agent says, in the sentence that decides when it says it. */
function Line({
  id, value, placeholder, onChange,
}: {
  id: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <span className="inline-flex min-w-0 items-baseline gap-0.5">
      <span aria-hidden>&ldquo;</span>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="inline-block h-7 w-48 px-2 py-0 text-sm italic"
        aria-label="What the agent says"
      />
      <span aria-hidden>&rdquo;</span>
    </span>
  )
}
