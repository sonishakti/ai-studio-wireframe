import { redirect } from "next/navigation"

// /agents/agents → /agents. A doubled segment shows up in the wild (a base
// URL that already ends in /agents getting "/agents" appended — the user-test
// runner did exactly this, 2026-07-28) and otherwise falls into the
// [id] route as a dead agent page. Static segment wins over [id], so this
// catches it and lands on the list.
export default function AgentsDoubledSegmentRedirect() {
  redirect("/agents")
}
