import { redirect } from "next/navigation"

// Telephony is now a channel inside a campaign, not a separate destination.
export default function TelephonyCampaignsLegacyRedirect() {
  redirect("/campaigns")
}
