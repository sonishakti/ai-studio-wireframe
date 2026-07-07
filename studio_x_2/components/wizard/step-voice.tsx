"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { VoiceBrowser } from "@/components/wizard/voice-browser"
import {
  allVoices,
  PRESET_VOICES,
  stashPlaygroundStack,
  type VoiceArtifact,
} from "@/lib/voice-artifacts"
import { STACK_CATALOG } from "@/lib/campaign-data"
import type { AgentDraft } from "@/lib/wizard-draft"

/**
 * Step 1 — Voice.
 *
 * Pick a voice (a ready-made persona) and the spoken language. The MODEL STACK
 * moved out (2026-07-07): the engine lives WITH the voice, so you set it in the
 * Playground when you customize. Presets are IMMUTABLE — "Customize this voice"
 * forks a copy into the Playground (?from=), a custom edits in place
 * (?artifact=); both return here with the artifact selected. The chosen voice's
 * cost/latency show on the agent card.
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
  const router = useRouter()
  // Customs live in localStorage — load after mount to avoid hydration mismatch.
  const [voices, setVoices] = React.useState<VoiceArtifact[]>(PRESET_VOICES)
  React.useEffect(() => {
    setVoices(allVoices())
  }, [])

  const selected = draft.voice ? voices.find((v) => v.id === draft.voice!.id) : undefined
  const origin = draft.agentId ?? "new"
  const [browserOpen, setBrowserOpen] = React.useState(false)
  const setLanguage = (language: string) => update({ stack: { ...draft.stack, language } })
  // Hand the agent's current engine to the Playground so customizing starts
  // from where it runs today, then navigate (stack-move review, 2026-07-07).
  const goPlayground = (suffix: string) => {
    stashPlaygroundStack(draft.stack)
    router.push(`/agents/playground?${suffix}&agent=${origin}`)
  }

  return (
    <div className="max-w-md space-y-5">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold">Voice</h3>
        <p className="text-sm text-muted-foreground">
          How your agent sounds and its starting personality.
        </p>
      </header>

      {/* Browse the full catalog (F5) — filters, traits, sample, voice IDs. */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Voice</Label>
        <button
          type="button"
          onClick={() => setBrowserOpen(true)}
          aria-label="Browse voices"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-left text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {selected ? (
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="font-medium">{selected.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {selected.tagline}{selected.kind === "custom" ? " · Custom" : ""}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Browse voices</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </div>

      <VoiceBrowser
        open={browserOpen}
        onOpenChange={setBrowserOpen}
        voices={voices}
        selectedId={draft.voice?.id}
        onSelect={onSelectVoice}
      />

      {selected ? (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">
            Says: &ldquo;{selected.firstMessage}&rdquo;
          </p>
          <button
            type="button"
            onClick={() =>
              goPlayground(selected.kind === "custom" ? `artifact=${selected.id}` : `from=${selected.id}`)
            }
            className="inline-flex items-center gap-1 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {selected.kind === "custom" ? "Edit in playground" : "Customize this voice"}
          </button>
          {/* Where the engine lives now — signpost it at the exact control.
              Realtime (multimodal) voices run a single model, so don't name the
              three cascade stages (audit 2026-07-07). */}
          <p className="text-xs text-muted-foreground/80">
            {draft.stack.pipeline === "mllm"
              ? "Speed, cost, and the realtime model live with the voice. Customize to change them."
              : "Speed, cost, and the STT / LLM / TTS models live with the voice. Customize to change them."}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Each voice is a ready-made persona: tone, opening line, and the models behind it.
        </p>
      )}

      <button
        type="button"
        onClick={() => goPlayground("new=1")}
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden /> Create a custom voice
      </button>

      {/* Spoken language stays here — it's an agent trait, not a model detail
          (heuristic-eval #16), and cheap to change without a Playground trip. */}
      <div className="space-y-1.5 border-t border-border pt-5">
        <Label className="text-xs text-muted-foreground">Spoken language</Label>
        <Select value={draft.stack.language ?? "English"} onValueChange={setLanguage}>
          <SelectTrigger className="w-full text-sm" aria-label="Spoken language"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STACK_CATALOG.languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
