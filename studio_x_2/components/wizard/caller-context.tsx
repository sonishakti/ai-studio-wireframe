"use client"

import * as React from "react"
import { SectionRow } from "@/components/wizard/section-row"
import { promptVars, type AgentDraft } from "@/lib/wizard-draft"

/**
 * Caller context — the inbound sibling of the contact list (direction C,
 * 2026-09-17). The question both answer is the same one: what will the agent
 * know about the caller when it opens its mouth. Batch answers it with the
 * file it dials; an inbound agent has no file, and this row says so where the
 * question is asked rather than three sections away.
 *
 * It is a sentence, not a status table. Nothing in the product observes
 * whether a caller arrives carrying values, `llm.template_variables` is a
 * Start-call field the Console never sets for an inbound session, and every
 * shipped "Requires Engine" caption here carries a month or "planned"
 * (engine-row.tsx:54) — a promise there is no Engine item behind. So the row
 * names the variables the prompt declares, the mechanism that leaves them
 * empty, and the two ways out, and it renders nothing at all until a prompt
 * declares one: the default agent is unchanged until a reviewer types a
 * variable.
 *
 * `CampaignContacts` could not be extended — it takes a `CampaignDraft` and
 * writes `csvName` and `contacts` onto a run, and a run is a batch dial. The
 * two blocks share the SectionRow grammar and `lib/contact-list.ts`, not a
 * component.
 */

/** "{{a}}, {{b}} and {{c}}" — the declared tokens in prompt order. */
function tokenList(vars: string[]): string {
  const tokens = vars.map((v) => `{{${v}}}`)
  if (tokens.length < 2) return tokens.join("")
  return `${tokens.slice(0, -1).join(", ")} and ${tokens[tokens.length - 1]}`
}

export function CallerContextBlock({ draft }: { draft: AgentDraft }): React.ReactNode {
  const vars = promptVars(draft)
  if (vars.length === 0) return null
  // Number agreement only — the coverage panel next door already states its
  // one sentence both ways ("Missing 1 column … Add it").
  const one = vars.length === 1

  return (
    <SectionRow
      id="wz-2-caller-context"
      focusId="caller-context"
      label="Caller context"
      hint="What the agent knows about the caller before it speaks."
    >
      {/* The quiet line the batch coverage check uses, not a destructive
          panel: an inbound agent with variables still deploys. */}
      <p className="text-xs leading-relaxed text-muted-foreground">
        {tokenList(vars)} {one ? "has" : "have"} no value on an inbound call: Agora starts the
        call, not your app. Remove {one ? "it" : "them"} from the prompt, or deploy this agent as
        Code / SDK and set {one ? "it" : "them"} when your server starts the session.
      </p>
    </SectionRow>
  )
}
