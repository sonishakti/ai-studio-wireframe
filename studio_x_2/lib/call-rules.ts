/**
 * Call rules — what happens on silence, on voicemail, and when a call runs
 * long (design 05).
 *
 * Every competitor keeps these together on the agent and writes them as
 * settings: Retell's Call Settings, Vapi's Call Timeout Settings, Bland's
 * `max_duration`. What none of them does is show the RESULT. Vapi has an idle
 * timeout on one screen and a silence timeout further down the same screen,
 * and nothing tells you that setting the first above the second means the
 * reminder never fires at all.
 *
 * So the rules read as sentences, and the ladder they add up to is one line
 * above them. The ladder is also the thing the pre-flight checks, because a
 * rule that can never fire is a bug you only find on a real call.
 */

import type { CallBehaviorConfig } from "@/lib/wizard-draft"

// ─── the ladder ──────────────────────────────────────────────────────────────

export interface Rung {
  at: number
  label: string
}

/** Remind, then hang up, then stop. In that order, or it is broken. */
export function ladder(cb: CallBehaviorConfig): Rung[] {
  const out: Rung[] = []
  if (cb.remind) out.push({ at: cb.remindAfterSec ?? 8, label: "speak up" })
  if (cb.silenceHangup) out.push({ at: cb.silenceTimeoutSec, label: "hang up on silence" })
  out.push({ at: cb.maxDurationSec, label: "hard stop" })
  return out
}

/** "Speaks up at 8s · hangs up at 2 min · hard stop at 5 min" */
export function ladderLine(cb: CallBehaviorConfig): string {
  return ladder(cb).map((r) => `${r.label} at ${duration(r.at)}`).join(" · ")
}

export function duration(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.round((sec / 60) * 10) / 10
  return `${m % 1 === 0 ? m : m.toFixed(1)} min`
}

// ─── what is wrong with it ───────────────────────────────────────────────────

export interface RuleIssue {
  id: string
  /** A blocker stops the deploy. A warning is worth knowing and nothing more. */
  level: "blocker" | "warning"
  /** Written as the consequence, not as the rule. */
  message: string
  /** The control to open. */
  anchor: string
}

export function ruleIssues(cb: CallBehaviorConfig, opts: { telephony: boolean }): RuleIssue[] {
  const out: RuleIssue[] = []
  const remindAt = cb.remindAfterSec ?? 8

  if (cb.remind && cb.silenceHangup && remindAt >= cb.silenceTimeoutSec) {
    out.push({
      id: "reminder-after-hangup",
      level: "blocker",
      message: `The call hangs up at ${duration(cb.silenceTimeoutSec)}, so the reminder at ${duration(remindAt)} never plays.`,
      anchor: "cr-remind",
    })
  }
  if (cb.silenceHangup && cb.silenceTimeoutSec >= cb.maxDurationSec) {
    out.push({
      id: "silence-after-cap",
      level: "blocker",
      message: `Every call stops at ${duration(cb.maxDurationSec)}, so the silence hang-up at ${duration(cb.silenceTimeoutSec)} never runs.`,
      anchor: "cr-silence",
    })
  }
  if (cb.remind && !(cb.remindText ?? "").trim()) {
    out.push({
      id: "reminder-empty",
      level: "blocker",
      message: "The agent has nothing to say when the caller goes quiet.",
      anchor: "cr-remind-text",
    })
  }
  if (cb.maxDurationSec > 3600) {
    out.push({
      id: "cap-long",
      level: "warning",
      message: `A caller who walks away is billed for up to ${duration(cb.maxDurationSec)}.`,
      anchor: "cr-cap",
    })
  }
  if (!telephonyRulesApply(opts.telephony) && cb.voicemailDetection) {
    out.push({
      id: "voicemail-no-phone",
      level: "warning",
      message: "Voicemail only happens on a phone call, and this agent has no number.",
      anchor: "cr-voicemail",
    })
  }
  if (cb.finishSpeaking && (cb.finishSpeakingSec ?? 30) > 60) {
    out.push({
      id: "farewell-long",
      level: "warning",
      message: "Stopping the agent waits up to a minute before the line drops.",
      anchor: "cr-finish",
    })
  }
  return out
}

const telephonyRulesApply = (t: boolean) => t

// ─── the rules that have no engine field yet ─────────────────────────────────

/**
 * Both are real product gaps, not oversights, and both are things every rival
 * ships: Retell and Bland can leave a voicemail message, and Vapi, Retell and
 * ElevenLabs all take keypad input. They appear as choices you cannot pick so
 * the roadmap is legible without pretending the feature is here.
 */
export const PENDING_RULES = [
  {
    id: "leave-message",
    label: "Leave a message on voicemail",
    why: "The engine can detect voicemail and hang up. Speaking after the beep needs an engine change.",
  },
  {
    id: "keypad",
    label: "Take keypad input",
    why: "Digits pressed during a call are not passed through yet.",
  },
] as const

// ─── deployment-owned values ─────────────────────────────────────────────────

/**
 * Max duration and silence hang-up also exist on the phone number a live agent
 * answers. Two editable copies of one number is how drift starts, so when a
 * number is bound the agent shows the number's value and a way to go change it
 * there, rather than a second field that wins only sometimes.
 */
export interface BoundRule {
  label: string
  value: string
  ownedBy: string
  href: string
}

export function boundRules(numberLabel: string | null, cb: CallBehaviorConfig): BoundRule[] {
  if (!numberLabel) return []
  return [
    {
      label: "Maximum call length",
      value: duration(cb.maxDurationSec),
      ownedBy: numberLabel,
      href: "/phone-numbers",
    },
  ]
}
