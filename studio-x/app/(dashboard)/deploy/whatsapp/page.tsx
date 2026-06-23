import { redirect } from "next/navigation"

// Channel-specific deployment now lives in the channels inventory.
export default function DeployWhatsAppLegacyRedirect() {
  redirect("/integrations?tab=channels")
}
