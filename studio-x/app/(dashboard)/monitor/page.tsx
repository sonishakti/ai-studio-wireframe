import { redirect } from "next/navigation"

// Monitor dissolved. Performance is campaign-scoped — open a campaign for its
// Analytics tab. Cross-campaign call search lives at /campaigns/calls.
export default function MonitorLegacyRedirect() {
  redirect("/campaigns")
}
