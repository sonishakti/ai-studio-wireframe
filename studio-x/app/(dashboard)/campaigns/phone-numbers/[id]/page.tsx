import { redirect } from "next/navigation"

// Legacy deep link → the promoted top-level /phone-numbers/[id].
export default async function PhoneNumberLegacyRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/phone-numbers/${id}`)
}
