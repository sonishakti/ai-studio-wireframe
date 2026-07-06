"use client"

import * as React from "react"
import { Zap } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  STACK_PRESETS, STACK_CATALOG, stackFor, stackEstimateFor,
  type StackPreset, type AgentStack,
} from "@/lib/campaign-data"
import type { StepProps } from "@/components/wizard/types"

/**
 * StackConfig — the model stack behind the voice (Step 1's second half).
 *
 * Two pipeline shapes: the classic STT→LLM→TTS cascade (per-slot provider
 * dropdowns) or a single multimodal realtime model (MLLM) — Agora's
 * Conversational AI Engine supports both (bring-your-own vendors):
 * https://docs.agora.io/en/conversational-ai/overview/product-overview
 *
 * Presets write sensible vendor defaults; every slot stays individually
 * overridable. Estimates are PRESET-based (no per-model tables at wireframe
 * altitude): overriding a slot un-highlights the preset chips and the footer
 * says the numbers approximate the preset — never a false "live" claim.
 * Options come from STACK_CATALOG (colocated with STACK_PRESETS) so a preset
 * can never write a value the dropdowns don't list.
 */

type Pipeline = NonNullable<AgentStack["pipeline"]>

const PIPELINES: { id: Pipeline; title: string; desc: string }[] = [
  { id: "stt-llm-tts", title: "STT · LLM · TTS", desc: "Configure each stage of the cascade yourself." },
  // Finding 19: explain the tradeoff — never a circular "Configure your MLLM".
  { id: "mllm", title: "Multimodal LLM", desc: "One model handles speech in and out. Lower latency, fewer knobs." },
]

const isMllmModel = (llm: AgentStack["llm"]) =>
  STACK_CATALOG.mllm.some((o) => o.vendor === llm.vendor && o.model === llm.model)

/** Slots (voice excluded — personas legitimately change it) differ from the
 *  preset's writes → the chip un-highlights and estimates read as approximate. */
const divergedFromPreset = (s: AgentStack) => {
  const p = STACK_PRESETS[s.preset]
  return (
    s.llm.vendor !== p.llm.vendor || s.llm.model !== p.llm.model ||
    s.asr.vendor !== p.asr.vendor || s.asr.model !== p.asr.model ||
    s.tts.vendor !== p.tts.vendor
  )
}

export function StackConfig({ draft, update }: StepProps) {
  const stack = draft.stack
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  const est = stackEstimateFor(stack)
  const diverged = pipeline === "stt-llm-tts" && divergedFromPreset(stack)

  const patch = (s: Partial<AgentStack>) => update({ stack: { ...stack, ...s } })

  // Switching shape must keep the LLM slot coherent: entering MLLM writes a
  // realtime model (never a display-only fallback), leaving it restores the
  // preset's cascade model — otherwise card/summary/JSON contradict the UI.
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

  // Preset rewrites the slots but never the modality or language the draft
  // already carries.
  const setPreset = (preset: StackPreset) =>
    update({
      stack: {
        ...stackFor(preset, stack.modality),
        pipeline,
        language: stack.language,
      },
    })

  const ttsVendor = STACK_CATALOG.tts.find((v) => v.vendor === stack.tts.vendor) ?? STACK_CATALOG.tts[0]
  // A custom/imported voice may not be in the catalog — include it so the
  // Select never renders blank.
  const vendorVoices = ttsVendor.voices as readonly string[]
  const voiceOptions = vendorVoices.includes(stack.tts.voice)
    ? [...vendorVoices]
    : [stack.tts.voice, ...vendorVoices]

  const languageSelect = (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Spoken language</Label>
      <Select value={stack.language ?? "English"} onValueChange={(language) => patch({ language })}>
        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {STACK_CATALOG.languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold">Models behind the voice</h3>
        <p className="text-sm text-muted-foreground">
          A preset is all you need — open the dropdowns only if you want a specific provider.
        </p>
      </header>

      {/* Language first — it's a user-facing agent trait, not a model detail,
          and was previously buried below the model grid (heuristic-eval #16). */}
      <div className="sm:max-w-xs">{languageSelect}</div>

      {/* Pipeline shape — ToggleGroup for real radio keyboard semantics. */}
      <ToggleGroup
        type="single"
        value={pipeline}
        onValueChange={(v) => v && setPipeline(v as Pipeline)}
        className="grid gap-2 sm:grid-cols-2"
        aria-label="Pipeline"
      >
        {PIPELINES.map((p) => (
          <ToggleGroupItem
            key={p.id}
            value={p.id}
            className="h-auto flex-col items-start gap-1 rounded-lg border border-border p-3 text-left data-[state=on]:border-primary data-[state=on]:bg-primary/5"
          >
            <span className="text-sm font-medium">{p.title}</span>
            <span className="text-xs font-normal leading-relaxed text-muted-foreground">{p.desc}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {pipeline === "stt-llm-tts" ? (
        <>
          {/* Speed/cost preset */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Preset</Label>
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                type="single"
                value={diverged ? "" : stack.preset}
                onValueChange={(v) => v && setPreset(v as StackPreset)}
                variant="outline"
                size="sm"
                aria-label="Stack preset"
              >
                {(Object.keys(STACK_PRESETS) as StackPreset[]).map((p) => (
                  <ToggleGroupItem key={p} value={p} className="gap-1.5 text-sm">
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                    {STACK_PRESETS[p].label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <span className="text-xs text-muted-foreground">
                {diverged ? "Custom mix" : STACK_PRESETS[stack.preset].hint}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Text-to-Speech (TTS)</Label>
              <Select
                value={ttsVendor.vendor}
                onValueChange={(vendor) => {
                  const v = STACK_CATALOG.tts.find((x) => x.vendor === vendor)
                  if (v) patch({ tts: { vendor: v.vendor, voice: v.voices[0] } })
                }}
              >
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STACK_CATALOG.tts.map((v) => <SelectItem key={v.vendor} value={v.vendor}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Voice</Label>
              <Select
                value={stack.tts.voice}
                onValueChange={(voice) => patch({ tts: { ...stack.tts, voice } })}
              >
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {voiceOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-1.5 sm:max-w-xs">
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
      )}

      <p className="text-xs text-muted-foreground">
        {pipeline === "mllm"
          ? `Estimated ~${est.latencyMs} ms end-to-end · ~$${est.costPerMin.toFixed(2)}/min for a realtime model — the card on the left follows this.`
          : diverged
          ? `Estimates approximate the ${STACK_PRESETS[stack.preset].label} preset (~${est.latencyMs} ms · ~$${est.costPerMin.toFixed(2)}/min) — your custom mix may differ.`
          : `Estimated ~${est.latencyMs} ms end-to-end · ~$${est.costPerMin.toFixed(2)}/min — the card on the left follows the preset.`}
      </p>
    </section>
  )
}
