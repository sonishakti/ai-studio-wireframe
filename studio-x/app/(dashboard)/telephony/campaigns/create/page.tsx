import { redirect } from "next/navigation"

// New campaign creation lives in the omnichannel wizard.
export default function TelephonyCreateLegacyRedirect() {
  redirect("/deploy/batch-calls/new")
}
