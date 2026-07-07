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
  type VoiceArtifact,
} from "@/lib/voice-artifacts"
import { StackConfig } from "@/components/wizard/stack-config"
import type { AgentDraft } from "@/lib/wizard-draft"

/**
 * Step 1 — Voice & models.
 *
 * The voice picker is a compact Select (2026-07-07 directive: "what
 * differentiates them? It can be a simple dropdown") — each option carries the
 * persona's differentiator (tagline), and the selected voice previews its
 * opening line below. Presets are IMMUTABLE: "Customize" forks a copy into the
 * Playground (?from=); customs edit in place (?artifact=). Both routes return
 * here with the artifact selected. The model stack (preset-first) sits beside
 * it at xl widths.
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

  return (
    // Two columns only at 2xl: at 1280-1440 with the sidebar open, an xl split
    // squeezed each preset card to ~45px of content (audit 2026-07-07).
    // max-w-7xl keeps the columns readable on 4K instead of stretching.
    <div className="grid max-w-7xl gap-x-10 gap-y-6 2xl:grid-cols-2">
      {/* Voice persona */}
      <section className="min-w-0 space-y-4">
        <header className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Voice</h3>
            <button
              type="button"
              onClick={() => router.push(`/agents/playground?agent=${origin}`)}
              className="shrink-0 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Voice playground →
            </button>
          </div>
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
            <SelectTrigger className="w-full max-w-md text-sm" aria-label="Voice">
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
          <div className="max-w-md space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">
              Says: &ldquo;{selected.firstMessage}&rdquo;
            </p>
            <button
              type="button"
              onClick={() =>
                router.push(
                  selected.kind === "custom"
                    ? `/agents/playground?artifact=${selected.id}&agent=${origin}`
                    : `/agents/playground?from=${selected.id}&agent=${origin}`,
                )
              }
              className="inline-flex items-center gap-1 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {selected.kind === "custom" ? "Edit in playground" : "Customize this voice"}
            </button>
          </div>
        ) : (
          <p className="max-w-md text-sm text-muted-foreground">
            Each voice is a ready-made persona: tone, opening line, and starting prompt.
          </p>
        )}

        <button
          type="button"
          onClick={() => router.push(`/agents/playground?agent=${origin}`)}
          className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Create a custom voice
        </button>
      </section>

      {/* The models behind the voice — preset-first. */}
      <section className="min-w-0 border-t border-border pt-5 2xl:border-l 2xl:border-t-0 2xl:pl-10 2xl:pt-0">
        <StackConfig draft={draft} update={update} />
      </section>
    </div>
  )
}
