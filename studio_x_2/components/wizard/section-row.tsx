import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * SectionRows / SectionRow — the builder's [label | content] anatomy (owner
 * 2026-07-21, screenshot direction): every config sub-question is a two-column
 * row — LHS carries ONLY the question/name (+ a quiet hint), RHS carries the
 * controls. Rows divide with hairlines; below @3xl of REAL column width the
 * label stacks above its controls (container queries — the three-column shell
 * can starve the center column, viewport breakpoints lie here).
 *
 * Compose rows as DIRECT children of SectionRows (fragments are fine — the
 * divide-y sees through them); the label column is fixed so every row's
 * controls share one left edge.
 */
export function SectionRows({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("@container", className)}>
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

export function SectionRow({
  id,
  label,
  hint,
  children,
  className,
}: {
  /** TOC scroll anchor (e.g. "wz-1-pick"). */
  id?: string
  label: React.ReactNode
  /** Quiet explainer under the label — owns the row's helper copy so the RHS
   *  stays pure controls. */
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      id={id}
      className={cn(
        "grid scroll-mt-28 grid-cols-1 gap-4 py-6 first:pt-0 last:pb-0 @3xl:grid-cols-[240px_minmax(0,1fr)] @3xl:gap-10",
        className,
      )}
    >
      <div className="min-w-0">
        <h4 className="text-base font-medium leading-snug">{label}</h4>
        {hint ? <div className="mt-1.5 space-y-1 text-xs leading-relaxed text-muted-foreground">{hint}</div> : null}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </div>
  )
}
