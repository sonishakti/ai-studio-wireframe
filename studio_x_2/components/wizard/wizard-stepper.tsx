"use client"

import * as React from "react"
import { Check, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StepperItem {
  n: number
  title: string
  /** Dimmed + non-navigable until prerequisites are met. */
  locked: boolean
  /** Rendered with a check; prerequisites satisfied + visited/passed. */
  complete: boolean
}

/**
 * WizardStepper — the wizard's navigation rail (it doubles as the page header,
 * so the wizard host has no <PageHeader>). Locked steps are dimmed with a lock
 * and can't be opened; complete steps show a check; the active step is ringed.
 */
export function WizardStepper({
  items,
  active,
  onNavigate,
}: {
  items: StepperItem[]
  active: number
  onNavigate: (n: number) => void
}) {
  return (
    <nav aria-label="Creation steps" className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
      {items.map((it) => {
        const isActive = active === it.n
        return (
          <button
            key={it.n}
            type="button"
            disabled={it.locked}
            onClick={() => !it.locked && onNavigate(it.n)}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
              "shrink-0 lg:shrink",
              it.locked && "opacity-50",
              isActive ? "bg-accent" : !it.locked && "hover:bg-accent/50",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                it.complete && !isActive && "border-primary bg-primary/10 text-primary",
                isActive && "border-primary bg-primary text-primary-foreground",
                !it.complete && !isActive && "border-border text-muted-foreground",
              )}
            >
              {it.locked ? (
                <Lock className="h-3 w-3" />
              ) : it.complete && !isActive ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                it.n
              )}
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-sm font-medium lg:whitespace-normal",
                isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {it.title}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
