import { redirect } from "next/navigation"

// Usage moved into Billing — it's a commercial concern, not Insights.
export default function UsageLegacyRedirect() {
  redirect("/billing/usage")
}
