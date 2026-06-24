import type { AgentDraft } from "@/lib/wizard-draft"

/** Shared contract every wizard step receives. `update` shallow-merges a patch
 *  into the single AgentDraft the host owns (autosaved + step-gated there). */
export interface StepProps {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
}

export const STEP_TITLES = [
  "Choose your voice",
  "Select agent type",
  "System prompt",
  "Configure",
  "Test & publish",
] as const
