import { redirect } from "next/navigation"

// studio_x_2 wizard IA: embed/code is Step 4 (Code type) of the creation wizard.
export default function EmbedLegacyRedirect() {
  redirect("/agents/new/edit?dc=code")
}
