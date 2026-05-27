import * as React from "react"

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
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  if (!title && !actions && !description) return null

  return (
    <div className="flex items-start justify-between gap-4 border-b bg-background px-6 py-4">
      <div className="min-w-0">
        {title && (
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        )}
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
