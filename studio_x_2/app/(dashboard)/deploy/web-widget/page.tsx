import { redirect } from "next/navigation"

// studio_x_2 wizard IA: the web widget is configured INSIDE the creation wizard
// (Step 4, Inbound → Web widget). Route into the wizard with web preselected.
export default function DeployWebWidgetLegacyRedirect() {
  redirect("/agents/new/edit?dc=web")
}
