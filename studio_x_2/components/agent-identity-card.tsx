"use client"

import * as React from "react"
import { Mic, PhoneOff, DollarSign, Gauge } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AgentSphere } from "@/components/agent-test-panel"

/**
 * AgentIdentityCard — the shared "here's your agent" panel.
 *
 * One component so the Agents home (GoLiveHome) and the builder (AgentWizard)
 * present the agent IDENTICALLY — the agent never "goes missing" when you cross
 * from the list into edit. Left column on both: sphere + name + status + stack +
 * a Talk/Test button. The name is a static heading on the home and an
 * inline-editable field in the builder (pass `onNameChange`).
 */
export function AgentIdentityCard({
  name,
  namePlaceholder = "Your agent",
  onNameChange,
  status,
  subtitle,
  stack,
  costPerMin,
  latencyMs,
  talking,
  onToggleTalk,
  talkLabel,
  endLabel = "End call",
  secondary,
  className,
}: {
  name: string
  namePlaceholder?: string
  /** When provided, the name renders as an inline-editable field (builder). */
  onNameChange?: (value: string) => void
  status: string
  subtitle?: string
  /** Mono stack line, e.g. "gpt-4o-mini · nova-2 · turbo". */
  stack?: string
  costPerMin?: number
  latencyMs?: number
  talking: boolean
  onToggleTalk: () => void
  talkLabel?: string
  endLabel?: string
  /** Extra action under the Talk button (e.g. "Edit agent" on the home). */
  secondary?: React.ReactNode
  className?: string
}) {
  const displayName = name || namePlaceholder
  const hasStats = !!stack || costPerMin != null || latencyMs != null

  return (
    <section className={cn("flex flex-col rounded-xl border border-border bg-card p-6 lg:sticky lg:top-6", className)}>
      <div className="flex flex-col items-center gap-3 text-center">
        <AgentSphere size={104} active={talking} />
        <div className="w-full space-y-1">
          <div className="flex items-center justify-center gap-2">
            {onNameChange ? (
              <input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={namePlaceholder}
                aria-label="Agent name"
                className="min-w-0 flex-1 rounded-md bg-transparent px-1 text-center text-xl font-semibold tracking-tight outline-none placeholder:font-normal placeholder:text-muted-foreground/60 focus:bg-muted/50"
              />
            ) : (
              <h2 className="truncate text-xl font-semibold tracking-tight">{displayName}</h2>
            )}
            <Badge variant="secondary" className="shrink-0">{status}</Badge>
          </div>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      {hasStats && (
        <div className="mt-5 space-y-2 border-t border-border pt-4">
          {stack && <p className="break-words font-mono text-sm text-muted-foreground">{stack}</p>}
          {(costPerMin != null || latencyMs != null) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {costPerMin != null && (
                <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" aria-hidden />{costPerMin.toFixed(2)}/min</span>
              )}
              {latencyMs != null && (
                <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" aria-hidden />{latencyMs}ms</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {talking ? (
          <Button variant="destructive" className="gap-1.5" onClick={onToggleTalk}>
            <PhoneOff className="h-4 w-4" aria-hidden /> {endLabel}
          </Button>
        ) : (
          <Button className="gap-1.5" onClick={onToggleTalk}>
            <Mic className="h-4 w-4" aria-hidden /> {talkLabel ?? `Talk to ${displayName}`}
          </Button>
        )}
        {secondary}
      </div>
    </section>
  )
}
