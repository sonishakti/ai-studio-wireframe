"use client"

/**
 * MASTER-P6 — "Up-next teaser" master-detail.
 * LEFT card: the 5 steps as one unbroken minimal list (icon + title + state
 * dot) with a progress-count chip in the header. RIGHT card: the selected
 * step's config upfront (label:value rows), then a separated quiet footer
 * teasing the NEXT step ("Up next: … — manifest") with a small Continue →
 * button — teaching the sequence without group headers. Identity lives in a
 * slim top bar with an on-demand "Talk to Aria" affordance; deploy state
 * rides along quietly in the same bar.
 */

import { useState } from "react"
import {
  ArrowRight,
  AudioLines,
  FileText,
  Mic,
  Phone,
  Rocket,
  Route,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AGENT, DEPLOY_STATE, Orb, STEP_FIELDS, STEPS } from "@/components/proto/shared"

const STEP_ICONS = [AudioLines, Route, FileText, Phone, Rocket]

export function MasterP6() {
  const [selected, setSelected] = useState(1)

  const current = STEPS.find((s) => s.n === selected) ?? STEPS[0]
  if (!current) return null
  const next = STEPS.find((s) => s.n === current.n + 1)
  const fields = STEP_FIELDS[current.n] ?? []
  const doneCount = STEPS.filter((s) => s.done).length

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      {/* Slim identity bar — agent, live badge, deploy state, on-demand Talk */}
      <div className="flex items-center gap-3">
        <Orb size={32} />
        <span className="text-sm font-semibold text-foreground">{AGENT.name}</span>
        <Badge variant="outline" className="gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          {AGENT.status}
        </Badge>
        <span className="ml-auto hidden truncate text-xs text-muted-foreground sm:block">
          {DEPLOY_STATE.headline}
        </span>
        <Button variant="ghost" size="sm">
          {DEPLOY_STATE.cta}
        </Button>
        <Button variant="outline" size="sm">
          <Mic className="h-4 w-4" />
          Talk to {AGENT.name}
        </Button>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* LEFT card — one unbroken sequence, minimal rows */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-medium text-foreground">Setup</span>
            <Badge variant="secondary">
              {doneCount}/{STEPS.length} done
            </Badge>
          </div>
          <ul className="p-2">
            {STEPS.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? FileText
              const isCurrent = step.n === selected
              return (
                <li key={step.n}>
                  <button
                    type="button"
                    onClick={() => setSelected(step.n)}
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isCurrent
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate text-left">{step.title}</span>
                    <span
                      aria-label={step.done ? "Done" : isCurrent ? "In progress" : "Pending"}
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        step.done ? "bg-primary" : "bg-muted-foreground/30",
                        isCurrent && "ring-2 ring-ring/40"
                      )}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* RIGHT card — selected step config upfront + up-next teaser footer */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <p className="text-xs text-muted-foreground">
              Step {current.n} of {STEPS.length}
            </p>
            <h2 className="mt-0.5 text-sm font-semibold text-foreground">{current.title}</h2>
          </div>

          <dl className="divide-y">
            {fields.map((f) => (
              <div key={f.label} className="grid gap-1 px-5 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                <dt className="text-xs text-muted-foreground sm:pt-0.5">{f.label}</dt>
                <dd className="text-sm text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>

          {next ? (
            <div className="flex items-center gap-3 rounded-b-xl border-t bg-muted/30 px-5 py-3">
              <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Up next: {next.title}</span>
                {" — "}
                {next.manifest}
              </p>
              <Button variant="ghost" size="sm" onClick={() => setSelected(next.n)}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-b-xl border-t bg-muted/30 px-5 py-3">
              <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {DEPLOY_STATE.sub}
              </p>
              <Button variant="ghost" size="sm">
                {DEPLOY_STATE.cta}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
