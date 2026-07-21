"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RadioCard, RadioCardGroup } from "@/components/wizard/radio-cards"
import {
  STACK_PRESETS, STACK_CATALOG, stackFor, stackEstimateFor,
  type StackPreset, type AgentStack,
} from "@/lib/campaign-data"

/**
 * Stack config — the model stack (speed/cost preset + pipeline + STT/LLM/TTS)
 * behind an agent. SPLIT IN TWO (Figma direction 2026-07-14) so builder Step 1
 * can run the screenshot's order — presets first, then Voice + Language, then
 * "Configure Models":
 *   • StackPresetCards — the speed/cost priority (the ONE decision most make)
 *   • StackModelsDetail — pipeline shape + the vendor disclosure
 * `StackConfig` composes both for the standalone Playground.
 *
 * It owns the TTS vendor AND the voice within it (kept coherent — a vendor
 * change resets to that vendor's first voice); the spoken language is a builder
 * trait, so no language control here. Both pipeline shapes are supported by
 * Agora's Conversational AI Engine (bring-your-own vendors):
 * https://docs.agora.io/en/conversational-ai/overview/product-overview
 *
 * Estimates are PRESET-based (no per-model tables at wireframe altitude):
 * overriding a slot un-highlights the preset cards and the estimate reads as
 * approximate. Options come from STACK_CATALOG (colocated with STACK_PRESETS)
 * so a preset can never write a value the dropdowns don't list.
 */

type Pipeline = NonNullable<AgentStack["pipeline"]>

interface StackPieceProps {
  stack: AgentStack
  onChange: (next: AgentStack) => void
  className?: string
}

const isMllmModel = (llm: AgentStack["llm"]) =>
  STACK_CATALOG.mllm.some((o) => o.vendor === llm.vendor && o.model === llm.model)

/** Slots (voice + language excluded — the Playground owns those) differ from
 *  the preset's writes → no card highlights and estimates read as approximate. */
const divergedFromPreset = (s: AgentStack) => {
  const p = STACK_PRESETS[s.preset]
  return (
    s.llm.vendor !== p.llm.vendor || s.llm.model !== p.llm.model ||
    s.asr.vendor !== p.asr.vendor || s.asr.model !== p.asr.model ||
    s.tts.vendor !== p.tts.vendor
  )
}

// ─── Piece 1: the speed/cost priority ─────────────────────────────────────────

export function StackPresetCards({ stack, onChange, className }: StackPieceProps) {
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  const diverged = pipeline === "stt-llm-tts" && divergedFromPreset(stack)
  const active = pipeline === "stt-llm-tts" && !diverged ? stack.preset : ""

  // Chained Model (MLLM): the speed/cost presets write CASCADE vendor stacks —
  // they serve no purpose on a realtime pipeline, so the whole block hides
  // (owner 2026-07-15: "why is it still shown if it serves no purpose").
  // The realtime model itself is picked in "Choose the realtime model".
  if (pipeline === "mllm") return null

  // A preset pick also returns a realtime pipeline to the standard cascade —
  // that is what the cards promise ("we suggest the vendors"). Keep the chosen
  // language, and keep the current voice ONLY if the preset's TTS vendor still
  // offers it (else fall back to the preset's own voice) — a vendor never
  // presents a voice it doesn't provide (stack-move review).
  const setPreset = (preset: StackPreset) => {
    const base = stackFor(preset, stack.modality)
    const vendorVoices = (STACK_CATALOG.tts.find((v) => v.vendor === base.tts.vendor)?.voices ?? []) as readonly string[]
    const voice = vendorVoices.includes(stack.tts.voice) ? stack.tts.voice : base.tts.voice
    onChange({
      ...base,
      pipeline: "stt-llm-tts",
      language: stack.language,
      tts: { vendor: base.tts.vendor, voice },
    })
  }

  return (
    // @container: cards reflow by the component's real width (builder center
    // column vs Playground page), not viewport breakpoints.
    <section className={cn("@container space-y-3", className)}>
      {/* "Configure Models" = the speed/cost preset (Figma "Shell Exploration"
          heading, 2026-07-15). */}
      <h4 className="text-base font-medium">Configure Models</h4>
      <RadioCardGroup
        value={active}
        onValueChange={(v) => v && setPreset(v as StackPreset)}
        aria-label="Model preset"
        className="@xl:grid-cols-3"
      >
      {(Object.keys(STACK_PRESETS) as StackPreset[]).map((p) => {
        const preset = STACK_PRESETS[p]
        const pEst = stackEstimateFor(stackFor(p, stack.modality))
        return (
          <RadioCard
            key={p}
            value={p}
            title={preset.label}
            // The numbers ARE the description; the prose rides the tooltip.
            description={`~${pEst.latencyMs} ms · ~$${pEst.costPerMin.toFixed(2)}/min`}
            hint={preset.hint}
          />
        )
      })}
      </RadioCardGroup>
    </section>
  )
}

// ─── Piece 2: pipeline shape + vendor-level control ───────────────────────────

export function StackModelsDetail({
  stack,
  onChange,
  className,
  showPicker = true,
  hideTitle,
}: StackPieceProps & {
  showPicker?: boolean
  /** [label | content] hosting (builder 2026-07-21): the row label already
   *  says "Pipeline" — suppress the inner h4. Playground keeps it. */
  hideTitle?: boolean
}) {
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"

  const patch = (s: Partial<AgentStack>) => onChange({ ...stack, ...s })

  // Switching shape must keep the LLM slot coherent: entering MLLM writes a
  // realtime model (never a display-only fallback), leaving it restores the
  // preset's cascade model — otherwise summary/JSON contradict the UI.
  const setPipeline = (p: Pipeline) => {
    if (p === pipeline) return
    if (p === "mllm") {
      patch({
        pipeline: p,
        llm: isMllmModel(stack.llm)
          ? stack.llm
          : { vendor: STACK_CATALOG.mllm[0].vendor, model: STACK_CATALOG.mllm[0].model },
      })
    } else {
      patch({
        pipeline: p,
        llm: isMllmModel(stack.llm) ? STACK_PRESETS[stack.preset].llm : stack.llm,
      })
    }
  }

  return (
    <section className={cn("@container space-y-4", className)}>
      {/* "Pipeline" — this section already lives inside the agent's Models
          page, so "Agent Architecture" double-qualified it (owner 2026-07-17).
          No estimate/summary paragraphs here: variable-length text above the
          cards moved them under the cursor on every switch (the model-switch
          jump); the live numbers live in the right panel's summary instead. */}
      {!hideTitle && <h4 className="text-base font-medium">Pipeline</h4>}
      <RadioCardGroup
        value={pipeline}
        onValueChange={(v) => v && setPipeline(v as Pipeline)}
        aria-label="Pipeline"
        className="gap-4 @2xl:grid-cols-4"
      >
        <RadioCard
          value="stt-llm-tts"
          title="Cascading Model"
          description="Speech, then an LLM, then speech. Tune each stage."
        />
        <RadioCard
          value="mllm"
          title="Chained Model (MLLM)"
          description="Hears and speaks. Faster, fewer knobs."
        />
      </RadioCardGroup>

      {/* The vendor picker renders here by default; the builder (Figma order)
          renders it separately via showPicker={false} + a standalone
          <StackModelPicker>. */}
      {showPicker && <StackModelPicker stack={stack} onChange={onChange} />}
    </section>
  )
}

/** The STT/LLM/TTS (or realtime) vendor pickers — ALWAYS VISIBLE (owner
 *  2026-07-17: "if user has selected cascading, show the asr-tts-llm
 *  selection, don't hide it"). Formerly a collapsed disclosure. */
export function StackModelPicker({
  stack,
  onChange,
  className,
  personaName,
  hideTitle,
}: StackPieceProps & {
  /** Selected voice persona (e.g. "Luna") — named under the TTS voice so the
   *  two voice concepts reconcile on screen: persona "Luna" speaking with the
   *  "rachel" TTS voice read as a bug (user-test 2026-07-21 D2). */
  personaName?: string
  /** [label | content] hosting: the row label carries "Models". */
  hideTitle?: boolean
}) {
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  const patch = (s: Partial<AgentStack>) => onChange({ ...stack, ...s })

  const ttsVendor = STACK_CATALOG.tts.find((v) => v.vendor === stack.tts.vendor) ?? STACK_CATALOG.tts[0]
  const vendorVoices = ttsVendor.voices as readonly string[]
  const voiceOptions = vendorVoices.includes(stack.tts.voice)
    ? [...vendorVoices]
    : [stack.tts.voice, ...vendorVoices]

  return (
    <div className={cn("@container", className)}>
      <div className="space-y-4">
        {!hideTitle && (
          <h4 className="text-base font-medium">
            {pipeline === "mllm" ? "Realtime model" : "Models"}
          </h4>
        )}
          {pipeline === "stt-llm-tts" ? (
            <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-4">
              <div className="min-w-0 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Speech-to-Text (STT)</Label>
                <Select
                  value={`${stack.asr.vendor}/${stack.asr.model}`}
                  onValueChange={(id) => {
                    const o = STACK_CATALOG.stt.find((x) => `${x.vendor}/${x.model}` === id)
                    if (o) patch({ asr: { vendor: o.vendor, model: o.model } })
                  }}
                >
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STACK_CATALOG.stt.map((o) => (
                      <SelectItem key={`${o.vendor}/${o.model}`} value={`${o.vendor}/${o.model}`}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Large Language Model (LLM)</Label>
                <Select
                  value={`${stack.llm.vendor}/${stack.llm.model}`}
                  onValueChange={(id) => {
                    const o = STACK_CATALOG.llm.find((x) => `${x.vendor}/${x.model}` === id)
                    if (o) patch({ llm: { vendor: o.vendor, model: o.model } })
                  }}
                >
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STACK_CATALOG.llm.map((o) => (
                      <SelectItem key={`${o.vendor}/${o.model}`} value={`${o.vendor}/${o.model}`}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Text-to-Speech (TTS)</Label>
                <Select
                  value={stack.tts.vendor}
                  onValueChange={(vendor) => {
                    const v = STACK_CATALOG.tts.find((x) => x.vendor === vendor)
                    // Reset the voice to the new vendor's first — a vendor never
                    // presents a voice it doesn't provide (stack-move review).
                    if (v) patch({ tts: { vendor: v.vendor, voice: v.voices[0] } })
                  }}
                >
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STACK_CATALOG.tts.map((v) => <SelectItem key={v.vendor} value={v.vendor}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-1.5">
                {/* "TTS voice", not "Voice" — the persona picker sits directly
                    above this on Step 1; two controls named Voice read as a bug. */}
                <Label className="text-xs text-muted-foreground">TTS voice</Label>
                <Select value={stack.tts.voice} onValueChange={(voice) => patch({ tts: { ...stack.tts, voice } })}>
                  <SelectTrigger className="text-sm capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {voiceOptions.map((v) => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                {personaName && (
                  <p className="text-xs text-muted-foreground">
                    The vendor sound {personaName} speaks with. Picking a new voice in Voice &amp; speech resets this to that voice&apos;s default sound.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-4">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Realtime model</Label>
              <Select
                value={`${stack.llm.vendor}/${stack.llm.model}`}
                onValueChange={(id) => {
                  const o = STACK_CATALOG.mllm.find((x) => `${x.vendor}/${x.model}` === id)
                  if (o) patch({ llm: { vendor: o.vendor, model: o.model } })
                }}
              >
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STACK_CATALOG.mllm.map((o) => (
                    <SelectItem key={`${o.vendor}/${o.model}`} value={`${o.vendor}/${o.model}`}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          )}
      </div>
    </div>
  )
}

// ─── The latency ↔ cost tradeoff slider ───────────────────────────────────────

/** One slider instead of three preset cards (owner 2026-07-17): drag toward
 *  Fastest and cost rises; drag toward Cheapest and latency rises. Snaps to
 *  the three presets underneath, so the data model is unchanged — each stop
 *  writes the same vendor defaults the cards did. Hidden on MLLM (one model
 *  owns the whole pipeline). */
const SLIDER_ORDER: StackPreset[] = ["fastest", "balanced", "cheapest"]

export function StackTradeoffSlider({ stack, onChange, className }: StackPieceProps) {
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  if (pipeline === "mllm") return null

  const idx = Math.max(0, SLIDER_ORDER.indexOf(stack.preset))
  const diverged = divergedFromPreset(stack)
  const est = stackEstimateFor(stack)

  const setPreset = (preset: StackPreset) => {
    const base = stackFor(preset, stack.modality)
    const vendorVoices = (STACK_CATALOG.tts.find((v) => v.vendor === base.tts.vendor)?.voices ?? []) as readonly string[]
    const voice = vendorVoices.includes(stack.tts.voice) ? stack.tts.voice : base.tts.voice
    onChange({
      ...base,
      pipeline: "stt-llm-tts",
      language: stack.language,
      tts: { vendor: base.tts.vendor, voice },
    })
  }

  return (
    <section className={cn("@container space-y-3", className)}>
      <h4 className="text-base font-medium">Latency vs cost</h4>
      {/* 50% of the 4-col system (owner 2026-07-17 layout normalization). */}
      <div className="w-full space-y-2 @2xl:w-1/2">
        <div className="flex items-baseline justify-between font-mono text-xs tabular-nums text-muted-foreground">
          <span title="Typical time to first word">~{est.latencyMs} ms</span>
          <span title="Estimated cost per minute">~${est.costPerMin.toFixed(2)}/min</span>
        </div>
        <Slider
          value={[idx]}
          min={0}
          max={SLIDER_ORDER.length - 1}
          step={1}
          onValueChange={([v]) => setPreset(SLIDER_ORDER[v])}
          aria-label="Latency versus cost"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Fastest · costs more</span>
          <span>{STACK_PRESETS.balanced.label}</span>
          <span>Cheapest · slower</span>
        </div>
      </div>
      {diverged && (
        <p className="text-xs text-muted-foreground">
          Custom model mix — moving the slider replaces it with the {STACK_PRESETS[SLIDER_ORDER[idx]].label} defaults.
        </p>
      )}
    </section>
  )
}

// ─── Composition — the standalone Playground consumes the whole stack ─────────

export function StackConfig({ stack, onChange, className }: StackPieceProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <StackPresetCards stack={stack} onChange={onChange} />
      <StackModelsDetail stack={stack} onChange={onChange} />
    </div>
  )
}
