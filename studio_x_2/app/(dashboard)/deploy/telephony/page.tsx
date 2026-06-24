import { redirect } from "next/navigation"

// Channel-specific deployment now lives in the channels inventory.
export default function DeployTelephonyLegacyRedirect() {
  redirect("/integrations?tab=channels")
}
