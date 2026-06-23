import { redirect } from "next/navigation"

// 2026-06-24 full-rebuild IA: "Go Live" is no longer a place. The channels
// inventory lives in Resources › Deployment Channels; the first-run hero (Aria)
// now lives on the Agents home. Deep links to the hub land on the inventory.
export default function DeployHubLegacyRedirect() {
  redirect("/integrations?tab=channels")
}
