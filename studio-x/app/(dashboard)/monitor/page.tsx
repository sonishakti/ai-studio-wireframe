import { redirect } from "next/navigation"

// Insights group dissolved. "What happened?" lives per-campaign now —
// open a campaign and use its Analytics tab.
export default function MonitorLegacyRedirect() {
  redirect("/campaigns")
}
