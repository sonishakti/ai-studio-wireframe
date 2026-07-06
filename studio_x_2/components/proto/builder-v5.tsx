"use client"

/**
 * Variant 5 — "Dashboard tiles".
 * Scan by cards, not rows: each builder concern gets a fixed spatial home
 * (a tile) the eye can revisit, instead of one long vertical stack.
 * Throwaway arrangement prototype — judges layout, not behavior.
 */

import {
  AudioLines,
  Check,
  FileText,
  Mic,
  Phone,
  PhoneIncoming,
  Radio,
  Rocket,
} from "lucide-react"

import { AGENT, DEPLOY_STATE, Orb, STEPS } from "@/components/proto/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const STEP_ICONS = [AudioLines, PhoneIncoming, FileText, Phone, Rocket] as const

export function VariantTiles() {
  const meta = [
    AGENT.id,
    AGENT.stack,
    `${AGENT.language} · ${AGENT.preset}`,
    AGENT.channelLabel,
    AGENT.cost,
    AGENT.latency,
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Identity strip */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
        <Orb size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-foreground">
              {AGENT.name}
            </span>
            <Badge variant="outline" className="gap-1 text-xs">
              <span
                className="h-1.5 w-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              {AGENT.status}
            </Badge>
            <span className="text-sm text-muted-foreground">{AGENT.role}</span>
          </div>
          <p className="mt-1 flex flex-wrap gap-x-2 font-mono text-xs text-muted-foreground">
            {meta.map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">·</span>}
                {item}
              </span>
            ))}
          </p>
        </div>
        <Button type="button" className="shrink-0">
          <Mic className="h-4 w-4" />
          Talk to {AGENT.name}
        </Button>
      </div>

      {/* Tile grid — one fixed home per concern */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? Rocket
          return (
            <button
              key={step.n}
              type="button"
              className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-ring/40"
            >
              <div className="flex w-full items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {step.title}
                </span>
                {step.done && (
                  <Check
                    className="ml-auto h-4 w-4 text-muted-foreground"
                    aria-label="Done"
                  />
                )}
              </div>
              <p className="text-sm text-foreground">{step.value}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {step.manifest}
              </p>
            </button>
          )
        })}

        {/* 6th tile — deploy state (accent) */}
        <div className="flex flex-col items-start gap-2 rounded-xl border border-primary/40 bg-card p-4">
          <div className="flex w-full items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {DEPLOY_STATE.headline}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{DEPLOY_STATE.sub}</p>
          <Button type="button" variant="outline" size="sm" className="mt-auto">
            {DEPLOY_STATE.cta}
          </Button>
        </div>
      </div>
    </div>
  )
}
