"use client"

// A1 Variant 3 — "Working session": provisioning IS the journey list working.
// The endowed-progress effect made literal: the platform completes the list's
// step zero in front of the user, so their very first sight of setup is
// already 1/6 done. THROWAWAY (first-run-lab harness) — judged, folded, deleted.

import * as React from "react"
import {
  ArrowRight,
  Blocks,
  Check,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  ListChecks,
  Loader2,
  Mic,
  PhoneOutgoing,
  Plus,
  RefreshCcw,
  Square,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { getDefaultAgent } from "@/lib/campaign-data"
import {
  JOURNEY_STEPS,
  NAMED_DEFAULT,
  type FirstRunVariantProps,
} from "@/components/first-run-lab/spec"

type StepId = (typeof JOURNEY_STEPS)[number]["id"]

// R1: 3 named stages, plausible work — never a bare spinner. Labels are the
// narration the user reads while the platform does step zero for them.
const PROVISION_STAGES = [
  { id: "project", label: "Create your project", detail: "Workspace, keys, and defaults" },
  { id: "aria", label: "Provision Aria", detail: `Persona + the ${NAMED_DEFAULT.name} stack` },
  { id: "pipeline", label: "Warm the voice pipeline", detail: "Speech in, reasoning, speech out — ready to answer" },
] as const

// Real wait is "usually under 40 seconds"; compressed here so judges see the
// whole arc without sitting through it. The COPY stays honest — no fake %.
const STAGE_MS = [2200, 2800, 2400]

// Error scenario stalls at the LAST stage so two finished stages stay visibly
// done (R2: everything already finished stays done; the stall is named).
const STALL_AT = 2

// Scale shortcuts the journey list graduates into at 5/5 (R6: no trophy —
// the surface keeps earning its place for a power user).
const SCALE_SHORTCUTS = [
  { id: "batch", icon: PhoneOutgoing, title: "Run a batch call", detail: "Point Aria at a CSV of contacts" },
  { id: "agent", icon: Plus, title: "Create another agent", detail: `Reuse ${NAMED_DEFAULT.name} or pick your own stack` },
  { id: "integrations", icon: Blocks, title: "Connect integrations", detail: "CRM, knowledge bases, MCP tools" },
] as const

export function Variant3({ scenario }: FirstRunVariantProps) {
  const aria = getDefaultAgent()
  const inProvisioning = scenario.id === "provisioning" || scenario.id === "provisioning-error"

  const [stage, setStage] = React.useState(() => (scenario.id === "provisioning-error" ? STALL_AT : 0))
  const [stalled, setStalled] = React.useState(scenario.id === "provisioning-error")
  const provDone = !inProvisioning || stage >= PROVISION_STAGES.length

  // Mock journey completion — seeded from the scenario, advanced by clicking a
  // step's verb (mirrors the localStorage flags the real landing would keep).
  const [done, setDone] = React.useState<Set<StepId>>(
    () => new Set(JOURNEY_STEPS.slice(0, scenario.stepsDone).map((s) => s.id)),
  )
  const [talking, setTalking] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)

  // Stage auto-advance: timers are content progression, not decoration, so
  // they run under prefers-reduced-motion too (only the pulse/spin are gated).
  React.useEffect(() => {
    if (!inProvisioning || stalled || stage >= PROVISION_STAGES.length) return
    const t = window.setTimeout(() => setStage((s) => s + 1), STAGE_MS[stage])
    return () => window.clearTimeout(t)
  }, [inProvisioning, stalled, stage])

  const markDone = (id: StepId) =>
    setDone((d) => {
      if (d.has(id)) return d
      const next = new Set(d)
      next.add(id)
      return next
    })

  const stepAction = (id: StepId) => {
    // "Hear Aria" routes through the actual talk toggle so the card and the
    // list stay one mechanism, not two.
    if (id === "hear") {
      setTalking(true)
      return
    }
    markDone(id)
  }
  const endTalk = () => {
    setTalking(false)
    markDone("hear")
  }

  const nextUp = JOURNEY_STEPS.find((s) => !done.has(s.id))?.id
  // Provisioning counts as row 1 of 6 — the endowed-progress row.
  const doneCount = done.size + (provDone ? 1 : 0)
  const total = JOURNEY_STEPS.length + 1
  const complete = provDone && done.size === JOURNEY_STEPS.length

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      {/* LEFT — Aria identity card (locked landing position, R7). During
          provisioning it dims so the working journey list on the right leads. */}
      <section
        aria-label="Your agent"
        className={cn(
          "flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center lg:sticky lg:top-6",
          !provDone && "opacity-70",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary",
            !provDone && "motion-safe:animate-pulse",
            talking && "ring-4 ring-primary/30 motion-safe:animate-pulse",
          )}
        >
          <Mic className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{aria.name}</h2>
            {provDone ? (
              <Badge variant="outline" className="gap-1 border-success/40 bg-success/10 text-success">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success motion-safe:animate-pulse" />
                Live
              </Badge>
            ) : stalled ? (
              <Badge variant="warning">Paused</Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Loader2 aria-hidden className="motion-safe:animate-spin" />
                Provisioning
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{aria.role}</p>
        </div>

        {/* R3: talking in-browser is the unmistakable primary action. */}
        {talking ? (
          <Button size="lg" variant="outline" className="w-full gap-2" onClick={endTalk}>
            <Square aria-hidden /> End call
          </Button>
        ) : (
          <Button size="lg" className="w-full gap-2" disabled={!provDone} onClick={() => setTalking(true)}>
            <Mic aria-hidden /> Talk to {aria.name}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          {provDone
            ? "In your browser · free · nothing to set up"
            : `The moment this finishes, ${aria.name} answers right here — nothing to set up.`}
        </p>

        <Separator />

        {/* R4: the default stack NAMED, with the why and the escape hatch. */}
        <div className="w-full space-y-2 text-left">
          <p className="text-xs font-medium">
            Runs <span className="text-foreground">{NAMED_DEFAULT.name}</span>
            <span className="text-muted-foreground"> — {NAMED_DEFAULT.why}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {NAMED_DEFAULT.chips.map((chip) => (
              <Badge key={chip} variant="outline" className="tabular-nums">
                {chip}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{NAMED_DEFAULT.escape}</p>
        </div>
      </section>

      {/* RIGHT — the journey list. During provisioning this column leads:
          step zero is the platform's own work, auto-completing in place. */}
      {complete ? (
        <ScaleShortcuts agentName={aria.name} />
      ) : dismissed ? (
        // R6: dismissed, never gone — progress stays one click away.
        <Button variant="outline" className="justify-start gap-2 self-start" onClick={() => setDismissed(false)}>
          <ListChecks aria-hidden />
          Setup guide
          <span className="tabular-nums text-muted-foreground">
            {doneCount}/{total}
          </span>
          <span className="text-muted-foreground">— show</span>
        </Button>
      ) : (
        <Collapsible
          open={!collapsed}
          onOpenChange={(open) => setCollapsed(!open)}
          className={cn("rounded-xl border border-border bg-card", !provDone && "ring-1 ring-primary/20")}
        >
          <div className="flex items-start justify-between gap-3 p-4 pb-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight">Your path to live</h2>
                <span
                  role="status"
                  aria-label={`Setup progress: ${doneCount} of ${total} done`}
                  className="text-xs tabular-nums text-muted-foreground"
                >
                  {doneCount}/{total}
                </span>
              </div>
              {/* The spec strip echoed ONCE beside the list header — the list
                  and the card describe the same named stack (R4, no drift). */}
              {provDone && (
                <p className="truncate text-xs text-muted-foreground">
                  Runs {NAMED_DEFAULT.name} · <span className="tabular-nums">{NAMED_DEFAULT.chips.join(" · ")}</span>
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {/* R6: never a nag — collapse and dismiss both live here. */}
              {provDone && (
                <Button variant="ghost" size="xs" onClick={() => setDismissed(true)}>
                  Hide
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={collapsed ? "Expand setup guide" : "Collapse setup guide"}>
                  <ChevronDown aria-hidden className={cn("transition-transform", collapsed && "-rotate-90")} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <div className="px-4">
            <Progress
              value={(doneCount / total) * 100}
              aria-label={`Setup progress: ${doneCount} of ${total} done`}
              className="h-1"
            />
          </div>

          <CollapsibleContent>
            <ul className="space-y-1 p-3">
              {/* STEP ZERO — the endowed-progress row. The platform does this
                  one for the user, live, inside their own checklist. */}
              <li>
                {provDone ? (
                  <div className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                    <StepCheck done />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Provisioned for you ✓</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Project created · {aria.name} live on {NAMED_DEFAULT.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ProvisioningRow stage={stage} stalled={stalled} agentName={aria.name} onRetry={() => setStalled(false)} />
                )}
              </li>

              {/* The five journey steps (R5 endowed state; R8 value verbs).
                  Dimmed-but-visible until step zero finishes — the user sees
                  the whole path while the platform works. */}
              {JOURNEY_STEPS.map((step) => {
                const isDone = done.has(step.id)
                const isNext = provDone && step.id === nextUp
                return (
                  <li
                    key={step.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2 py-2.5",
                      isNext && "border border-primary/30 bg-primary/5",
                      !provDone && "opacity-50",
                    )}
                  >
                    <StepCheck done={isDone} active={isNext} />
                    <p className={cn("min-w-0 flex-1 truncate text-sm", isDone ? "text-muted-foreground" : "font-medium")}>
                      {step.title}
                    </p>
                    {isNext && <Badge variant="secondary">Up next</Badge>}
                    {/* Done steps keep their verb (ghost) — one click away, R6. */}
                    <Button
                      variant={isNext ? "default" : isDone ? "ghost" : "outline"}
                      size="sm"
                      disabled={!provDone}
                      onClick={() => stepAction(step.id)}
                    >
                      {step.verb}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

/** Step-status glyph: check when done, primary ring for the next-up row. */
function StepCheck({ done, active }: { done?: boolean; active?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
        done
          ? "border-success/40 bg-success/10 text-success"
          : active
            ? "border-primary/50 text-primary"
            : "border-border text-muted-foreground",
      )}
    >
      {done && <Check className="h-3 w-3" />}
    </span>
  )
}

/** Step zero while it runs: staged, labeled, honest — and the wait sells the
 *  payoff (R1). Stalled: the stage is NAMED, finished work stays done, one
 *  retry, an escape hatch, zero blame (R2). */
function ProvisioningRow({
  stage,
  stalled,
  agentName,
  onRetry,
}: {
  stage: number
  stalled: boolean
  agentName: string
  onRetry: () => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-3">
      <div className="flex items-start gap-3">
        {stalled ? (
          <CircleAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        ) : (
          <Loader2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary motion-safe:animate-spin" />
        )}
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">
            Provisioning {agentName} — we&apos;re doing this one for you
          </p>
          {/* aria-live narrates stage changes for screen readers (R9). */}
          <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
            {stalled
              ? `“${PROVISION_STAGES[stage].label}” is taking longer than usual. Nothing you did — this stage sometimes needs a second try.`
              : "Usually under 40 seconds — no need to refresh."}
          </p>
        </div>
      </div>

      <ul className="space-y-1.5 pl-8">
        {PROVISION_STAGES.map((st, i) => {
          const isDone = i < stage
          const isActive = i === stage
          return (
            <li key={st.id} className="flex items-center gap-2 text-xs">
              {isDone ? (
                <Check aria-hidden className="h-3.5 w-3.5 shrink-0 text-success" />
              ) : isActive && !stalled ? (
                <Loader2 aria-hidden className="h-3.5 w-3.5 shrink-0 text-primary motion-safe:animate-spin" />
              ) : isActive ? (
                <CircleAlert aria-hidden className="h-3.5 w-3.5 shrink-0 text-warning" />
              ) : (
                <span aria-hidden className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
              )}
              <span className={cn(isDone && "text-muted-foreground", isActive && "font-medium")}>
                {st.label}
                {isDone && <span className="sr-only"> — done</span>}
                {isActive && stalled && <span className="sr-only"> — stalled</span>}
              </span>
              <span className="truncate text-muted-foreground">· {st.detail}</span>
            </li>
          )
        })}
      </ul>

      {stalled ? (
        <div className="flex flex-wrap items-center gap-2 pl-8">
          <Button size="sm" className="gap-1.5" onClick={onRetry}>
            <RefreshCcw aria-hidden /> Retry this stage
          </Button>
          <Button variant="ghost" size="sm" asChild>
            {/* Escape hatch, not a dead end (R2). Mock link in the harness. */}
            <a href="#">
              Agora status <ExternalLink aria-hidden />
            </a>
          </Button>
        </div>
      ) : (
        <p className="pl-8 text-xs text-muted-foreground">
          When it finishes, {agentName} takes a real call in your browser — free, before you configure anything.
        </p>
      )}
    </div>
  )
}

/** 5/5 — the checklist retires into scale shortcuts; no permanent trophy. */
function ScaleShortcuts({ agentName }: { agentName: string }) {
  return (
    <section aria-label="Scale from here" className="rounded-xl border border-border bg-card p-4">
      <div className="space-y-1 pb-3">
        <h2 className="text-sm font-semibold tracking-tight">Scale from here</h2>
        <p className="text-xs text-muted-foreground">
          Setup&apos;s done — {agentName} is live. This space now tracks how you grow.
        </p>
      </div>
      <ul className="space-y-1">
        {SCALE_SHORTCUTS.map((s) => (
          <li key={s.id}>
            <Button variant="ghost" className="h-auto w-full justify-start gap-3 px-2 py-2.5">
              <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <s.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-medium">{s.title}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{s.detail}</span>
              </span>
              <ArrowRight aria-hidden className="text-muted-foreground" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
