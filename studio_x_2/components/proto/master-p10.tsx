"use client"

/**
 * MASTER P10 — "In-card breadcrumb": like P1, but the RIGHT card's header IS
 * the wayfinding. An explicit breadcrumb line ("Voice & models · Step 1 of 5 ·
 * ✓ Done") with tiny prev/next chevrons sits where you read. LEFT card stays a
 * minimal icon + title + value list; identity/Talk in a slim top bar; deploy
 * state in a quiet bar BELOW the two cards. Footer teases the NEXT step
 * (title + manifest) with a Continue button — Deploy/Redeploy on step 5.
 * Supports the Live/Draft harness toggle via `mode`. Throwaway.
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
import { dataFor, DEPLOY_STATE, Orb, type ProtoMode } from "@/components/proto/shared"

const STEP_ICONS: Record<number, typeof AudioLines> = {
  1: AudioLines,
  2: Route,
  3: FileText,
  4: Phone,
  5: Rocket,
}

export function MasterP10({ mode = "live" }: { mode?: ProtoMode }) {
  const [selected, setSelected] = useState(1)

  const { agent, steps, fields: allFields, live } = dataFor(mode)
  const step = steps[selected - 1]
  const fields = allFields[selected] ?? []
  const doneCount = steps.filter((s) => s.done).length
  const nextStep = selected < steps.length ? steps[selected] : null

  return (
    <div className="flex flex-col gap-4">
      {/* Slim identity bar — agent lives here, out of the main layout */}
      <div className="flex items-center gap-3 px-1">
        <Orb size={32} />
        <span className="text-sm font-semibold">{agent.name}</span>
        {live ? (
          <Badge variant="outline" className="gap-1.5 border-success/40 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {agent.status}
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            {agent.status}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">{agent.role}</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" disabled={!live}>
          <MessageCircle className="h-4 w-4" />
          {live ? `Talk to ${agent.name}` : "Talk to your agent"}
        </Button>
      </div>

      {/* Master–detail: two page-level cards; stacks below lg, list first */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[340px_1fr]">
        {/* LEFT card — the 5 steps, one unbroken sequence: icon + title + value */}
        <div className="min-w-0 rounded-xl border bg-card">
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
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/30",
                    isCurrent && "bg-accent/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{s.title}</span>
                    <span
                      className="block text-xs text-muted-foreground line-clamp-1"
                      title={valueLine}
                    >
                      {valueLine}
                    </span>
                  </span>
                  {isCurrent ? (
                    <span
                      className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary"
                      aria-label="Current step"
                    />
                  ) : s.done ? (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-success"
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
        <div className="min-w-0 rounded-xl border bg-card">
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
                Step {selected} of {steps.length}
              </span>
              <span className="text-xs text-muted-foreground" aria-hidden="true">
                ·
              </span>
              {step.done ? (
                <span className="flex items-center gap-1 text-xs font-medium text-success">
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
                disabled={selected === steps.length}
                onClick={() => setSelected((n) => Math.min(steps.length, n + 1))}
                aria-label="Next step"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Config — upfront label:value rows for the selected step */}
          <div className="divide-y px-5">
            {fields.map((f) => {
              const value = f.value || "Not set yet"
              return (
                <div key={f.label} className="flex items-start gap-4 py-3">
                  <span className="w-40 shrink-0 pt-0.5 text-xs text-muted-foreground">
                    {f.label}
                  </span>
                  <span className="min-w-0 flex-1 text-sm line-clamp-1" title={value}>
                    {value}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Footer — up-next teaser + Continue; Deploy/Redeploy on step 5 */}
          <div className="flex items-center justify-between gap-4 border-t px-5 py-3">
            {nextStep ? (
              <>
                <span
                  className="min-w-0 text-xs text-muted-foreground line-clamp-1"
                  title={`Up next: ${nextStep.title} — ${nextStep.manifest}`}
                >
                  Up next: {nextStep.title} — {nextStep.manifest}
                </span>
                <Button
                  size="sm"
                  onClick={() => setSelected((n) => Math.min(steps.length, n + 1))}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="min-w-0 text-xs text-muted-foreground line-clamp-1">
                  {live
                    ? "Everything's set — push your latest changes live."
                    : "Finish the steps above, then deploy."}
                </span>
                <Button size="sm">
                  <Rocket className="h-4 w-4" />
                  {live ? "Redeploy" : "Deploy"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deploy bar — below the cards, present but never competing */}
      {live ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-2.5">
          <Radio className="h-4 w-4 shrink-0 text-success" />
          <span className="min-w-0 flex-1">
            <span
              className="block text-sm font-medium line-clamp-1"
              title={DEPLOY_STATE.headline}
            >
              {DEPLOY_STATE.headline}
            </span>
            <span
              className="block text-xs text-muted-foreground line-clamp-1"
              title={DEPLOY_STATE.sub}
            >
              {DEPLOY_STATE.sub}
            </span>
          </span>
          <Button variant="outline" size="sm">
            {DEPLOY_STATE.cta}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-2.5">
          <Radio className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 text-sm text-muted-foreground line-clamp-1">
            Not deployed — finish the steps to go live
          </span>
        </div>
      )}
    </div>
  )
}
