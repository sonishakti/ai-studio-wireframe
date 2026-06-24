import { redirect } from "next/navigation"

// Channel-specific deployment now lives in the channels inventory.
export default function DeploySmsLegacyRedirect() {
  redirect("/integrations?tab=channels")
}
