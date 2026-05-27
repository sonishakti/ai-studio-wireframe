import { redirect } from "next/navigation"

// /deploy (the old "Channels" catalog) is deprecated. The umbrella term
// "Channels" conflicted with Agora's "channel" RTC connection meaning.
// Call-centre features now live under /campaigns. Per-agent deployment
// lives inside the agent builder's right-side Sheet.
export default function DeployLegacyRedirect() {
  redirect("/campaigns")
}
