import { redirect } from "next/navigation"

// studio_x_2 wizard IA: creating a batch (outbound) deployment is now the
// creation wizard with outbound preselected (Step 2 Outbound → Step 4 CSV).
export default function NewBatchCallsLegacyRedirect() {
  redirect("/agents/new/edit?dc=batch")
}
