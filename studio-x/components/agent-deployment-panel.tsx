"use client"

import Link from "next/link"
import { ArrowUpRight, Info } from "lucide-react"
import { ChannelHero } from "@/components/channel-hero"
import type { Agent } from "@/lib/campaign-data"

/**
 * AgentDeploymentPanel — the "Deploy" step of the agent editor. Always the same
 * go-live surface: the shared ChannelHero (Answer a number · Launch batch calls ·
 * Embed in your app). Live status, stats and "where it answers" now live in
 * Monitor — this step is only about choosing a channel and going live.
 *
 * Guard: a brand-new agent (id === "new") has never been saved, so the channel
 * cards are preview-only until it exists — you can't deploy a draft that hasn't
 * persisted yet.
 */
export function AgentDeploymentPanel({ id, agent }: { id: string; agent?: Agent }) {
  const isUnsaved = id === "new" || !agent
  const heroAgent = { id, name: agent?.name ?? "Untitled agent", status: agent?.status ?? "draft" }

  return (
    <div className="space-y-5">
      {isUnsaved && (
        <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/40 p-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            Save this agent first to deploy it. Finish the Persona and Stack steps, then
            the channels below unlock.
          </p>
        </div>
      )}
      <ChannelHero agent={heroAgent} disabled={isUnsaved} />
      <Link
        href="/monitor"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Manage live deployments in Monitor
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
