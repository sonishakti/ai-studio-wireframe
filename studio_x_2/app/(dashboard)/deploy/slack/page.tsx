import { redirect } from "next/navigation"

// Slack was a coming-soon channel. Channels now live in the inventory.
export default function DeploySlackLegacyRedirect() {
  redirect("/integrations?tab=channels")
}
