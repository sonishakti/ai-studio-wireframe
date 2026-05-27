import * as React from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

export type BreadcrumbEntry =
  | { label: string; href: string }
  | { label: string; href?: never }

interface PageHeaderProps {
  /** Breadcrumb trail. Last item is current page (no link). */
  crumbs: BreadcrumbEntry[]
  /** Optional title shown below breadcrumb */
  title?: string
  /** Optional description */
  description?: string
  /** Optional right-side actions */
  actions?: React.ReactNode
}

export function PageHeader({ crumbs, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-1 border-b bg-background px-4 py-3">
      {/* Top row: sidebar trigger + breadcrumb + global actions */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />

        <Breadcrumb className="flex-1">
          <BreadcrumbList>
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1
              return (
                <React.Fragment key={i}>
                  <BreadcrumbItem>
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Global topbar actions */}
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <span className="text-primary">✦</span>
            Ask
          </Button>
        </div>
      </div>

      {/* Optional title / description / page-level actions */}
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 pt-1 pb-0.5">
          <div>
            {title && <h1 className="text-xl font-semibold tracking-tight">{title}</h1>}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
    </header>
  )
}
