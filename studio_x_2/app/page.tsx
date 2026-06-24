import { redirect } from "next/navigation"

// 2026-06-23 agent-unification: the app root is "My Agents" — the single home
// (it absorbs the old Deploy home + Agents library). The agent is the unified
// thing; everything else (channels, modules) hangs off it.
export default function Root() {
  redirect("/agents")
}
