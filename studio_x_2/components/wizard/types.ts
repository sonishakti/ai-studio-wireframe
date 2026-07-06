import type { AgentDraft } from "@/lib/wizard-draft"

/** Shared contract every wizard step receives. `update` shallow-merges a patch
 *  into the single AgentDraft the host owns (autosaved + step-gated there). */
export interface StepProps {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
}

export const STEP_TITLES = [
  // "Voice & models" — the drawer holds the persona picker AND the model stack;
  // calling it just "voice" would mislabel the LLM/STT config (review finding 7).
  "Voice & models",
  "Select agent type",
  "System prompt",
  "Configure",
  "Deploy",
] as const
