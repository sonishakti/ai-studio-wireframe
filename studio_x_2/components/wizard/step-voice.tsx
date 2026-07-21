"use client"

import * as React from "react"
import { ChevronDown, Play } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { VoiceBrowser } from "@/components/wizard/voice-browser"
import { SectionRow } from "@/components/wizard/section-row"
import { allVoices, PRESET_VOICES, type VoiceArtifact } from "@/lib/voice-artifacts"
import { STACK_CATALOG } from "@/lib/campaign-data"
import type { AgentDraft } from "@/lib/wizard-draft"

/**
 * Section 3 — Voice & speech (v3 IA, 2026-07-17: Customize — only if needed).
 * The voice picker and the spoken language. SELECTION ONLY (owner 2026-07-17:
 * voice customization/creation was scope creep — users pick from the catalog;
 * the editor + "Create custom voice" were removed). The MODEL stack lives in
 * Models; turn-taking + attention/filters render below this component.
 */
export function StepVoice({
  draft,
  update,
  onSelectVoice,
}: {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
  onSelectVoice: (v: VoiceArtifact) => void
}) {
  // Customs (legacy/playground/import) live in localStorage — load after
  // mount to avoid hydration mismatch; still selectable, just not editable.
  const [voices, setVoices] = React.useState<VoiceArtifact[]>(PRESET_VOICES)
  const refreshVoices = React.useCallback(() => setVoices(allVoices()), [])
  React.useEffect(() => { refreshVoices() }, [refreshVoices])

  const selected = draft.voice ? voices.find((v) => v.id === draft.voice!.id) : undefined
  const [browserOpen, setBrowserOpen] = React.useState(false)

  const setLanguage = (language: string) => update({ stack: { ...draft.stack, language } })

  return (
    // [label | content] rows (owner 2026-07-21) — Voice and Spoken language
    // are each their own row; the host's <SectionRows> owns the container.
    <>
      <SectionRow
        id="wz-3-voice"
        label="Voice"
        hint={
          <>
            <p>Picking a voice fills in the prompt and greeting while they&apos;re empty.</p>
            {/* Two-layer reconciliation ECHOED here, not only in Models (user-test
                2026-07-21 verification, S3 residual #8): the persona and its
                vendor sound must meet on the page where the persona is picked. */}
            {selected && draft.stack.tts.voice && (
              <p>{selected.name} speaks with the <span className="font-mono capitalize">{draft.stack.tts.voice}</span> TTS sound — swap the sound in Models.</p>
            )}
          </>
        }
      >
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
      </SectionRow>

      {/* Spoken language — an agent trait, not a model detail. */}
      <SectionRow id="wz-3-language" label="Spoken language">
        <Select value={draft.stack.language ?? "English"} onValueChange={setLanguage}>
          <SelectTrigger className="w-full max-w-sm text-sm" aria-label="Spoken language"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STACK_CATALOG.languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </SectionRow>

      <VoiceBrowser
        open={browserOpen}
        onOpenChange={setBrowserOpen}
        voices={voices}
        selectedId={draft.voice?.id}
        onSelect={onSelectVoice}
      />
    </>
  )
}
