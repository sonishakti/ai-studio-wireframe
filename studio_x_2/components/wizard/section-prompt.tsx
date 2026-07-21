"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { extractVars } from "@/lib/campaign-data"
import { SectionRow } from "@/components/wizard/section-row"
import type { StepProps } from "@/components/wizard/types"
import { typeLabel } from "@/lib/wizard-draft"

/**
 * Section 2 — Prompt (v3 IA, 2026-07-17). The WORDS, rewritten per channel:
 * system prompt + greeting. Sits AFTER Channel because the prompt is
 * channel-shaped — "Thank you for calling…" vs "Hey {{name}}, I'm calling
 * from…" — and batch {{variables}} come from the CSV. The system prompt is
 * the ONE behavior definition (owner 2026-07-21 — the Persona block was a
 * wireframe invention and is gone).
 *
 * Returns a FRAGMENT of SectionRows ([label | content], owner 2026-07-21):
 * the sub-question lives on the LHS, controls on the RHS.
 */
export function SectionPrompt({ draft, update }: StepProps) {
  const vars = extractVars(`${draft.systemPrompt} ${draft.greeting}`)

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
          ? `How ${draft.name || "your agent"} behaves on ${typeLabel(draft.type)} — instructions, rules, and what it says.`
          : "How your agent behaves — instructions, rules, and what it says. Pick a channel first to shape the words."}
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

      {/* NO Persona block (owner 2026-07-21: "we only had system prompt —
          where did Persona come from?"). The voice-artifact personality/tone
          seed was a wireframe invention; the ONE behavior definition is the
          system prompt above. Voice picking lives in Voice & speech. */}
    </>
  )
}
