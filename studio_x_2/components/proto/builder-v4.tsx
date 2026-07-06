"use client"

/**
 * Proto variant 4 — "Focus stepper".
 * One thing at a time: a vertical stepper nav on the left, and ONLY the active
 * step expanded on the right as a large focused card. Progressive disclosure —
 * never show all five steps' details at once.
 * THROWAWAY — judges arrangement only; buttons are no-ops.
 */

import { useState } from "react"
import { ArrowRight, Check, Pencil, Phone, Rocket } from "lucide-react"

import { AGENT, DEPLOY_STATE, Orb, STEPS } from "@/components/proto/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function VariantStepper() {
  const [active, setActive] = useState(1)

  const activeStep = STEPS.find((s) => s.n === active) ?? STEPS[0]
  const nextStep = STEPS.find((s) => s.n === active + 1)

  return (
    <div className="flex flex-col rounded-xl border border-border bg-background">
      {/* Slim identity bar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Orb size={40} />
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{AGENT.name}</span>
          <Badge variant="outline" className="gap-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            {AGENT.status}
          </Badge>
          <span className="truncate text-sm text-muted-foreground">{AGENT.role}</span>
        </div>
        <div className="flex-1" />
        <Button type="button" size="sm">
          <Phone className="h-4 w-4" />
          Talk to {AGENT.name}
        </Button>
      </div>

      {/* Compact meta strip — everything else stays out of the way */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span className="font-mono">{AGENT.id}</span>
        <span aria-hidden>·</span>
        <span>{AGENT.stack}</span>
        <span aria-hidden>·</span>
        <span>
          {AGENT.language} · {AGENT.preset}
        </span>
        <span aria-hidden>·</span>
        <span>
          {AGENT.channelLabel} {AGENT.channelTarget}
        </span>
        <span aria-hidden>·</span>
        <span>{AGENT.cost}</span>
        <span aria-hidden>·</span>
        <span>{AGENT.latency}</span>
      </div>

      {/* Body: stepper nav + focused step */}
      <div className="grid min-h-96 grid-cols-[220px_1fr]">
        {/* Left: vertical stepper nav */}
        <nav aria-label="Setup steps" className="flex flex-col gap-1 border-r border-border py-3">
          {STEPS.map((step) => {
            const isActive = step.n === active
            return (
              <button
                key={step.n}
                type="button"
                onClick={() => setActive(step.n)}
                className={cn(
                  "flex items-center gap-2.5 border-l-2 px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "border-primary bg-primary/5 font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                    isActive
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {step.done && !isActive ? (
                    <Check className="h-3.5 w-3.5" aria-label="Done" />
                  ) : (
                    step.n
                  )}
                </span>
                <span className="truncate">{step.title}</span>
              </button>
            )
          })}
        </nav>

        {/* Right: the active step only */}
        <div className="flex flex-col gap-3 p-4">
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-2 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {activeStep.title}
                </h3>
                <Button type="button" variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </div>
              <p className="text-base text-foreground">{activeStep.value}</p>
              <p className="text-xs text-muted-foreground">{activeStep.manifest}</p>
            </CardContent>
          </Card>

          {nextStep ? (
            <button
              type="button"
              onClick={() => setActive(nextStep.n)}
              className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              next: {nextStep.title}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}

          {/* Deploy state bar pinned at the bottom of the right column */}
          <div className="mt-auto flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{DEPLOY_STATE.headline}</p>
              <p className="truncate text-xs text-muted-foreground">{DEPLOY_STATE.sub}</p>
            </div>
            <Button type="button" variant="outline" size="sm">
              <Rocket className="h-4 w-4" />
              {DEPLOY_STATE.cta}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
