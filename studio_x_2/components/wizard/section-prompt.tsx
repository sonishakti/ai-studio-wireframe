"use client"

import * as React from "react"
import { UserRound } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { extractVars } from "@/lib/campaign-data"
import { allVoices, PRESET_VOICES, type VoiceArtifact } from "@/lib/voice-artifacts"
import { SectionRow } from "@/components/wizard/section-row"
import type { StepProps } from "@/components/wizard/types"
import { typeLabel } from "@/lib/wizard-draft"

/**
 * Section 2 — Prompt (v3 IA, 2026-07-17). The WORDS, rewritten per channel:
 * system prompt + greeting (moved here from the old Step 3) + the persona
 * (personality/tone — filed under Prompt per the IA even though the edit
 * surface stays the voice editor, tension T3). Sits AFTER Channel because the
 * prompt is channel-shaped — "Thank you for calling…" vs "Hey {{name}}, I'm
 * calling from…" — and batch {{variables}} come from the CSV.
 *
 * Returns a FRAGMENT of SectionRows ([label | content], owner 2026-07-21):
 * the sub-question lives on the LHS, controls on the RHS.
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
    <>
      {/* 1 — System prompt */}
      <SectionRow
        id="wz-2-prompt"
        label="System prompt"
        hint={draft.type
          ? `What ${draft.name || "your agent"} says on ${typeLabel(draft.type)}.`
          : "What your agent says. Pick a channel first to shape the words."}
      >
        <Textarea
          id="wz-prompt"
          aria-label="System prompt"
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
      </SectionRow>

      {/* 2 — Greeting */}
      <SectionRow id="wz-2-greeting" label="Greeting" hint="The first thing your agent says.">
        <Textarea
          id="wz-greeting"
          aria-label="Greeting"
          value={draft.greeting}
          onChange={(e) => update({ greeting: e.target.value })}
          className="min-h-[72px] text-sm"
          placeholder={greetingPlaceholder}
        />
      </SectionRow>

      {/* 3 — Persona (personality · tone). Read-only: it comes with the
          selected voice. Precedence stated once (user-test 2026-07-21, all 3
          personas): two behavior definitions on one page must say which wins. */}
      <SectionRow
        id="wz-2-persona"
        label={<span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-muted-foreground" aria-hidden /> Persona</span>}
        hint={
          <>
            <p>{selected ? `Comes with ${selected.name}, the selected voice.` : "Comes with the voice you pick."}</p>
            <p>
              Personality and tone flavor <em>how</em> it sounds — your system prompt above decides <em>what</em> it says.
            </p>
          </>
        }
      >
        {selected ? (
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
        ) : (
          <p className="text-sm text-muted-foreground">No voice selected yet.</p>
        )}
        <div>
          <Button variant="outline" size="sm" onClick={onPickVoice}>
            {selected ? "Change voice" : "Pick a voice"}
          </Button>
        </div>
      </SectionRow>
    </>
  )
}
