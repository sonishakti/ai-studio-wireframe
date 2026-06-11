"use client"

import * as React from "react"
import Link from "next/link"
import {
  PhoneIncoming,
  PhoneOutgoing,
  Code2,
  ArrowRight,
  Globe,
  Terminal,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { track, Events } from "@/lib/analytics"

/**
 * DeployChooser
 * ────────────────
 * The 3-option entry point for "how does my agent go live?". Used by:
 *   • /deploy (full-page mode)
 *   • Agent editor's right-side Sheet (in-sheet mode)
 *
 * Inbound     → /deploy/inbound/new (agent answers on one channel)
 * Batch Calls → /deploy/batch-calls/new (outbound CSV dialing)
 * Code        → inline expansion of two sub-paths (Widget embed · REST API)
 */

interface DeployChooserProps {
  /** Pre-fill an agent into the campaign-creation flow. */
  agentId?: string
  /** Render variant — full page (default) vs compact for sheet. */
  variant?: "page" | "sheet"
}

type OptionId = "inbound" | "outbound" | "code"

export function DeployChooser({ agentId, variant = "page" }: DeployChooserProps) {
  const [expanded, setExpanded] = React.useState<OptionId | null>(null)

  // Fire view event once on mount
  React.useEffect(() => {
    track(Events.deploy_chooser_viewed, { variant })
  }, [variant])

  const agentParam = agentId ? `?agent=${agentId}` : ""

  const options: Array<{
    id: OptionId
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    bullets: string[]
    href?: string
  }> = [
    {
      id: "inbound",
      icon: PhoneIncoming,
      title: "Inbound",
      description: "Your agent answers.",
      bullets: ["Phone number", "Web widget", "WhatsApp", "One agent, one channel"],
      href: `/deploy/inbound/new${agentParam}`,
    },
    {
      id: "outbound",
      icon: PhoneOutgoing,
      title: "Batch Calls",
      description: "Your agent dials a contact list.",
      bullets: ["Upload a CSV", "Columns become {{variables}}", "Prompt written at launch"],
      href: `/deploy/batch-calls/new${agentParam}`,
    },
    {
      id: "code",
      icon: Code2,
      title: "Code & embed",
      description: "Self-serve integration.",
      bullets: ["iFrame widget", "REST API", "Direct SDK"],
    },
  ]

  const handleOptionClick = (id: OptionId) => {
    track(Events.deploy_chooser_option_selected, { option: id })
    if (id === "code") {
      setExpanded((curr) => (curr === id ? null : id))
    }
  }

  return (
    <div className={cn("space-y-5", variant === "sheet" && "space-y-4")}>
      <div
        className={cn(
          "grid gap-4",
          variant === "page" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1",
        )}
      >
        {options.map((opt) => {
          const Icon = opt.icon
          const isCode = opt.id === "code"
          const isExpanded = expanded === opt.id

          const card = (
            <div
              className={cn(
                "group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-sm",
                isCode && "cursor-pointer",
                isExpanded && "border-primary/60 shadow-sm",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{opt.title}</h3>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
              <ul className="space-y-1 pt-1">
                {opt.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )

          if (isCode) {
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleOptionClick(opt.id)}
                className="text-left"
              >
                {card}
              </button>
            )
          }

          return (
            <Link
              key={opt.id}
              href={opt.href!}
              onClick={() => handleOptionClick(opt.id)}
            >
              {card}
            </Link>
          )
        })}
      </div>

      {/* Inline expansion for Code branch */}
      {expanded === "code" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CodeSubOption
            icon={Globe}
            title="Embed widget"
            description="Drop a chat widget into your site with one snippet."
            href="/deploy/embed/widget"
          />
          <CodeSubOption
            icon={Terminal}
            title="Use REST API"
            description="Server-to-server integration with token auth."
            href="/deploy/embed/api"
          />
        </div>
      )}
    </div>
  )
}

function CodeSubOption({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  )
}

/**
 * DeployChooserFooter — small helper that points users to either start fresh
 * or open an existing campaign. Shown beneath the chooser on the page variant.
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
