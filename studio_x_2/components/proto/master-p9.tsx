"use client"

/**
 * MASTER P9 — "Scroll-spy all-upfront": nothing is hidden, ever.
 * RIGHT page-level card stacks ALL FIVE step configs as sections — each with a
 * sticky-ish header (icon + title + done ✓) followed by its STEP_FIELDS — in
 * one scrollable card, with the deploy bar fixed at its bottom. LEFT slim card
 * is an anchor nav: the 5 titles in order with breadcrumb-style state dots;
 * highlight follows a trivial useState onClick (no real scroll-spy).
 * Identity/testing = slim top bar with an on-demand "Talk to Aria". Throwaway.
 */

import { useState } from "react"
import {
  AudioLines,
  Check,
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
import { AGENT, DEPLOY_STATE, Orb, STEP_FIELDS, STEPS } from "@/components/proto/shared"

const STEP_ICONS: Record<number, typeof AudioLines> = {
  1: AudioLines,
  2: Route,
  3: FileText,
  4: Phone,
  5: Rocket,
}

const sectionId = (n: number) => `p9-step-${n}`

export function MasterP9() {
  const [selected, setSelected] = useState(1)

  const doneCount = STEPS.filter((s) => s.done).length

  const jumpTo = (n: number) => {
    setSelected(n)
    document
      .getElementById(sectionId(n))
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Slim identity bar — agent lives here, out of the main layout */}
      <div className="flex items-center gap-3 px-1">
        <Orb size={32} />
        <span className="text-sm font-semibold">{AGENT.name}</span>
        <Badge variant="outline" className="gap-1.5 border-emerald-500/40 text-emerald-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {AGENT.status}
        </Badge>
        <span className="text-xs text-muted-foreground">{AGENT.role}</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm">
          <MessageCircle className="h-4 w-4" />
          Talk to Aria
        </Button>
      </div>

      {/* Master–detail: slim anchor nav + one all-upfront scrollable card */}
      <div className="grid grid-cols-[240px_1fr] items-start gap-4">
        {/* LEFT slim card — anchor nav, one unbroken 1→5 sequence */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-medium">Steps</span>
            <span className="text-xs text-muted-foreground">
              {doneCount} of {STEPS.length} done
            </span>
          </div>

          <nav aria-label="Build steps" className="flex flex-col gap-0.5 p-2">
            {STEPS.map((s) => {
              const isCurrent = s.n === selected
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => jumpTo(s.n)}
                  aria-current={isCurrent ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/30",
                    isCurrent && "bg-accent/50"
                  )}
                >
                  {isCurrent ? (
                    <span
                      className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary"
                      aria-label="Current step"
                    />
                  ) : s.done ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                      aria-label="Done"
                    />
                  ) : (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full ring-1 ring-muted-foreground/40"
                      aria-label="Pending"
                    />
                  )}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      isCurrent ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {s.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{s.n}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* RIGHT card — ALL FIVE sections stacked, one scrollable card */}
        <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
          <div className="max-h-140 overflow-y-auto">
            {STEPS.map((s, i) => {
              const Icon = STEP_ICONS[s.n]
              const fields = STEP_FIELDS[s.n] ?? []
              const isCurrent = s.n === selected
              return (
                <section
                  key={s.n}
                  id={sectionId(s.n)}
                  aria-labelledby={`${sectionId(s.n)}-title`}
                  className={cn(i > 0 && "border-t")}
                >
                  {/* Sticky-ish section header — stays pinned while its fields scroll */}
                  <div
                    className={cn(
                      "sticky top-0 z-10 flex items-center gap-2.5 border-b bg-card px-5 py-3",
                      isCurrent && "bg-accent/50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <h2 id={`${sectionId(s.n)}-title`} className="text-sm font-medium">
                      {s.title}
                    </h2>
                    {s.done && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/40 text-emerald-500"
                      >
                        <Check className="h-4 w-4" />
                        Done
                      </Badge>
                    )}
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      Step {s.n} of {STEPS.length}
                    </span>
                  </div>

                  <div className="divide-y px-5">
                    {fields.map((f) => (
                      <div key={f.label} className="flex items-start gap-4 py-3">
                        <span className="w-40 shrink-0 pt-0.5 text-xs text-muted-foreground">
                          {f.label}
                        </span>
                        <span className="min-w-0 flex-1 text-sm">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>

          {/* Deploy bar — fixed at the bottom of the right card, never competing */}
          <div className="flex items-center gap-3 border-t bg-muted/30 px-5 py-3">
            <Radio className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {DEPLOY_STATE.headline}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {DEPLOY_STATE.sub}
              </span>
            </span>
            <Button size="sm">{DEPLOY_STATE.cta}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
