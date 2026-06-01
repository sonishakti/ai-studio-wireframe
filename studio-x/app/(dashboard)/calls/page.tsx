import { redirect } from "next/navigation"

// Call History is now the Calls tab inside the Campaigns hub.
export default function CallsLegacyRedirect() {
  redirect("/campaigns/calls")
}
