import { redirect } from "next/navigation"

// Channel-specific deployment moved into the campaign wizard's configure step.
export default function DeployWhatsAppLegacyRedirect() {
  redirect("/deploy/batch-calls/new")
}
