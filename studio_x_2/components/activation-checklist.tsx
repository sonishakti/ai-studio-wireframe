"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Bot,
  Settings2,
  Mic,
  Rocket,
  Globe,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { track, Events, markSignup } from "@/lib/analytics"

// ─── Activation steps ────────────────────────────────────────────────────────
//
// One source of truth for the new-user → first-deploy journey.
// CLAUDE.md north star: signup → first agent published within 7d.
// We add "deploy somewhere" as the closing step so activation doesn't end
// at "published in a draft state" — that's an incomplete moment.

type StepStatus = "done" | "current" | "todo" | "skipped"

type Step = {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  cta: string
  /** State key in localStorage — completion is persisted client-side */
  flagKey: string
}

const STEPS: Step[] = [
  {
    id: "pick-template",
    title: "Pick a starting point",
    description: "Browse templates — Appointment Reminder, NPS Survey, IVR, e-commerce support.",
    icon: Bot,
    href: "/agents",
    cta: "Browse templates",
    flagKey: "sx:onboarding:pick-template",
  },
  {
    id: "configure",
    title: "Configure your agent",
    description: "Set the prompt, voice, language, and (optionally) connect a vendor key.",
    icon: Settings2,
    href: "/agents/new/edit",
    cta: "Open editor",
    flagKey: "sx:onboarding:configure",
  },
  {
    id: "test",
    title: "Test in the playground",
    description: "Talk to your agent from this browser tab. No phone number needed.",
    icon: Mic,
    href: "/agents/new/test",
    cta: "Start test call",
    flagKey: "sx:onboarding:test",
  },
  {
    id: "publish",
    title: "Publish",
    description: "Make your agent live so it can take real calls + sessions.",
    icon: Rocket,
    href: "/agents/new/edit",
    cta: "Publish",
    flagKey: "sx:onboarding:publish",
  },
  {
    id: "deploy",
    title: "Choose where it answers",
    description: "Phone, web widget, WhatsApp, SMS, or your own app via API.",
    icon: Globe,
    href: "/deploy",
    cta: "Pick a channel",
    flagKey: "sx:onboarding:deploy",
  },
]

const DISMISS_KEY = "sx:onboarding:dismissed"

// ─── helpers ─────────────────────────────────────────────────────────────────

function readFlag(key: string): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(key) === "1"
}

function writeFlag(key: string, value: boolean) {
  if (typeof window === "undefined") return
  if (value) window.localStorage.setItem(key, "1")
  else window.localStorage.removeItem(key)
}

// ─── component ──────────────────────────────────────────────────────────────

export function ActivationChecklist() {
  const [open, setOpen] = React.useState(true)
  const [dismissed, setDismissed] = React.useState<boolean>(() =>
    typeof window === "undefined" ? false : readFlag(DISMISS_KEY),
  )

  // Read step completion from localStorage — components elsewhere flip these
  // (agent published page sets publish=done, deploy/* sets deploy=done, etc.)
  const [completion, setCompletion] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(STEPS.map((s) => [s.id, readFlag(s.flagKey)])),
  )

  // Mark signup once on first mount so TTFA has a starting timestamp
  React.useEffect(() => {
    markSignup()
  }, [])

  // Refresh from storage on focus so cross-tab completion shows up
  React.useEffect(() => {
    const refresh = () =>
      setCompletion(
        Object.fromEntries(STEPS.map((s) => [s.id, readFlag(s.flagKey)])),
      )
    window.addEventListener("focus", refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener("focus", refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  const doneCount = Object.values(completion).filter(Boolean).length
  const totalCount = STEPS.length
  const pct = (doneCount / totalCount) * 100
  const allDone = doneCount === totalCount
  const currentStepIndex = STEPS.findIndex((s) => !completion[s.id])

  // If user has fully completed activation, auto-dismiss (don't show the checklist forever)
  if (dismissed || allDone) {
    return allDone && !dismissed ? (
      <CompletionCelebration onDismiss={() => { setDismissed(true); writeFlag(DISMISS_KEY, true) }} />
    ) : null
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.04] to-transparent">
      <CardContent className="p-0">
        <Collapsible open={open} onOpenChange={setOpen}>
          {/* Header — always visible */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">
                  Get to your first deployed agent
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {doneCount} / {totalCount}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Five short steps. Most teams finish in under 20 minutes.
              </p>
              <Progress value={pct} className="h-1 mt-2.5" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation()
                setDismissed(true)
                writeFlag(DISMISS_KEY, true)
              }}
            >
              Skip for now
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    open && "rotate-180",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Steps */}
          <CollapsibleContent>
            <div className="border-t">
              {STEPS.map((step, i) => {
                const isDone = completion[step.id]
                const isCurrent = !isDone && i === currentStepIndex
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-start gap-4 px-5 py-4 border-b last:border-b-0 transition-colors",
                      isCurrent && "bg-primary/[0.03]",
                      isDone && "opacity-60",
                    )}
                  >
                    {/* Index + status */}
                    <div className="flex items-center gap-3 shrink-0 pt-0.5">
                      <span className="text-xs font-mono text-muted-foreground tabular-nums w-4">
                        {i + 1}
                      </span>
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle
                          className={cn(
                            "h-5 w-5",
                            isCurrent ? "text-primary" : "text-muted-foreground/40",
                          )}
                        />
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isDone && "line-through",
                          )}
                        >
                          {step.title}
                        </p>
                        {isCurrent && (
                          <Badge className="text-xs h-4 px-1.5">Up next</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    </div>

                    {/* CTA */}
                    {!isDone && (
                      <Button
                        size="sm"
                        variant={isCurrent ? "default" : "outline"}
                        className="shrink-0 text-xs h-8"
                        asChild
                        onClick={() => {
                          // Treat the CTA click as "step started" — done flag flips elsewhere
                          if (step.id === "pick-template") track(Events.agent_template_browsed)
                        }}
                      >
                        <Link href={step.href}>
                          {step.cta}
                          <ArrowRight className="h-3 w-3 ml-0.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

// ─── completion celebration ─────────────────────────────────────────────────

function CompletionCelebration({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardContent className="flex items-center gap-4 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 shrink-0">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Activation complete 🎉</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your first agent is live and deployed. Open Campaigns to watch it work.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/deploy/batch-calls">Open Batch Calls</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── helper export for other components to mark steps complete ──────────────

export function markActivationStep(
  step: "pick-template" | "configure" | "test" | "publish" | "deploy",
) {
  const map = {
    "pick-template": "sx:onboarding:pick-template",
    configure:       "sx:onboarding:configure",
    test:            "sx:onboarding:test",
    publish:         "sx:onboarding:publish",
    deploy:          "sx:onboarding:deploy",
  } as const
  writeFlag(map[step], true)
}
