import { redirect } from "next/navigation"

// Phone Numbers moved under the Deploy hub (2026-06-11 intent-first revamp).
export default function PhoneNumbersLegacyRedirect() {
  redirect("/deploy/phone-numbers")
}
