import { redirect } from "next/navigation"

// studio_x_2 wizard IA: a LIVE batch deployment is managed in Monitor (the
// post-publish home), not a standalone deploy detail page.
export default function BatchCallsDetailLegacyRedirect() {
  redirect("/monitor")
}
