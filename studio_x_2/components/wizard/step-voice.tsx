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
import type { AgentDraft } from "@/lib/wizard-draft"

/**
 * Step 1 — Choose your Voice.
 *
 * Preset voices are IMMUTABLE (selectable, never edited). Custom voices are
 * built in the Playground (or seeded from an Import) and can be edited. Choosing
 * any voice unlocks Step 2. "Create custom voice" (replacing the old "Edit Aria")
 * and a custom's "Edit" both route to the Playground.
 */
export function StepVoice({
  draft,
  onSelectVoice,
}: {
  draft: AgentDraft
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
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Choose your voice</h2>
        <p className="text-sm text-muted-foreground">
          Pick a ready-made voice or build your own. This sets how your agent sounds and its starting personality — you can fine-tune the rest next.
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
                      <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-normal">Custom</Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[11px] font-normal text-muted-foreground">
                        <Lock className="h-2.5 w-2.5" /> Preset
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{v.tagline}</p>
                </div>
                {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </div>

              <p className="line-clamp-2 text-xs text-muted-foreground/90">
                &ldquo;{v.firstMessage}&rdquo;
              </p>

              {isCustom && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/agents/playground?artifact=${v.id}`)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation()
                      router.push(`/agents/playground?artifact=${v.id}`)
                    }
                  }}
                  className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" /> Edit in playground
                </span>
              )}
            </button>
          )
        })}

        {/* Create custom voice — replaces the old "Edit Aria". */}
        <button
          type="button"
          onClick={() => router.push("/agents/playground")}
          className="flex min-h-[7rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/40 p-4 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Plus className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">Create custom voice</span>
          <span className="text-xs text-muted-foreground">Design one in the playground</span>
        </button>
      </div>
    </div>
  )
}
