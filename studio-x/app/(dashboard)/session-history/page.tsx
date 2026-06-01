import { redirect } from "next/navigation"

// Session History is now the Sessions tab inside Realtime Services — it's RTC
// session telemetry, distinct from campaign call history.
export default function SessionHistoryLegacyRedirect() {
  redirect("/realtime-services/sessions")
}
