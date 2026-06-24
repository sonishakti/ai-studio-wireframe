import { redirect } from "next/navigation"

// studio_x_2 wizard IA: creating an inbound deployment is now the creation
// wizard with the inbound channel preselected (Step 2 Inbound → Step 4 phone).
export default function NewInboundLegacyRedirect() {
  redirect("/agents/new/edit?dc=inbound")
}
