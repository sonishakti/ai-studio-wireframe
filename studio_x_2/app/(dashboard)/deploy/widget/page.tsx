import { redirect } from "next/navigation"

// studio_x_2 wizard IA: the web widget is Step 4 (Inbound → Web widget) of the wizard.
export default function WidgetLegacyRedirect() {
  redirect("/agents/new/edit?dc=web")
}
