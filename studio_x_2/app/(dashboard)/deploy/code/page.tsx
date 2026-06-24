import { redirect } from "next/navigation"

// studio_x_2 wizard IA: deploying by code is now a step INSIDE the creation
// wizard (Step 4, Code type). The standalone /deploy/code page is gone — route
// into the wizard with the code channel preselected.
export default function DeployCodeLegacyRedirect() {
  redirect("/agents/new/edit?dc=code")
}
