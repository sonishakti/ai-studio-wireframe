"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { RadioCard, RadioCardGroup } from "@/components/wizard/radio-cards"
import {
  STACK_PRESETS, STACK_CATALOG, stackFor, stackEstimateFor, stackLine,
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
    <RadioCardGroup
      value={active}
      onValueChange={(v) => v && setPreset(v as StackPreset)}
      aria-label="Model preset"
      className={cn("sm:grid-cols-3", className)}
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
  )
}

// ─── Piece 2: pipeline shape + vendor-level control ───────────────────────────

export function StackModelsDetail({ stack, onChange, className }: StackPieceProps) {
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  const est = stackEstimateFor(stack)
  const diverged = pipeline === "stt-llm-tts" && divergedFromPreset(stack)
  // Custom mixes and realtime pipelines only exist inside the disclosure, so
  // arriving with one means the user belongs in there. Open it once.
  const [customOpen, setCustomOpen] = React.useState(diverged || pipeline === "mllm")

  const patch = (s: Partial<AgentStack>) => onChange({ ...stack, ...s })

  // The chosen vendor's voices; include the current voice if the catalog
  // doesn't list it (imported/legacy) so the Select never renders blank.
  const ttsVendor = STACK_CATALOG.tts.find((v) => v.vendor === stack.tts.vendor) ?? STACK_CATALOG.tts[0]
  const vendorVoices = ttsVendor.voices as readonly string[]
  const voiceOptions = vendorVoices.includes(stack.tts.voice)
    ? [...vendorVoices]
    : [stack.tts.voice, ...vendorVoices]

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
    <section className={cn("space-y-4", className)}>
      {/* Pipeline shape — a FIRST-CLASS choice, not buried in the disclosure
          (owner 2026-07-09), in plain language (user-test: bare "STT · LLM ·
          TTS" jargon lands cold — explain, don't re-hide). */}
      <h4 className="text-base font-medium">Configure Models</h4>
      <RadioCardGroup
        value={pipeline}
        onValueChange={(v) => v && setPipeline(v as Pipeline)}
        aria-label="Pipeline"
        className="sm:grid-cols-2"
      >
        <RadioCard
          value="stt-llm-tts"
          title={<>Separate models <span className="font-normal text-muted-foreground">(default)</span></>}
          description="Speech, then an LLM, then speech. Tune each stage."
        />
        <RadioCard
          value="mllm"
          title="One realtime model"
          description="Hears and speaks. Faster, fewer knobs."
        />
      </RadioCardGroup>

      {pipeline === "mllm" ? (
        <p className="text-xs text-muted-foreground">
          The model owns turn-taking, so the interruption and end-of-speech controls in
          Advanced don&apos;t apply.
        </p>
      ) : null}

      {/* What the pick means, in vendors and numbers. */}
      <p className="text-xs text-muted-foreground">
        {pipeline === "mllm"
          ? `Realtime model: ${stackLine(stack)} · ~${est.latencyMs} ms · ~$${est.costPerMin.toFixed(2)}/min`
          : diverged
          ? `Custom mix: ${stackLine(stack)}. Estimates approximate the ${STACK_PRESETS[stack.preset].label} preset (~${est.latencyMs} ms · ~$${est.costPerMin.toFixed(2)}/min).`
          : `Runs on ${stackLine(stack)} · ~${est.latencyMs} ms · ~$${est.costPerMin.toFixed(2)}/min`}
      </p>

      {/* Vendor-level control, tucked away until wanted. */}
      <Collapsible open={customOpen} onOpenChange={setCustomOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-foreground transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {pipeline === "mllm" ? "Choose the realtime model" : "Choose specific models"}
            <ChevronDown className={cn("h-4 w-4 transition-transform", customOpen && "rotate-180")} aria-hidden />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          {pipeline === "stt-llm-tts" ? (
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 space-y-1.5 sm:col-span-6">
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
              <div className="col-span-12 space-y-1.5 sm:col-span-6">
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
              <div className="col-span-12 space-y-1.5 sm:col-span-6">
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
              <div className="col-span-12 space-y-1.5 sm:col-span-6">
                {/* "TTS voice", not "Voice" — the persona picker sits directly
                    above this on Step 1; two controls named Voice read as a bug. */}
                <Label className="text-xs text-muted-foreground">TTS voice</Label>
                <Select value={stack.tts.voice} onValueChange={(voice) => patch({ tts: { ...stack.tts, voice } })}>
                  <SelectTrigger className="text-sm capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {voiceOptions.map((v) => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-12">
            <div className="col-span-12 space-y-1.5 sm:col-span-6">
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
        </CollapsibleContent>
      </Collapsible>
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
