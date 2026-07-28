"use client"

import * as React from "react"
import { Play, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { RadioCard, RadioCardGroup } from "@/components/wizard/radio-cards"
import { SectionRow } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import { VoiceBrowser } from "@/components/wizard/voice-browser"
import { VoiceAdvancedSheet } from "@/components/wizard/voice-advanced-sheet"
import { allVoices, PRESET_VOICES, type VoiceArtifact } from "@/lib/voice-artifacts"
import {
  STACK_PRESETS, STACK_CATALOG, stackFor, stackEstimateFor,
  type StackPreset, type AgentStack,
} from "@/lib/campaign-data"
import { hasChannel, type AgentDraft } from "@/lib/wizard-draft"
import type { StepProps } from "@/components/wizard/types"

/**
 * Section 1 — VOICE (v4 IA, 2026-07-28): exactly TWO handles on the hot path —
 * the COST handle (Agora Cheapest · Balanced · Best tier cards, mapping to the
 * cheapest/balanced/fastest presets) and the VOICE handle (voices filtered to
 * the TTS provider the chosen tier ships, with an inline sound test). No
 * persona/template here — the template chip lives in the header. Everything
 * deeper (architecture, manual vendor picks, speech tuning, history) is behind
 * the Advanced slide-out, off the hot path.
 */

/** Display order + owner naming: cost ascends left to right. */
const TIERS: { preset: StackPreset; label: string }[] = [
  { preset: "cheapest", label: "Agora Cheapest" },
  { preset: "balanced", label: "Agora Balanced" },
  { preset: "fastest", label: "Agora Best" },
]

/** How many voices show inline before "Browse all voices". */
const QUICK_PICKS = 6

/** The tier's TTS provider — what filters the voice list. */
export function tierProvider(preset: StackPreset): "ElevenLabs" | "Azure" {
  return STACK_PRESETS[preset].tts.vendor === "Azure" ? "Azure" : "ElevenLabs"
}

/** Slots differ from the preset's writes → the tier reads as customized. */
const divergedFromPreset = (s: AgentStack) => {
  const p = STACK_PRESETS[s.preset]
  return (
    s.llm.vendor !== p.llm.vendor || s.llm.model !== p.llm.model ||
    s.asr.vendor !== p.asr.vendor || s.asr.model !== p.asr.model ||
    s.tts.vendor !== p.tts.vendor
  )
}

export function VoiceSection({
  draft,
  update,
  onSelectVoice,
  onStackChange,
}: StepProps & {
  /** Host-owned voice seeding (keeps the tier, adopts the voice's TTS). */
  onSelectVoice: (v: VoiceArtifact) => void
  /** Host-owned stack writes (scroll pinning + spy mute live there). */
  onStackChange: (stack: AgentDraft["stack"]) => void
}) {
  // Customs (playground/import) live in localStorage — load after mount to
  // avoid hydration mismatch.
  const [voices, setVoices] = React.useState<VoiceArtifact[]>(PRESET_VOICES)
  React.useEffect(() => { setVoices(allVoices()) }, [])

  const [browserOpen, setBrowserOpen] = React.useState(false)
  const [advancedOpen, setAdvancedOpen] = React.useState(false)

  const mllm = draft.stack.pipeline === "mllm"
  const diverged = !mllm && divergedFromPreset(draft.stack)
  const provider = tierProvider(draft.stack.preset)
  const selected = draft.voice ? voices.find((v) => v.id === draft.voice!.id) : undefined

  /** The COST handle. Switching tier may switch TTS provider — the voice
   *  follows: same-gender remap onto the new provider's catalog, said out
   *  loud in a toast. Balanced↔Best (both ElevenLabs) keeps the voice. */
  const setTier = (preset: StackPreset) => {
    const base = stackFor(preset, draft.stack.modality)
    const nextProvider = tierProvider(preset)
    const patch: Partial<AgentDraft> = {}
    let stack: AgentStack = {
      ...base,
      pipeline: "stt-llm-tts",
      language: draft.stack.language,
    }
    if (selected && (selected.provider ?? "ElevenLabs") !== nextProvider) {
      const pool = PRESET_VOICES.filter((v) => (v.provider ?? "ElevenLabs") === nextProvider)
      const remap = pool.find((v) => v.gender === selected.gender) ?? pool[0]
      if (remap) {
        patch.voice = { kind: "preset", id: remap.id }
        stack = { ...stack, tts: { vendor: nextProvider, voice: remap.ttsVoice } }
        toast(`Voice switched to ${remap.name}`, {
          description: `${TIERS.find((t) => t.preset === preset)?.label ?? preset} uses ${nextProvider} TTS — ${selected.name} isn't available there.`,
        })
      }
    } else {
      // Same provider: keep the current voice sound when the vendor offers it.
      const vendorVoices = (STACK_CATALOG.tts.find((v) => v.vendor === base.tts.vendor)?.voices ?? []) as readonly string[]
      const voice = vendorVoices.includes(draft.stack.tts.voice) ? draft.stack.tts.voice : base.tts.voice
      stack = { ...stack, tts: { vendor: base.tts.vendor, voice } }
    }
    if (patch.voice) update(patch)
    onStackChange(stack)
  }

  const playSample = (v: VoiceArtifact) =>
    toast("Simulated preview", {
      description: `No live audio in this wireframe — ${v.name}'s sample would play here.`,
    })

  const quickPicks = React.useMemo(() => {
    const pool = voices.filter((v) => (v.provider ?? "ElevenLabs") === provider)
    // The selected voice always shows, even past the quick-pick cut.
    const picks = pool.slice(0, QUICK_PICKS)
    if (selected && pool.includes(selected) && !picks.includes(selected)) picks[picks.length - 1] = selected
    return picks
  }, [voices, provider, selected])

  const setLanguage = (language: string) => update({ stack: { ...draft.stack, language } })

  return (
    <>
      {/* The COST handle. */}
      <SectionRow
        id="wz-1-tier"
        label="Model tier"
        hint="One handle for cost and latency — each tier bundles Agora-tuned speech recognition, model, and voice vendors."
      >
        {mllm ? (
          <p className="text-sm text-muted-foreground">
            This agent runs a realtime multimodal model — tiers apply to the cascading pipeline.
            Switch it back under <span className="font-medium text-foreground">Advanced</span> below.
          </p>
        ) : (
          <RadioCardGroup
            value={diverged ? "" : draft.stack.preset}
            onValueChange={(v) => v && setTier(v as StackPreset)}
            aria-label="Model tier"
            className="gap-4 @xl:grid-cols-3"
          >
            {TIERS.map((t) => {
              const est = stackEstimateFor(stackFor(t.preset, draft.stack.modality))
              return (
                <RadioCard
                  key={t.preset}
                  value={t.preset}
                  title={t.label}
                  description={`~$${est.costPerMin.toFixed(2)}/min · ~${est.latencyMs} ms`}
                  hint={STACK_PRESETS[t.preset].hint}
                />
              )
            })}
          </RadioCardGroup>
        )}
        {diverged && (
          <InfoHint label="Customized model mix">
            The models were hand-picked under Advanced, so no tier card is highlighted.
            Picking a tier replaces the mix with that tier&apos;s defaults.
          </InfoHint>
        )}
      </SectionRow>

      {/* The VOICE handle. */}
      <SectionRow
        id="wz-1-voice"
        label="Voice"
        hint={`Voices come from the ${provider} catalog your tier ships. Picking one fills in the prompt and greeting while they're empty.`}
      >
        <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2" role="radiogroup" aria-label="Voice">
          {quickPicks.map((v) => {
            const on = selected?.id === v.id
            return (
              <div
                key={v.id}
                className={cn(
                  "group relative flex min-w-0 items-center gap-2.5 rounded-lg border bg-card p-3 shadow-xs transition-colors",
                  on ? "border-primary" : "border-border hover:border-foreground/25",
                )}
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0 rounded-full"
                  onClick={() => playSample(v)}
                  aria-label={`Play a sample of ${v.name}`}
                >
                  <Play className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onSelectVoice(v)}
                  className="min-w-0 flex-1 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="block text-sm font-medium">{v.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{v.tagline}</span>
                </button>
                <span
                  aria-hidden
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                    on ? "border-primary" : "border-muted-foreground/40",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full bg-primary transition-transform", on ? "scale-100" : "scale-0")} />
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setBrowserOpen(true)}>
            Browse all voices
          </Button>
          {selected && !quickPicks.some((v) => v.id === selected.id) && (
            <p className="text-xs text-muted-foreground">
              Current: <span className="font-medium text-foreground">{selected.name}</span> · {selected.tagline}
            </p>
          )}
        </div>

        {/* SDK builders skipped this section wholesale (user-test 2026-07-28
            P1) — say why it still matters to them. */}
        {hasChannel(draft, "code") && (
          <p className="text-xs text-muted-foreground">
            This voice is the TTS stage of your pipeline — it applies to Code / SDK agents too.
          </p>
        )}

        {/* Spoken language rides the voice handle. */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Spoken language</Label>
          <Select value={draft.stack.language ?? "English"} onValueChange={setLanguage}>
            <SelectTrigger className="w-full max-w-sm text-sm" aria-label="Spoken language"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STACK_CATALOG.languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Everything deeper leaves the hot path (owner 2026-07-28). */}
        <div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setAdvancedOpen(true)}>
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Advanced — models &amp; speech tuning
          </Button>
        </div>
      </SectionRow>

      <VoiceBrowser
        open={browserOpen}
        onOpenChange={setBrowserOpen}
        voices={voices}
        selectedId={draft.voice?.id}
        onSelect={(v) => {
          // A cross-provider pick from the full catalog flips the TTS vendor —
          // said out loud, never blocked.
          const p = v.provider ?? "ElevenLabs"
          if (!mllm && p !== provider) {
            toast(`${v.name} uses ${p} TTS`, {
              description: "The text-to-speech vendor follows the voice — the rest of the tier is unchanged.",
            })
          }
          onSelectVoice(v)
        }}
      />

      <VoiceAdvancedSheet
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        draft={draft}
        update={update}
        onStackChange={onStackChange}
      />
    </>
  )
}
