import { redirect } from "next/navigation"

// Channel-specific deployment moved into the campaign wizard's configure step.
export default function DeployTelephonyLegacyRedirect() {
  redirect("/deploy/batch-calls/new")
}
