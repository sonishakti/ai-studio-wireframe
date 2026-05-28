"use client"

import * as React from "react"
import Link from "next/link"
import {
  FolderKanban, Check, Plus, ArrowRight, ChevronsUpDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { toast } from "sonner"
import { track, Events } from "@/lib/analytics"

// Stub project list — in production fetch from API + cache.
// Matches /projects page data.
const PROJECTS = [
  { id: "prj_123456", name: "My first project", plan: "Free",       env: "production",  current: true  },
  { id: "prj_789012", name: "Acme Production",  plan: "Pro",        env: "production",  current: false },
  { id: "prj_345678", name: "Acme Staging",     plan: "Pro",        env: "staging",     current: false },
  { id: "prj_901234", name: "Q3 Pilot",         plan: "Free",       env: "development", current: false },
]

export function ProjectSwitcher() {
  const current = PROJECTS.find((p) => p.current) ?? PROJECTS[0]
  const others = PROJECTS.filter((p) => !p.current)

  const handleSwitch = (toId: string, toName: string) => {
    track(Events.project_switched, { from_project_id: current.id, to_project_id: toId })
    toast.success(`Switched to ${toName}`, {
      description: "Reloading project data…",
    })
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) track(Events.project_switcher_opened) }}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          className="flex-1 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          tooltip={current.name}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded bg-muted shrink-0">
            <FolderKanban className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="flex-1 truncate text-sm">{current.name}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-60" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64"
        side="top"
        align="start"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Current project
        </DropdownMenuLabel>
        <DropdownMenuItem className="gap-2 cursor-default focus:bg-accent/50">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{current.name}</p>
            <p className="text-xs text-muted-foreground">
              {current.env} · {current.plan}
            </p>
          </div>
          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
        </DropdownMenuItem>

        {others.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Switch project
            </DropdownMenuLabel>
            {others.map((p) => (
              <DropdownMenuItem
                key={p.id}
                className="gap-2"
                onSelect={() => handleSwitch(p.id, p.name)}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
                  <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.env} · {p.plan}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/projects" className="gap-2">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">View all projects</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Create new project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
