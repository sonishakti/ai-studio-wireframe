"use client"

import * as React from "react"
import { Gauge, MessagesSquare, Ear, Settings2, AudioLines, Type, Sparkle, Lock, Fingerprint, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DEFAULT_ADVANCED, type AdvancedConfig } from "@/lib/wizard-draft"

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
}: {
  value: AdvancedConfig | undefined
  onChange: (next: AdvancedConfig) => void
  /** True when the agent runs a multimodal realtime model. */
  realtime?: boolean
  /** v3 builder renders history in Knowledge & Tools instead. */
  showHistory?: boolean
}) {
  const adv = value ?? DEFAULT_ADVANCED
  const patch = (p: Partial<AdvancedConfig>) => onChange({ ...adv, ...p })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Fine-tune how the agent listens and takes turns. Defaults work for most agents.
      </p>

      {/* Turn-taking & interruptions (v3 TOC anchor). */}
      <div id="wz-3-turntaking" className="scroll-mt-28 space-y-4">
      {/* Turn detection */}
      <Sub
        icon={MessagesSquare}
        title="Turn detection"
        desc="How the agent decides it's their turn to speak."
        enabled={adv.turnDetection.enabled}
        onToggle={(enabled) => patch({ turnDetection: { ...adv.turnDetection, enabled } })}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
        {adv.turnDetection.preset === "custom" && (
          <SliderRow
            label="Threshold" value={adv.turnDetection.threshold} min={0} max={100} step={1}
            helper="How loud the user must speak for the system to detect their voice."
            onChange={(threshold) => patch({ turnDetection: { ...adv.turnDetection, threshold } })}
          />
        )}
      </Sub>

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
              onChange={(mode) => patch({ startOfSpeech: { ...adv.startOfSpeech, mode: mode as "vad" | "keyword" } })}
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
              onChange={(interruptMs) => patch({ startOfSpeech: { ...adv.startOfSpeech, interruptMs } })}
            />
            <SliderRow
              label="Prefix padding" unit="ms" value={adv.startOfSpeech.prefixPaddingMs} min={0} max={500} step={10}
              helper="Buffer time so the start of words isn't clipped."
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
              onChange={(mode) => patch({ endOfSpeech: { ...adv.endOfSpeech, mode: mode as "vad" | "semantic" } })}
              options={[
                { id: "vad", label: "Voice activity", icon: AudioLines },
                { id: "semantic", label: "Semantic", icon: Sparkle },
              ]}
            />
            <SliderRow
              label="Silence duration" unit="ms" value={adv.endOfSpeech.silenceMs} min={0} max={2000} step={20}
              helper="How long to wait after the user stops before responding."
              onChange={(silenceMs) => patch({ endOfSpeech: { ...adv.endOfSpeech, silenceMs } })}
            />
            <SliderRow
              label="Max wait duration" unit="ms" value={adv.endOfSpeech.maxWaitMs} min={1000} max={20000} step={250}
              helper="The longest the system waits for a response before timing out."
              onChange={(maxWaitMs) => patch({ endOfSpeech: { ...adv.endOfSpeech, maxWaitMs } })}
            />
          </Sub>
        </>
      )}
      </div>

      {/* Attention & filters (v3 TOC anchor). */}
      <div id="wz-3-attention" className="scroll-mt-28 space-y-4">
      {/* Selective attention locking */}
      <Sub
        icon={Lock}
        title="Selective attention locking"
        desc="Whether the agent locks onto one speaker or listens to everyone."
        enabled={adv.attentionLocking.enabled}
        onToggle={(enabled) => patch({ attentionLocking: { ...adv.attentionLocking, enabled } })}
      >
        <ModeRow
          value={adv.attentionLocking.mode}
          onChange={(mode) => patch({ attentionLocking: { ...adv.attentionLocking, mode: mode as "speaker" | "passthrough" } })}
          options={[
            { id: "speaker", label: "Lock to speaker", icon: Lock },
            { id: "passthrough", label: "Listen to all", icon: Fingerprint },
          ]}
        />
      </Sub>

      {/* Filter words */}
      <Sub
        icon={Settings2}
        title="Filter words"
        desc="Filler patterns to hold while the agent thinks."
        enabled={adv.filterWords.enabled}
        onToggle={(enabled) => patch({ filterWords: { ...adv.filterWords, enabled } })}
      >
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Patterns</Label>
          <Textarea
            value={adv.filterWords.patterns}
            onChange={(e) => patch({ filterWords: { ...adv.filterWords, patterns: e.target.value } })}
            placeholder={"um\nlet me check\none moment"}
            className="min-h-[72px] font-mono text-xs"
          />
        </div>
        <SliderRow
          label="Response wait threshold" unit="ms" value={adv.filterWords.responseWaitMs} min={0} max={2000} step={20}
          helper="How long to wait before the agent starts using filler words."
          onChange={(responseWaitMs) => patch({ filterWords: { ...adv.filterWords, responseWaitMs } })}
        />
      </Sub>
      </div>

      {showHistory && <HistoryField value={value} onChange={onChange} />}
    </div>
  )
}

/** Conversation history (max messages) — its own export because the v3 IA
 *  homes it under Knowledge & Tools (working memory sits with knowledge),
 *  while the Playground keeps it inside StepAdvanced. */
export function HistoryField({
  value,
  onChange,
  id,
}: {
  value: AdvancedConfig | undefined
  onChange: (next: AdvancedConfig) => void
  /** Optional TOC scroll anchor (e.g. "wz-5-history"). */
  id?: string
}) {
  const adv = value ?? DEFAULT_ADVANCED
  return (
    <section id={id} className="scroll-mt-28 space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Gauge className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Conversation history</p>
          <p className="text-xs text-muted-foreground">How much conversation the agent keeps in context.</p>
        </div>
      </div>
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
          className="h-auto justify-start gap-2 rounded-lg border border-border p-2.5 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary/5"
        >
          <o.icon className="h-4 w-4 text-muted-foreground" aria-hidden /> {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function SliderRow({ label, helper, value, min, max, step, unit, onChange }: {
  label: string; helper: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="font-mono text-xs tabular-nums text-foreground">{value}{unit ? ` ${unit}` : ""}</span>
      </div>
      <div className="flex items-center gap-3">
        <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} aria-label={label} className="flex-1" />
        <IntInput value={value} min={min} max={max} step={step} onChange={onChange} className="w-20 text-sm" aria-label={`${label} value`} />
      </div>
      <p className="text-xs text-muted-foreground">{helper}</p>
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
