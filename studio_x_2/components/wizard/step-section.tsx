"use client"

import * as React from "react"
import { Check, Lock, ChevronDown, ArrowLeft, ArrowRight, Pencil, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"

/**
 * StepSection — one step in the UPFRONT stepped builder.
 *
 * All five sections render at once, stacked, and ANY of them can be expanded —
 * locking is not a secret. Each section's `status`:
 *   • active → ring + editable body + shared Back/Continue footer
 *   • done   → collapsed to a one-line summary; expand to edit in place
 *   • locked → still EXPANDABLE so the user can see what's inside, but the body
 *     is shown view-only (dimmed + non-interactive) with a short note that it's
 *     disabled until the previous step is complete. NOT hard pointer-events-none.
 *
 * The header is a universal expand/collapse toggle (host updates `expandedStep`).
 * Radix Collapsible drives the animated height transition only.
 */

export interface StepSectionProps {
  n: number
  title: string
  status: "locked" | "active" | "done"
  /** Body expanded right now (host-controlled via expandedStep). */
  open: boolean
  /** One-line recap shown when a done step is collapsed. */
  summary?: React.ReactNode
  /** Why a locked step is disabled (shown when the user expands it to explore). */
  lockedReason?: string
  /** Toggle this section open/closed (host flips expandedStep). */
  onToggle: () => void
  onBack?: () => void
  onContinue?: () => void
  canContinue?: boolean
  children: React.ReactNode
}

export function StepSection({
  n, title, status, open, summary, lockedReason, onToggle, onBack, onContinue, canContinue, children,
}: StepSectionProps) {
  const locked = status === "locked"
  const done = status === "done"

  return (
    <Collapsible
      open={open}
      className={cn(
        "rounded-xl border border-border bg-card/30 transition-colors",
        open && !locked && "border-primary/60 bg-card/50 ring-1 ring-primary/40",
        open && locked && "bg-muted/20",
        !open && locked && "opacity-75",
      )}
      aria-disabled={locked || undefined}
    >
      {/* Header — a universal toggle: every step can be opened to look inside. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-t-xl px-4 py-3.5 text-left transition-colors hover:bg-accent/40 sm:px-5"
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
            open && !locked && "border-primary bg-primary text-primary-foreground",
            done && !open && "border-primary bg-primary/10 text-primary",
            (locked || (!open && !done)) && "border-border text-muted-foreground",
          )}
        >
          {locked ? <Lock className="h-3 w-3" /> : done && !open ? <Check className="h-3.5 w-3.5" /> : n}
        </span>

        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold", locked && "text-muted-foreground")}>{title}</p>
          {!open && done && summary && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{summary}</p>
          )}
          {!open && locked && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">Disabled — finish the previous step first</p>
          )}
        </div>

        {locked && <span className="shrink-0 text-xs font-medium text-muted-foreground">Disabled</span>}
        {done && !open && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Pencil className="h-3 w-3" /> Edit
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {/* Body */}
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="border-t border-border px-4 pb-5 pt-5 sm:px-5">
          {locked && lockedReason && (
            <div className="mb-4 flex items-start gap-2.5 rounded-md border border-border bg-muted/40 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-relaxed text-muted-foreground">{lockedReason}</p>
            </div>
          )}

          {/* Locked body is visible-but-view-only — explore, don't edit yet. */}
          <div className={cn(locked && "pointer-events-none select-none opacity-60")}>
            {children}
          </div>

          {!locked && (onBack || onContinue) && (
            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" className="gap-1.5" disabled={!onBack} onClick={onBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {onContinue && (
                <Button className="gap-1.5" disabled={!canContinue} onClick={() => canContinue && onContinue()}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
