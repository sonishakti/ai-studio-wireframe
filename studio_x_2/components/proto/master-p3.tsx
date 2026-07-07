"use client"

/**
 * MASTER-DETAIL P3 — TOP TRAIL + SLIM LIST.
 * A horizontal breadcrumb trail above both cards carries THE progress
 * experience (done = muted-success, current = primary-filled, pending =
 * outline). Below, a [280px_1fr] master-detail: slim step list on the left
 * (title + status dot — the trail already tells the story), the selected
 * step's config upfront on the right. Identity (Aria · Live · Talk) sits
 * slim and right-aligned inside the trail row. Throwaway prototype.
 */

import { useState } from "react"
import {
  AudioLines,
  Check,
  ChevronLeft,
  ChevronRight,
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
const SHORT_TITLES = ["Voice", "Type", "Prompt", "Number", "Deploy"]

export function MasterP3() {
  const [selected, setSelected] = useState(1)
  const step = STEPS[selected - 1]
  const fields = STEP_FIELDS[selected] ?? []

  return (
    <div className="flex flex-col gap-4">
      {/* ── Top trail: 5 connected chips + slim identity strip ─────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <nav aria-label="Setup progress" className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = STEP_ICONS[i]
            const isCurrent = s.n === selected
            const isDone = s.done && !isCurrent
            return (
              <div key={s.n} className="flex shrink-0 items-center gap-1.5">
                {i > 0 && (
                  <span
                    aria-hidden
                    className={cn("h-px w-5", STEPS[i - 1].done ? "bg-emerald-500/40" : "bg-border")}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setSelected(s.n)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    isDone && "border-emerald-500/30 bg-emerald-500/5 text-muted-foreground hover:text-foreground",
                    !isCurrent && !isDone && "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {isDone ? <Check className="h-4 w-4 text-emerald-500" /> : <Icon className="h-4 w-4" />}
                  {SHORT_TITLES[i]}
                </button>
              </div>
            )
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <Orb size={24} />
          <span className="text-sm font-medium">{AGENT.name}</span>
          <Badge variant="outline" className="gap-1.5 border-emerald-500/40 text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {AGENT.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Mic className="h-4 w-4" />
            Talk to {AGENT.name}
          </Button>
        </div>
      </div>

      {/* ── Master-detail: slim list card + upfront config card ────────── */}
      <div className="grid items-start gap-4 lg:grid-cols-[280px_1fr]">
        {/* LEFT — slim step list */}
        <div className="rounded-xl border bg-card">
          <div className="flex flex-col gap-0.5 p-2">
            {STEPS.map((s) => {
              const isCurrent = s.n === selected
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setSelected(s.n)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    isCurrent
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      s.done ? "bg-emerald-500" : isCurrent ? "bg-primary" : "bg-muted-foreground/30",
                    )}
                  />
                  <span className="truncate">{s.title}</span>
                </button>
              )
            })}
          </div>

          {/* Deploy state — present, not competing */}
          <div className="border-t p-3">
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate">{DEPLOY_STATE.headline}</span>
            </div>
            <Button variant="outline" size="sm" className="mt-2 w-full">
              {DEPLOY_STATE.cta}
            </Button>
          </div>
        </div>

        {/* RIGHT — selected step's config, upfront */}
        <div className="flex flex-col rounded-xl border bg-card">
          <div className="border-b p-5">
            <p className="text-xs text-muted-foreground">
              Step {step.n} of {STEPS.length}
            </p>
            <h2 className="mt-1 text-base font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.manifest}</p>
          </div>

          <dl className="flex flex-1 flex-col gap-4 p-5">
            {fields.map((f) => (
              <div key={f.label} className="flex flex-col gap-1.5">
                <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                <dd className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center justify-between border-t p-4">
            <Button
              variant="outline"
              size="sm"
              disabled={selected === 1}
              onClick={() => setSelected((n) => Math.max(1, n - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selected === STEPS.length}
              onClick={() => setSelected((n) => Math.min(STEPS.length, n + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
