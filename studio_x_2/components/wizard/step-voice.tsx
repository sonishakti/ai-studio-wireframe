"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, Pencil, AudioLines, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  allVoices,
  PRESET_VOICES,
  type VoiceArtifact,
} from "@/lib/voice-artifacts"
import { StackConfig } from "@/components/wizard/stack-config"
import type { AgentDraft } from "@/lib/wizard-draft"

/**
 * Step 1 — Choose your Voice.
 *
 * Preset voices are IMMUTABLE (selectable). "Customize" forks a preset into a
 * new editable custom in the Playground (?from=) — this is the spec's "Edit Aria
 * → custom artifact". Custom voices edit in place (?artifact=). "Create custom
 * voice" starts a blank one. All routes return here with the artifact selected.
 * Choosing any voice unlocks Step 2.
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

  return (
    <div className="space-y-5">
      {/* Section heading (sized like StackConfig's) — the drawer's SheetTitle
          "Voice & models" is the screen heading; this labels the persona half. */}
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Choose your voice</h3>
          {/* The playground is otherwise reachable only via per-voice links —
              give it a stable, always-visible door (heuristic-eval #9). */}
          <button
            type="button"
            onClick={() => router.push(`/agents/playground?agent=${draft.agentId ?? "new"}`)}
            className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Voice playground →
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Pick a ready-made voice or build your own. This sets how your agent sounds and its starting personality — the models behind it are below.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {voices.map((v) => {
          const selected = draft.voice?.id === v.id
          const isCustom = v.kind === "custom"
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVoice(v)}
              aria-pressed={selected}
              className={cn(
                "group relative flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:border-foreground/20 hover:bg-accent/40",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <AudioLines className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{v.name}</p>
                    {isCustom ? (
                      <Badge variant="secondary" className="h-6 px-2 text-xs font-medium">Custom</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        title="Ready-made voice — use Customize to make an editable copy"
                        className="h-6 gap-1 px-2 text-xs font-medium text-muted-foreground"
                      >
                        <Lock className="h-3 w-3" aria-hidden /> Preset
                        <span className="sr-only">— ready-made voice; use Customize to make an editable copy</span>
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{v.tagline}</p>
                </div>
                {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </div>

              <p className="line-clamp-2 text-sm text-muted-foreground">
                &ldquo;{v.firstMessage}&rdquo;
              </p>

              {/* Presets are immutable — "Customize" forks a copy into the
                  Playground (?from=). Customs edit in place (?artifact=). Both
                  return here with the resulting artifact selected. */}
              {(() => {
                const origin = draft.agentId ?? "new"
                const href = isCustom
                  ? `/agents/playground?artifact=${v.id}&agent=${origin}`
                  : `/agents/playground?from=${v.id}&agent=${origin}`
                const label = isCustom ? "Edit in playground" : "Customize"
                const goEdit = (e: React.SyntheticEvent) => {
                  e.stopPropagation()
                  router.push(href)
                }
                return (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={isCustom ? `Edit ${v.name} in the playground` : `Customize ${v.name} into a new voice`}
                    onClick={goEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") goEdit(e)
                    }}
                    className="inline-flex w-fit items-center gap-1 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> {label}
                  </span>
                )
              })()}
            </button>
          )
        })}

        {/* Create custom voice — replaces the old "Edit Aria". */}
        <button
          type="button"
          onClick={() => router.push(`/agents/playground?agent=${draft.agentId ?? "new"}`)}
          className="flex min-h-[7rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/40 p-4 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Plus className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">Create custom voice</span>
          <span className="text-xs text-muted-foreground">Design one in the playground</span>
        </button>
      </div>

      {/* The models behind the voice — STT/LLM/TTS cascade or one realtime model. */}
      <div className="border-t border-border pt-5">
        <StackConfig draft={draft} update={update} />
      </div>
    </div>
  )
}
