import { redirect } from "next/navigation"

// The fallback for any trunk link that lost its number: the inventory, at the
// Trunk column, which is where a trunk is read. It used to land on the channels
// table, which carries no trunk address, no credential and no allowlist.
export default function DeployTelephonyLegacyRedirect() {
  redirect("/deploy/phone-numbers?focus=trunk-column")
}
