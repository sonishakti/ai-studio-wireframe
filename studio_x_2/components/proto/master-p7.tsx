"use client"

/**
 * Master-detail P7 — "Identity in the list card"
 * THROWAWAY master-detail prototype for the /agents builder landing.
 * No top bar at all: the LEFT page-level card opens with a compact
 * identity block (Orb 40 · name + Live · role · mono channel line ·
 * small outline Talk button) under a border-b, then the five steps as
 * one unbroken breadcrumb-style list (title + value + state dot).
 * The RIGHT page-level card is pure config for the selected step,
 * fields upfront, with prev/next. Deploy state rides as a slim
 * footer strip on the left card so it never competes.
 * Test: does merging identity into the list card free vertical space
 * and read cleaner than a top bar?
 */

import { useState } from "react"
import { ChevronLeft, ChevronRight, Mic, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AGENT,
  DEPLOY_STATE,
  Orb,
  STEP_FIELDS,
  STEPS,
} from "@/components/proto/shared"
import { cn } from "@/lib/utils"

export function MasterP7() {
  const [selected, setSelected] = useState(1)

  const step = STEPS.find((s) => s.n === selected) ?? STEPS[0]
  const fields = STEP_FIELDS[step.n] ?? []

  return (
    <div className="mx-auto grid w-full max-w-5xl items-start gap-4 px-4 py-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* LEFT page-level card: identity block + unbroken 5-step list + slim deploy footer */}
      <section className="flex flex-col rounded-xl border bg-card">
        {/* Compact identity block — replaces any top bar */}
        <header className="flex items-center gap-3 border-b p-4">
          <Orb size={40} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {AGENT.name}
              </h1>
              <Badge variant="outline" className="gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  aria-hidden
                />
                {AGENT.status}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {AGENT.role}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {AGENT.channelLabel} · {AGENT.channelTarget}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0">
            <Mic className="h-4 w-4" />
            Talk
          </Button>
        </header>

        {/* One unbroken sequence, 1→5 — no group headers */}
        <ol className="flex flex-col p-2" aria-label="Setup steps">
          {STEPS.map((s) => {
            const isCurrent = s.n === selected
            return (
              <li key={s.n}>
                <button
                  type="button"
                  onClick={() => setSelected(s.n)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isCurrent ? "bg-accent" : "hover:bg-accent/50"
                  )}
                >
                  {/* State dot: done = filled, pending = hollow, current = ringed */}
                  <span
                    aria-hidden
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      s.done
                        ? "bg-primary"
                        : "border border-muted-foreground/50 bg-transparent",
                      isCurrent && "ring-2 ring-primary/30"
                    )}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCurrent ? "text-foreground" : "text-foreground/90"
                      )}
                    >
                      {s.n}. {s.title}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {s.value}
                    </span>
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground",
                      isCurrent ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden
                  />
                </button>
              </li>
            )
          })}
        </ol>

        {/* Slim deploy strip — present, never loud */}
        <footer className="mt-auto flex items-center justify-between gap-3 border-t px-4 py-3">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {DEPLOY_STATE.headline}
            </span>{" "}
            — {DEPLOY_STATE.sub}
          </p>
          <Button type="button" variant="secondary" size="sm" className="shrink-0">
            <RefreshCw className="h-4 w-4" />
            {DEPLOY_STATE.cta}
          </Button>
        </footer>
      </section>

      {/* RIGHT page-level card: pure config for the selected step */}
      <section className="flex flex-col rounded-xl border bg-card">
        <header className="border-b p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Step {step.n} of {STEPS.length}
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-foreground">
            {step.title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{step.manifest}</p>
        </header>

        <div className="flex flex-col gap-4 p-4">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {field.label}
              </span>
              {/* Disabled-looking input surface — upfront, non-functional */}
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-foreground">
                {field.value}
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-auto flex items-center justify-between border-t px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={step.n === 1}
            onClick={() => setSelected((n) => Math.max(1, n - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={step.n === STEPS.length}
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
