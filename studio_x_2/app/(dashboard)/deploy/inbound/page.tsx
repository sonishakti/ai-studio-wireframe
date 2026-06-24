import { redirect } from "next/navigation"

// studio_x_2 wizard IA: live inbound deployments are managed in Monitor (the
// post-publish home). Creating one is the wizard (/deploy/inbound/new → ?dc=inbound).
export default function InboundListLegacyRedirect() {
  redirect("/monitor")
}
