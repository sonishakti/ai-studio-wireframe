"use client"

import * as React from "react"
import { UserRound } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { extractVars } from "@/lib/campaign-data"
import { allVoices, PRESET_VOICES, type VoiceArtifact } from "@/lib/voice-artifacts"
import type { StepProps } from "@/components/wizard/types"
import { typeLabel } from "@/lib/wizard-draft"

/**
 * Section 2 — Prompt (v3 IA, 2026-07-17). The WORDS, rewritten per channel:
 * system prompt + greeting (moved here from the old Step 3) + the persona
 * (personality/tone — filed under Prompt per the IA even though the edit
 * surface stays the voice editor, tension T3). Sits AFTER Channel because the
 * prompt is channel-shaped — "Thank you for calling…" vs "Hey {{name}}, I'm
 * calling from…" — and batch {{variables}} come from the CSV.
 */
export function SectionPrompt({
  draft,
  update,
  onPickVoice,
}: StepProps & {
  /** Jump to Voice & speech › Voice — the persona block must never be a
   *  dead end (owner 2026-07-17: it read as "empty and unclickable"). */
  onPickVoice?: () => void
}) {
  const vars = extractVars(`${draft.systemPrompt} ${draft.greeting}`)

  // Persona rides the selected voice artifact (customs in localStorage —
  // load after mount, same idiom as step-voice). Read-only here: voice
  // customization left the builder (owner 2026-07-17 — selection only).
  const [voices, setVoices] = React.useState<VoiceArtifact[]>(PRESET_VOICES)
  React.useEffect(() => { setVoices(allVoices()) }, [])
  const selected = draft.voice ? voices.find((v) => v.id === draft.voice!.id) : undefined

  // Channel-aware helper copy: the greeting example follows the chosen channel
  // (v3 rule 2 — the fork determines the words).
  const greetingPlaceholder =
    draft.type === "outbound"
      ? "Hey {{name}}, I'm calling from Acme about your account…"
      : "Hi, thanks for calling Acme, how can I help?"

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {draft.type
          ? `Write what ${draft.name || "your agent"} says on ${typeLabel(draft.type)}.`
          : `Pick a channel first, then write the words for it.`}
      </p>

      <div className="max-w-3xl space-y-6">
        {/* 1 — System prompt */}
        <div id="wz-2-prompt" className="scroll-mt-28 space-y-2">
          <Label htmlFor="wz-prompt" className="text-sm font-medium">System prompt</Label>
          <Textarea
            id="wz-prompt"
            value={draft.systemPrompt}
            onChange={(e) => update({ systemPrompt: e.target.value })}
            className="min-h-[200px] font-mono text-sm leading-relaxed"
            placeholder={"You are a helpful voice agent for Acme.\nBe concise. Greet the caller, resolve their request, and escalate to a human if asked.\nUse {{name}} and {{account}} when available."}
          />
          {/* Variable chips: on Batch calls these are filled from the CSV
              uploaded in Channel — the dependency runs channel → prompt. */}
          {vars.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs text-muted-foreground">
                Variables detected{draft.type === "outbound" ? " (filled from your contacts CSV)" : ""}:
              </span>
              {vars.map((v) => (
                <Badge key={v} variant="secondary" className="h-6 px-2 font-mono text-xs">{`{{${v}}}`}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* 2 — Greeting */}
        <div id="wz-2-greeting" className="scroll-mt-28 space-y-2">
          <Label htmlFor="wz-greeting" className="text-sm font-medium">Greeting</Label>
          <Textarea
            id="wz-greeting"
            value={draft.greeting}
            onChange={(e) => update({ greeting: e.target.value })}
            className="min-h-[72px] text-sm"
            placeholder={greetingPlaceholder}
          />
          <p className="text-xs text-muted-foreground">
            The first thing your agent says.
          </p>
        </div>

        {/* 3 — Persona (personality · tone). Read-only: it comes with the
            selected voice. Both states carry ONE action — jump to the voice
            picker — so this block is never a dead end. */}
        <div id="wz-2-persona" className="scroll-mt-28 space-y-3 border-t border-border pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <UserRound className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Persona</p>
                <p className="text-xs text-muted-foreground">
                  {selected ? `Comes with ${selected.name}, the selected voice.` : "Comes with the voice you pick."}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={onPickVoice}>
              {selected ? "Change voice" : "Pick a voice"}
            </Button>
          </div>
          {selected && (
            <dl className="space-y-1.5 rounded-lg border border-border bg-card p-4 text-sm">
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Personality</dt>
                <dd className="min-w-0">{selected.personality}</dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tone</dt>
                <dd>{selected.tone}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  )
}
