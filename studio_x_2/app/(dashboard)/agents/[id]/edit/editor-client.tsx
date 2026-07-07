"use client"

import { AgentWizard } from "@/components/wizard/agent-wizard"

/** Client half of the editor route — the server page resolves params. */
export function AgentEditorClient({ id }: { id: string }) {
  return <AgentWizard id={id} />
}
