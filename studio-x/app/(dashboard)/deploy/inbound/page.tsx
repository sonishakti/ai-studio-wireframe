import { redirect } from "next/navigation"

// 2026-06-24 full-rebuild IA: the inbound deployment LIST moved into the
// channels inventory (Resources › Deployment Channels). The wizard
// (/deploy/inbound/new) and detail (/deploy/inbound/[id]) pages are kept.
export default function InboundListLegacyRedirect() {
  redirect("/integrations?tab=channels")
}
