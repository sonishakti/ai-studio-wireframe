"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ChannelHero } from "@/components/channel-hero"
import type { Agent } from "@/lib/campaign-data"

/**
 * AgentDeploymentPanel — the "Deploy" step of the agent editor. Always the same
 * go-live surface: the shared ChannelHero (Answer a number · Launch batch calls ·
 * Embed in your app). Live status, stats and "where it answers" now live in
 * Monitor — this step is only about choosing a channel and going live, so it
 * stays identical whether the agent is a fresh draft or already running.
 */
export function AgentDeploymentPanel({ id, agent }: { id: string; agent?: Agent }) {
  const heroAgent = { id, name: agent?.name ?? "Untitled agent", status: agent?.status ?? "draft" }

  return (
    <div className="space-y-5">
      <ChannelHero agent={heroAgent} />
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
