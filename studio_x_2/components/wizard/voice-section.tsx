"use client"

import * as React from "react"
import { ChevronDown, Code2, Gauge, Play, SlidersHorizontal, Wrench } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SectionRow } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import { VoiceBrowser } from "@/components/wizard/voice-browser"
import { VoiceAdvancedSheet } from "@/components/wizard/voice-advanced-sheet"
import { StackTradeoffSlider, ManualStackConfig } from "@/components/wizard/stack-config"
import { HistoryField } from "@/components/wizard/step-advanced"
import { allVoices, PRESET_VOICES, type VoiceArtifact } from "@/lib/voice-artifacts"
import { STACK_PRESETS, STACK_CATALOG, type AgentStack } from "@/lib/campaign-data"
import { hasChannel, overriddenSections, type AgentDraft } from "@/lib/wizard-draft"
import type { StepProps } from "@/components/wizard/types"

/**
 * Section 1 — VOICE (v6, owner 2026-07-29): the two handles, in the previous
 * controls — the COST handle is the LATENCY VS COST slider (three stops =
 * cheapest/balanced/fastest presets), the VOICE handle is the dropdown trigger
 * that opens the voice browser (no highlighted quick-pick grid) + an inline
 * sound test. Everything deeper (architecture, manual STT/LLM/TTS, custom
 * config, speech tuning) is behind the Advanced slide-out.
 */

/** The tier's TTS provider — the voice must stay coherent with it. */
function tierProvider(preset: AgentStack["preset"]): "ElevenLabs" | "Azure" {
  return STACK_PRESETS[preset].tts.vendor === "Azure" ? "Azure" : "ElevenLabs"
}

export function VoiceSection({
  draft,
  update,
  onSelectVoice,
  onStackChange,
}: StepProps & {
  /** Host-owned voice seeding (keeps the tier, adopts the voice's TTS). */
  onSelectVoice: (v: VoiceArtifact) => void
  /** Host-owned stack writes (spy mute lives there). */
  onStackChange: (stack: AgentDraft["stack"]) => void
}) {
  // Customs (playground/import) live in localStorage — load after mount to
  // avoid hydration mismatch.
  const [voices, setVoices] = React.useState<VoiceArtifact[]>(PRESET_VOICES)
  React.useEffect(() => { setVoices(allVoices()) }, [])

  const [browserOpen, setBrowserOpen] = React.useState(false)
  const [advancedOpen, setAdvancedOpen] = React.useState(false)
  const [manualOpen, setManualOpen] = React.useState(false)

  const mllm = draft.stack.pipeline === "mllm"
  const provider = tierProvider(draft.stack.preset)
  const selected = draft.voice ? voices.find((v) => v.id === draft.voice!.id) : undefined

  /** Slider writes ride through here: when the new stop's TTS provider differs
   *  from the current voice's, the voice follows (same-gender remap, said out
   *  loud) so vendor + voice never contradict. */
  const handleStackChange = (stack: AgentStack) => {
    const nextProvider = stack.tts.vendor === "Azure" ? "Azure" : "ElevenLabs"
    if (selected && (selected.provider ?? "ElevenLabs") !== nextProvider) {
      const pool = PRESET_VOICES.filter((v) => (v.provider ?? "ElevenLabs") === nextProvider)
      const remap = pool.find((v) => v.gender === selected.gender) ?? pool[0]
      if (remap) {
        update({ voice: { kind: "preset", id: remap.id } })
        onStackChange({ ...stack, tts: { vendor: nextProvider, voice: remap.ttsVoice } })
        toast(`Voice switched to ${remap.name}`, {
          description: `This tier uses ${nextProvider} TTS — ${selected.name} isn't available there.`,
        })
        return
      }
    }
    onStackChange(stack)
  }

  const setLanguage = (language: string) => update({ stack: { ...draft.stack, language } })

  const modelsOverridden = overriddenSections(draft).some((s) => s === "asr" || s === "llm" || s === "tts")

  return (
    <>
      {/* The model stack — slider + the manual door (Figma 2861-61019). */}
      <SectionRow
        id="wz-1-tier"
        label="Sets up Agora Conversational AI Engine"
        hint={<InfoHint label="What each stop changes">Each stop bundles Agora-tuned STT, model, and voice vendors.</InfoHint>}
      >
        {/* Overridden by Custom Config (Figma 2987-92308) — the JSON drawer
            owns these sections; the visual controls gray out until emptied. */}
        {modelsOverridden && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/50 bg-warning/5 px-3.5 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-warning">
              <Code2 className="h-4 w-4 shrink-0" aria-hidden /> Overridden by Custom Config
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-warning"
              onClick={() => window.dispatchEvent(new CustomEvent("sx:open-config-drawer", { cancelable: true }))}
            >
              View
            </Button>
          </div>
        )}
        <div className={cn(modelsOverridden && "pointer-events-none opacity-50")} aria-disabled={modelsOverridden || undefined}>
          <h4 className="flex items-center gap-2 pb-3 text-base font-medium">
            <Gauge className="h-4 w-4 text-muted-foreground" aria-hidden /> Choose your Model Stack
          </h4>
          {mllm ? (
            <p className="text-sm text-muted-foreground">
              Runs a realtime model — no tier slider. Switch pipelines under Configure models manually.
            </p>
          ) : (
            <StackTradeoffSlider stack={draft.stack} onChange={handleStackChange} lean />
          )}
        </div>

        {/* "Or Configure models manually" — inline expander (Figma 2998-93809). */}
        <div className="border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setManualOpen((o) => !o)}
            aria-expanded={manualOpen}
            className="flex w-full items-center justify-between gap-2 rounded text-left text-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" aria-hidden /> Or Configure models manually
            </span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", manualOpen && "rotate-180")} aria-hidden />
          </button>
          {manualOpen && (
            <div className={cn("space-y-4 pt-4", modelsOverridden && "pointer-events-none opacity-50")}>
              <ManualStackConfig stack={draft.stack} onChange={handleStackChange} />
              <HistoryField
                id="wz-1-history"
                value={draft.advanced}
                onChange={(advanced) => update({ advanced })}
              />
              {/* Power door — the JSON that outranks all of this. */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("sx:open-config-drawer", { cancelable: true }))}
                className="flex w-full items-center gap-2.5 rounded-lg border border-dashed border-border px-3.5 py-2.5 text-left text-sm transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Code2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Custom Config (JSON)</span>
                  <span className="block text-xs text-muted-foreground">Override engine sections as JSON — overridden sections lock in the UI.</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </SectionRow>

      {/* The VOICE handle — dropdown trigger + inline sound test. */}
      <SectionRow
        id="wz-1-voice"
        label="Agent Voice and Spoken Language"
        hint={<InfoHint label="Seeds prompt & greeting">A voice pick seeds the prompt and greeting while they&apos;re empty.</InfoHint>}
      >
        {/* Voice | Spoken language — parallel choices, side by side (Figma
            2861-61019). */}
        <div className="flex flex-wrap gap-4">
          <div className="min-w-0 flex-1 basis-64 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Voice</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBrowserOpen(true)}
                aria-label="Browse voices"
                className={cn(
                  "flex h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {selected ? (
                  <span className="flex min-w-0 items-baseline gap-2">
                    {/* The pink identity dot (Figma: "● Luna – Female, soft…"). */}
                    <span aria-hidden className="size-2 shrink-0 self-center rounded-full bg-primary" />
                    <span className="font-medium">{selected.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {selected.tagline}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Browse voices</span>
                )}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!selected}
                    // Same simulated-disclosure pattern as the Talk panel — a bare
                    // "Playing a sample" with no audio read as broken (user-test #9).
                    onClick={() => selected && toast("Simulated preview", {
                      description: `No live audio in this wireframe — ${selected.name}'s sample would play here.`,
                    })}
                    className="size-9"
                    aria-label="Preview voice"
                  >
                    <Play className="h-4 w-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Preview voice</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="min-w-0 basis-44 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Spoken language</Label>
            <Select value={draft.stack.language ?? "English"} onValueChange={setLanguage}>
              <SelectTrigger className="w-full text-sm" aria-label="Spoken language"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STACK_CATALOG.languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* SDK builders skipped this section wholesale (user-test 2026-07-28
            P1) — say why it still matters to them. */}
        {hasChannel(draft, "code") && (
          <p className="text-xs text-muted-foreground">
            Also applies to Code / SDK agents — it&apos;s the pipeline&apos;s TTS stage.
          </p>
        )}

        {/* Speech tuning leaves the hot path (Figma: "Advanced Speech
            Settings" — models moved inline above). */}
        <div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAdvancedOpen(true)}>
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Advanced Speech Settings
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
