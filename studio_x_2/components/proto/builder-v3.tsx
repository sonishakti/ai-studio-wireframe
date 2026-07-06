"use client"

/**
 * Variant 3 — "Spec sheet".
 * The agent as a scannable definition table: label:value pairs are the fastest
 * structure to digest. The five wizard steps become an implementation detail
 * behind each row's quiet Edit affordance (step title + value line carried on
 * the button for recognition), so the page reads as a spec, not a process.
 */

import { ChevronRight, Mic, RefreshCw } from "lucide-react"

import { AGENT, DEPLOY_STATE, Orb, STEPS } from "@/components/proto/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type SpecRow = {
  label: string
  value: string
  /** Which wizard step this row's Edit opens (1-indexed into STEPS). */
  stepN: number
}

const ROWS: SpecRow[] = [
  { label: "Voice", value: `${AGENT.name} (${AGENT.preset} preset)`, stepN: 1 },
  { label: "Models", value: AGENT.stack, stepN: 1 },
  { label: "Language", value: AGENT.language, stepN: 1 },
  { label: "Type", value: AGENT.channelLabel, stepN: 2 },
  { label: "Channel", value: AGENT.channelTarget, stepN: 4 },
  { label: "Prompt", value: `${AGENT.prompt.length} chars · greeting set`, stepN: 3 },
  {
    label: "Knowledge & tools",
    value: `${AGENT.knowledge} knowledge · ${AGENT.connectors} connectors`,
    stepN: 3,
  },
  { label: "Cost & latency", value: `${AGENT.cost} · ~${AGENT.latency}`, stepN: 5 },
]

export function VariantSpecSheet() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* Slim header row: identity + the one primary action */}
      <div className="flex items-center gap-3">
        <Orb size={48} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {AGENT.name}
            </h2>
            <Badge
              variant="outline"
              className="border-success/40 bg-success/10 text-success"
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"
                aria-hidden
              />
              {AGENT.status}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {AGENT.role}
            <span className="text-muted-foreground/70"> · {AGENT.id}</span>
          </p>
        </div>
        <div className="flex-1" />
        <Button type="button">
          <Mic className="h-4 w-4" />
          Talk to {AGENT.name}
        </Button>
      </div>

      {/* The spec sheet: one card, eight definition rows */}
      <div className="rounded-xl border border-border bg-card">
        <dl className="divide-y divide-border">
          {ROWS.map((row) => {
            const step = STEPS[row.stepN - 1]
            return (
              <div key={row.label} className="flex items-center gap-4 px-4 py-3">
                <dt className="w-40 shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <span className="truncate text-sm text-foreground">
                    {row.value}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    title={`Step ${step.n} · ${step.title} — ${step.value}`}
                  >
                    Edit
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">
                      {` — opens step ${step.n}, ${step.title}: ${step.value}`}
                    </span>
                  </Button>
                </dd>
              </div>
            )
          })}
        </dl>
      </div>

      {/* Deploy bar */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-success animate-pulse"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {DEPLOY_STATE.headline}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {DEPLOY_STATE.sub}
          </p>
        </div>
        <div className="flex-1" />
        <Button type="button" variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
          {DEPLOY_STATE.cta}
        </Button>
      </div>
    </div>
  )
}
