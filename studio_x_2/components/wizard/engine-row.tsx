"use client"

import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * The flat-row idiom inside a SectionRow: title + one-line description on the
 * left, the control on the right, a hairline between rows (the parent owns
 * `divide-y`). One idea per row.
 */
export function FlatRow({
  title,
  description,
  hint,
  control,
  children,
}: {
  title: string
  description: string
  /** Quiet line under the description — an InfoHint or a caption. */
  hint?: React.ReactNode
  control: React.ReactNode
  /** Folded detail, rendered under the row when the control is on. */
  children?: React.ReactNode
}) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium leading-5">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {hint ? <div className="pt-0.5">{hint}</div> : null}
        </div>
        <div className="shrink-0 pt-0.5">{control}</div>
      </div>
      {children}
    </div>
  )
}

export const ENGINE_TOOLTIP = "Engine work in progress. Your choice stays in this browser until it ships."

/**
 * "Requires Engine" idiom: a control the Agora Engine cannot honour yet. The
 * switch records only the builder's intent (the caller keeps it in
 * localStorage under an `sx:` key — never in a real-looking property), the
 * tooltip names the dependency, the caption states it on the surface.
 */
export function EngineRow({
  title,
  description,
  caption = "Requires Engine",
  tooltip = ENGINE_TOOLTIP,
  checked,
  onCheckedChange,
  children,
}: {
  title: string
  description: string
  /** e.g. "Requires Engine · Sep" — month or "planned". */
  caption?: string
  tooltip?: string
  checked: boolean
  onCheckedChange: (on: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <FlatRow
      title={title}
      description={description}
      hint={<p className="text-xs text-muted-foreground">{caption}</p>}
      control={
        <Tooltip>
          <TooltipTrigger asChild>
            <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
          </TooltipTrigger>
          <TooltipContent className="max-w-72" side="left">{tooltip}</TooltipContent>
        </Tooltip>
      }
    >
      {checked ? children : null}
    </FlatRow>
  )
}
