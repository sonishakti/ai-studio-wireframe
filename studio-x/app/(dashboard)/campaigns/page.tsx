import { redirect } from "next/navigation"

// Campaigns → Batch Calls, which now lives in the channels inventory
// (Resources › Deployment Channels). Routed straight there, no redirect chain.
export default function CampaignsLegacyRedirect() {
  redirect("/integrations?tab=channels")
}
