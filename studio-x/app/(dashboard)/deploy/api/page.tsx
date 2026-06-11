import { redirect } from "next/navigation"

// API & SDK folded into Deploy › Embed / Code (2026-06-11 intent-first revamp).
export default function ApiLegacyRedirect() {
  redirect("/deploy/code")
}
