"use client"

import * as React from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDot,
  ListChecks,
  Loader2,
  Mic,
  RotateCcw,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AgentIdentityCard } from "@/components/agent-identity-card"
import { AgentSphere } from "@/components/agent-test-panel"
import { getDefaultAgent, stackLine, STACK_ESTIMATE } from "@/lib/campaign-data"
import { JOURNEY_STEPS, NAMED_DEFAULT, type FirstRunPhase, type FirstRunVariantProps } from "./spec"

/**
 * Variant 1 · "Ceremony" — provisioning is a FULL-TAKEOVER moment (staged,
 * labeled, honest — R1/R2) that ENDS IN the locked landing (Aria left ·
 * journey right — R7). The journey steps carry endowed progress (R5/R6) and
 * retire into quiet shortcuts at 5/5.
 */

// ————————————————————————————————————————————————— provisioning ceremony

// Plausible, honest work — never a bare spinner (R1). Content is fixed: three
// stages that map to what a real backend does at signup.
const STAGES = [
  { label: "Creating your project", detail: "Workspace, API keys, and a test line" },
  { label: "Provisioning Aria, your default agent", detail: "Persona plus the Agora Balanced stack" },
  { label: "Warming the voice pipeline", detail: "Speech-to-text, model, and voice ready to answer" },
] as const

// Mock pacing only. The stage PROGRESSION stays under reduced motion (it is
// information, not decoration) — only spin/pulse styling is dropped.
const STAGE_MS = 1200
// Index of the stage the error scenario freezes on — the two before it stay
// visibly done (R2: finished work is never re-shown as pending).
const STALLED_AT = 2

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return reduced
}

function ProvisionCeremony({ stalled, onFinished }: { stalled: boolean; onFinished: () => void }) {
  const reduced = usePrefersReducedMotion()
  // `stage` = index of the currently running stage; everything below it is done.
  const [stage, setStage] = React.useState(stalled ? STALLED_AT : 0)
  // The error scenario mounts halted; Retry un-halts and the timers resume from
  // the stalled stage — retrying never redoes finished work (R2).
  const [halted, setHalted] = React.useState(stalled)

  React.useEffect(() => {
    if (halted) return
    if (stage >= STAGES.length) {
      // Brief settle beat so the last check registers before the takeover ends.
      const t = window.setTimeout(onFinished, reduced ? 0 : 600)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setStage((s) => s + 1), STAGE_MS)
    return () => window.clearTimeout(t)
  }, [stage, halted, reduced, onFinished])

  const active = STAGES[Math.min(stage, STAGES.length - 1)]

  return (
    // Full-takeover: one centered panel, nothing else competing for attention.
    <div className="flex min-h-96 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <AgentSphere size={72} active={!halted && !reduced} />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {halted ? "One step is taking longer than expected" : "Setting up your workspace"}
            </h1>
            {/* Honest estimate — a concrete number, never a fake percentage (R1). */}
            <p className="text-sm text-muted-foreground">Usually under 40 seconds.</p>
          </div>
        </div>

        {/* One polite live region instead of announcing every row (R9). */}
        <p className="sr-only" role="status">
          {halted
            ? `${STAGES[STALLED_AT].label} stalled. Retry available.`
            : stage >= STAGES.length
              ? "Setup finished. Aria is live."
              : `${active.label} in progress.`}
        </p>

        <ol className="space-y-3" aria-label="Setup stages">
          {STAGES.map((s, i) => {
            const state = i < stage ? "done" : i === stage ? (halted ? "stalled" : "active") : "pending"
            return (
              <li key={s.label} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {state === "done" && <CheckCircle2 className="h-5 w-5 text-success" />}
                  {state === "active" &&
                    (reduced
                      ? <CircleDot className="h-5 w-5 text-primary" />
                      : <Loader2 className="h-5 w-5 animate-spin text-primary" />)}
                  {state === "stalled" && <AlertTriangle className="h-5 w-5 text-warning" />}
                  {state === "pending" && <Circle className="h-5 w-5 text-muted-foreground/40" />}
                </span>
                <div className="min-w-0">
                  <p className={cn(
                    "text-sm",
                    state === "pending" ? "text-muted-foreground" : "font-medium text-foreground",
                  )}>
                    {s.label}
                    {state === "done" && <span className="sr-only"> — done</span>}
                  </p>
                  {state === "active" && <p className="text-xs text-muted-foreground">{s.detail}</p>}
                  {/* Zero blame copy: names the stage, owns the delay, promises
                      finished work is safe (R2). */}
                  {state === "stalled" && (
                    <p className="text-xs text-warning">
                      Stalled on our side — nothing you did. Everything above is saved; retry only redoes this step.
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>

        {halted ? (
          <div className="flex flex-col items-center gap-3">
            <Button className="w-full gap-1.5" onClick={() => setHalted(false)}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Retry this step
            </Button>
            <a
              href="https://status.agora.io"
              target="_blank"
              rel="noreferrer"
              className="rounded text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Check the Agora status page
            </a>
          </div>
        ) : (
          // The wait sells the payoff — what Aria can do the moment it ends (R1).
          <p className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
            The moment this finishes, <span className="font-medium text-foreground">Aria can take a real call in your browser</span> — say hello before you touch a single setting.
          </p>
        )}
      </div>
    </div>
  )
}

// ————————————————————————————————————————————————— landing (locked shape)

const HEADINGS: Record<Exclude<FirstRunPhase, "provisioning-error">, { h1: string; sub: string }> = {
  provisioning: {
    // Shown when the ceremony hands off into the landing.
    h1: "Aria is live — say hello",
    sub: "Your agent can talk right now, in the browser. Make her yours after.",
  },
  "first-visit": {
    h1: "Aria is live — say hello",
    sub: "Your agent can talk right now, in the browser. Make her yours after.",
  },
  "returning-incomplete": {
    h1: "Welcome back — Aria kept your progress",
    sub: "Pick up where you left off. The next step is queued up on the right.",
  },
  "returning-complete": {
    h1: "Aria is live and taking traffic",
    sub: "Setup is finished, so the checklist retired. Everything stays one click away.",
  },
}

// The named default stack — "smart model by default" made visible, honest
// claims only, escape hatch adjacent to the claim (R4).
function SpecStrip() {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-left">
      <p className="text-sm">
        <span className="font-medium">{NAMED_DEFAULT.name}</span>
        <span className="text-muted-foreground"> — {NAMED_DEFAULT.why}.</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {NAMED_DEFAULT.chips.map((chip) => (
          <Badge key={chip} variant="outline" className="font-mono text-xs tabular-nums">{chip}</Badge>
        ))}
      </div>
      {/* Mock — the real build deep-links to the builder's stack step. */}
      <button
        type="button"
        className="mt-2 rounded text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {NAMED_DEFAULT.escape}
      </button>
    </div>
  )
}

function JourneyPanel({
  stepsDone,
  onStep,
}: {
  stepsDone: number
  onStep: (id: string) => void
}) {
  const [open, setOpen] = React.useState(true)
  const [dismissed, setDismissed] = React.useState(false)

  // Never a nag (R6): dismissing leaves a one-click restore that keeps the
  // endowed count visible — progress is never thrown away.
  if (dismissed) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-3 py-2">
        <p className="text-sm text-muted-foreground">
          Setup guide hidden — progress saved at <span className="tabular-nums">{stepsDone}/5</span>.
        </p>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(false)}>Show</Button>
      </div>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="rounded-xl border border-border bg-card" aria-label="Setup journey">
        <div className="flex items-center gap-1 p-4 pb-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ListChecks className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate text-sm font-semibold">Put Aria to work</span>
              <Badge variant="secondary" className="shrink-0 tabular-nums">{stepsDone}/5</Badge>
              <ChevronDown
                className={cn("ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 shrink-0 p-0 text-muted-foreground"
            aria-label="Hide setup guide"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        {/* The bar stays visible even collapsed — endowed progress at a glance. */}
        <div className="px-4 pb-3">
          <Progress
            value={(stepsDone / JOURNEY_STEPS.length) * 100}
            aria-label={`Setup progress: ${stepsDone} of 5 steps complete`}
            className="h-1.5"
          />
        </div>

        <CollapsibleContent>
          <ol className="space-y-1 p-3 pt-0" aria-label={`Setup steps, ${stepsDone} of 5 complete`}>
            {JOURNEY_STEPS.map((step, i) => {
              const state = i < stepsDone ? "done" : i === stepsDone ? "next" : "todo"
              return (
                <li key={step.id}>
                  <div
                    className={cn(
                      "flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5",
                      state === "next" ? "border-primary/40 bg-primary/5" : "border-transparent",
                    )}
                  >
                    {state === "done" ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
                    ) : (
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums",
                          state === "next" ? "border-primary font-medium text-primary" : "border-border text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                    )}
                    <p className={cn("min-w-0 flex-1 text-sm", state === "done" ? "text-muted-foreground" : "font-medium")}>
                      {step.title}
                      {state === "done" && <span className="sr-only"> — done</span>}
                    </p>
                    {state === "next" ? (
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge variant="outline" className="border-primary/40 text-primary">Up next</Badge>
                        <Button size="sm" className="gap-1.5" onClick={() => onStep(step.id)}>
                          {step.id === "hear" && <Mic className="h-3.5 w-3.5" aria-hidden />}
                          {step.verb}
                        </Button>
                      </span>
                    ) : (
                      // Completed steps stay one click away (R6) — quiet, not crossed out.
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground"
                        onClick={() => onStep(step.id)}
                      >
                        {step.verb}
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}

// 5/5: the progress chrome retires — same five steps (content is locked),
// re-presented as quiet shortcuts. No trophy, no count, no checks.
function ScaleShortcuts({ onStep }: { onStep: (id: string) => void }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4" aria-label="Shortcuts">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Shortcuts</p>
      <p className="mt-1 text-sm text-muted-foreground">Setup is done — no more checklist. These stay one click away.</p>
      <ul className="mt-3 grid gap-1 sm:grid-cols-2">
        {JOURNEY_STEPS.map((step) => (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onStep(step.id)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{step.verb}</span>
                <span className="block truncate text-xs text-muted-foreground">{step.title}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Landing({
  phase,
  stepsDone,
  arrived,
  onReplay,
}: {
  phase: Exclude<FirstRunPhase, "provisioning-error">
  stepsDone: number
  /** Just handed off from the ceremony — show the "provisioned just now" beat. */
  arrived: boolean
  onReplay?: () => void
}) {
  const [talking, setTalking] = React.useState(false)
  const aria = getDefaultAgent()
  const est = STACK_ESTIMATE[aria.stack.preset]
  const heading = HEADINGS[phase]

  // Mock: "hear" drives the in-browser talk toggle; the rest deep-link into
  // the builder (?step=N) in the real build.
  const onStep = (id: string) => {
    if (id === "hear") setTalking(true)
  }

  return (
    <div className="w-full space-y-6 px-4 py-8 pb-16 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{heading.h1}</h1>
          <p className="text-sm text-muted-foreground">{heading.sub}</p>
        </header>
        {arrived && (
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline" className="gap-1 border-success/40 text-success">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> Provisioned just now
            </Badge>
            {/* Lab-only affordance so judges can re-watch the takeover. */}
            {onReplay && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onReplay}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Replay
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Column shape verbatim from agent-wizard.tsx — the locked landing is
          Aria left (sticky) · journey right; additive only (R7). */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <AgentIdentityCard
          name={aria.name}
          status="Live"
          subtitle="Your default agent — answering since signup"
          stack={stackLine(aria.stack)}
          language="English · Balanced"
          costPerMin={est.costPerMin}
          latencyMs={est.latencyMs}
          talking={talking}
          onToggleTalk={() => setTalking((v) => !v)}
          talkLabel="Talk to Aria"
          secondary={<SpecStrip />}
        />

        {phase === "returning-complete"
          ? <ScaleShortcuts onStep={onStep} />
          : <JourneyPanel stepsDone={stepsDone} onStep={onStep} />}
      </div>
    </div>
  )
}

// ————————————————————————————————————————————————— variant root

export function Variant1({ scenario }: FirstRunVariantProps) {
  // The ceremony ENDS IN the landing: once the mock stages finish (or a retry
  // recovers), the takeover hands off to the exact landing the user will live
  // in — no separate "done" screen to click through.
  const [ceremonyDone, setCeremonyDone] = React.useState(false)

  // Reset the handoff when the lab switches scenarios (adjust-state-in-render,
  // avoids a one-frame stale flash an effect would cause).
  const [prevId, setPrevId] = React.useState(scenario.id)
  if (prevId !== scenario.id) {
    setPrevId(scenario.id)
    setCeremonyDone(false)
  }

  const finish = React.useCallback(() => setCeremonyDone(true), [])

  const isProvisioningScenario = scenario.id === "provisioning" || scenario.id === "provisioning-error"
  if (isProvisioningScenario && !ceremonyDone) {
    return (
      <ProvisionCeremony
        key={scenario.id}
        stalled={scenario.id === "provisioning-error"}
        onFinished={finish}
      />
    )
  }

  // Post-ceremony both provisioning scenarios land as a first visit (0/5).
  const phase: Exclude<FirstRunPhase, "provisioning-error"> =
    scenario.id === "provisioning-error" ? "provisioning" : scenario.id
  return (
    <Landing
      key={scenario.id}
      phase={phase}
      stepsDone={scenario.stepsDone}
      arrived={isProvisioningScenario}
      onReplay={isProvisioningScenario ? () => setCeremonyDone(false) : undefined}
    />
  )
}
