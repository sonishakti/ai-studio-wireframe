"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

/**
 * AgentJourneyBreadcrumb — the agent experience as a journey stepper, not tabs
 * (2026-06-23). Segments reflect build progress (completed ✓ / current /
 * upcoming); every segment is clickable so editing can jump anywhere. Built on
 * the breadcrumb primitive. The agent identity is anchored to the left.
 */

export type AgentSection = "persona" | "stack" | "knowledge" | "actions" | "deployment"

export const AGENT_SECTIONS: { id: AgentSection; label: string }[] = [
  { id: "persona", label: "Persona" },
  { id: "stack", label: "Stack" },
  { id: "knowledge", label: "Knowledge" },
  { id: "actions", label: "Actions" },
  { id: "deployment", label: "Deployment" },
]

export function AgentJourneyBreadcrumb({
  agentName,
  status,
  active,
  completion,
  onJump,
}: {
  agentName: string
  status: string
  active: AgentSection
  completion: Record<AgentSection, boolean>
  onJump: (s: AgentSection) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* Identity anchor — never lose "which agent" */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tracking-tight">{agentName}</span>
        <Badge variant={status === "live" ? "default" : "outline"} className="text-xs capitalize">
          {status}
        </Badge>
      </div>
      <span className="h-4 w-px bg-border" aria-hidden />

      {/* Journey stepper */}
      <Breadcrumb>
        <BreadcrumbList className="gap-1 sm:gap-1">
          {AGENT_SECTIONS.map((s, i) => {
            const isCurrent = s.id === active
            const isComplete = completion[s.id] && !isCurrent
            return (
              <React.Fragment key={s.id}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  <button
                    type="button"
                    onClick={() => onJump(s.id)}
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors",
                      isCurrent
                        ? "bg-muted font-medium text-foreground"
                        : isComplete
                          ? "text-foreground hover:text-primary"
                          : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {isComplete && <Check className="h-3.5 w-3.5 text-primary" />}
                    {s.label}
                  </button>
                </BreadcrumbItem>
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
