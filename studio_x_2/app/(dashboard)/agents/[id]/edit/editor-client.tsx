"use client"

import { AgentWizard } from "@/components/wizard/agent-wizard"

/** Client half of the editor route — the server page resolves params. */
export function AgentEditorClient({ id }: { id: string }) {
  return (
    <AgentWizard
      id={id}
      // "Start over" escape (owner 2026-07-14): explorers who dug themselves
      // into a config they don't want need a fresh start WITHOUT hunting for
      // /agents. ?blank=1 guarantees a truly blank draft; a full navigation
      // (not router.push) because the wizard's mount parser only runs on
      // mount — a same-route param push would no-op for id === "new".
      onCreateNew={() => window.location.assign("/agents/new/edit?blank=1")}
    />
  )
}
