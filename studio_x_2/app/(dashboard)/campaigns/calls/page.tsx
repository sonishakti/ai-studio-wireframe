import { redirect } from "next/navigation"

// Call History is a top-level Observe surface now (global, filterable).
export default function CampaignCallsLegacyRedirect() {
  redirect("/calls")
}
