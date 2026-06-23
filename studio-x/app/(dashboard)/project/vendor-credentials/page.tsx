import { redirect } from "next/navigation"

// 2026-06-24 full-rebuild IA: vendor keys live as a tab inside Resources (the
// modules inventory). This standalone Project page is now a redirect so deep
// links keep working — the body renders via VendorCredentialsPanel in
// /integrations?tab=credentials.
export default function VendorCredentialsLegacyRedirect() {
  redirect("/integrations?tab=credentials")
}
