"use client"

/**
 * MASTER-DETAIL PROTO P2 — "list-as-breadcrumb".
 * LEFT card: the 5 steps as ONE unbroken timeline (no group headers); each row
 * carries a tiny Done/Current/Pending badge so the list itself reads as a
 * breadcrumb. RIGHT card: the selected step's config upfront (STEP_FIELDS) with
 * a sticky Back/Next footer. Deploy state lives in a quiet full-width success
 * bar BELOW both cards. Throwaway — judged against sibling arrangements.
 */

import { useState } from "react"
import {
  AudioLines,
  AudioWaveform,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Phone,
  PhoneIncoming,
  RefreshCw,
  Rocket,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  AGENT,
  DEPLOY_STATE,
  Orb,
  STEP_FIELDS,
  STEPS,
} from "@/components/proto/shared"

const STEP_ICONS = [AudioWaveform, PhoneIncoming, FileText, Phone, Rocket]

/** Prototype fiction: steps 1–4 done, step 5 pending — so all three
 *  breadcrumb states (Done / Current / Pending) are visible for judging. */
const DONE_UPTO = 4

type RowState = "done" | "current" | "pending"

function rowState(n: number, selected: number): RowState {
  if (n === selected) return "current"
  return n <= DONE_UPTO ? "done" : "pending"
}

const BADGE_LABEL: Record<RowState, string> = {
  done: "Done",
  current: "Current",
  pending: "Pending",
}

const BADGE_VARIANT: Record<RowState, "secondary" | "default" | "outline"> = {
  done: "secondary",
  current: "default",
  pending: "outline",
}

export function MasterP2() {
  const [selected, setSelected] = useState(1)
  const step = STEPS.find((s) => s.n === selected) ?? STEPS[0]
  const fields = STEP_FIELDS[step.n] ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-5">
        {/* LEFT — the step list IS the breadcrumb */}
        <Card size="sm" className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Orb size={28} />
              <span>{AGENT.name}</span>
              <Badge variant="outline" className="gap-1.5 text-success">
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-success"
                />
                {AGENT.status}
              </Badge>
            </CardTitle>
            <CardDescription>Setup breadcrumb — tap a step</CardDescription>
            <CardAction className="flex items-center gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">
                {DONE_UPTO}/{STEPS.length}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                title={`Talk to ${AGENT.name}`}
              >
                <AudioLines className="h-4 w-4" />
                <span className="sr-only">Talk to {AGENT.name}</span>
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent className="flex flex-col px-2 group-data-[size=sm]/card:px-2">
            {STEPS.map((s, i) => {
              const state = rowState(s.n, selected)
              const Icon = STEP_ICONS[i]
              const last = i === STEPS.length - 1
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setSelected(s.n)}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "group/row flex w-full gap-3 rounded-lg px-2 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    state === "current" && "bg-accent/60"
                  )}
                >
                  {/* timeline column: icon + vertical connector */}
                  <div className="flex flex-col items-center self-stretch pt-1.5">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border",
                        state === "current" &&
                          "border-primary bg-primary/10 text-primary",
                        state === "done" &&
                          "border-success/30 bg-success/10 text-success",
                        state === "pending" &&
                          "border-dashed text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {!last && <span className="w-px flex-1 bg-border" />}
                  </div>

                  <div
                    className={cn(
                      "flex min-w-0 flex-1 flex-col gap-0.5 pt-2",
                      last ? "pb-2" : "pb-6"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          state === "pending" && "text-muted-foreground"
                        )}
                      >
                        {s.title}
                      </span>
                      <Badge variant={BADGE_VARIANT[state]}>
                        {BADGE_LABEL[state]}
                      </Badge>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {s.value}
                    </span>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* RIGHT — selected step's config, upfront */}
        <Card size="sm" className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle>{step.title}</CardTitle>
            <CardDescription>
              Step {step.n} of {STEPS.length} · {step.manifest}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1">
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div
                  key={f.label}
                  className={cn(
                    "flex flex-col gap-1.5",
                    f.value.length > 40 && "sm:col-span-2"
                  )}
                >
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {f.label}
                  </span>
                  <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>

          <CardFooter className="sticky bottom-0 mt-auto justify-between border-t bg-card">
            <Button
              variant="outline"
              size="sm"
              disabled={selected === 1}
              onClick={() => setSelected((n) => Math.max(1, n - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              size="sm"
              disabled={selected === STEPS.length}
              onClick={() => setSelected((n) => Math.min(STEPS.length, n + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Deploy state — full width, quiet success tint */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/25 bg-success/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{DEPLOY_STATE.headline}</span>
            <span className="text-xs text-muted-foreground">
              {DEPLOY_STATE.sub}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
          {DEPLOY_STATE.cta}
        </Button>
      </div>
    </div>
  )
}
