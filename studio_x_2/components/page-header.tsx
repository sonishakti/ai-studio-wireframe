import * as React from "react"
import { cn } from "@/lib/utils"

// crumbs is accepted but intentionally not rendered — breadcrumbs live in
// DashboardHeader (the sticky layout-level bar) not in the page body.
export type BreadcrumbEntry =
  | { label: string; href: string }
  | { label: string; href?: never }

interface PageHeaderProps {
  /** Kept for API compatibility — breadcrumbs render in DashboardHeader */
  crumbs?: BreadcrumbEntry[]
  title?: string
  description?: string
  actions?: React.ReactNode
  /**
   * `dense` strips the description and tightens vertical spacing so a page
   * can put its tabs+search+filter+action row immediately below the title.
   * Use on index/list pages where the breadcrumb + title already carry
   * identity (e.g. /calls, /agents, /projects).
   */
  dense?: boolean
}

export function PageHeader({
  title,
  description,
  actions,
  dense,
}: PageHeaderProps) {
  if (!title && !actions && !description) return null

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 bg-background px-6",
        dense ? "py-3 border-b" : "py-4 border-b",
      )}
    >
      <div className="min-w-0">
        {title && (
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        )}
        {!dense && description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
