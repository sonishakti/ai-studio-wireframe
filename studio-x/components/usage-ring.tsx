"use client"

import * as React from "react"
import Link from "next/link"
import { Gift } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PLAN_USAGE, freeMinutesStats } from "@/lib/campaign-data"
import { track, Events } from "@/lib/analytics"

/**
 * Free-minutes usage, surfaced two ways (2026-06-19):
 *   • AvatarUsageRing — a tiny progress ring drawn AROUND the account avatar,
 *     the way Claude rings its context meter. Ambient from every screen.
 *   • FreeMinutesBlock — the detailed meter, which now lives INSIDE the account
 *     menu (moved off the Go Live home).
 *
 * Both read the same source of truth (PLAN_USAGE) via freeMinutesStats(), so the
 * ring and the menu block can never disagree. The ring fills with minutes USED
 * (climbs toward the cap, like a context meter); the block leads with what's left.
 */

// Re-exported from the lib so existing `@/components/usage-ring` imports keep
// working; the definition lives in campaign-data so server pages can call it.
export { freeMinutesStats }

/** A thin circular progress ring wrapping `children` (the avatar). */
export function AvatarUsageRing({
  pctUsed,
  size = 34,
  stroke = 2.5,
  className,
  children,
}: {
  pctUsed: number
  size?: number
  stroke?: number
  className?: string
  children: React.ReactNode
}) {
  const clamped = Math.max(0, Math.min(100, pctUsed))
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - clamped / 100)
  const tone =
    clamped >= 100 ? "text-destructive" : clamped >= 80 ? "text-warning" : "text-primary"

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        // Inline size beats the sidebar's `[&_svg]:size-4` rule that would
        // otherwise clamp this ring to 16px (smaller than the avatar).
        style={{ width: size, height: size }}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="currentColor" className="text-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-500", tone)}
        />
      </svg>
      {children}
    </span>
  )
}

/** The free-minutes meter for inside the account menu — links to Usage. */
export function FreeMinutesBlock() {
  const { plan, included, pctUsed, remaining } = freeMinutesStats()
  return (
    <div className="px-1 py-1">
      <Link
        href="/billing/usage"
        onClick={() => track(Events.quota_warning_clicked, { meter: "free_minutes", pct_used: pctUsed })}
        className="block rounded-md border border-border bg-muted/40 p-2.5 transition-colors hover:bg-muted/70"
      >
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Free minutes</span>
          <Badge variant="secondary" className="ml-auto text-xs">{plan}</Badge>
        </div>
        <Progress value={pctUsed} className="mt-2 h-1.5" />
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-medium tabular-nums">
            {remaining.toLocaleString()} / {included.toLocaleString()} min
          </span>
        </div>
      </Link>
    </div>
  )
}
