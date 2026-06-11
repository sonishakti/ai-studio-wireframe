"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, CircleHelp, Sparkles } from "lucide-react"
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
import { openComposerPanel } from "@/components/composer-panel"

// ─── segment → human label map ───────────────────────────────────────────────

const LABELS: Record<string, string> = {
  home: "Home",
  agents: "Agents",
  edit: "Edit Agent",
  "realtime-services": "Realtime Services",
  integrations: "Integrations",
  telephony: "Telephony",
  "phone-numbers": "Phone Numbers",
  campaigns: "Batch Calls",
  "batch-calls": "Batch Calls",
  inbound: "Inbound",
  embed: "Embed / Code",
  code: "Code",
  "web-widget": "Web Widget",
  create: "New Batch",
  calls: "Call History",
  chats: "Chat History",
  monitor: "Monitor",
  sessions: "Sessions",
  deploy: "Deploy",
  widget: "Web Widget",
  whatsapp: "WhatsApp",
  sms: "SMS",
  api: "API & SDK",
  slack: "Slack",
  test: "Test Playground",
  projects: "Projects",
  project: "Project",
  settings: "Project Settings",
  "vendor-credentials": "Vendor Credentials",
  usage: "Usage",
  billing: "Billing",
  plans: "Plans",
  subscriptions: "Subscriptions",
  invoices: "Invoices",
  transactions: "Transactions",
  "payment-methods": "Payment Methods",
  extensions: "Extensions Marketplace",
  developer: "Developer Hub",
  "restful-api": "RESTful API",
  webhooks: "Webhooks",
  "audit-logs": "Audit Logs",
  toolkit: "SDK Toolkit",
  "aa-credentials": "Service Accounts",
  licensing: "Licensing",
  preferences: "Preferences",
  notifications: "Notifications",
  help: "Help Hub",
  contact: "Contact Support",
  "contact-sales": "Contact Sales",
  tickets: "My Tickets",
  "whats-new": "What's New",
}

/** Skip opaque ID segments like agt_01, dp_ob_01, UUIDs */
function isId(seg: string) {
  return /^[a-z]{2,4}(_[a-z0-9]+)+$/i.test(seg) || /^[0-9a-f-]{36}$/i.test(seg)
}

function labelOf(seg: string) {
  return (
    LABELS[seg] ??
    seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

// ─── component ───────────────────────────────────────────────────────────────

export function DashboardHeader() {
  const pathname = usePathname()

  // Build breadcrumb trail from the URL, skipping ID segments
  const crumbs: { label: string; href: string }[] = []
  let acc = ""
  for (const seg of pathname.split("/").filter(Boolean)) {
    acc += `/${seg}`
    if (!isId(seg)) crumbs.push({ label: labelOf(seg), href: acc })
  }

  // Every Deploy surface now lives under /deploy/*, so the trail is already
  // "Deploy › X" with no special-casing (2026-06-11 intent-first revamp).

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />

      <Breadcrumb className="flex-1 min-w-0">
        <BreadcrumbList>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem className="min-w-0">
                  {isLast ? (
                    <BreadcrumbPage className="truncate max-w-[200px]">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href} className="truncate max-w-[160px]">
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Help">
          <CircleHelp className="h-4 w-4" />
          <span className="sr-only">Help</span>
        </Button>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" title="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={openComposerPanel}
          title="Composer (⌘J)"
        >
          Composer
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </Button>
      </div>
    </header>
  )
}
