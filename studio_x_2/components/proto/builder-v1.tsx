"use client"

/**
 * Variant 1 — "Narrative column"
 * THROWAWAY arrangement prototype for the /agents builder landing.
 * One centered reading axis: hero row → quiet meta line → vertical
 * step timeline → deploy state bar. Strict top-to-bottom story,
 * zero horizontal scanning.
 */

import { ChevronRight, Mic, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AGENT, DEPLOY_STATE, Orb, STEPS } from "@/components/proto/shared"

export function VariantNarrative() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      {/* Hero row: orb · identity · the one primary CTA */}
      <div className="flex items-center gap-4">
        <Orb size={56} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-foreground">
              {AGENT.name}
            </h1>
            <Badge variant="outline" className="gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              {AGENT.status}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">{AGENT.role}</p>
        </div>
        <Button
          type="button"
          className="shrink-0 bg-foreground text-background hover:bg-foreground/90"
        >
          <Mic className="h-4 w-4" />
          Talk to {AGENT.name}
        </Button>
      </div>

      {/* One quiet meta line */}
      <p className="mt-4 font-mono text-xs text-muted-foreground">
        {AGENT.id} · {AGENT.stack} · {AGENT.language} / {AGENT.preset} ·{" "}
        {AGENT.channelLabel} {AGENT.channelTarget} · {AGENT.cost} · {AGENT.latency}
      </p>

      {/* Vertical timeline of the five steps */}
      <ol className="relative mt-10 flex flex-col gap-6">
        {/* Rail line behind the numbered circles */}
        <div
          className="absolute bottom-4 left-3.5 top-4 w-px bg-border"
          aria-hidden
        />
        {STEPS.map((step) => (
          <li key={step.n} className="relative flex items-start gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium text-foreground">
              {step.n}
            </span>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-1">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">
                  {step.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{step.value}</p>
              </div>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </li>
        ))}
      </ol>

      {/* Deploy state bar */}
      <div className="mt-10 flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {DEPLOY_STATE.headline}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{DEPLOY_STATE.sub}</p>
        </div>
        <Button type="button" variant="outline" className="shrink-0">
          <RefreshCw className="h-4 w-4" />
          {DEPLOY_STATE.cta}
        </Button>
      </div>
    </div>
  )
}
