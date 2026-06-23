import { redirect } from "next/navigation"

// Telephony is a channel in the inventory now, not a separate destination.
export default function TelephonyCampaignsLegacyRedirect() {
  redirect("/integrations?tab=channels")
}
