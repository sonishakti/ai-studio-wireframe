import { DefectorFlow } from "@/components/defector-flow"

export const metadata = {
  title: "Defect to Agora — paste your agent, hear it ring",
}

// Radical activation experiment (2026-06-22) — the "Defector" prototype from the
// 4-flow activation study. A STANDALONE, no-dashboard entry built for developers
// leaving Vapi/Retell/Bland: paste a rival config → hear your own agent on Agora
// → claim a number. Deliberately outside (dashboard) so it has no sidebar chrome.
// Exploratory, not the default — the believe-then-scale /deploy home still leads.
export default function DefectPage() {
  return <DefectorFlow />
}
