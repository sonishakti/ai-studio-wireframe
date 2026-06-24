"use client"

import * as React from "react"
import { Check, Lock, ChevronDown, ArrowLeft, ArrowRight, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"

/**
 * StepSection — one step in the UPFRONT stepped builder.
 *
 * All five sections render at once, stacked. This wrapper is purely
 * presentational chrome around an existing StepX body; the host owns which
 * section is `open` and each section's `status`:
 *   • locked → visible but DIMMED + lock icon + non-interactive (the prior step
 *     isn't done yet) — the core "all steps shown, disabled until unlocked" rule
 *   • active → ring + expanded body + shared Back/Continue footer
 *   • done   → collapsed to a one-line summary; click the header (or Edit) to
 *     re-open and edit in place
 *
 * Open/close is HOST-controlled (not a Radix trigger): only the cursor step is
 * open, and Continue / Edit move the cursor. Radix Collapsible is used only for
 * the animated height transition.
 */

export interface StepSectionProps {
  n: number
  title: string
  status: "locked" | "active" | "done"
  /** Body expanded right now (host-controlled via expandedStep). */
  open: boolean
  /** One-line recap shown when this step is collapsed-done. */
  summary?: React.ReactNode
  /** Re-expand a done step to edit it (host sets expandedStep = n). */
  onEdit: () => void
  onBack?: () => void
  onContinue?: () => void
  canContinue?: boolean
  children: React.ReactNode
}

export function StepSection({
  n, title, status, open, summary, onEdit, onBack, onContinue, canContinue, children,
}: StepSectionProps) {
  const locked = status === "locked"
  const done = status === "done"
  const expanded = open && !locked
  // A collapsed, completed step: clicking its header re-opens it to edit.
  const headerClickable = done && !expanded

  return (
    <Collapsible
      open={expanded}
      className={cn(
        "rounded-xl border border-border bg-card/30 transition-colors",
        expanded && "border-primary/60 bg-card/50 ring-1 ring-primary/40",
        locked && "pointer-events-none select-none opacity-60",
      )}
      aria-disabled={locked || undefined}
    >
      {/* Header */}
      <div
        role={headerClickable ? "button" : undefined}
        tabIndex={headerClickable ? 0 : undefined}
        onClick={headerClickable ? onEdit : undefined}
        onKeyDown={
          headerClickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onEdit()
                }
              }
            : undefined
        }
        className={cn(
          "flex items-center gap-3 px-4 py-3.5 sm:px-5",
          headerClickable && "cursor-pointer rounded-t-xl hover:bg-accent/40",
        )}
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
            expanded && "border-primary bg-primary text-primary-foreground",
            done && !expanded && "border-primary bg-primary/10 text-primary",
            (locked || (!expanded && !done)) && "border-border text-muted-foreground",
          )}
        >
          {locked ? <Lock className="h-3 w-3" /> : done && !expanded ? <Check className="h-3.5 w-3.5" /> : n}
        </span>

        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold", locked && "text-muted-foreground")}>{title}</p>
          {done && !expanded && summary && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{summary}</p>
          )}
        </div>

        {locked ? (
          <span className="text-xs font-medium text-muted-foreground">Locked</span>
        ) : done && !expanded ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Pencil className="h-3 w-3" /> Edit
          </span>
        ) : (
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        )}
      </div>

      {/* Body */}
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="border-t border-border px-4 pb-5 pt-5 sm:px-5">
          {children}

          {(onBack || onContinue) && (
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
