import { redirect } from "next/navigation"

// studio_x_2 wizard IA: live batch deployments are managed in Monitor (the
// post-publish home). Creating one is the wizard (/deploy/batch-calls/new → ?dc=batch).
export default function BatchCallsListLegacyRedirect() {
  redirect("/monitor")
}
