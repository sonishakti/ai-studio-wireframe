import { redirect } from "next/navigation"

// Phone numbers moved under Campaigns since that's where they're assigned.
export default function TelephonyPhoneNumbersLegacyRedirect() {
  redirect("/phone-numbers")
}
