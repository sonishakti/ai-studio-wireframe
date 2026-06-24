import { redirect } from "next/navigation"

// Phone Numbers moved under the Deploy hub (2026-06-11 intent-first revamp).
export default async function PhoneNumberLegacyRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/deploy/phone-numbers/${id}`)
}
