"use client"

/**
 * Master-detail P4 — "Stepper only"
 * THROWAWAY arrangement prototype. Tests whether the LEFT master list is
 * even needed: the horizontal breadcrumb stepper at top is the ONLY
 * navigation (5 connected, clickable segments — icon + title + one-word
 * value). Below it, ONE full-width detail card renders the selected
 * step's STEP_FIELDS in a wide two-column grid, with Back/Next in the
 * footer and a ghost "Talk to Aria" in the card header. Deploy state is
 * a slim bar between stepper and card.
 */

import { useState } from "react"
import {
  AudioLines,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Mic,
  Phone,
  Rocket,
  Route,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AGENT,
  DEPLOY_STATE,
  Orb,
  STEPS,
  STEP_FIELDS,
} from "@/components/proto/shared"

const STEP_ICONS: Record<number, LucideIcon> = {
  1: AudioLines,
  2: Route,
  3: MessageSquareText,
  4: Phone,
  5: Rocket,
}

/** One-word recognition value beneath each segment (derived from shared data). */
const ONE_WORD: Record<number, string> = {
  1: AGENT.preset, // Balanced
  2: AGENT.channelLabel, // Inbound
  3: "Ready",
  4: "Linked",
  5: AGENT.status, // Live
}

export function MasterP4() {
  const [selected, setSelected] = useState(1)

  const step = STEPS.find((s) => s.n === selected) ?? STEPS[0]
  const fields = STEP_FIELDS[step.n] ?? []
  const StepIcon = STEP_ICONS[step.n] ?? AudioLines
  const isLive = STEPS.every((s) => s.done)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-10">
      {/* Slim identity row — agent lives OUT of the main layout */}
      <div className="flex items-center gap-3 px-1">
        <Orb size={32} />
        <span className="text-sm font-semibold text-foreground">
          {AGENT.name}
        </span>
        <Badge variant="outline" className="gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          {AGENT.status}
        </Badge>
        <span className="ml-auto hidden truncate font-mono text-xs text-muted-foreground sm:block">
          {AGENT.id} · {AGENT.stack}
        </span>
      </div>

      {/* CARD 1 — the breadcrumb stepper: the ONLY navigation */}
      <nav
        aria-label="Setup steps"
        className="rounded-xl border border-border bg-card px-2 py-2 shadow-sm"
      >
        <ol className="flex items-stretch">
          {STEPS.map((s, i) => {
            const Icon = STEP_ICONS[s.n] ?? AudioLines
            const isCurrent = s.n === selected
            return (
              <li key={s.n} className="flex min-w-0 flex-1 items-center">
                <button
                  type="button"
                  onClick={() => setSelected(s.n)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-center transition-colors ${
                    isCurrent
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <span
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${
                      isCurrent
                        ? "border-primary bg-primary/10 text-primary"
                        : s.done
                          ? "border-border bg-muted text-foreground"
                          : "border-dashed border-border text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {s.done ? (
                      <span
                        className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        aria-hidden
                      >
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    ) : null}
                    <span className="sr-only">
                      {s.done ? "Done" : isCurrent ? "Current" : "Pending"}
                    </span>
                  </span>
                  <span
                    className={`w-full truncate text-xs font-medium ${
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.n}. {s.title}
                  </span>
                  <span
                    className={`w-full truncate text-xs ${
                      isCurrent ? "text-primary" : "text-muted-foreground/70"
                    }`}
                  >
                    {ONE_WORD[s.n]}
                  </span>
                </button>
                {i < STEPS.length - 1 ? (
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground/50"
                    aria-hidden
                  />
                ) : null}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Slim deploy bar — present but quiet */}
      {isLive ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {DEPLOY_STATE.headline}
            </span>
            <span className="hidden sm:inline"> — {DEPLOY_STATE.sub}</span>
          </p>
          <Button type="button" variant="outline" size="sm" className="shrink-0">
            {DEPLOY_STATE.cta}
          </Button>
        </div>
      ) : null}

      {/* CARD 2 — full-width detail: the selected step's config, upfront */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <header className="flex items-center gap-3 px-6 py-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground">
            <StepIcon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-foreground">
              Step {step.n} · {step.title}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {step.manifest}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="shrink-0">
            <Mic className="h-4 w-4" />
            Talk to {AGENT.name}
          </Button>
        </header>

        <Separator />

        {/* Wide two-column field grid — long values span the full row */}
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-6 py-6 sm:grid-cols-2">
          {fields.map((f) => (
            <div
              key={f.label}
              className={`flex flex-col gap-1.5 ${
                f.value.length > 48 ? "sm:col-span-2" : ""
              }`}
            >
              <dt className="text-xs font-medium text-muted-foreground">
                {f.label}
              </dt>
              <dd className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>

        <Separator />

        <footer className="flex items-center justify-between px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={selected <= 1}
            onClick={() => setSelected((n) => Math.max(1, n - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="text-xs text-muted-foreground">
            Step {selected} of {STEPS.length}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={selected >= STEPS.length}
            onClick={() => setSelected((n) => Math.min(STEPS.length, n + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </footer>
      </section>
    </div>
  )
}
