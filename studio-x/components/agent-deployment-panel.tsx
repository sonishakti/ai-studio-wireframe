"use client"

import * as React from "react"
import Link from "next/link"
import { PhoneIncoming, PhoneOutgoing, Rocket, ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ChannelHero } from "@/components/channel-hero"
import {
  DEPLOYMENTS,
  STATUS_BADGE,
  deploymentHref,
  type Agent,
} from "@/lib/campaign-data"

/**
 * AgentDeploymentPanel — the "Deployment" section of the agent editor: where
 * THIS agent is live + how to put it on another channel (2026-06-23). Reuses
 * the shared ChannelHero, plus DEPLOYMENTS/STATUS_BADGE/deploymentHref. One
 * agent ↔ one channel, so going to another channel = duplicate.
 */
export function AgentDeploymentPanel({ id, agent }: { id: string; agent?: Agent }) {
  const deployedIn = DEPLOYMENTS.filter((d) => d.agentId === id)
  const name = agent?.name ?? "This agent"
  const heroAgent = { id, name: agent?.name ?? "Untitled agent", status: agent?.status ?? "draft" }

  if (deployedIn.length === 0) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Rocket className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">{name} isn&apos;t live yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Put it on a channel to start taking real traffic. Going live is free.
          </p>
        </div>
        <ChannelHero agent={heroAgent} showNote={false} />
      </div>
    )
  }

  const calls = deployedIn.reduce((s, d) => s + d.metrics.calls, 0)
  const successAvg = Math.round(
    deployedIn.reduce((s, d) => s + d.metrics.successRate, 0) / deployedIn.length,
  )
  const ahtAvg = Math.round(
    deployedIn.reduce((s, d) => s + d.metrics.avgHandleTimeSec, 0) / deployedIn.length,
  )

  return (
    <div className="space-y-6">
      {/* Live stats — aggregated across this agent's channels */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Conversations" value={calls.toLocaleString()} />
        <Stat label="Success rate" value={`${successAvg}%`} />
        <Stat label="Avg handle time" value={`${ahtAvg}s`} />
      </div>

      {/* Where this agent answers */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Where {name} answers</p>
        <Card>
          <CardContent className="divide-y p-0">
            {deployedIn.map((d) => (
              <Link
                key={d.id}
                href={deploymentHref(d)}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {d.kind === "batch" ? <PhoneOutgoing className="h-4 w-4" /> : <PhoneIncoming className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.kind === "batch" ? "Batch calls" : "Inbound"}</div>
                </div>
                <Badge variant={STATUS_BADGE[d.status].variant} className="text-xs">
                  {STATUS_BADGE[d.status].label}
                </Badge>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Put it on another channel — duplicate (1 agent ↔ 1 channel) */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Put {name} on another channel</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            One agent runs one channel — duplicate it to add another.
          </p>
        </div>
        <ChannelHero agent={heroAgent} showNote={false} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  )
}
