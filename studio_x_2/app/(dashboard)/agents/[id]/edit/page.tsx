import { AGENTS } from "@/lib/campaign-data"
import { AgentEditorClient } from "./editor-client"

/**
 * Agent editor → the unified creation WIZARD (2026-06-24, studio_x_2).
 *
 * ONE route, four entry modes:
 *   • id === "new"  → a fresh (or localStorage-restored) draft
 *   • id === "agt_*" → loads that agent into the wizard, every step unlocked
 *   • onboarding + empty-state → just link here; no separate wizard code
 *
 * SERVER wrapper + generateStaticParams: every mock agent id (plus "new") is
 * pre-generated so the route builds STATIC. Request-time rendering left client
 * pages under dynamic segments un-hydrated in this app: the SSR HTML showed
 * but React never attached, so templates never seeded, deep links never
 * scrolled, and every field was dead (found + bisected 2026-07-07; predates
 * the one-pager).
 */
export function generateStaticParams() {
  return [{ id: "new" }, ...AGENTS.map((a) => ({ id: a.id }))]
}

export default async function AgentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AgentEditorClient id={id} />
}
