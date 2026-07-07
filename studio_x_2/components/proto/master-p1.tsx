"use client"

/**
 * MASTER P1 — "Mail mirror": the closest translation of the mail-app reference.
 * Two side-by-side page-level cards: LEFT = the 5 build steps as one unbroken
 * list (breadcrumb-style done/current/pending dots), RIGHT = the selected
 * step's configuration upfront as label:value rows. Identity/testing lives in
 * a slim top bar with an on-demand "Talk to Aria" affordance; the deploy state
 * sits as a slim bar below the two cards. Throwaway.
 */

import { useState } from "react"
import {
  ArrowRight,
  AudioLines,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageCircle,
  Phone,
  Radio,
  Rocket,
  Route,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DEPLOY_STATE, dataFor, Orb, type ProtoMode } from "@/components/proto/shared"

const STEP_ICONS: Record<number, typeof AudioLines> = {
  1: AudioLines,
  2: Route,
  3: FileText,
  4: Phone,
  5: Rocket,
}

export function MasterP1({ mode = "live" }: { mode?: ProtoMode }) {
  const [selected, setSelected] = useState(1)

  const { agent, steps, fields: allFields, live } = dataFor(mode)
  const step = steps[selected - 1]
  const fields = allFields[selected] ?? []
  // Done is done — selecting a step never removes it from the count.
  const doneCount = steps.filter((s) => s.done).length

  return (
    <div className="flex flex-col gap-4">
      {/* Slim identity bar — agent lives here, out of the main layout */}
      <div className="flex items-center gap-3 px-1">
        <Orb size={32} />
        <span className="text-sm font-semibold">{agent.name}</span>
        <Badge
          variant="outline"
          className={cn(
            "gap-1.5",
            live ? "border-success/40 text-success" : "text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              live ? "bg-success" : "bg-muted-foreground/60"
            )}
          />
          {agent.status}
        </Badge>
        <span className="text-xs text-muted-foreground">{agent.role}</span>
        <div className="flex-1" />
        {live && (
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4" />
            Talk to {agent.name}
          </Button>
        )}
      </div>

      {/* Master–detail: two page-level cards; stacks below lg, list first */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[340px_1fr]">
        {/* LEFT card — the 5 steps, one unbroken sequence */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-medium">Build steps</span>
            <span className="text-xs text-muted-foreground">
              {doneCount} of {steps.length} done
            </span>
          </div>

          <div className="flex flex-col gap-0.5 p-2">
            {steps.map((s) => {
              const Icon = STEP_ICONS[s.n]
              const isCurrent = s.n === selected
              const valueLine = s.value || s.manifest || "Not set yet"
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setSelected(s.n)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/30",
                    isCurrent && "bg-accent/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{s.title}</span>
                    <span
                      className="block line-clamp-1 text-xs text-muted-foreground"
                      title={valueLine}
                    >
                      {valueLine}
                    </span>
                  </span>
                  {isCurrent ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-primary/40 text-primary"
                    >
                      Current
                    </Badge>
                  ) : s.done ? (
                    <span
                      role="img"
                      aria-label="Done"
                      className="h-2 w-2 shrink-0 rounded-full bg-success"
                    />
                  ) : (
                    <span
                      role="img"
                      aria-label="Pending"
                      className="h-2 w-2 shrink-0 rounded-full ring-1 ring-muted-foreground/40"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT card — selected step's config, upfront and inline */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-2.5 border-b px-5 py-3">
            <h2 className="text-sm font-medium">{step.title}</h2>
            {step.done ? (
              <Badge variant="outline" className="gap-1 border-success/40 text-success">
                <Check className="h-4 w-4" />
                Done
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Pending
              </Badge>
            )}
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                disabled={selected === 1}
                onClick={() => setSelected((n) => Math.max(1, n - 1))}
                aria-label="Previous step"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                disabled={selected === steps.length}
                onClick={() => setSelected((n) => Math.min(steps.length, n + 1))}
                aria-label="Next step"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="divide-y px-5">
            {fields.map((f) => (
              <div key={f.label} className="flex items-start gap-4 py-3">
                <span className="w-40 shrink-0 pt-0.5 text-xs text-muted-foreground">
                  {f.label}
                </span>
                <span className="min-w-0 flex-1 line-clamp-1 text-sm" title={f.value}>
                  {f.value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 border-t px-5 py-3">
            <span
              className="min-w-0 line-clamp-1 text-xs text-muted-foreground"
              title={step.manifest}
            >
              {step.manifest}
            </span>
            <Button
              size="sm"
              disabled={selected === steps.length}
              onClick={() => setSelected((n) => Math.min(steps.length, n + 1))}
            >
              Next step
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Deploy state — its own slim bar, out of the step sequence */}
      {live ? (
        <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 px-4 py-2.5">
          <Radio className="h-4 w-4 shrink-0 text-success" />
          <span className="min-w-0 flex-1">
            <span className="block line-clamp-1 text-sm font-medium" title={DEPLOY_STATE.headline}>
              {DEPLOY_STATE.headline}
            </span>
            <span
              className="block line-clamp-1 text-xs text-muted-foreground"
              title={DEPLOY_STATE.sub}
            >
              {DEPLOY_STATE.sub}
            </span>
          </span>
          <Button variant="ghost" size="xs">
            {DEPLOY_STATE.cta}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-4 py-2.5">
          <Radio className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Not deployed — finish the steps to go live
          </span>
        </div>
      )}
    </div>
  )
}
