import { redirect } from "next/navigation"

// Embed/Code collapsed into the single Code surface (2026-06-11, user
// direction): the iframe embed is one snippet there, not a peer page.
export default function EmbedLegacyRedirect() {
  redirect("/deploy/code")
}
