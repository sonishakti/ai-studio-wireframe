"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mic, Plus, Upload, PhoneOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgentSphere } from "@/components/agent-test-panel"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { getDefaultAgent, type ImportedAgentConfig } from "@/lib/campaign-data"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"

/**
 * GoLiveHome — the believe-then-scale first-run home, RADICALLY simplified
 * (2026-06-24). It used to stack six heavy widgets (a ~320-line agent card with
 * an agent switcher + three test methods + intent presets + post-test outcomes,
 * three channel "cards", a free-minutes nudge, an already-live strip) and the
 * team said it looked far too complex.
 *
 * Now it's ONE lean hero: meet your ready-made agent (Aria) → talk to it
 * (believe) → create your own (scale). Import + "View all agents" live in the
 * page header. This won a 10-prototype audit — "bare hero" (V1): top first-run
 * fit, near-top on minimalism, no card clutter.
 */
export function GoLiveHome() {
  const router = useRouter()
  const agent = getDefaultAgent()
  const [talking, setTalking] = React.useState(false)

  React.useEffect(() => {
    track(Events.default_agent_provisioned, { agent_id: agent.id })
  }, [agent.id])

  const toggleTalk = () => {
    if (talking) {
      track(Events.agent_test_ended, { channel: "web", agent_id: agent.id, duration_sec: 30 })
    } else {
      track(Events.agent_test_started, { channel: "web", agent_id: agent.id })
    }
    setTalking((t) => !t)
  }

  // Import → carry it straight into the builder (the wizard's import accelerator).
  const onImported = (_config: ImportedAgentConfig) => {
    toast.success("Agent imported", { description: "Opening it in the builder…" })
    router.push("/agents/new/edit")
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <AgentSphere size={140} active={talking} />

      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {talking ? "Connected" : "Your ready-made agent"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {talking ? `${agent.name} is listening…` : `${agent.name} is ready`}
        </h1>
        {!talking && (
          <p className="max-w-md text-sm text-muted-foreground">
            Live from minute one. Talk to it, then put it to work — or build your own from scratch.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {talking ? (
          <Button size="lg" variant="destructive" className="gap-2" onClick={toggleTalk}>
            <PhoneOff className="h-4 w-4" /> End call
          </Button>
        ) : (
          <>
            <Button size="lg" className="gap-2" onClick={toggleTalk}>
              <Mic className="h-4 w-4" /> Talk to {agent.name}
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2">
              <Link href="/agents/new/edit">
                <Plus className="h-4 w-4" /> Create agent
              </Link>
            </Button>
          </>
        )}
      </div>

      {!talking && (
        <ImportAgentSheet onImported={onImported}>
          <button className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <Upload className="h-3.5 w-3.5" /> Import from Vapi, Retell or ElevenLabs
          </button>
        </ImportAgentSheet>
      )}
    </main>
  )
}
