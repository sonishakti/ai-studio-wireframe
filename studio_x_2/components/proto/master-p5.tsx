"use client"

/**
 * Master-detail prototype P5 — "Rich rows + rail"
 * THROWAWAY. LEFT page-level card = the 5 steps as one unbroken sequence,
 * rows keep today's richness (icon circle w/ check, title, value, manifest)
 * connected by a left rail; header shows 5 progress segments. RIGHT page-level
 * card = the selected step's fields rendered as stacked mock form controls
 * (label + input-looking bordered divs, select chevrons) with a Close/Next
 * footer. Slim identity bar on top carries the Live/Draft badge and the
 * on-demand "Talk to Aria" affordance; deploy state lives in its own strip.
 * Supports the harness `mode` toggle ("live" | "draft") via dataFor(mode).
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
  DEPLOY_STATE,
  dataFor,
  Orb,
  type ProtoMode,
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

export function MasterP5({ mode = "live" }: { mode?: ProtoMode }) {
  const { agent, steps, fields: fieldsByStep, live } = dataFor(mode)
  const [selected, setSelected] = useState(1)
  const step = steps[selected - 1]
  const fields = fieldsByStep[selected] ?? []
  const doneCount = steps.filter((s) => s.done).length

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* ── Slim identity bar — one quiet affordance, nothing louder ───── */}
      <div className="flex items-center gap-3">
        <Orb size={32} />
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-sm font-semibold text-foreground">
            {agent.name}
          </h1>
          <Badge
            variant="outline"
            className={cn("gap-1.5", live && "border-success/40 text-success")}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                live ? "bg-success" : "bg-muted-foreground"
              )}
              aria-hidden
            />
            {agent.status}
          </Badge>
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
            {agent.role}
          </span>
        </div>
        <div className="flex-1" />
        <Button type="button" variant="outline" size="sm" className="shrink-0">
          <Mic className="h-4 w-4" />
          Talk to {agent.name}
        </Button>
      </div>

      {/* ── Deploy strip — the only home of Redeploy ──────────────────── */}
      {live ? (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-2.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-success" aria-hidden />
          <p
            className="line-clamp-1 min-w-0 text-sm font-medium text-success"
            title={DEPLOY_STATE.headline}
          >
            {DEPLOY_STATE.headline}
          </p>
          <p
            className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground md:block"
            title={DEPLOY_STATE.sub}
          >
            {DEPLOY_STATE.sub}
          </p>
          <div className="flex-1 md:hidden" />
          <Button type="button" variant="outline" size="sm" className="shrink-0">
            <RefreshCw className="h-4 w-4" />
            {DEPLOY_STATE.cta}
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed px-4 py-2.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">
            Not deployed — finish the steps to go live
          </p>
        </div>
      )}

      {/* ── Master / detail cards — stack below lg, list first ────────── */}
      <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
        {/* LEFT card — the unbroken 5-step sequence */}
        <section
          aria-label="Setup steps"
          className="min-w-0 rounded-xl border bg-card lg:col-span-2"
        >
          <header className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-foreground">Setup</h2>
              <span className="text-xs text-muted-foreground">
                {doneCount} of {steps.length} done
              </span>
            </div>
            {/* Progress segments — one tiny bar per step, filled = done */}
            <div className="mt-2.5 flex gap-1" aria-hidden>
              {steps.map((s) => (
                <div
                  key={s.n}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    s.done ? "bg-success" : "bg-muted"
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
            {steps.map((s) => {
              const Icon = STEP_ICONS[s.n]
              const current = s.n === selected
              const valueText = s.value || "Not set yet"
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
                        "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                        s.done
                          ? "border-success/40 bg-success/10 text-success"
                          : current
                            ? "border-primary bg-card text-foreground"
                            : "border-border bg-card text-muted-foreground"
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
                        <span
                          className="line-clamp-1 min-w-0 text-sm font-medium text-foreground"
                          title={s.title}
                        >
                          {s.title}
                        </span>
                        {current ? (
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-primary"
                            aria-hidden
                          />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "line-clamp-1 text-sm",
                          s.value
                            ? "text-muted-foreground"
                            : "text-muted-foreground/70 italic"
                        )}
                        title={valueText}
                      >
                        {valueText}
                      </span>
                      <span
                        className="line-clamp-1 text-xs text-muted-foreground/70"
                        title={s.manifest}
                      >
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
          className="flex min-w-0 flex-col rounded-xl border bg-card lg:col-span-3"
        >
          <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <div className="min-w-0">
              {/* Quiet inline position counter */}
              <p className="text-xs text-muted-foreground">
                Step {step.n} of {steps.length}
              </p>
              <h2
                className="mt-0.5 line-clamp-1 text-sm font-semibold text-foreground"
                title={step.title}
              >
                {step.title}
              </h2>
            </div>
            {step.done ? (
              <Badge
                variant="outline"
                className="shrink-0 gap-1.5 border-success/40 bg-success/10 text-success"
              >
                <Check className="h-4 w-4" />
                Done
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="shrink-0 text-muted-foreground"
              >
                Pending
              </Badge>
            )}
          </header>

          <div className="flex flex-1 flex-col gap-4 px-5 py-4">
            {fields.map((f) => {
              const valueText = f.value || "Not set yet"
              return (
                <div key={f.label} className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground">
                    {f.label}
                  </span>
                  {TEXTAREA_FIELDS.has(f.label) ? (
                    <div
                      className={cn(
                        "min-h-20 rounded-md border bg-background px-3 py-2 text-sm leading-relaxed",
                        f.value ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {valueText}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2">
                      <span
                        className={cn(
                          "line-clamp-1 min-w-0 text-sm",
                          f.value ? "text-foreground" : "text-muted-foreground"
                        )}
                        title={valueText}
                      >
                        {valueText}
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
              )
            })}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t px-5 py-3">
            <Button type="button" variant="outline" size="sm">
              Close
            </Button>
            {step.n < steps.length ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setSelected(step.n + 1)}
              >
                Next: {steps[step.n].title}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : null}
          </footer>
        </section>
      </div>
    </div>
  )
}
