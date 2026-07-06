"use client"

/**
 * VariantGrouped — "Grouped chunks" arrangement prototype.
 *
 * The five wizard steps are re-chunked into TWO labeled groups that match the
 * product's mental model instead of one undifferentiated list of five:
 *   A. YOUR AGENT      → steps 1 (Voice & models) + 3 (Prompt & tools)
 *   B. HOW IT GOES LIVE → steps 2 (Agent type) + 4 (Phone number) + 5 (Deploy)
 * Two chunks of 2–3 items beat one list of 5 (Miller's law chunking).
 * Throwaway — judges arrangement only; rows are non-functional.
 */

import { AudioLines, Check, ChevronRight, Rocket } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AGENT, DEPLOY_STATE, Orb, STEPS, type StepInfo } from "@/components/proto/shared"

const GROUPS: { label: string; stepNumbers: number[] }[] = [
  { label: "Your agent", stepNumbers: [1, 3] },
  { label: "How it goes live", stepNumbers: [2, 4, 5] },
]

const META_LINES: { label: string; value: string }[] = [
  { label: "ID", value: AGENT.id },
  { label: "Stack", value: AGENT.stack },
  { label: "Language", value: `${AGENT.language} · ${AGENT.preset}` },
  { label: "Channel", value: `${AGENT.channelLabel} · ${AGENT.channelTarget}` },
  { label: "Cost", value: AGENT.cost },
  { label: "Latency", value: AGENT.latency },
]

function StepRow({ step }: { step: StepInfo }) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground">
        {step.done ? <Check className="h-4 w-4 text-emerald-500" /> : step.n}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{step.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{step.value}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

export function VariantGrouped() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Left: identity card */}
      <div className="w-full shrink-0 rounded-xl border border-border bg-card p-6 lg:w-[320px]">
        <div className="flex flex-col items-center text-center">
          <Orb size={72} />
          <div className="mt-4 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">{AGENT.name}</h2>
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/40 text-emerald-500"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {AGENT.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{AGENT.role}</p>
        </div>

        <dl className="mt-6 space-y-2 border-t border-border pt-4">
          {META_LINES.map((line) => (
            <div key={line.label} className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-xs text-muted-foreground">{line.label}</dt>
              <dd className="truncate text-xs font-medium text-foreground">{line.value}</dd>
            </div>
          ))}
        </dl>

        <Button type="button" className="mt-6 w-full">
          <AudioLines className="h-4 w-4" />
          Talk to {AGENT.name}
        </Button>
      </div>

      {/* Right: two grouped chunks + deploy bar */}
      <div className="min-w-0 flex-1 space-y-6">
        {GROUPS.map((group) => (
          <section key={group.label}>
            <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </h3>
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {group.stepNumbers.map((n) => {
                const step = STEPS.find((s) => s.n === n)
                return step ? <StepRow key={step.n} step={step} /> : null
              })}
            </div>
          </section>
        ))}

        {/* Deploy state bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <Rocket className="h-4 w-4 text-emerald-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{DEPLOY_STATE.headline}</p>
            <p className="truncate text-xs text-muted-foreground">{DEPLOY_STATE.sub}</p>
          </div>
          <Button type="button" variant="outline" size="sm">
            {DEPLOY_STATE.cta}
          </Button>
        </div>
      </div>
    </div>
  )
}
