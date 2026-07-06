"use client"

import * as React from "react"
import { Check, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  STACK_PRESETS, STACK_ESTIMATE, MLLM_ESTIMATE, stackFor,
  type StackPreset, type AgentStack,
} from "@/lib/campaign-data"
import type { StepProps } from "@/components/wizard/types"

/**
 * StackConfig — the model stack behind the voice (Step 1's second half).
 *
 * Two pipeline shapes: the classic STT→LLM→TTS cascade (per-slot provider
 * dropdowns) or a single multimodal realtime model (MLLM). Presets write
 * sensible vendor defaults; every slot stays individually overridable.
 * Estimates ($/min · latency) come from the preset (marked "~") and feed the
 * identity card live, so swapping Balanced → Fastest visibly moves the numbers.
 */

type Pipeline = NonNullable<AgentStack["pipeline"]>

const STT_OPTIONS = [
  { id: "Deepgram/nova-3", vendor: "Deepgram", model: "nova-3", label: "Deepgram Nova-3" },
  { id: "Deepgram/nova-2", vendor: "Deepgram", model: "nova-2", label: "Deepgram Nova-2" },
  { id: "Whisper/large-v3", vendor: "Whisper", model: "large-v3", label: "OpenAI Whisper large-v3" },
]

const LLM_OPTIONS = [
  { id: "OpenAI/gpt-4o", vendor: "OpenAI", model: "gpt-4o", label: "OpenAI GPT-4o" },
  { id: "OpenAI/gpt-4o-mini", vendor: "OpenAI", model: "gpt-4o-mini", label: "OpenAI GPT-4o mini" },
  { id: "Anthropic/claude-haiku", vendor: "Anthropic", model: "claude-haiku", label: "Anthropic Claude Haiku" },
]

const MLLM_OPTIONS = [
  { id: "OpenAI/gpt-4o-realtime", vendor: "OpenAI", model: "gpt-4o-realtime", label: "OpenAI GPT-4o Realtime" },
  { id: "Gemini/2.0-flash-live", vendor: "Google", model: "gemini-2.0-flash-live", label: "Gemini 2.0 Flash Live" },
]

const TTS_VENDORS = [
  { vendor: "ElevenLabs", label: "ElevenLabs", voices: ["rachel", "turbo", "blake"] },
  { vendor: "Azure", label: "Azure Neural", voices: ["en-US-Jenny", "en-US-Guy"] },
]

const LANGUAGES = ["English", "Spanish", "French", "German", "Hindi", "Mandarin"]

const PIPELINES: { id: Pipeline; title: string; desc: string }[] = [
  { id: "stt-llm-tts", title: "STT · LLM · TTS", desc: "Configure each stage of the cascade yourself." },
  // Finding 19: explain the tradeoff — never a circular "Configure your MLLM".
  { id: "mllm", title: "Multimodal LLM", desc: "One model handles speech in and out. Lower latency, fewer knobs." },
]

export function StackConfig({ draft, update }: StepProps) {
  const stack = draft.stack
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  const est = pipeline === "mllm" ? MLLM_ESTIMATE : STACK_ESTIMATE[stack.preset]

  const patch = (s: Partial<AgentStack>) => update({ stack: { ...stack, ...s } })

  const setPreset = (preset: StackPreset) =>
    update({ stack: { ...stackFor(preset), pipeline, language: stack.language } })

  const ttsVendor = TTS_VENDORS.find((v) => v.vendor === stack.tts.vendor) ?? TTS_VENDORS[0]

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold">Models behind the voice</h3>
        <p className="text-sm text-muted-foreground">
          A preset is all you need — open the dropdowns only if you want a specific provider.
        </p>
      </header>

      {/* Pipeline shape */}
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Pipeline">
        {PIPELINES.map((p) => {
          const selected = pipeline === p.id
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => patch({ pipeline: p.id })}
              className={cn(
                "flex items-start justify-between gap-2 rounded-lg border p-3 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:border-foreground/20 hover:bg-accent/40",
              )}
            >
              <span>
                <span className="block text-sm font-medium">{p.title}</span>
                <span className="block text-xs leading-relaxed text-muted-foreground">{p.desc}</span>
              </span>
              {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
            </button>
          )
        })}
      </div>

      {pipeline === "stt-llm-tts" ? (
        <>
          {/* Speed/cost preset */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Preset</Label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Stack preset">
              {(Object.keys(STACK_PRESETS) as StackPreset[]).map((p) => {
                const selected = stack.preset === p
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPreset(p)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                    )}
                  >
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                    {STACK_PRESETS[p].label}
                  </button>
                )
              })}
              <span className="self-center text-xs text-muted-foreground">
                {STACK_PRESETS[stack.preset].hint}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Speech-to-Text (STT)</Label>
              <Select
                value={`${stack.asr.vendor}/${stack.asr.model}`}
                onValueChange={(id) => {
                  const o = STT_OPTIONS.find((x) => x.id === id)
                  if (o) patch({ asr: { vendor: o.vendor, model: o.model } })
                }}
              >
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STT_OPTIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Language</Label>
              <Select value={stack.language ?? "English"} onValueChange={(language) => patch({ language })}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Large Language Model (LLM)</Label>
            <Select
              value={`${stack.llm.vendor}/${stack.llm.model}`}
              onValueChange={(id) => {
                const o = LLM_OPTIONS.find((x) => x.id === id)
                if (o) patch({ llm: { vendor: o.vendor, model: o.model } })
              }}
            >
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LLM_OPTIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Text-to-Speech (TTS)</Label>
              <Select
                value={ttsVendor.vendor}
                onValueChange={(vendor) => {
                  const v = TTS_VENDORS.find((x) => x.vendor === vendor)
                  if (v) patch({ tts: { vendor: v.vendor, voice: v.voices[0] } })
                }}
              >
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TTS_VENDORS.map((v) => <SelectItem key={v.vendor} value={v.vendor}>{v.label}</SelectItem>)}
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
                  {ttsVendor.voices.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Realtime model</Label>
            <Select
              value={MLLM_OPTIONS.find((o) => o.model === stack.llm.model)?.id ?? MLLM_OPTIONS[0].id}
              onValueChange={(id) => {
                const o = MLLM_OPTIONS.find((x) => x.id === id)
                if (o) patch({ llm: { vendor: o.vendor, model: o.model } })
              }}
            >
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MLLM_OPTIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Language</Label>
            <Select value={stack.language ?? "English"} onValueChange={(language) => patch({ language })}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Estimated ~{est.latencyMs} ms end-to-end · ~${est.costPerMin.toFixed(2)}/min — the card on the left updates as you change this.
      </p>
    </section>
  )
}
