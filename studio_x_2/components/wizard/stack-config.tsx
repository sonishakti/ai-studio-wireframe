"use client"

import * as React from "react"
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RadioCard, RadioCardGroup } from "@/components/wizard/radio-cards"
import {
  STACK_PRESETS, STACK_CATALOG, stackFor, stackEstimateFor, stackNonStreaming,
  stackCost, slotMode, MANAGED_PROVIDERS, AGORA_RATE_PER_MIN,
  type StackPreset, type AgentStack, type CredentialMode,
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

/**
 * Who supplies the key for one slot — the control Agora's own API already has
 * (`credential_mode`, scoped per asr/llm/tts block) and the console never
 * surfaced. Per component, never global: the common real-world config is
 * managed LLM plus your own cloned ElevenLabs voice.
 *
 * The copy leads with the economics because Agora's are the inverse of every
 * competitor's: the platform rate is the same either way, and managed absorbs
 * the vendor bill. Everywhere else BYO saves you money; here it costs more.
 */
function SlotMode({
  slot, vendor, mode, onChange,
}: {
  slot: "asr" | "llm" | "tts"
  vendor: string
  mode: CredentialMode
  onChange: (m: CredentialMode) => void
}) {
  const resellable = vendor in MANAGED_PROVIDERS
  const rate = MANAGED_PROVIDERS[vendor]

  // A provider Agora can't resell must not offer a mode it can't honour.
  if (!resellable) {
    return (
      <p className="text-xs text-muted-foreground">
        {vendor} is bring-your-own-key only — Agora doesn&apos;t resell it.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => v && onChange(v as CredentialMode)}
        aria-label={`${slot.toUpperCase()} credentials`}
        className="grid grid-cols-2 gap-1"
      >
        <ToggleGroupItem
          value="managed"
          className="h-7 rounded-md border border-border px-2 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/5"
        >
          Agora managed
        </ToggleGroupItem>
        <ToggleGroupItem
          value="byo"
          className="h-7 rounded-md border border-border px-2 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/5"
        >
          Your own key
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">
        {mode === "managed"
          ? "Included — no key to add, no vendor bill."
          : `You add a ${vendor} key and they bill you directly (~$${rate.toFixed(3)}/min on top of Agora's rate).`}
      </p>
    </div>
  )
}

/** A model row in a picker — name plus what it costs you in latency and money.
 *  Competitor scan 2026-07-29: only Vapi shows the tradeoff at the point of
 *  choice; ElevenLabs, Synthflow, LiveKit and Cartesia all leave it in docs, so
 *  the user picks a model and discovers the cost later. */
function ModelOption({
  label, latencyMs, costPerMin, note,
}: {
  label: string
  latencyMs: number
  costPerMin: number
  note?: string
}) {
  return (
    <span className="flex w-full min-w-0 items-baseline justify-between gap-3">
      <span className="truncate">{label}</span>
      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
        {note ? `${note} · ` : ""}~{latencyMs} ms · ${costPerMin.toFixed(3)}/min
      </span>
    </span>
  )
}

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
            // The tooltip now carries the DOWNSIDE too — every hint used to be
            // one-sided upside, so no preset ever looked like a compromise.
            description={`~${pEst.latencyMs} ms · ~$${pEst.costPerMin.toFixed(2)}/min`}
            hint={`${preset.hint}. ${preset.tradeoff}`}
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
      {!hideTitle && <h4 className="text-base font-medium">Model Architecture</h4>}
      <RadioCardGroup
        value={pipeline}
        onValueChange={(v) => v && setPipeline(v as Pipeline)}
        aria-label="Pipeline"
        // Two cards, two tracks — a 4-col track squeezed them (2026-07-21).
        className="gap-4 @xl:grid-cols-2"
      >
        {/* Proposal 2639-102124 card copy. */}
        <RadioCard
          value="stt-llm-tts"
          title="Cascading Model"
          description="Chains multiple AI models together, best for high efficiency and lower costs"
        />
        <RadioCard
          value="mllm"
          title="Multimodal Large Language Model"
          description="Single, unified AI model. Best for deep, holistic understanding across multiple data types"
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
  stacked,
}: StackPieceProps & {
  /** Selected voice persona (e.g. "Luna") — named under the TTS voice so the
   *  two voice concepts reconcile on screen: persona "Luna" speaking with the
   *  "rachel" TTS voice read as a bug (user-test 2026-07-21 D2). */
  personaName?: string
  /** [label | content] hosting: the row label carries "Models". */
  hideTitle?: boolean
  /** Force ONE column — the Advanced sheet stacks STT → LLM → TTS top to
   *  bottom (owner 2026-07-29: it's a sequence to read, not parallel picks). */
  stacked?: boolean
}) {
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  const patch = (s: Partial<AgentStack>) => onChange({ ...stack, ...s })
  const modes = {
    asr: slotMode(stack, "asr"), llm: slotMode(stack, "llm"), tts: slotMode(stack, "tts"),
  }

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
            <div className={cn("grid grid-cols-1 gap-4", !stacked && "@lg:grid-cols-2")}>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-sm font-medium">Speech-to-Text (STT)</Label>
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
                      <SelectItem key={`${o.vendor}/${o.model}`} value={`${o.vendor}/${o.model}`}>
                        <ModelOption
                          label={o.label}
                          latencyMs={o.latencyMs}
                          costPerMin={o.costPerMin}
                          note={o.streaming ? undefined : "no streaming"}
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SlotMode
                  slot="asr" vendor={stack.asr.vendor} mode={slotMode(stack, "asr")}
                  onChange={(m) => patch({ credentialMode: { ...modes, asr: m } })}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-sm font-medium">Large Language Model (LLM)</Label>
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
                      <SelectItem key={`${o.vendor}/${o.model}`} value={`${o.vendor}/${o.model}`}>
                        <ModelOption label={o.label} latencyMs={o.latencyMs} costPerMin={o.costPerMin} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SlotMode
                  slot="llm" vendor={stack.llm.vendor} mode={slotMode(stack, "llm")}
                  onChange={(m) => patch({ credentialMode: { ...modes, llm: m } })}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-sm font-medium">Text-to-Speech (TTS)</Label>
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
                    {STACK_CATALOG.tts.map((v) => (
                      <SelectItem key={v.vendor} value={v.vendor}>
                        <ModelOption label={v.label} latencyMs={v.latencyMs} costPerMin={v.costPerMin} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SlotMode
                  slot="tts" vendor={stack.tts.vendor} mode={slotMode(stack, "tts")}
                  onChange={(m) => patch({ credentialMode: { ...modes, tts: m } })}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                {/* "TTS voice", not "Voice" — the persona picker sits directly
                    above this on Step 1; two controls named Voice read as a bug. */}
                <Label className="text-sm font-medium">TTS voice</Label>
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
            <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-sm font-medium">Realtime model</Label>
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

// ─── Configure a slot (Figma 2962-91425): vendor · credential · model ─────────

const SLOT_LABEL = { asr: "STT", llm: "LLM", tts: "TTS" } as const

/** "Configure LLM" — the per-slot sheet behind each model row's ⚙ button:
 *  Vendor, Credential (managed vs your own key — Agora's `credential_mode`,
 *  per slot), Model (or a Custom id), Save changes. */
function ConfigureSlotSheet({
  slot, stack, onChange, open, onOpenChange,
}: {
  slot: "asr" | "llm" | "tts"
  stack: AgentStack
  onChange: (next: AgentStack) => void
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const current = stack[slot]
  const vendors = React.useMemo(() => {
    const list = slot === "tts" ? STACK_CATALOG.tts : slot === "asr" ? STACK_CATALOG.stt : STACK_CATALOG.llm
    return [...new Set(list.map((o) => o.vendor))]
  }, [slot])

  const [vendor, setVendor] = React.useState(current.vendor)
  const [model, setModel] = React.useState(slot === "tts" ? stack.tts.voice : (current as { model: string }).model)
  const [mode, setMode] = React.useState<CredentialMode>(slotMode(stack, slot))
  const [custom, setCustom] = React.useState(false)
  React.useEffect(() => {
    if (open) {
      setVendor(current.vendor)
      setModel(slot === "tts" ? stack.tts.voice : (current as { model: string }).model)
      setMode(slotMode(stack, slot))
      setCustom(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const models: string[] = React.useMemo(() => {
    if (slot === "tts") return [...(STACK_CATALOG.tts.find((v) => v.vendor === vendor)?.voices ?? [])]
    const list = slot === "asr" ? STACK_CATALOG.stt : STACK_CATALOG.llm
    return list.filter((o) => o.vendor === vendor).map((o) => o.model)
  }, [slot, vendor])

  const resellable = vendor in MANAGED_PROVIDERS

  const save = () => {
    const modes = { asr: slotMode(stack, "asr"), llm: slotMode(stack, "llm"), tts: slotMode(stack, "tts") }
    const next: AgentStack = {
      ...stack,
      credentialMode: { ...modes, [slot]: resellable ? mode : "byo" },
      ...(slot === "tts"
        ? { tts: { vendor, voice: model } }
        : slot === "asr"
        ? { asr: { vendor, model } }
        : { llm: { vendor, model } }),
    }
    onChange(next)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-base">Configure {SLOT_LABEL[slot]}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Vendor</Label>
            <Select value={vendor} onValueChange={(v) => {
              setVendor(v)
              const first = slot === "tts"
                ? STACK_CATALOG.tts.find((x) => x.vendor === v)?.voices[0]
                : (slot === "asr" ? STACK_CATALOG.stt : STACK_CATALOG.llm).find((x) => x.vendor === v)?.model
              if (first) setModel(first)
            }}>
              <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {vendors.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Credential</Label>
              <a
                href="/integrations?tab=credentials"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Manage <span aria-hidden>↗</span>
              </a>
            </div>
            <Select
              value={resellable ? mode : "byo"}
              onValueChange={(v) => setMode(v as CredentialMode)}
              disabled={!resellable}
            >
              <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {resellable && <SelectItem value="managed">Agora managed (included)</SelectItem>}
                <SelectItem value="byo">my-{vendor.toLowerCase().replace(/\s+/g, "-")}-{slot}-credential</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {!resellable
                ? `${vendor} is bring-your-own-key only — Agora doesn't resell it.`
                : mode === "managed"
                ? "Included — no key to add, no vendor bill."
                : `You add a ${vendor} key and they bill you directly, on top of Agora's rate.`}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{slot === "tts" ? "Voice" : "Model"}</Label>
            {custom ? (
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={slot === "tts" ? "custom-voice-id" : "custom-model-id"}
                className="font-mono text-sm"
              />
            ) : (
              <Select value={models.includes(model) ? model : models[0]} onValueChange={setModel}>
                <SelectTrigger className="w-full text-sm capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {models.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <label className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
              <Checkbox checked={custom} onCheckedChange={(c) => setCustom(!!c)} aria-label="Custom model id" />
              Custom
            </label>
          </div>
        </div>
        <div className="shrink-0 border-t border-border px-5 py-3">
          <Button className="w-full" onClick={save}>Save changes</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** "Or Configure models manually" (Figma 2998-93809) — the inline expander:
 *  Custom Stack recap + Reset, the architecture cards, then one row per model
 *  slot with a ⚙ door to its Configure sheet. */
export function ManualStackConfig({ stack, onChange, className }: StackPieceProps) {
  const [openSlot, setOpenSlot] = React.useState<"asr" | "llm" | "tts" | null>(null)
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  const diverged = pipeline === "stt-llm-tts" && divergedFromPreset(stack)

  const slotValue = (slot: "asr" | "llm" | "tts") => {
    if (slot === "tts") {
      const v = STACK_CATALOG.tts.find((x) => x.vendor === stack.tts.vendor)
      return `${v?.label ?? stack.tts.vendor} ${stack.tts.voice}`
    }
    const list = slot === "asr" ? STACK_CATALOG.stt : STACK_CATALOG.llm
    const cur = stack[slot] as { vendor: string; model: string }
    return list.find((o) => o.vendor === cur.vendor && o.model === cur.model)?.label ?? `${cur.vendor} ${cur.model}`
  }

  const reset = () => {
    const base = stackFor(stack.preset, stack.modality)
    onChange({ ...base, pipeline: "stt-llm-tts", language: stack.language })
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm">
          <span className="font-medium">Custom Stack</span>{" "}
          <span className="font-mono text-xs text-muted-foreground">
            {stack.asr.vendor} + {stack.llm.model} + {stack.tts.vendor}
          </span>
        </p>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
        </Button>
      </div>

      <StackModelsDetail stack={stack} onChange={onChange} showPicker={false} />

      {pipeline === "stt-llm-tts" ? (
        <div className="space-y-4">
          {(["asr", "llm", "tts"] as const).map((slot) => (
            <div key={slot} className="min-w-0 space-y-1.5">
              <Label className="text-sm font-medium">
                {slot === "asr" ? "Speech-to-Text (STT)" : slot === "llm" ? "Large Language Model (LLM)" : "Text-to-Speech (TTS)"}
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenSlot(slot)}
                  className="flex h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Configure ${SLOT_LABEL[slot]}`}
                >
                  <span className="truncate capitalize">{slotValue(slot)}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0"
                  aria-label={`Configure ${SLOT_LABEL[slot]} vendor and credential`}
                  onClick={() => setOpenSlot(slot)}
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StackModelPicker stack={stack} onChange={onChange} hideTitle stacked />
      )}

      {openSlot && (
        <ConfigureSlotSheet
          slot={openSlot}
          stack={stack}
          onChange={onChange}
          open={!!openSlot}
          onOpenChange={(o) => !o && setOpenSlot(null)}
        />
      )}
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

/** "Balanced — Deepgram STT · gpt-4o-mini · ElevenLabs voice": the preset name
 *  plus the vendors it bundles, from the CURRENT stack so per-slot overrides
 *  stay truthful ("Custom mix" once diverged). */
const bundleLine = (s: AgentStack, diverged: boolean) =>
  `${diverged ? "Custom mix" : STACK_PRESETS[s.preset].label} — ${s.asr.vendor} STT · ${s.llm.model} · ${s.tts.vendor} voice`

export function StackTradeoffSlider({
  stack, onChange, className, lean,
}: StackPieceProps & {
  /** Builder hot-path mode (Plain Form winner, 2026-07-29): no card chrome,
   *  no mono label, one estimate line. The Playground default is unchanged. */
  lean?: boolean
}) {
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  if (pipeline === "mllm") return null

  const idx = Math.max(0, SLIDER_ORDER.indexOf(stack.preset))
  const diverged = divergedFromPreset(stack)
  const est = stackEstimateFor(stack)
  const cost = stackCost(stack)
  const nonStreaming = stackNonStreaming(stack)

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

  // Proposal 2639-102124: the slider reads Lowest Cost → Fastest left-to-
  // right, inside a card with a mono "LATENCY VS COST" label and the two
  // extremes' real numbers at the track ends.
  const DISPLAY: StackPreset[] = ["cheapest", "balanced", "fastest"]
  const displayIdx = Math.max(0, DISPLAY.indexOf(SLIDER_ORDER[idx]))
  const cheapEst = stackEstimateFor(stackFor("cheapest", stack.modality))
  const fastEst = stackEstimateFor(stackFor("fastest", stack.modality))

  return (
    <section className={cn("@container space-y-4", !lean && "rounded-lg border border-border bg-card p-5", className)}>
      {!lean && <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Latency vs cost</p>}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={cn(displayIdx === 0 && "font-medium")}>Lowest Cost</span>
          <span className={cn(displayIdx === 1 && "font-medium")}>Balanced</span>
          <span className={cn(displayIdx === 2 && "font-medium")}>Fastest</span>
        </div>
        <Slider
          value={[displayIdx]}
          min={0}
          max={DISPLAY.length - 1}
          step={1}
          onValueChange={([v]) => setPreset(DISPLAY[v])}
          aria-label="Latency versus cost"
        />
        {!lean && (
          <div className="flex items-baseline justify-between font-mono text-xs tabular-nums text-muted-foreground">
            <span>{cheapEst.latencyMs} ms · ~${cheapEst.costPerMin.toFixed(2)}/min</span>
            <span>{fastEst.latencyMs} ms · ~${fastEst.costPerMin.toFixed(2)}/min</span>
          </div>
        )}
      </div>
      {/* Name the bundle, not just its numbers (user-test 2026-07-29): the
          preset is a VENDOR bundle, and real model control exists — both must
          read without hovering. Diverged mixes are named honestly — AND the
          numbers now move with the models, which they previously did not. */}
      {lean ? (
        /* Figma 2861-61019: "Agora Balanced:  Deepgram Nova + GPT-5 nano +
           Flash v2.5 (250 ms, ~$0.10/min)" — name the bundle, then its parts. */
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium">
            {diverged ? "Custom Stack:" : `Agora ${STACK_PRESETS[stack.preset].label}:`}
          </span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {stack.asr.vendor} + {stack.llm.model} + {stack.tts.vendor} ({est.latencyMs} ms, ~${est.costPerMin.toFixed(2)}/min)
          </span>
        </p>
      ) : (
        <p className="font-mono text-xs tabular-nums text-muted-foreground">
          Current: {bundleLine(stack, diverged)} · ~{est.latencyMs} ms · ~${est.costPerMin.toFixed(2)}/min
        </p>
      )}
      {/* Where the money actually goes. Agora charges its platform rate either
          way and managed absorbs the vendor bill, so managed is CHEAPER — the
          inverse of every competitor, and previously invisible. Arithmetic, not
          adjectives: the two numbers and their sum. */}
      <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs">
        {cost.allManaged ? (
          <p>
            <span className="font-medium">${cost.totalPerMin.toFixed(2)}/min, all in.</span>{" "}
            Speech, model, and voice are included in Agora&apos;s rate — no vendor keys, no second bill.
          </p>
        ) : (
          <div className="space-y-0.5">
            <p className="tabular-nums">
              Agora ${cost.platformPerMin.toFixed(2)}/min
              {" + "}
              your {cost.byoSlots.join(" and ")} vendor{cost.byoSlots.length > 1 ? "s" : ""} ~${cost.vendorPerMin.toFixed(2)}/min
              {" = "}
              <span className="font-medium">~${cost.totalPerMin.toFixed(2)}/min</span>
            </p>
            <p className="text-muted-foreground">
              Agora&apos;s rate is the same either way, so your own key adds a bill rather than
              replacing one. Switch {cost.byoSlots.join("/")} to managed to pay only ${AGORA_RATE_PER_MIN.toFixed(2)}/min.
            </p>
          </div>
        )}
      </div>
      {/* The measurement boundary, stated. A latency figure with no stated
          boundary is unfalsifiable — every vendor quotes the flattering one. */}
      <p className="text-xs text-muted-foreground">
        Typical end-to-end: caller stops speaking → agent audio starts. Measured across our
        traffic, not a guarantee for your account.
      </p>
      {nonStreaming.length > 0 && (
        <p className="text-xs text-warning">
          {nonStreaming.join(", ")} doesn&apos;t stream — it transcribes only after the caller
          stops, which is most of the delay above.
        </p>
      )}
      {diverged && (
        <p className="text-xs text-muted-foreground">
          Moving the slider replaces your custom model mix.
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
