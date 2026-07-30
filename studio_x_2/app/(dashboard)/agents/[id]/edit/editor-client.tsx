"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AgentWizard } from "@/components/wizard/agent-wizard"
import { getAgent } from "@/lib/campaign-data"
import { readSessionAgents } from "@/lib/agent-store"
import { restoreDraft } from "@/lib/wizard-draft"

/** Client half of the editor route — the server page resolves params. */
export function AgentEditorClient({ id }: { id: string }) {
  const router = useRouter()
  // Build-time-known ids ("new" + the AGENTS mock) mount immediately — SSR
  // parity with generateStaticParams. Everything else lives in browser
  // storage (agents deployed this session, per-agent draft slots), so the
  // verdict waits for mount.
  const staticKnown = id === "new" || !!getAgent(id)
  const [clientKnown, setClientKnown] = React.useState(false)
  React.useEffect(() => {
    if (staticKnown) return
    const known = readSessionAgents().some((a) => a.id === id) || !!restoreDraft(id)
    if (known) {
      setClientKnown(true)
      return
    }
    // Unknown id → back to the list with a notice (user-test 2026-07-29 S2):
    // an EDIT URL must never silently mount a blank new-agent wizard.
    toast.error("Agent not found", {
      description: `No agent "${id}" in this project — it may have been deleted. Showing all agents.`,
    })
    router.replace("/agents?view=list")
  }, [staticKnown, id, router])
  if (!staticKnown && !clientKnown) return null

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
