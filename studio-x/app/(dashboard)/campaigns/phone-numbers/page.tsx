import { redirect } from "next/navigation"

// Phone Numbers was promoted to a top-level resource at /phone-numbers.
export default function PhoneNumbersLegacyRedirect() {
  redirect("/phone-numbers")
}
