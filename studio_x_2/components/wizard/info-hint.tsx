"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * InfoHint — progressive disclosure for informational copy (owner 2026-07-21:
 * "nest these in a tooltip with underlined section with dotted lines… reduce
 * descriptive or informative text upfront").
 *
 * Renders a SHORT dotted-underlined phrase; hover (or focus) opens the full
 * message in a tooltip. Radix keeps the content hoverable, so links inside
 * the message stay clickable. Use for background knowledge ("Agora doesn't
 * sell numbers…"), never for state feedback, warnings, or consequences —
 * those must stay on the surface.
 */
export function InfoHint({
  label,
  children,
  className,
}: {
  /** The short visible trigger phrase. */
  label: React.ReactNode
  /** The full message shown in the tooltip. */
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "cursor-help text-left text-xs text-muted-foreground underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          {label}
        </button>
      </TooltipTrigger>
      {/* The base TooltipContent is an inline-flex, vertically-centered
          one-liner pill — long prose lays out oddly in it (owner 2026-07-21).
          Override to a block panel: left-aligned, roomier padding, relaxed
          leading, and visible link/code styling against the inverted bg. */}
      <TooltipContent
        className="block max-w-[320px] px-3.5 py-2.5 text-left text-xs font-normal leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_code]:font-mono [&_em]:not-italic [&_em]:font-medium"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
