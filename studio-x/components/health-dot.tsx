import { cn } from "@/lib/utils"
import type { Health } from "@/lib/diagnostics"

// Token-only health colors: healthy = brand (cyan), degraded = warning (amber),
// unhealthy = destructive (red). One source of truth for the health → color map.
const COLOR: Record<Health, string> = {
  healthy: "bg-primary",
  degraded: "bg-warning",
  unhealthy: "bg-destructive",
}
const LABEL: Record<Health, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  unhealthy: "Unhealthy",
}

/** A small status dot for an agent/deployment/call's diagnosed health. */
export function HealthDot({
  status,
  label = false,
  className,
}: {
  status: Health
  label?: boolean
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-2 w-2 rounded-full shrink-0", COLOR[status])} aria-hidden />
      <span className={label ? "text-xs text-muted-foreground" : "sr-only"}>{LABEL[status]}</span>
    </span>
  )
}
