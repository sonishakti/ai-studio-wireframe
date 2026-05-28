import { redirect } from "next/navigation"

// Slack deployment was a coming-soon placeholder. Use the campaign wizard.
export default function DeploySlackLegacyRedirect() {
  redirect("/campaigns/new")
}
