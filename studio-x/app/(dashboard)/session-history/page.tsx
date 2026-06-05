import { redirect } from "next/navigation"

// Session History → agent Sessions, now in the Monitor hub (Conversational AI
// conversation runs, not RTC telemetry).
export default function SessionHistoryLegacyRedirect() {
  redirect("/sessions")
}
