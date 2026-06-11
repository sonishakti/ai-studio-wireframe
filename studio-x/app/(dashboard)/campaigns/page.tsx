import { redirect } from "next/navigation"

// Campaigns → Batch Calls (2026-06-11 revamp): "campaign" specifically meant
// outbound batch dialing; inbound is a peer surface at /deploy/inbound.
export default function CampaignsLegacyRedirect() {
  redirect("/deploy/batch-calls")
}
