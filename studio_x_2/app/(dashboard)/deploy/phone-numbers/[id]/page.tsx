import { PHONE_NUMBERS } from "@/lib/campaign-data"
import { PhoneNumberClient } from "./number-client"

/**
 * Server wrapper: pre-generates every mock number id so this route builds
 * STATIC. Dynamic (request-time) rendering left client pages under [id]
 * segments un-hydrated in this app: SSR HTML was served but React never
 * attached, so every field was inert (found 2026-07-07 on /agents/[id]/edit;
 * reproduced here on /deploy/phone-numbers/pn_02).
 */
export function generateStaticParams() {
  return PHONE_NUMBERS.map((n) => ({ id: n.id }))
}

export default async function EditPhoneNumberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PhoneNumberClient id={id} />
}
