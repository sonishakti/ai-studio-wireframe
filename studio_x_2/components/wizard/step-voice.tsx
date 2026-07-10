"use client"

import * as React from "react"
import { Plus, Pencil, ChevronDown, Play } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { VoiceBrowser } from "@/components/wizard/voice-browser"
import { StackConfig } from "@/components/wizard/stack-config"
import { VoiceEditorSheet, type VoiceEditorMode } from "@/components/wizard/voice-editor-sheet"
import { allVoices, PRESET_VOICES, type VoiceArtifact } from "@/lib/voice-artifacts"
import { STACK_CATALOG } from "@/lib/campaign-data"
import type { AgentDraft } from "@/lib/wizard-draft"

/**
 * Step 1 — Voice & models.
 *
 * EVERYTHING ON ONE PAGE (owner 2026-07-09). This reverses the 2026-07-07
 * "engine lives in the Playground" call: reaching the multimodal-vs-cascade
 * choice took a route change plus two disclosures, and editing a voice meant
 * leaving the builder entirely.
 *
 *   • Voice   — pick a ready-made persona (browser modal) or make your own.
 *   • Models  — StackConfig inline, editing `draft.stack` directly. Preset and
 *               pipeline shape are both visible; only vendor dropdowns nest.
 *   • Voice editing/creating — a Sheet on this page, never `/agents/playground`.
 *
 * Presets are IMMUTABLE: "Customize" forks a preset into a new custom you own.
 * The standalone Playground route still exists (⌘K, agents list) but the
 * builder never sends you there.
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
  // Customs live in localStorage — load after mount to avoid hydration mismatch.
  const [voices, setVoices] = React.useState<VoiceArtifact[]>(PRESET_VOICES)
  const refreshVoices = React.useCallback(() => setVoices(allVoices()), [])
  React.useEffect(() => { refreshVoices() }, [refreshVoices])

  const selected = draft.voice ? voices.find((v) => v.id === draft.voice!.id) : undefined
  const [browserOpen, setBrowserOpen] = React.useState(false)
  const [editor, setEditor] = React.useState<VoiceEditorMode | null>(null)

  const setLanguage = (language: string) => update({ stack: { ...draft.stack, language } })

  // A saved voice is immediately selected, so the agent runs what you just made.
  const onVoiceSaved = (v: VoiceArtifact) => {
    refreshVoices()
    setEditor(null)
    onSelectVoice(v)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Pick the ready-made persona your agent speaks with, then tune the models behind it. A voice
        pre-fills your prompt and greeting only while they&apos;re empty; switching voices never
        overwrites what you&apos;ve written.
      </p>

      {/* ── Voice: pick · preview · make your own ── */}
      <div className="space-y-2">
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

        {/* A sample of the VOICE, plus the two make-your-own actions. Both open a
            sheet on this page (no Playground trip). */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {selected && (
            <button
              type="button"
              onClick={() => toast(`Playing a sample of ${selected.name}`)}
              className="inline-flex items-center gap-1.5 rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Play className="h-3.5 w-3.5" aria-hidden /> Preview voice
            </button>
          )}
          {selected && (
            <button
              type="button"
              onClick={() =>
                setEditor(selected.kind === "custom"
                  ? { kind: "edit", artifact: selected }
                  : { kind: "fork", from: selected })
              }
              className="inline-flex items-center gap-1.5 rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {selected.kind === "custom" ? "Edit voice" : "Customize"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditor({ kind: "create" })}
            className="inline-flex items-center gap-1.5 rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Create a custom voice
          </button>
        </div>
      </div>

      {/* Spoken language — an agent trait, not a model detail (heuristic-eval #16). */}
      <div className="max-w-xs space-y-1.5">
        <Label className="text-xs text-muted-foreground">Spoken language</Label>
        <Select value={draft.stack.language ?? "English"} onValueChange={setLanguage}>
          <SelectTrigger className="w-full text-sm" aria-label="Spoken language"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STACK_CATALOG.languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* ── Models & speed: inline. Preset + pipeline shape both visible. ── */}
      <div className="border-t border-border pt-5">
        <StackConfig stack={draft.stack} onChange={(stack) => update({ stack })} />
      </div>

      <VoiceBrowser
        open={browserOpen}
        onOpenChange={setBrowserOpen}
        voices={voices}
        selectedId={draft.voice?.id}
        onSelect={onSelectVoice}
      />
      <VoiceEditorSheet
        mode={editor}
        stack={draft.stack}
        onClose={() => setEditor(null)}
        onSaved={onVoiceSaved}
      />
    </div>
  )
}
