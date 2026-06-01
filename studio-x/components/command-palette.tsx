"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Bot, Radio, Puzzle, Phone, Megaphone, PhoneCall, Activity, Gauge,
  KeyRound, Shield, SlidersHorizontal, Home, FolderKanban, CreditCard, Store,
  Settings, Code2, HelpCircle, Bell, Search, Plus, ArrowRight,
  Sparkles,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { track, Events } from "@/lib/analytics"

type Command = {
  id: string
  label: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  group: string
  /** Optional action that runs instead of navigation */
  onSelect?: () => void
  /** Keywords for fuzzy matching */
  keywords?: string[]
}

const COMMANDS: Command[] = [
  // ── Pages — most common navigation targets ─────────────────────────────────
  { id: "go-home",       label: "Home",                     href: "/home",                            icon: Home,               group: "Pages", keywords: ["dashboard"] },
  { id: "go-agents",     label: "Agents",                   href: "/agents",                          icon: Bot,                group: "Pages" },
  { id: "go-rtc",        label: "Realtime Services",        href: "/realtime-services",               icon: Radio,              group: "Pages" },
  { id: "go-integ",      label: "Integrations",             href: "/integrations",                    icon: Puzzle,             group: "Pages" },
  { id: "go-numbers",    label: "Phone Numbers",            href: "/campaigns/phone-numbers",         icon: Phone,              group: "Pages" },
  { id: "go-camp",       label: "Campaigns",                href: "/campaigns",                       icon: Megaphone,          group: "Pages" },
  { id: "go-calls",      label: "Calls",                    href: "/campaigns/calls",                 icon: PhoneCall,          group: "Pages", keywords: ["call history", "call log", "monitor"] },
  { id: "go-sessions",   label: "Sessions",                 href: "/realtime-services/sessions",      icon: Radio,              group: "Pages", keywords: ["session history", "rtc", "realtime"] },
  { id: "go-deploy",     label: "Deploy",                   href: "/deploy",                          icon: Activity,           group: "Pages", keywords: ["go live", "publish", "ship"] },

  // ── Billing ──────────────────────────────────────────────────────────────
  { id: "go-usage",      label: "Usage",                    href: "/billing/usage",                   icon: Gauge,              group: "Billing", keywords: ["consumption", "minutes", "quotas"] },

  // ── Project ──────────────────────────────────────────────────────────────
  { id: "go-proj-set",   label: "Project Settings",         href: "/project/settings",                icon: SlidersHorizontal,  group: "Project" },
  { id: "go-vend-cred",  label: "Vendor Credentials",       href: "/project/vendor-credentials",      icon: Shield,             group: "Project" },
  { id: "go-projects",   label: "View all projects",        href: "/projects",                        icon: FolderKanban,       group: "Project" },

  // ── Account ──────────────────────────────────────────────────────────────
  { id: "go-billing",    label: "Billing",                  href: "/billing",                         icon: CreditCard,         group: "Account", keywords: ["invoices", "payment"] },
  { id: "go-plans",      label: "Plans",                    href: "/billing/plans",                   icon: CreditCard,         group: "Account", keywords: ["upgrade", "pricing"] },
  { id: "go-invoices",   label: "Invoices",                 href: "/billing/invoices",                icon: CreditCard,         group: "Account" },
  { id: "go-ext",        label: "Extensions Marketplace",   href: "/extensions",                      icon: Store,              group: "Account" },
  { id: "go-pref",       label: "Preferences",              href: "/preferences",                     icon: Settings,           group: "Account" },

  // ── Developer & Help ─────────────────────────────────────────────────────
  { id: "go-dev",        label: "Developer Hub",            href: "/developer",                       icon: Code2,              group: "Developer" },
  { id: "go-api",        label: "RESTful API reference",    href: "/developer/restful-api",           icon: Code2,              group: "Developer", keywords: ["http", "endpoints"] },
  { id: "go-webhooks",   label: "Webhooks",                 href: "/developer/webhooks",              icon: Code2,              group: "Developer" },
  { id: "go-audit",      label: "Audit Logs",               href: "/developer/audit-logs",            icon: Code2,              group: "Developer" },
  { id: "go-help",       label: "Help Hub",                 href: "/help",                            icon: HelpCircle,         group: "Help" },
  { id: "go-contact",    label: "Contact Support",          href: "/help/contact",                    icon: HelpCircle,         group: "Help" },
  { id: "go-tickets",    label: "My Tickets",               href: "/help/tickets",                    icon: HelpCircle,         group: "Help" },
  { id: "go-notif",      label: "Notifications",            href: "/notifications",                   icon: Bell,               group: "Help" },

  // ── Actions ──────────────────────────────────────────────────────────────
  { id: "new-agent",     label: "Create a new agent",       href: "/agents/new/edit",                 icon: Plus,               group: "Actions", keywords: ["create", "new"] },
  { id: "new-camp",      label: "Create a new campaign",    href: "/campaigns/new",                   icon: Plus,               group: "Actions", keywords: ["create"] },
]

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  // ⌘K / Ctrl+K toggle + window-event handle so any component (sidebar
  // Composer / Search items, topbar Composer button) can open the palette.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => {
          if (!prev) track(Events.command_palette_opened)
          return !prev
        })
      }
    }
    const onOpenEvt = () => {
      setOpen((prev) => {
        if (!prev) track(Events.command_palette_opened)
        return true
      })
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("sx:open-command-palette", onOpenEvt as EventListener)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("sx:open-command-palette", onOpenEvt as EventListener)
    }
  }, [])

  const grouped = React.useMemo(() => {
    const map = new Map<string, Command[]>()
    for (const cmd of COMMANDS) {
      if (!map.has(cmd.group)) map.set(cmd.group, [])
      map.get(cmd.group)!.push(cmd)
    }
    return Array.from(map.entries())
  }, [])

  const run = (cmd: Command) => {
    track(Events.command_executed, { command: cmd.id, surface: "palette" })
    setOpen(false)
    if (cmd.onSelect) {
      cmd.onSelect()
    } else if (cmd.href) {
      router.push(cmd.href)
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, projects, agents…" />
      <CommandList>
        <CommandEmpty>
          <div className="py-4">
            <Search className="h-5 w-5 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium mt-2">No matches</p>
            <p className="text-xs text-muted-foreground mt-1">Try a page name, &ldquo;new agent&rdquo;, or &ldquo;billing&rdquo;.</p>
          </div>
        </CommandEmpty>
        {grouped.map(([group, items], i) => (
          <React.Fragment key={group}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={`${cmd.label} ${cmd.keywords?.join(" ") ?? ""}`}
                  onSelect={() => run(cmd)}
                >
                  <cmd.icon className="h-4 w-4" />
                  <span>{cmd.label}</span>
                  <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
