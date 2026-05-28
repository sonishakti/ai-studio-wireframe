import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Info } from "lucide-react"

/**
 * MetricSection — LiveKit-style grouped block of metric cards.
 *
 * Pattern: small section header (chevron + title), then a stack of children
 * (usually MetricCard rows or grids). Used on /home, /billing/usage, and per-
 * campaign analytics.
 */
export function MetricSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">▾</span>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

/**
 * MetricCard — single metric in the LiveKit overview pattern.
 * Label, optional info icon, value with unit, optional delta + sparkline.
 *
 * `mute` = empty/no-data state — renders the value as muted helper copy
 * inside the card instead of as a number.
 */
export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaPositive,
  sub,
  chart,
  mute,
  className,
}: {
  label: string
  value: string
  unit?: string
  delta?: string
  deltaPositive?: boolean
  sub?: string
  chart?: React.ReactNode
  mute?: boolean
  className?: string
}) {
  return (
    <Card className={cn("p-4", className)}>
      <CardContent className="p-0 space-y-3">
        {/* Label */}
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <Info className="h-2.5 w-2.5 text-muted-foreground/40" />
        </div>

        {/* Value */}
        {mute ? (
          <p className="text-sm text-muted-foreground">{value}</p>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
            {unit && (
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{unit}</span>
            )}
            {delta && (
              <span
                className={cn(
                  "text-xs font-medium ml-1 tabular-nums",
                  deltaPositive ? "text-emerald-600" : "text-muted-foreground",
                )}
              >
                {delta}
              </span>
            )}
          </div>
        )}

        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {chart}
      </CardContent>
    </Card>
  )
}
