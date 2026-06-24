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

export type AgentSection = "persona" | "stack" | "knowledge" | "mcp" | "connectors" | "deployment"

// Names match the Figma design (03_Configure_Integrations): Knowledge Base · MCP
// · Connectors are distinct modules — not a combined "Actions" bucket.
//
// Persona is intentionally NOT a step (2026-06-24): it moved INTO Deploy (each
// deployment carries its own voice + prompt), so the builder leads with Stack.
// "persona" stays in the AgentSection type union — other code (the hash map,
// the completion Record) still references the id.
export const AGENT_SECTIONS: { id: AgentSection; label: string }[] = [
  { id: "stack", label: "Stack" },
  { id: "knowledge", label: "Knowledge Base" },
  { id: "mcp", label: "MCP" },
  { id: "connectors", label: "Connectors" },
  // Label "Deploy" but keep the internal id "deployment" — #deployment deep-links,
  // jump("deployment") and <TabsContent value="deployment"> + diagnostics anchors
  // all key off the id; renaming it would need every call site moved in lockstep.
  { id: "deployment", label: "Deploy" },
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
      {/* Identity anchor — never lose "which agent". This is the editor's page
          heading (the editor is an intentional full-bleed exception to PageHeader:
          its journey stepper IS the header, like the Deploy wizard's stepper). */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold tracking-tight">{agentName}</h1>
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
