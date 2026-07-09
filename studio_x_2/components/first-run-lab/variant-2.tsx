"use client"

import * as React from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  AudioLines,
  Check,
  ChevronDown,
  Circle,
  ExternalLink,
  Mic,
  PenLine,
  PhoneOff,
  Radio,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AgentSphere } from "@/components/agent-test-panel"
import { getDefaultAgent } from "@/lib/campaign-data"
import { JOURNEY_STEPS, NAMED_DEFAULT, type FirstRunVariantProps } from "./spec"

/**
 * Variant 2 — "Instant-feel".
 *
 * THESIS: the landing is never withheld. Provisioning is not a takeover screen
 * the user waits BEHIND — it is a state the Aria card wears while the rest of
 * the page is already real and explorable. The staged narration (R1) lives
 * INSIDE the card, exactly where the payoff will appear: when warm-up ends the
 * same card flips to LIVE in place — no navigation, no layout shift, the Talk
 * button the user has been looking at simply switches on.
 *
 * Layout is the LOCKED landing shape (R7): sticky Aria card left, journey
 * steps right. The journey list carries QUIET endowed progress (R5/R6): plain
 * checks, a bare "n/5" text (never a badge), and only the next step gets any
 * color at all — the list must never out-shout the Talk CTA (R3). At 5/5 the
 * checklist chrome retires entirely into flat scale shortcuts (same five
 * doors, minus the ceremony — no trophy, nothing vestigial, R10).
 */

type CardMode = "warming" | "stalled" | "live"

/** 3 named stages (R1) — plausible work, never a bare spinner. Stage 0 is
 *  already done when the card first paints: the account exists, so "creating
 *  project" showing an immediate ✓ is honest AND seeds endowment. */
const WARMUP_STAGES = [
  { id: "project", label: "Creating your project" },
  { id: "aria", label: "Provisioning Aria" },
  { id: "voice", label: "Warming the voice pipeline" },
] as const

/** Demo pacing only — compressed so the lab can watch the flip. The COPY keeps
 *  the honest real-world estimate ("usually under 40 seconds", no fake %). */
const DEMO_STAGE_MS = 3200

/** 5/5 graduation: the SAME five journey anchors reframed for scale — no new
 *  steps invented (spec: A1 upgrades state, not content) and no second
 *  checklist (R10). */
const SCALE_SHORTCUTS = [
  { id: "hear", icon: Mic, label: "Talk to Aria", sub: "Sanity-check the live config" },
  { id: "voice", icon: AudioLines, label: "Voice", sub: "Swap or tune how she sounds" },
  { id: "prompt", icon: PenLine, label: "Prompt", sub: "Teach her new business rules" },
  { id: "channel", icon: Radio, label: "Channels", sub: "Add another way in" },
  { id: "live", icon: Activity, label: "Live calls", sub: "Watch traffic in Monitor" },
] as const

export function Variant2({ scenario }: FirstRunVariantProps) {
  // key resets every timer/counter/local-progress when the lab switches
  // scenarios — each phase must demo from a clean slate.
  return <Variant2Inner key={scenario.id} scenario={scenario} />
}

function Variant2Inner({ scenario }: FirstRunVariantProps) {
  const ariaAgent = getDefaultAgent()

  const initialMode: CardMode =
    scenario.id === "provisioning" ? "warming" : scenario.id === "provisioning-error" ? "stalled" : "live"
  const [mode, setMode] = React.useState<CardMode>(initialMode)
  // Index of the stage currently RUNNING; everything before it stays checked —
  // including through the stalled state (R2: finished work never un-finishes).
  const [stageIdx, setStageIdx] = React.useState(scenario.id === "provisioning-error" ? 2 : 1)
  const [elapsed, setElapsed] = React.useState(0)
  const [talking, setTalking] = React.useState(false)
  // Endowed progress is locally mutable (mock): finishing a step here shows
  // the list absorbing it, and reaching 5/5 shows the chrome retiring live.
  const [stepsDone, setStepsDone] = React.useState(scenario.stepsDone)

  // Stage advance — one timeout per stage (not an interval) so Retry can
  // re-enter at stage 2 without replaying finished work.
  React.useEffect(() => {
    if (mode !== "warming") return
    if (stageIdx >= WARMUP_STAGES.length) {
      setMode("live")
      return
    }
    const t = window.setTimeout(() => setStageIdx((i) => i + 1), DEMO_STAGE_MS)
    return () => window.clearTimeout(t)
  }, [mode, stageIdx])

  // Honest elapsed counter beside the estimate — real seconds, no invented %.
  React.useEffect(() => {
    if (mode !== "warming") return
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [mode])

  const toggleTalk = () => {
    // Talking IS journey step 1 — the card and the list agree without a nag.
    setTalking((t) => {
      if (!t) setStepsDone((n) => Math.max(n, 1))
      return !t
    })
  }

  const retry = () => {
    // Re-enter warming AT the stalled stage: stages 0–1 stay done (R2).
    setStageIdx(2)
    setMode("warming")
  }

  const quiet = mode !== "live"
  const complete = stepsDone >= JOURNEY_STEPS.length

  return (
    <div className="space-y-6">
      {/* The landing header renders in FULL during provisioning — instant-feel
          means the page never looks provisional, only the card does. */}
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Deploy an AI agent in minutes</h2>
        <p className="text-sm text-muted-foreground">
          Talk to your ready-made agent, set it up, and put it live.
        </p>
      </header>

      {/* Locked landing shape (R7): sticky Aria card left · journey right. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section
          aria-label={`Aria, your default agent — ${mode === "live" ? "live" : mode === "warming" ? "warming up" : "warm-up stalled"}`}
          className="flex flex-col rounded-xl border border-border bg-card p-6 lg:sticky lg:top-6"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <AgentSphere size={96} active={talking} />
            <div className="w-full space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h3 className="truncate text-xl font-semibold tracking-tight">{ariaAgent.name}</h3>
                {mode === "live" && <Badge variant="secondary">Live</Badge>}
                {mode === "warming" && <Badge variant="secondary">Warming up</Badge>}
                {mode === "stalled" && <Badge variant="warning">Warm-up stalled</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {ariaAgent.role ?? "General assistant"} — ready-made, yours to reshape.
              </p>
            </div>
          </div>

          {quiet ? (
            /* Staged narration INSIDE the card — the wait lives exactly where
               the payoff will land. aria-live announces stage flips (R9). */
            <div
              role="status"
              aria-live="polite"
              className="mt-5 rounded-lg border border-border bg-muted/40 p-3.5 text-left"
            >
              <ol className="space-y-2">
                {WARMUP_STAGES.map((stage, i) => {
                  const done = i < stageIdx
                  const stalled = mode === "stalled" && i === stageIdx
                  const active = mode === "warming" && i === stageIdx
                  return (
                    <li key={stage.id} className="flex items-center gap-2.5 text-sm">
                      {done ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                      ) : stalled ? (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
                      ) : active ? (
                        <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-hidden>
                          <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-primary/50 motion-reduce:animate-none" />
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </span>
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" strokeWidth={1.5} aria-hidden />
                      )}
                      <span
                        className={cn(
                          done && "text-muted-foreground",
                          (active || stalled) && "font-medium text-foreground",
                          !done && !active && !stalled && "text-muted-foreground/70",
                        )}
                      >
                        {stage.label}
                      </span>
                      <span className="sr-only">
                        {done ? ", done" : stalled ? ", stalled" : active ? ", in progress" : ", waiting"}
                      </span>
                    </li>
                  )
                })}
              </ol>

              {mode === "warming" ? (
                <>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Usually under 40 seconds
                    <span className="tabular-nums"> · {elapsed}s in</span>
                  </p>
                  {/* Sell the payoff, not the plumbing (spec must #3). */}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    The moment this finishes, Aria answers right here in your browser — mic on, no
                    number to buy, nothing to configure.
                  </p>
                </>
              ) : (
                /* Stalled: name the stage, keep the checks, offer a way
                   forward. No blame, no dead end (R2). */
                <div className="mt-3 space-y-2.5 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    The voice pipeline is taking longer than usual on our side. Your project and
                    Aria are already in place — retrying usually clears it.
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={retry}>
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Retry warm-up
                    </Button>
                    <a
                      href="#status"
                      className="inline-flex items-center gap-1 rounded text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Service status <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* LIVE: the named-default spec strip (R4) — the "smart model by
               default" claim made visible, with the escape hatch. */
            <div className="mt-5 space-y-2 border-t border-border pt-4 text-left">
              <p className="text-sm">
                <span className="font-medium">Runs on {NAMED_DEFAULT.name}</span>
                <span className="text-muted-foreground"> — {NAMED_DEFAULT.why}.</span>
              </p>
              <ul aria-label="Default stack" className="flex flex-wrap gap-1.5">
                {NAMED_DEFAULT.chips.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs tabular-nums text-muted-foreground"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">{NAMED_DEFAULT.escape}</p>
            </div>
          )}

          {/* Talk stays the card's ONE action in every mode (R3). While
              warming it is disabled WITH the reason attached — the promise
              that this exact button flips live is the instant-feel contract. */}
          <div className="mt-5 flex flex-col gap-1.5">
            {mode === "live" ? (
              talking ? (
                <Button size="lg" variant="destructive" className="gap-1.5" onClick={toggleTalk}>
                  <PhoneOff className="h-4 w-4" aria-hidden /> End call
                </Button>
              ) : (
                <Button size="lg" className="gap-1.5" onClick={toggleTalk}>
                  <Mic className="h-4 w-4" aria-hidden /> Talk to {ariaAgent.name}
                </Button>
              )
            ) : (
              <>
                <Button size="lg" className="gap-1.5" disabled aria-describedby="v2-talk-why">
                  <Mic className="h-4 w-4" aria-hidden /> Talk to {ariaAgent.name}
                </Button>
                <p id="v2-talk-why" className="text-center text-xs text-muted-foreground">
                  {mode === "warming"
                    ? "Goes live the moment warm-up finishes — this exact button flips on."
                    : "Available after a successful warm-up — retry above."}
                </p>
              </>
            )}
          </div>
        </section>

        {complete ? (
          <ScaleShortcuts agentName={ariaAgent.name} />
        ) : (
          <JourneyPanel quiet={quiet} stepsDone={stepsDone} onCompleteStep={(i) => setStepsDone(i + 1)} />
        )}
      </div>
    </div>
  )
}

/**
 * The journey list with QUIET endowed progress: muted checks, a bare tabular
 * "n/5", color on the next step ONLY. Collapsible so it is never a nag (R6) —
 * collapsed, every step (done ones included) stays one click away.
 */
function JourneyPanel({
  quiet,
  stepsDone,
  onCompleteStep,
}: {
  quiet: boolean
  stepsDone: number
  onCompleteStep: (index: number) => void
}) {
  const [open, setOpen] = React.useState(true)

  return (
    <section
      aria-label={quiet ? "Setup journey — starts when Aria is live" : `Setup journey, ${stepsDone} of 5 steps done`}
      className="rounded-xl border border-border bg-card"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-xl p-5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0 space-y-0.5">
              <span className="block text-sm font-semibold">Make Aria yours</span>
              <span className="block text-xs text-muted-foreground">
                {quiet ? "Ready the moment she's live — look around meanwhile." : "Five steps, in your own time."}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2.5">
              {/* Progress as plain text, never a badge — endowed but quiet. */}
              {!quiet && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  <span aria-hidden>{stepsDone}/5</span>
                  <span className="sr-only">{stepsDone} of 5 done</span>
                </span>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform motion-reduce:transition-none",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <ol className="space-y-0.5 px-3 pb-4">
            {JOURNEY_STEPS.map((step, i) => {
              const done = !quiet && i < stepsDone
              const next = !quiet && i === stepsDone
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    disabled={quiet}
                    onClick={() => next && onCompleteStep(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      next ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50",
                      quiet && "disabled:pointer-events-none",
                    )}
                  >
                    {/* Minimal glyphs: even the check stays muted — the ONLY
                        color on this list belongs to the next step. */}
                    {done ? (
                      <Check className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    ) : next ? (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      </span>
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" strokeWidth={1.5} aria-hidden />
                    )}
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm",
                        next ? "font-medium text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="sr-only">{done ? ", done" : next ? ", up next" : ""}</span>
                    {/* Value verbs (R8), always visible but only colored when
                        the step is up next. */}
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 text-xs",
                        next ? "font-medium text-primary" : "text-muted-foreground/60",
                      )}
                    >
                      {step.verb}
                      {next && <ArrowRight className="h-3 w-3" />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}

/**
 * 5/5 — the checklist chrome retires (R6): no trophy, no count, no checks.
 * The same five doors return as flat scale shortcuts a power user would keep.
 */
function ScaleShortcuts({ agentName }: { agentName: string }) {
  return (
    <section aria-label="Shortcuts" className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{agentName} is set up — scale from here</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Same doors as your first-run steps, minus the ceremony.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SCALE_SHORTCUTS.map(({ id, icon: Icon, label, sub }) => (
          <button
            key={id}
            type="button"
            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{label}</span>
              <span className="block truncate text-xs text-muted-foreground">{sub}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
