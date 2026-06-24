import { Badge } from "@/components/ui/badge"
import type { Severity } from "@/lib/diagnostics"

const MAP: Record<Severity, { variant: "destructive" | "warning" | "secondary"; label: string }> = {
  critical: { variant: "destructive", label: "Critical" },
  warning: { variant: "warning", label: "Warning" },
  info: { variant: "secondary", label: "Info" },
}

/** Severity pill for a diagnosed issue — maps onto the design-token badge variants. */
export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const { variant, label } = MAP[severity]
  return <Badge variant={variant} className={className}>{label}</Badge>
}
