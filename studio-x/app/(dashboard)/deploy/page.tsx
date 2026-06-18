import { GoLiveHome } from "@/components/go-live-home"

export const metadata = {
  title: "Go Live",
}

// The "Go Live" hub home (2026-06-18 IA reshuffle): a proper home, NOT a tabbed
// landing. One job — get the live agent onto real traffic (believe-then-scale hero
// → put-it-to-work → already-live). Sidebar handles wayfinding; the home stays
// focused. The deploy channel surfaces (Inbound · Batch Calls · Phone Numbers ·
// Web Widget · Code) keep their own <DeployNav> tabs on their own pages; the home
// no longer wears that chrome.
export default function DeployHubPage() {
  return <GoLiveHome />
}
