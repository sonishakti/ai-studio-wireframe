"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  STACK_PRESETS, STACK_CATALOG, stackFor, stackEstimateFor, stackLine,
  type StackPreset, type AgentStack,
} from "@/lib/campaign-data"
import type { StepProps } from "@/components/wizard/types"

/**
 * StackConfig — the model stack behind the voice (Step 1's second half).
 *
 * PRESET-FIRST (2026-07-07 directive): the first decision is Fastest vs
 * Balanced vs Cheapest; each preset suggests its vendors and shows its
 * latency/cost up front. Vendor-level dropdowns (and the cascade-vs-realtime
 * pipeline switch) live behind "Customize models". Two pipeline shapes, both
 * supported by Agora's Conversational AI Engine (bring-your-own vendors):
 * https://docs.agora.io/en/conversational-ai/overview/product-overview
 *
 * Estimates are PRESET-based (no per-model tables at wireframe altitude):
 * overriding a slot un-highlights the preset cards and the estimate reads as
 * approximate. Options come from STACK_CATALOG (colocated with STACK_PRESETS)
 * so a preset can never write a value the dropdowns don't list.
 */

type Pipeline = NonNullable<AgentStack["pipeline"]>

const isMllmModel = (llm: AgentStack["llm"]) =>
  STACK_CATALOG.mllm.some((o) => o.vendor === llm.vendor && o.model === llm.model)

/** Slots (voice excluded — personas legitimately change it) differ from the
 *  preset's writes → no card highlights and estimates read as approximate. */
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
  // Custom mixes and realtime pipelines only exist inside the disclosure, so
  // arriving with one means the user belongs in there. Open it once.
  const [customOpen, setCustomOpen] = React.useState(diverged || pipeline === "mllm")

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

  // A preset pick also returns a realtime pipeline to the standard cascade —
  // that is what the cards promise ("we suggest the vendors").
  const setPreset = (preset: StackPreset) =>
    update({
      stack: {
        ...stackFor(preset, stack.modality),
        pipeline: "stt-llm-tts",
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

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold">Models</h3>
        <p className="text-sm text-muted-foreground">
          Pick a priority. We suggest the vendors to match.
        </p>
      </header>

      {/* Preset first — the ONE model decision most users make. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label="Model preset">
        {(Object.keys(STACK_PRESETS) as StackPreset[]).map((p) => {
          const preset = STACK_PRESETS[p]
          const pEst = stackEstimateFor(stackFor(p, stack.modality))
          const active = pipeline === "stt-llm-tts" && !diverged && stack.preset === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              aria-pressed={active}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:border-foreground/20 hover:bg-accent/40",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{preset.label}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{preset.hint}</span>
              <span className="mt-1.5 block text-xs text-muted-foreground">
                ~{pEst.latencyMs} ms · ~${pEst.costPerMin.toFixed(2)}/min
              </span>
            </button>
          )
        })}
      </div>

      {/* What the pick means, in vendors and numbers. */}
      <p className="text-xs text-muted-foreground">
        {pipeline === "mllm"
          ? `Realtime model: ${stackLine(stack)} · ~${est.latencyMs} ms · ~$${est.costPerMin.toFixed(2)}/min`
          : diverged
          ? `Custom mix: ${stackLine(stack)}. Estimates approximate the ${STACK_PRESETS[stack.preset].label} preset (~${est.latencyMs} ms · ~$${est.costPerMin.toFixed(2)}/min).`
          : `Runs on ${stackLine(stack)} · ~${est.latencyMs} ms · ~$${est.costPerMin.toFixed(2)}/min`}
      </p>

      <div className="max-w-xs space-y-1.5">
        <Label className="text-xs text-muted-foreground">Spoken language</Label>
        <Select value={stack.language ?? "English"} onValueChange={(language) => patch({ language })}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STACK_CATALOG.languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Vendor-level control, tucked away until wanted. */}
      <Collapsible open={customOpen} onOpenChange={setCustomOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-foreground transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", customOpen && "rotate-180")} aria-hidden />
            Customize models
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          {/* Pipeline shape — ToggleGroup for real radio keyboard semantics. */}
          <ToggleGroup
            type="single"
            value={pipeline}
            onValueChange={(v) => v && setPipeline(v as Pipeline)}
            className="grid w-full gap-2 sm:grid-cols-2"
            aria-label="Pipeline"
          >
            <ToggleGroupItem
              value="stt-llm-tts"
              className="h-auto flex-col items-start gap-1 rounded-lg border border-border p-3 text-left data-[state=on]:border-primary data-[state=on]:bg-primary/5"
            >
              <span className="text-sm font-medium">STT · LLM · TTS</span>
              <span className="text-xs font-normal leading-relaxed text-muted-foreground">Configure each stage of the cascade yourself.</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="mllm"
              className="h-auto flex-col items-start gap-1 rounded-lg border border-border p-3 text-left data-[state=on]:border-primary data-[state=on]:bg-primary/5"
            >
              <span className="text-sm font-medium">Multimodal LLM</span>
              <span className="text-xs font-normal leading-relaxed text-muted-foreground">One model handles speech in and out. Lower latency, fewer knobs.</span>
            </ToggleGroupItem>
          </ToggleGroup>

          {pipeline === "stt-llm-tts" ? (
            <div className="grid gap-3 sm:grid-cols-2">
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
          ) : (
            <div className="max-w-xs space-y-1.5">
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
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
