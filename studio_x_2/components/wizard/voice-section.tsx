"use client"

import * as React from "react"
import { ChevronDown, Play, SlidersHorizontal } from "lucide-react"
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
import { StackTradeoffSlider } from "@/components/wizard/stack-config"
import { allVoices, PRESET_VOICES, type VoiceArtifact } from "@/lib/voice-artifacts"
import { STACK_PRESETS, STACK_CATALOG, type AgentStack } from "@/lib/campaign-data"
import { hasChannel, type AgentDraft } from "@/lib/wizard-draft"
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

  return (
    <>
      {/* The COST handle — the previous LATENCY VS COST slider. */}
      <SectionRow
        id="wz-1-tier"
        label="Model tier"
        hint={<InfoHint label="What each stop changes">Each stop bundles Agora-tuned STT, model, and voice vendors.</InfoHint>}
      >
        {mllm ? (
          <p className="text-sm text-muted-foreground">
            Runs a realtime model — no tier slider. Switch pipelines in Advanced.
          </p>
        ) : (
          <StackTradeoffSlider stack={draft.stack} onChange={handleStackChange} lean />
        )}
      </SectionRow>

      {/* The VOICE handle — dropdown trigger + inline sound test. */}
      <SectionRow
        id="wz-1-voice"
        label="Voice"
        hint={<InfoHint label="Seeds prompt & greeting">A voice pick seeds the prompt and greeting while they&apos;re empty.</InfoHint>}
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBrowserOpen(true)}
              aria-label="Browse voices"
              className={cn(
                "flex h-9 min-w-0 flex-1 basis-56 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {selected ? (
                <span className="flex min-w-0 items-baseline gap-2">
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

        {/* SDK builders skipped this section wholesale (user-test 2026-07-28
            P1) — say why it still matters to them. */}
        {hasChannel(draft, "code") && (
          <p className="text-xs text-muted-foreground">
            Also applies to Code / SDK agents — it&apos;s the pipeline&apos;s TTS stage.
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

        {/* Everything deeper leaves the hot path. */}
        <div>
          {/* The door names its contents (user-test 2026-07-29 P1): barge-in /
              turn-taking hunters need "interruptions" ON the label to find it. */}
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setAdvancedOpen(true)}>
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Advanced — models, speech &amp; interruptions 
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
