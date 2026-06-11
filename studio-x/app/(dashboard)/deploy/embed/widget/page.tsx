import { redirect } from "next/navigation"

// Web Widget folded into Code — "Copy as iframe" lives there (2026-06-11).
export default function EmbedWidgetLegacyRedirect() {
  redirect("/deploy/code")
}
