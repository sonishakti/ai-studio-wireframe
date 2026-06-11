import { redirect } from "next/navigation"

// Web Widget folded into Deploy › Embed / Code (2026-06-11 intent-first revamp).
export default function WidgetLegacyRedirect() {
  redirect("/deploy/code")
}
