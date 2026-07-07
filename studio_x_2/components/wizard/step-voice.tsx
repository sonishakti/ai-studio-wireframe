"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
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

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Voice</Label>
        <Select
          value={draft.voice?.id ?? ""}
          onValueChange={(id) => {
            const v = voices.find((x) => x.id === id)
            if (v) onSelectVoice(v)
          }}
        >
          <SelectTrigger className="w-full text-sm" aria-label="Voice">
            <SelectValue placeholder="Pick a voice" />
          </SelectTrigger>
          <SelectContent>
            {voices.map((v) => (
              <SelectItem key={v.id} value={v.id} textValue={v.name}>
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="font-medium">{v.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {v.tagline}{v.kind === "custom" ? " · Custom" : ""}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          {/* Where the engine lives now — signpost it at the exact control. */}
          <p className="text-xs text-muted-foreground/80">
            Speed, cost, and the STT / LLM / TTS models live with the voice — customize to change them.
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
