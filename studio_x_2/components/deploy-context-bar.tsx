"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAgent } from "@/lib/campaign-data"

/**
 * DeployContextBar — the "you came from an agent, here's the way back" rail.
 *
 * Every deploy surface (code, web widget, phone numbers, inbound/batch wizards)
 * can be opened FROM the agent builder's Deploy step (it passes ?agent=…). When
 * it is, this slim sticky bar keeps the agent in view and gives a one-click
 * return to the builder's Deploy step — so configuring a channel never strands
 * you. Renders nothing when there's no agent context (the page still works
 * standalone from Resources › Deployment Channels).
 *
 * Reads window.location.search (not useSearchParams) so it needs no Suspense
 * boundary — matching the pattern the deploy wizards already use for ?agent=.
 */
export function DeployContextBar({ channelLabel }: { channelLabel: string }) {
  const [agent, setAgent] = React.useState<{ id: string; name: string } | null>(null)

  React.useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("agent")
    if (!id) return
    const a = getAgent(id)
    setAgent(a ? { id: a.id, name: a.name } : { id, name: "your agent" })
  }, [])

  if (!agent) return null

  return (
    <div className="sticky top-12 z-10 flex items-center gap-1.5 border-b bg-muted/40 px-4 py-1.5 text-sm backdrop-blur supports-[backdrop-filter]:bg-muted/30 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 h-7 gap-1.5">
        <Link href={`/agents/${agent.id}/edit?step=4`} title={`Back to ${agent.name}`}>
          <ArrowLeft className="h-3.5 w-3.5" />
          {agent.name}
        </Link>
      </Button>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{channelLabel}</span>
    </div>
  )
}
