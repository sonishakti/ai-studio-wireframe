import { redirect } from "next/navigation"

// 2026-06-24 full-rebuild IA: the batch-calls LIST moved into the channels
// inventory (Resources › Deployment Channels). The wizard
// (/deploy/batch-calls/new) and detail (/deploy/batch-calls/[id]) pages are kept.
export default function BatchCallsListLegacyRedirect() {
  redirect("/integrations?tab=channels")
}
