import { redirect } from "next/navigation"

// studio_x_2 wizard IA: API & SDK is Step 4 (Code type) of the creation wizard.
export default function ApiLegacyRedirect() {
  redirect("/agents/new/edit?dc=code")
}
