"use client"

import { use } from "react"
import { AgentWizard } from "@/components/wizard/agent-wizard"

/**
 * Agent editor → the unified creation WIZARD (2026-06-24, studio_x_2).
 *
 * ONE route, four entry modes:
 *   • id === "new"  → a fresh (or localStorage-restored) draft
 *   • id === "agt_*" → loads that agent into the wizard, every step unlocked
 *   • onboarding + empty-state → just link here; no separate wizard code
 *
 * The previous tab/breadcrumb editor (Stack/Knowledge/MCP/Connectors/Deploy) was
 * replaced wholesale by the 5-step wizard: Voice → Type → Prompt → Configure →
 * Test & publish. See `components/wizard/*`.
 */
export default function AgentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <AgentWizard id={id} />
}
