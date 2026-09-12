"use client"

import * as React from "react"
import { Gauge, MessagesSquare, Ear, Settings2, AudioLines, Type, Sparkle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { DEFAULT_ADVANCED, type AdvancedConfig } from "@/lib/wizard-draft"
import { reconcileTurnPreset } from "@/lib/turn-taking"
import { useStoredState } from "@/hooks/use-stored-state"
import { SectionRow } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import { EngineRow } from "@/components/wizard/engine-row"

/** Browser-only intent for the filler rows the Engine cannot honour yet. */
type FillerIntent = { persona?: boolean; keepGoing?: boolean; toolCalls?: boolean }

/**
 * Speech tuning (was the optional "Advanced" section — dissolved into Voice &
 * speech by the v3 IA, 2026-07-17): turn detection, start/end of speech,
 * selective attention locking, filter words. Every sub-section is toggle-gated
 * with sane defaults, so a novice can skip the whole thing. MLLM (realtime)
 * hides the cascade-only knobs (speech VAD) since one model owns turn-taking.
 * History moved to Knowledge & Tools (its own `HistoryField` below) —
 * `showHistory` keeps it here for the standalone Playground.
 */
export function StepAdvanced({
  value,
  onChange,
  realtime,
  showHistory = true,
  agentId,
}: {
  value: AdvancedConfig | undefined
  onChange: (next: AdvancedConfig) => void
  /** True when the agent runs a multimodal realtime model. */
  realtime?: boolean
  /** v3 builder renders history in Knowledge & Tools instead. */
  showHistory?: boolean
  /** Scopes the browser-only intent of the Requires-Engine rows. */
  agentId?: string
}) {
  const adv = value ?? DEFAULT_ADVANCED
  const patch = (p: Partial<AdvancedConfig>) => onChange({ ...adv, ...p })
  /** A raw-row edit that diverges from the named preset flips it to Custom —
   *  the Turn-taking row above must never claim numbers it doesn't have. */
  const patchSpeech = (p: Partial<AdvancedConfig>) => onChange(reconcileTurnPreset({ ...adv, ...p }))
  const [fillerIntent, setFillerIntent] = useStoredState<FillerIntent>(`sx:filler_intent:${agentId ?? "new"}`, {})

  return (
    // [label | content] rows (owner 2026-07-21): two labeled groups, each its
    // own row; the host's <SectionRows> owns the container + dividers.
    <>
      {/* Turn-taking & interruptions (anchor renumbered: Voice & Speech is
          section 4 since the 2026-07-22 proposal moved Models to 3). */}
      <SectionRow
        id="wz-4-turntaking"
        label="Turn-taking & interruptions"
        hint={realtime
          ? "Fine-tune how the agent listens and takes turns. Barge-in tuning lives here (Speaking interrupt duration)."
          : (
            <InfoHint label="Raw controls behind the preset above">
              Turn detection, start and end of speech. Changing a number here switches the preset to Custom.
            </InfoHint>
          )}
      >
      {/* Turn detection */}
      <Sub
        icon={MessagesSquare}
        title="Turn detection"
        desc="How the agent decides it's their turn to speak."
        enabled={adv.turnDetection.enabled}
        onToggle={(enabled) => patch({ turnDetection: { ...adv.turnDetection, enabled } })}
      >
        {/* Presets live in the Turn-taking row above (turn-taking-row.tsx) —
            this grid stays only for realtime stacks, where that row is not
            mounted. */}
        {realtime && (
          <>
            <Label className="text-xs text-muted-foreground">Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2 @lg:grid-cols-4">
              {TURN_PRESETS.map((p) => {
                const on = adv.turnDetection.preset === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => patch({ turnDetection: { ...adv.turnDetection, preset: p.id } })}
                    aria-pressed={on}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors",
                      on ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/40",
                    )}
                  >
                    <p.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="text-sm font-medium">{p.label}</span>
                    <span className="text-xs text-muted-foreground">{p.hint}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
        {/* The chosen preset, characterized (Figma 2916-3435): a one-line
            description plus its Response Speed / Naturalness read-out. */}
        <p className="text-xs text-muted-foreground">
          {PRESET_DESC[adv.turnDetection.preset].text}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Response Speed <Badge variant="secondary" className="ml-1 text-xs">{PRESET_DESC[adv.turnDetection.preset].speed}</Badge></span>
          <span>Naturalness <Badge variant="secondary" className="ml-1 text-xs">{PRESET_DESC[adv.turnDetection.preset].naturalness}</Badge></span>
        </p>
        {adv.turnDetection.preset === "custom" && (
          <SliderRow
            label="Threshold" value={adv.turnDetection.threshold} min={0} max={100} step={1}
            helper="How loud does the user need to speak for the system to detect their voice?"
            ends={["Low (Sensitive)", "High (Noisy Env)"]}
            onChange={(threshold) => patch({ turnDetection: { ...adv.turnDetection, threshold } })}
          />
        )}
      </Sub>

      {/* Explain the vanishing knobs (user-test 2026-07-28): switching to a
          realtime architecture silently dropped Start/End of speech — say
          where they went instead of leaving a hole. */}
      {realtime && (
        <p className="text-xs text-muted-foreground">
          Realtime multimodal models manage turn-taking natively. The Start/End of speech
          controls apply to cascading stacks.
        </p>
      )}

      {!realtime && (
        <>
          {/* Start of speech */}
          <Sub
            icon={AudioLines}
            title="Start of speech"
            desc="When the agent decides the user has started talking."
            enabled={adv.startOfSpeech.enabled}
            onToggle={(enabled) => patch({ startOfSpeech: { ...adv.startOfSpeech, enabled } })}
          >
            <ModeRow
              value={adv.startOfSpeech.mode}
              onChange={(mode) => patchSpeech({ startOfSpeech: { ...adv.startOfSpeech, mode: mode as "vad" | "keyword" } })}
              options={[
                { id: "vad", label: "Voice activity", icon: AudioLines },
                { id: "keyword", label: "Keyword", icon: Type },
              ]}
            />
            {adv.startOfSpeech.mode === "keyword" && (
              <KeywordInput
                keywords={adv.startOfSpeech.keywords}
                onChange={(keywords) => patch({ startOfSpeech: { ...adv.startOfSpeech, keywords } })}
              />
            )}
            <SliderRow
              label="Speaking interrupt duration" unit="ms" value={adv.startOfSpeech.interruptMs} min={0} max={1500} step={20}
              helper="How long the user must speak while the agent is talking before it interrupts."
              ends={["Attentive", "Talkative"]}
              onChange={(interruptMs) => patchSpeech({ startOfSpeech: { ...adv.startOfSpeech, interruptMs } })}
            />
            <SliderRow
              label="Prefix padding" unit="ms" value={adv.startOfSpeech.prefixPaddingMs} min={0} max={500} step={10}
              helper="Buffer time to avoid cutting off the start or end of words."
              ends={["Minimal", "Safe"]}
              onChange={(prefixPaddingMs) => patch({ startOfSpeech: { ...adv.startOfSpeech, prefixPaddingMs } })}
            />
          </Sub>

          {/* End of speech */}
          <Sub
            icon={Ear}
            title="End of speech"
            desc="When the agent decides the user has finished."
            enabled={adv.endOfSpeech.enabled}
            onToggle={(enabled) => patch({ endOfSpeech: { ...adv.endOfSpeech, enabled } })}
          >
            <ModeRow
              value={adv.endOfSpeech.mode}
              onChange={(mode) => patchSpeech({ endOfSpeech: { ...adv.endOfSpeech, mode: mode as "vad" | "semantic" } })}
              options={[
                { id: "vad", label: "Voice activity", icon: AudioLines },
                { id: "semantic", label: "Semantic", icon: Sparkle },
              ]}
            />
            <SliderRow
              label="Silence duration" unit="ms" value={adv.endOfSpeech.silenceMs} min={0} max={2000} step={20}
              helper="How long should the agent wait after you stop talking before it responds?"
              ends={["Quick", "Thoughtful"]}
              onChange={(silenceMs) => patchSpeech({ endOfSpeech: { ...adv.endOfSpeech, silenceMs } })}
            />
            <SliderRow
              label="Max wait duration" unit="ms" value={adv.endOfSpeech.maxWaitMs} min={1000} max={20000} step={250}
              helper="The longest the system waits for a response before timing out."
              onChange={(maxWaitMs) => patchSpeech({ endOfSpeech: { ...adv.endOfSpeech, maxWaitMs } })}
            />
          </Sub>
        </>
      )}
      </SectionRow>

      {/* Fillers (anchor kept: wz-4-attention). "Lock onto one speaker" now
          lives in the Listening group (listening-rows.tsx) — same state, one
          place. */}
      <SectionRow
        id="wz-4-attention"
        label="Fillers"
      >
      {/* While thinking (Design Tracker 04-C: relabel only — counter,
          one-per-line helper and order rule unchanged). */}
      <Sub
        icon={Settings2}
        title="While thinking"
        desc="Short phrases while the answer is being generated"
        enabled={adv.filterWords.enabled}
        onToggle={(enabled) => patch({ filterWords: { ...adv.filterWords, enabled } })}
      >
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label className="text-xs text-muted-foreground">Phrases</Label>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {adv.filterWords.patterns.split("\n").filter((l) => l.trim()).length}/100
            </span>
          </div>
          <Textarea
            value={adv.filterWords.patterns}
            onChange={(e) => patch({ filterWords: { ...adv.filterWords, patterns: e.target.value } })}
            placeholder={"sure let me look that up for you,\num,\nuh huh,\nplease wait,"}
            className="min-h-[88px] font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">One per line, separated by a comma, max 100 phrases.</p>
        </div>
        <SliderRow
          label="After" unit="ms" value={adv.filterWords.responseWaitMs} min={0} max={2000} step={20}
          helper="How long should the agent wait before it starts using filler words?"
          ends={["Quick", "Thoughtful"]}
          onChange={(responseWaitMs) => patch({ filterWords: { ...adv.filterWords, responseWaitMs } })}
        />
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Order</Label>
          <Select
            value={adv.filterWords.selectionRule ?? "shuffle"}
            onValueChange={(v) => patch({ filterWords: { ...adv.filterWords, selectionRule: v as "shuffle" | "in-order" } })}
          >
            <SelectTrigger className="w-full max-w-sm text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="shuffle">Shuffle</SelectItem>
              <SelectItem value="in-order">In order</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* What the Engine will add to fillers — visible, inert, captioned;
            intent stays in this browser (sx:filler_intent:<agentId|new>). */}
        <div className="divide-y divide-border border-t border-border pt-3">
          <EngineRow
            title="Match the persona"
            description="Filler that fits the conversation so far"
            checked={fillerIntent.persona === true}
            onCheckedChange={(on) => setFillerIntent({ ...fillerIntent, persona: on })}
          />
          <EngineRow
            title="Keep going after the filler"
            description="The answer continues without repeating the acknowledgement"
            checked={fillerIntent.keepGoing === true}
            onCheckedChange={(on) => setFillerIntent({ ...fillerIntent, keepGoing: on })}
          />
          <EngineRow
            title="During tool calls"
            description="Fills the wait while a tool runs"
            checked={fillerIntent.toolCalls === true}
            onCheckedChange={(on) => setFillerIntent({ ...fillerIntent, toolCalls: on })}
          />
        </div>
      </Sub>
      </SectionRow>

      {showHistory && (
        <SectionRow label="Conversation history">
          <HistoryField value={value} onChange={onChange} />
        </SectionRow>
      )}
    </>
  )
}

/** Conversation history (max messages) — its own export because the v3 IA
 *  homes it under Knowledge & Tools (working memory sits with knowledge),
 *  while the Playground keeps it inside StepAdvanced. */
export function HistoryField({
  value,
  onChange,
  id,
  bare,
}: {
  value: AdvancedConfig | undefined
  onChange: (next: AdvancedConfig) => void
  /** Optional TOC scroll anchor (e.g. "wz-5-history"). */
  id?: string
  /** [label | content] hosting (2026-07-21): the row label already says
   *  "Conversation history" — render just the field, no card/title. */
  bare?: boolean
}) {
  const adv = value ?? DEFAULT_ADVANCED
  return (
    <section
      id={id}
      className={bare ? "scroll-mt-28 space-y-3" : "scroll-mt-28 space-y-3 rounded-lg border border-border bg-card p-4"}
    >
      {!bare && (
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Gauge className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Conversation history</p>
          <p className="text-xs text-muted-foreground">How much conversation the agent keeps in context.</p>
        </div>
      </div>
      )}
      <div className="max-w-[200px] space-y-1.5">
        <Label htmlFor="adv-history" className="text-xs text-muted-foreground">Max history messages</Label>
        <IntInput
          id="adv-history"
          min={0}
          max={200}
          value={adv.history.maxMessages}
          onChange={(maxMessages) => onChange({ ...adv, history: { maxMessages } })}
          className="text-sm"
          aria-label="Max history messages"
        />
      </div>
    </section>
  )
}

const TURN_PRESETS: { id: AdvancedConfig["turnDetection"]["preset"]; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "responsive", label: "Responsive", hint: "Jumps in fast", icon: Gauge },
  { id: "balanced", label: "Balanced", hint: "Natural pace", icon: MessagesSquare },
  { id: "patient", label: "Patient", hint: "Waits longer", icon: Ear },
  { id: "custom", label: "Custom", hint: "Set a threshold", icon: Settings2 },
]

/** Per-preset characterization (Figma 2916-3435). */
const PRESET_DESC: Record<AdvancedConfig["turnDetection"]["preset"], { text: string; speed: string; naturalness: string }> = {
  responsive: { text: "Answers the moment the caller pauses. Best for quick, transactional calls.", speed: "Fast", naturalness: "Direct" },
  balanced: { text: "Good mix of responsiveness and naturalness. Ideal for most use-cases.", speed: "Moderate", naturalness: "Natural" },
  patient: { text: "Waits out longer pauses before replying. Best for thoughtful or elderly callers.", speed: "Slow", naturalness: "Very natural" },
  custom: { text: "Your own threshold: tune how loud the caller must be to take the turn.", speed: "Custom", naturalness: "Custom" },
}

function Sub({
  icon: Icon, title, desc, enabled, onToggle, children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string; desc: string; enabled: boolean; onToggle: (v: boolean) => void; children: React.ReactNode
}) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Enable ${title}`} />
      </div>
      {enabled && <div className="space-y-4 border-t border-border pt-3">{children}</div>}
    </section>
  )
}

function ModeRow({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] }) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v)} className="grid grid-cols-2 gap-2" aria-label="Mode">
      {options.map((o) => (
        <ToggleGroupItem
          key={o.id}
          value={o.id}
          className="h-auto justify-start gap-2 rounded-lg border border-border p-2.5 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-foreground"
        >
          <o.icon className="h-4 w-4 text-muted-foreground" aria-hidden /> {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function SliderRow({ label, helper, value, min, max, step, unit, ends, onChange }: {
  label: string; helper: string; value: number; min: number; max: number; step: number; unit?: string
  /** Semantic endpoint labels under the track, e.g. ["Attentive","Talkative"]
   *  (proposal 2639-102124 — the ends say what the extremes MEAN). */
  ends?: [string, string]
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="font-mono text-xs tabular-nums text-foreground">{value}{unit ? ` ${unit}` : ""}</span>
      </div>
      <p className="text-xs text-muted-foreground">{helper}</p>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} aria-label={label} />
          {ends && (
            <div className="flex items-center justify-between text-xs text-muted-foreground/70">
              <span>{ends[0]}</span>
              <span>{ends[1]}</span>
            </div>
          )}
        </div>
        <IntInput value={value} min={min} max={max} step={step} onChange={onChange} className="w-20 self-start text-sm" aria-label={`${label} value`} />
      </div>
    </div>
  )
}

/** A controlled integer field that keeps its own text state so it can be cleared
 *  and retyped without snapping to `min` mid-keystroke; clamps + commits on blur
 *  or Enter. */
function IntInput({ value, min, max, step, onChange, className, "aria-label": ariaLabel, id }: {
  value: number; min: number; max: number; step?: number; onChange: (v: number) => void
  className?: string; "aria-label"?: string; id?: string
}) {
  const [text, setText] = React.useState(String(value))
  React.useEffect(() => { setText(String(value)) }, [value])
  const commit = () => {
    const next = clampInt(text, min, max)
    setText(String(next))
    if (next !== value) onChange(next)
  }
  return (
    <Input
      id={id}
      type="number"
      min={min}
      max={max}
      step={step}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit() } }}
      className={className}
      aria-label={ariaLabel}
    />
  )
}

function KeywordInput({ keywords, onChange }: { keywords: string[]; onChange: (k: string[]) => void }) {
  const [draft, setDraft] = React.useState("")
  const add = () => {
    const v = draft.trim()
    if (v && !keywords.includes(v)) onChange([...keywords, v])
    setDraft("")
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Trigger keywords</Label>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          placeholder="e.g. hey agent"
          className="text-sm"
        />
      </div>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((k) => (
            <Badge key={k} variant="secondary" className="gap-1 pr-1 font-normal">
              {k}
              <button type="button" onClick={() => onChange(keywords.filter((x) => x !== k))} aria-label={`Remove ${k}`} className="rounded-sm text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function clampInt(raw: string, min: number, max: number): number {
  const n = parseInt(raw, 10)
  if (Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}
