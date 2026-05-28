"use client"

import * as React from "react"
import Link from "next/link"
import {
  Plus, Search, FolderKanban, Users, MoreHorizontal, Copy, CheckCircle2,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"

const PROJECTS = [
  { id: "prj_123456", name: "My first project", description: "Personal exploration & demos", appId: "a1b2c3d4e5f67890", plan: "Free",       env: "production", members: 1, agents: 3, status: "active",   lastActive: "2 min ago",  current: true  },
  { id: "prj_789012", name: "Acme Production",  description: "Live customer support agents",  appId: "f9e8d7c6b5a43210", plan: "Pro",        env: "production", members: 8, agents: 14, status: "active",   lastActive: "12 min ago", current: false },
  { id: "prj_345678", name: "Acme Staging",     description: "Pre-prod testing",              appId: "0a1b2c3d4e5f6789", plan: "Pro",        env: "staging",    members: 6, agents: 7,  status: "active",   lastActive: "3 hours ago", current: false },
  { id: "prj_901234", name: "Q3 Pilot",         description: "Limited release pilot",         appId: "9b8a7c6d5e4f3210", plan: "Free",       env: "development",members: 3, agents: 2,  status: "active",   lastActive: "Yesterday",   current: false },
  { id: "prj_567890", name: "Legacy Voice",     description: "RTC-only — sunsetting Aug 2026", appId: "abcdef1234567890", plan: "Enterprise", env: "production", members: 12,agents: 0,  status: "archived", lastActive: "May 12, 2026", current: false },
]

const ENV_STYLES: Record<string, string> = {
  production:  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  staging:     "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  development: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
}

export default function ProjectsPage() {
  const [query, setQuery] = React.useState("")
  const [envFilter, setEnvFilter] = React.useState("all")

  const filtered = PROJECTS.filter((p) => {
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.appId.toLowerCase().includes(q)
    const matchesEnv = envFilter === "all" || p.env === envFilter
    return matchesQuery && matchesEnv
  })

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Projects"
        description="All projects you have access to. Each project has its own credentials, usage, and quotas."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-5">
        {/* Filter row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by project name or App ID…"
              className="pl-9"
            />
          </div>
          <Select value={envFilter} onValueChange={setEnvFilter}>
            <SelectTrigger className="h-9 w-40 text-sm">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All environments</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="development">Development</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Project grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className={`hover:border-foreground/30 transition-colors ${p.current ? "ring-1 ring-primary/40" : ""}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <Link href="/home" className="flex items-start gap-3 flex-1 min-w-0 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {p.name}
                        </p>
                        {p.current && (
                          <Badge variant="default" className="text-xs gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>
                    </div>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Open</DropdownMenuItem>
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DestructiveActionDialog
                        action="Archive"
                        resource="project"
                        resourceId={p.id}
                        resourceName={p.name}
                        description="The project's data and agents will be moved to read-only. You can restore it within 30 days."
                      >
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          Archive
                        </DropdownMenuItem>
                      </DestructiveActionDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* App ID row */}
                <div className="mt-4 flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                  <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider shrink-0">App ID</span>
                  <span className="font-mono text-xs flex-1 truncate">{p.appId}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                {/* Meta row */}
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-xs ${ENV_STYLES[p.env] ?? ""}`}
                  >
                    {p.env}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{p.plan}</Badge>
                  {p.status === "archived" && (
                    <Badge variant="outline" className="text-xs">archived</Badge>
                  )}
                </div>

                {/* Stats row */}
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {p.members}
                  </span>
                  <span>· {p.agents} agents</span>
                  <span className="ml-auto">{p.lastActive}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add-new card */}
          <Card className="border-dashed flex items-center justify-center cursor-pointer hover:border-foreground/40 transition-colors min-h-[180px]">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">New Project</span>
              <span className="text-xs">Start fresh with new credentials</span>
            </div>
          </Card>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderKanban className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium mt-3">No projects match your filters</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try clearing the search or environment filter.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
