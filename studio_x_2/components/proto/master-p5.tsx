"use client"

/**
 * Master-detail prototype P5 — "Rich rows + rail"
 * THROWAWAY. LEFT page-level card = the 5 steps as one unbroken sequence,
 * rows keep today's richness (icon circle w/ check, title, value, manifest)
 * connected by a left rail; header shows 5 progress segments. RIGHT page-level
 * card = the selected step's STEP_FIELDS rendered as stacked mock form
 * controls (label + input-looking bordered divs, select chevrons) with a
 * Done/Next footer. Slim identity bar on top carries Live badge, deploy
 * state, and the on-demand "Talk to Aria" affordance.
 */

import { useState } from "react"
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Mic,
  Phone,
  RefreshCw,
  Rocket,
  Waypoints,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  AGENT,
  DEPLOY_STATE,
  Orb,
  STEP_FIELDS,
  STEPS,
} from "@/components/proto/shared"

const STEP_ICONS: Record<number, LucideIcon> = {
  1: Mic,
  2: Waypoints,
  3: FileText,
  4: Phone,
  5: Rocket,
}

/** Fields that should read as <select>-style controls (chevron affordance). */
const SELECT_FIELDS = new Set([
  "Persona",
  "Preset",
  "STT",
  "LLM",
  "TTS · Voice",
  "Language",
  "Type",
  "Mode",
])

/** Fields that should read as multi-line textareas. */
const TEXTAREA_FIELDS = new Set(["System prompt", "Greeting"])

export function MasterP5() {
  const [selected, setSelected] = useState(1)
  const step = STEPS[selected - 1]
  const fields = STEP_FIELDS[selected] ?? []
  const doneCount = STEPS.filter((s) => s.done).length

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* ── Slim identity bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Orb size={32} />
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-sm font-semibold text-foreground">
            {AGENT.name}
          </h1>
          <Badge variant="outline" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            {AGENT.status}
          </Badge>
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
            {AGENT.role}
          </span>
        </div>
        <div className="flex-1" />
        {/* Deploy state — quiet, never competes with the two cards */}
        <span className="hidden text-xs text-muted-foreground md:inline">
          {DEPLOY_STATE.headline}
        </span>
        <Button type="button" variant="outline" size="sm" className="shrink-0">
          <RefreshCw className="h-4 w-4" />
          {DEPLOY_STATE.cta}
        </Button>
        <Button
          type="button"
          size="sm"
          className="shrink-0 bg-foreground text-background hover:bg-foreground/90"
        >
          <Mic className="h-4 w-4" />
          Talk to {AGENT.name}
        </Button>
      </div>

      {/* ── Master / detail cards ─────────────────────────────────────── */}
      <div className="mt-6 grid items-start gap-4 lg:grid-cols-5">
        {/* LEFT card — the unbroken 5-step sequence */}
        <section
          aria-label="Setup steps"
          className="rounded-xl border bg-card lg:col-span-2"
        >
          <header className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-foreground">Setup</h2>
              <span className="text-xs text-muted-foreground">
                {doneCount} of {STEPS.length} done
              </span>
            </div>
            {/* Progress segments — one tiny bar per step, filled = done */}
            <div className="mt-2.5 flex gap-1" aria-hidden>
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    s.done ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </header>

          <ol className="relative flex flex-col gap-1 p-2">
            {/* Rail connecting the icon circles */}
            <div
              className="absolute bottom-8 left-9 top-8 w-px bg-border"
              aria-hidden
            />
            {STEPS.map((s) => {
              const Icon = STEP_ICONS[s.n]
              const current = s.n === selected
              return (
                <li key={s.n} className="relative">
                  <button
                    type="button"
                    onClick={() => setSelected(s.n)}
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md border-l-2 px-3 py-3 text-left transition-colors",
                      current
                        ? "border-primary bg-accent/50"
                        : "border-transparent hover:bg-accent/30"
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-card",
                        s.done
                          ? "border-primary/40 text-primary"
                          : current
                            ? "border-primary text-foreground"
                            : "border-border text-muted-foreground"
                      )}
                    >
                      {s.done ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {s.title}
                        </span>
                        {current ? (
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-primary"
                            aria-hidden
                          />
                        ) : null}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">
                        {s.value}
                      </span>
                      <span className="truncate text-xs text-muted-foreground/70">
                        {s.manifest}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>

        {/* RIGHT card — selected step's config as upfront mock form */}
        <section
          aria-label={`Step ${step.n} configuration`}
          className="flex flex-col rounded-xl border bg-card lg:col-span-3"
        >
          <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Step {step.n} of {STEPS.length}
              </p>
              <h2 className="mt-0.5 truncate text-sm font-semibold text-foreground">
                {step.title}
              </h2>
            </div>
            <Badge variant="outline" className="shrink-0 gap-1.5">
              {step.done ? (
                <>
                  <Check className="h-4 w-4 text-primary" />
                  Done
                </>
              ) : (
                "Pending"
              )}
            </Badge>
          </header>

          <div className="flex flex-1 flex-col gap-4 px-5 py-4">
            {fields.map((f) => (
              <div key={f.label} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground">
                  {f.label}
                </span>
                {TEXTAREA_FIELDS.has(f.label) ? (
                  <div className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm leading-relaxed text-foreground">
                    {f.value}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2">
                    <span className="truncate text-sm text-foreground">
                      {f.value}
                    </span>
                    {SELECT_FIELDS.has(f.label) ? (
                      <ChevronDown
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t px-5 py-3">
            <Button type="button" variant="outline" size="sm">
              <Check className="h-4 w-4" />
              Done
            </Button>
            {step.n < STEPS.length ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setSelected(step.n + 1)}
              >
                Next: {STEPS[step.n].title}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" size="sm">
                <RefreshCw className="h-4 w-4" />
                {DEPLOY_STATE.cta}
              </Button>
            )}
          </footer>
        </section>
      </div>
    </div>
  )
}
