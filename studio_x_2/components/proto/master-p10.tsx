"use client"

/**
 * MASTER P10 — "In-card breadcrumb": like P1, but the RIGHT card's header IS
 * the wayfinding. An explicit breadcrumb line ("Voice & models · Step 1 of 5 ·
 * ✓ Done") with tiny prev/next chevrons sits where you read, and a micro-trail
 * of 5 done/current/pending dots lives just beneath it. LEFT card stays a
 * minimal icon + title + value list; identity/Talk in a slim top bar; deploy
 * state in a quiet bar BELOW the two cards. Throwaway.
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
import { AGENT, DEPLOY_STATE, Orb, STEP_FIELDS, STEPS } from "@/components/proto/shared"

const STEP_ICONS: Record<number, typeof AudioLines> = {
  1: AudioLines,
  2: Route,
  3: FileText,
  4: Phone,
  5: Rocket,
}

export function MasterP10() {
  const [selected, setSelected] = useState(1)

  const step = STEPS[selected - 1]
  const fields = STEP_FIELDS[selected] ?? []
  const doneCount = STEPS.filter((s) => s.done && s.n !== selected).length

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

      {/* Master–detail: two page-level cards */}
      <div className="grid grid-cols-[340px_1fr] items-start gap-4">
        {/* LEFT card — the 5 steps, one unbroken sequence: icon + title + value */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-medium">Build steps</span>
            <span className="text-xs text-muted-foreground">
              {doneCount} of {STEPS.length} done
            </span>
          </div>

          <div className="flex flex-col gap-0.5 p-2">
            {STEPS.map((s) => {
              const Icon = STEP_ICONS[s.n]
              const isCurrent = s.n === selected
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setSelected(s.n)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/30",
                    isCurrent && "bg-accent/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{s.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{s.value}</span>
                  </span>
                  {isCurrent ? (
                    <span
                      className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary"
                      aria-label="Current step"
                    />
                  ) : s.done ? (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                      aria-label="Done"
                    />
                  ) : (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full ring-1 ring-muted-foreground/40"
                      aria-label="Pending"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT card — breadcrumb header lives WHERE you read, then config */}
        <div className="rounded-xl border bg-card">
          {/* In-card breadcrumb line: title · Step N of 5 · status, + chevrons */}
          <div className="flex items-center gap-2 border-b px-5 py-3">
            <nav
              aria-label="Step breadcrumb"
              className="flex min-w-0 flex-1 items-center gap-2 truncate"
            >
              <span className="text-sm font-medium">{step.title}</span>
              <span className="text-xs text-muted-foreground" aria-hidden="true">
                ·
              </span>
              <span className="text-xs text-muted-foreground">
                Step {selected} of {STEPS.length}
              </span>
              <span className="text-xs text-muted-foreground" aria-hidden="true">
                ·
              </span>
              {step.done ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                  <Check className="h-4 w-4" />
                  Done
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </nav>
            <div className="flex items-center gap-1">
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
                disabled={selected === STEPS.length}
                onClick={() => setSelected((n) => Math.min(STEPS.length, n + 1))}
                aria-label="Next step"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Micro-trail — five done/current/pending dots beneath the header */}
          <div className="flex items-center gap-2 border-b px-5 py-2.5">
            {STEPS.map((s) => {
              const isCurrent = s.n === selected
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setSelected(s.n)}
                  aria-label={`${s.title} — ${isCurrent ? "current" : s.done ? "done" : "pending"}`}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    isCurrent
                      ? "w-5 bg-primary"
                      : s.done
                        ? "w-1.5 bg-emerald-500 hover:bg-emerald-500/70"
                        : "w-1.5 ring-1 ring-muted-foreground/40 hover:ring-muted-foreground"
                  )}
                />
              )
            })}
            <span className="ml-1 text-xs text-muted-foreground">
              {doneCount} of {STEPS.length} done
            </span>
          </div>

          {/* Config — upfront label:value rows for the selected step */}
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

          <div className="flex items-center justify-between gap-4 border-t px-5 py-3">
            <span className="truncate text-xs text-muted-foreground">{step.manifest}</span>
            <Button
              size="sm"
              disabled={selected === STEPS.length}
              onClick={() => setSelected((n) => Math.min(STEPS.length, n + 1))}
            >
              Next step
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Deploy bar — below the cards, present but never competing */}
      <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-2.5">
        <Radio className="h-4 w-4 shrink-0 text-emerald-500" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{DEPLOY_STATE.headline}</span>
          <span className="block truncate text-xs text-muted-foreground">{DEPLOY_STATE.sub}</span>
        </span>
        <Button variant="outline" size="sm">
          {DEPLOY_STATE.cta}
        </Button>
      </div>
    </div>
  )
}
