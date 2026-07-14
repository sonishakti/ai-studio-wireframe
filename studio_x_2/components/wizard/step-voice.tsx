"use client"

import * as React from "react"
import { Plus, Pencil, ChevronDown, Play } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { VoiceBrowser } from "@/components/wizard/voice-browser"
import { StackPresetCards, StackModelsDetail } from "@/components/wizard/stack-config"
import { VoiceEditorSheet, type VoiceEditorMode } from "@/components/wizard/voice-editor-sheet"
import { allVoices, PRESET_VOICES, type VoiceArtifact } from "@/lib/voice-artifacts"
import { STACK_CATALOG } from "@/lib/campaign-data"
import type { AgentDraft } from "@/lib/wizard-draft"

/**
 * Step 1 — Voice & models. EVERYTHING ON ONE PAGE (owner 2026-07-09): the
 * voice picker, the voice editor (a sheet, not a route), the spoken language,
 * and the full model stack.
 *
 * ORDER = the Figma direction (2026-07-14): the speed/cost preset first (the
 * one decision most people make), then Voice + Spoken language side by side
 * (parallel choices), then "Configure Models" depth. Controls stay on the
 * select-box scale; the space between them is what grew.
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

  const editSelected = () => {
    if (!selected) return
    setEditor(selected.kind === "custom"
      ? { kind: "edit", artifact: selected }
      : { kind: "fork", from: selected })
  }

  return (
    <div className="space-y-8">
      <StackPresetCards stack={draft.stack} onChange={(stack) => update({ stack })} />

      {/* Voice + Spoken language: parallel choices, one row (Figma 2026-07-14).
          The voice keeps its select · Preview · Edit line (owner 2026-07-10). */}
      <div className="grid items-start gap-x-4 gap-y-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-2">
          <Label className="text-sm font-medium">Voice</Label>
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
                    {selected.tagline}{selected.kind === "custom" ? " · Custom" : ""}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">Browse voices</span>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selected}
              onClick={() => selected && toast(`Playing a sample of ${selected.name}`)}
              className="h-9 gap-1.5"
            >
              <Play className="h-3.5 w-3.5" aria-hidden /> Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selected}
              onClick={editSelected}
              className="h-9 gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
            </Button>
          </div>
          {/* The promise that used to be an intro paragraph, kept to one line. */}
          <p className="text-xs text-muted-foreground">
            A voice pre-fills your prompt and greeting only while they&apos;re empty — switching never overwrites your work.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditor({ kind: "create" })}
            className="h-8 gap-1.5 px-2 text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Create custom voice
          </Button>
        </div>

        {/* Spoken language — an agent trait, not a model detail. */}
        <div className="min-w-0 space-y-2">
          <Label className="text-sm font-medium">Spoken language</Label>
          <Select value={draft.stack.language ?? "English"} onValueChange={setLanguage}>
            <SelectTrigger className="w-full text-sm" aria-label="Spoken language"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STACK_CATALOG.languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <StackModelsDetail stack={draft.stack} onChange={(stack) => update({ stack })} />

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
