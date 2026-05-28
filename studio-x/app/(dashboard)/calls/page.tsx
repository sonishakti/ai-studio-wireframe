import { redirect } from "next/navigation"

// Insights group dissolved. Call history is per-campaign now —
// open a campaign and use its Calls tab.
export default function CallsLegacyRedirect() {
  redirect("/campaigns")
}
