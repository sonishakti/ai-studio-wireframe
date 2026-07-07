"use client"

/**
 * Master-detail P8 — "Detail + collapsed rest"
 * THROWAWAY master-detail prototype for the /agents builder landing.
 * LEFT page-level card: compact index of the 5 steps (one unbroken
 * sequence, done/current/pending marks, progress dots). RIGHT page-level
 * card: the selected step's config EXPANDED at the top (label:value rows,
 * upfront — no drawer), then under a divider the OTHER four steps as
 * collapsed one-line rows (icon · title · value · chevron; click selects).
 * Identity/testing lives in a slim header ("Talk to Aria" is a mock,
 * on-demand affordance); deploy state is a quiet footer line.
 */

import { useState } from "react"
import {
  AudioLines,
  Check,
  ChevronRight,
  MessageSquareText,
  Mic,
  Phone,
  RefreshCw,
  Rocket,
  Waypoints,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  AGENT,
  DEPLOY_STATE,
  Orb,
  STEP_FIELDS,
  STEPS,
  type StepInfo,
} from "@/components/proto/shared"

const STEP_ICONS: Record<number, LucideIcon> = {
  1: AudioLines,
  2: Waypoints,
  3: MessageSquareText,
  4: Phone,
  5: Rocket,
}

/** Breadcrumb-style progress dots — done / current / pending at a glance. */
function ProgressDots({ selected }: { selected: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {STEPS.map((step) => (
        <span
          key={step.n}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            step.n === selected
              ? "bg-primary ring-2 ring-primary/30"
              : step.done
                ? "bg-primary/50"
                : "bg-muted-foreground/25"
          )}
        />
      ))}
    </div>
  )
}

/** Numbered circle that flips to a check when the step is done. */
function StepMark({ step, current }: { step: StepInfo; current: boolean }) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
        current
          ? "border-primary bg-primary text-primary-foreground"
          : step.done
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground"
      )}
    >
      {step.done && !current ? <Check className="h-4 w-4" /> : step.n}
    </span>
  )
}

export function MasterP8() {
  const [selected, setSelected] = useState(1)
  const active = STEPS.find((s) => s.n === selected) ?? STEPS[0]
  const rest = STEPS.filter((s) => s.n !== selected)
  const ActiveIcon = STEP_ICONS[active.n]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
      {/* Slim identity strip — agent moved out of the main layout */}
      <header className="flex items-center gap-3">
        <Orb size={32} />
        <span className="text-sm font-semibold text-foreground">
          {AGENT.name}
        </span>
        <Badge variant="outline" className="gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          {AGENT.status}
        </Badge>
        <span className="min-w-0 flex-1" />
        <Button type="button" variant="outline" size="sm">
          <Mic className="h-4 w-4" />
          Talk to {AGENT.name}
        </Button>
      </header>

      {/* Two page-level cards, side by side */}
      <div className="flex items-start gap-4">
        {/* LEFT card — compact index: one unbroken 1→5 sequence */}
        <div className="w-64 shrink-0 rounded-xl border bg-card">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Setup
            </p>
            <ProgressDots selected={selected} />
          </div>
          <Separator />
          <nav aria-label="Setup steps" className="flex flex-col gap-1 p-2">
            {STEPS.map((step) => {
              const current = step.n === selected
              return (
                <button
                  key={step.n}
                  type="button"
                  onClick={() => setSelected(step.n)}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    current
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <StepMark step={step} current={current} />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate",
                      current && "font-medium text-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  {current ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : null}
                </button>
              )
            })}
          </nav>
        </div>

        {/* RIGHT card — ONE detail surface: selected step expanded, rest collapsed */}
        <div className="min-w-0 flex-1 rounded-xl border bg-card">
          {/* Expanded selected step */}
          <section aria-label={active.title} className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                <ActiveIcon className="h-4 w-4 text-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-semibold text-foreground">
                    {active.title}
                  </h2>
                  {active.done ? (
                    <Badge variant="outline" className="gap-1">
                      <Check className="h-4 w-4" />
                      Done
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  Step {active.n} of {STEPS.length} · {active.manifest}
                </p>
              </div>
              <ProgressDots selected={selected} />
            </div>

            {/* Upfront config — label:value rows, no drawer */}
            <dl className="mt-4 overflow-hidden rounded-lg border">
              {STEP_FIELDS[active.n].map((field) => (
                <div
                  key={field.label}
                  className="flex items-start gap-4 border-b bg-background/50 px-4 py-3 last:border-b-0"
                >
                  <dt className="w-32 shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd className="min-w-0 flex-1 text-sm text-foreground">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <Separator />

          {/* Collapsed rest — the other four steps, one line each */}
          <div className="flex flex-col gap-1 p-2">
            {rest.map((step) => {
              const Icon = STEP_ICONS[step.n]
              return (
                <button
                  key={step.n}
                  type="button"
                  onClick={() => setSelected(step.n)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="shrink-0 text-sm font-medium text-foreground">
                    {step.title}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {step.value}
                  </span>
                  {step.done ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Deploy state — quiet, non-competing footer line */}
      <footer className="flex items-center justify-between gap-3 px-1">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {DEPLOY_STATE.headline}
          </span>{" "}
          · {DEPLOY_STATE.sub}
        </p>
        <Button type="button" variant="ghost" size="sm" className="shrink-0">
          <RefreshCw className="h-4 w-4" />
          {DEPLOY_STATE.cta}
        </Button>
      </footer>
    </div>
  )
}
