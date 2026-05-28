import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * CatalogCard — the shared shape used by every "browse a list of things you
 * can add to your project" surface: Channels, Integrations Connectors,
 * Extensions Marketplace.
 *
 * Consistent visual density across these three so users can scan them the
 * same way. Sleek not chunky — small icon, single status badge, optional
 * one-line metadata, single primary action.
 */

export type CatalogCardStatus = "available" | "connected" | "coming-soon" | "beta"

export type CatalogCardProps = {
  /** Title — semibold, primary line */
  name: string
  /** Subtitle — vendor / category / one-liner */
  description: string
  /** Where the card links to */
  href: string
  /** Icon component (lucide). For initials/brand letters, use the
   *  `initials` prop instead. */
  icon?: React.ComponentType<{ className?: string }>
  /** First-letter or initial styling — pass a 1-2 char string with a
   *  background-color class. Use ONE of `icon` or `initials`. */
  initials?: string
  iconColor?: string  // tailwind bg-* class, defaults to bg-muted
  /** Status badge shown in the corner */
  status?: CatalogCardStatus
  /** Override the badge label (e.g. "2 live" on Channels) */
  statusLabel?: string
  /** Optional one-liner under the description (e.g. "Pay-per-use", "Setup: 10 min") */
  meta?: string
  /** Override the action label — default "Open" */
  actionLabel?: string
}

const STATUS_STYLES: Record<CatalogCardStatus, string> = {
  available:    "",
  connected:    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  beta:         "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  "coming-soon":"border-muted-foreground/30 bg-muted text-muted-foreground",
}

const STATUS_LABELS: Record<CatalogCardStatus, string> = {
  available:    "Available",
  connected:    "Connected",
  beta:         "Beta",
  "coming-soon":"Coming soon",
}

export function CatalogCard({
  name,
  description,
  href,
  icon: Icon,
  initials,
  iconColor = "bg-muted",
  status,
  statusLabel,
  meta,
  actionLabel,
}: CatalogCardProps) {
  const isUnavailable = status === "coming-soon"

  return (
    <Card
      className={cn(
        "transition-colors group",
        isUnavailable
          ? "opacity-60"
          : "hover:border-foreground/30 hover:shadow-sm cursor-pointer",
      )}
    >
      <Link
        href={isUnavailable ? "#" : href}
        className={isUnavailable ? "pointer-events-none" : "block"}
        aria-disabled={isUnavailable}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          {/* Header: icon + status */}
          <div className="flex items-start justify-between gap-2">
            {Icon ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : initials ? (
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md text-white font-semibold text-sm shrink-0",
                  iconColor,
                )}
              >
                {initials}
              </div>
            ) : null}
            {status && status !== "available" && (
              <Badge
                variant="outline"
                className={cn("text-xs shrink-0", STATUS_STYLES[status])}
              >
                {statusLabel ?? STATUS_LABELS[status]}
              </Badge>
            )}
            {status === "available" && statusLabel && (
              <Badge variant="outline" className="text-xs shrink-0">
                {statusLabel}
              </Badge>
            )}
          </div>

          {/* Body: name + description */}
          <div>
            <p className="text-sm font-semibold leading-tight">{name}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">
              {description}
            </p>
          </div>

          {/* Footer: meta + action */}
          <div className="flex items-center justify-between mt-auto pt-1">
            {meta ? (
              <span className="text-xs text-muted-foreground">{meta}</span>
            ) : <span />}
            {!isUnavailable && (
              <span className="text-xs font-medium text-primary inline-flex items-center gap-0.5">
                {actionLabel ?? "Open"}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
