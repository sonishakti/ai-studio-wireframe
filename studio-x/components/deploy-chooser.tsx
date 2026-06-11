"use client"

import * as React from "react"
import Link from "next/link"
import {
  PhoneIncoming,
  PhoneOutgoing,
  Code2,
  ArrowRight,
  Globe,
  Phone,
  Code,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AGENTS } from "@/lib/campaign-data"
import { track, Events } from "@/lib/analytics"

/**
 * DeployChooser — aligned with Figma `04_Deploy_Future_scope` (657:15639).
 * ────────────────────────────────────────────────────────────────────────
 * Agent-first: pick the AI Agent, then pick the channel. Used by:
 *   • /deploy (full-page mode)
 *   • Agent editor's right-side Sheet (in-sheet mode — agent comes pre-picked)
 *
 * Inbound Calls  → /deploy/inbound/new?agent=…
 * Outbound Calls → /deploy/batch-calls/new?agent=…
 * Code           → /deploy/code?agent=…
 */

interface DeployChooserProps {
  /** Pre-fill the agent (sheet mode — opened from an agent's editor). */
  agentId?: string
  /** Render variant — full page (default) vs compact for sheet. */
  variant?: "page" | "sheet"
}

type OptionId = "inbound" | "outbound" | "code"

type Chip = { icon: React.ComponentType<{ className?: string }>; label: string }

const OPTIONS: Array<{
  id: OptionId
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  chips: Chip[]
  href: (agentParam: string) => string
}> = [
  {
    id: "inbound",
    icon: PhoneIncoming,
    title: "Inbound Calls",
    description: "Users come to your agent",
    chips: [
      { icon: Globe, label: "Web Widget" },
      { icon: Phone, label: "Phone Number" },
    ],
    href: (a) => `/deploy/inbound/new${a}`,
  },
  {
    id: "outbound",
    icon: PhoneOutgoing,
    title: "Outbound Calls",
    description: "Your agent reaches out",
    chips: [{ icon: Phone, label: "Telephony Dialing" }],
    href: (a) => `/deploy/batch-calls/new${a}`,
  },
  {
    id: "code",
    icon: Code2,
    title: "Code",
    description: "Export your agent to any stack",
    chips: [
      { icon: Code, label: "cURL" },
      { icon: Code, label: "Python" },
      { icon: Code, label: "Node" },
    ],
    href: (a) => `/deploy/code${a}`,
  },
]

export function DeployChooser({ agentId, variant = "page" }: DeployChooserProps) {
  const [agent, setAgent] = React.useState(agentId ?? AGENTS[0].id)

  // Fire view event once on mount
  React.useEffect(() => {
    track(Events.deploy_chooser_viewed, { variant })
  }, [variant])

  const agentParam = `?agent=${agent}`

  return (
    <div className={cn("space-y-5", variant === "sheet" && "space-y-4")}>
      {/* AI Agent — picked FIRST (Figma 657:15639) */}
      <div className="space-y-1.5 max-w-sm">
        <Label className="text-sm font-medium">
          AI Agent <span className="text-destructive">*</span>
        </Label>
        <Select value={agent} onValueChange={setAgent}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Pick an agent" />
          </SelectTrigger>
          <SelectContent>
            {AGENTS.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select an agent to deploy to a channel
        </p>
      </div>

      {/* Channel cards */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Select Channel</p>
        <div
          className={cn(
            "grid gap-4",
            variant === "page" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1",
          )}
        >
          {OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <Link
                key={opt.id}
                href={opt.href(agentParam)}
                onClick={() => track(Events.deploy_chooser_option_selected, { option: opt.id })}
                className="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <Icon className="h-5 w-5 text-foreground" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">{opt.title}</h3>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-border/60 mt-auto">
                  {opt.chips.map((chip) => (
                    <span
                      key={chip.label}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground pt-2"
                    >
                      <chip.icon className="h-3.5 w-3.5" />
                      {chip.label}
                    </span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * DeployChooserFooter — points users at existing deployments beneath the chooser.
 */
export function DeployChooserFooter() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="text-sm font-medium">Already deployed?</p>
        <p className="text-xs text-muted-foreground">
          Reconfigure a live deployment — its prompt and variables live there.
        </p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link href="/deploy/batch-calls" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Open Batch Calls
        </Link>
      </Button>
    </div>
  )
}
