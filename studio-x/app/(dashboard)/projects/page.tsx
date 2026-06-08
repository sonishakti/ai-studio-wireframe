"use client"

import * as React from "react"
import Link from "next/link"
import {
  Plus, Search, FolderKanban, Users, MoreHorizontal, Copy, CheckCircle2,
  Archive, RotateCcw,
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
import { toast } from "sonner"

type Project = {
  id: string; name: string; description: string; appId: string
  plan: string; env: string; members: number; agents: number
  status: "active" | "archived"; lastActive: string; current: boolean
}

const PROJECTS: Project[] = [
  { id: "prj_123456", name: "My first project", description: "Personal exploration & demos", appId: "a1b2c3d4e5f67890", plan: "Free",       env: "production", members: 1, agents: 3, status: "active",   lastActive: "2 min ago",  current: true  },
  { id: "prj_789012", name: "Acme Production",  description: "Live customer support agents",  appId: "f9e8d7c6b5a43210", plan: "Pro",        env: "production", members: 8, agents: 14, status: "active",   lastActive: "12 min ago", current: false },
  { id: "prj_345678", name: "Acme Staging",     description: "Pre-prod testing",              appId: "0a1b2c3d4e5f6789", plan: "Pro",        env: "staging",    members: 6, agents: 7,  status: "active",   lastActive: "3 hours ago", current: false },
  { id: "prj_901234", name: "Q3 Pilot",         description: "Limited release pilot",         appId: "9b8a7c6d5e4f3210", plan: "Free",       env: "development",members: 3, agents: 2,  status: "active",   lastActive: "Yesterday",   current: false },
  { id: "prj_567890", name: "Legacy Voice",     description: "RTC-only — sunsetting Aug 2026", appId: "abcdef1234567890", plan: "Enterprise", env: "production", members: 12,agents: 0,  status: "archived", lastActive: "May 12, 2026", current: false },
]

// Env shown as a single colored dot + label — quieter than a bordered badge per card.
const ENV_DOT: Record<string, string> = {
  production:  "bg-emerald-500",
  staging:     "bg-amber-500",
  development: "bg-sky-500",
}

export default function ProjectsPage() {
  const [query, setQuery] = React.useState("")
  const [envFilter, setEnvFilter] = React.useState("all")
  const [showArchived, setShowArchived] = React.useState(false)

  const archivedCount = PROJECTS.filter((p) => p.status === "archived").length

  const filtered = PROJECTS.filter((p) => {
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.appId.toLowerCase().includes(q)
    const matchesEnv = envFilter === "all" || p.env === envFilter
    const matchesArchived = showArchived || p.status !== "archived"
    return matchesQuery && matchesEnv && matchesArchived
  })

  const hasFilters = query.trim() !== "" || envFilter !== "all"

  const copyAppId = (appId: string) => {
    navigator.clipboard?.writeText(appId)
    toast.success("App ID copied")
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Projects"
        description="Each project has its own credentials, usage, and quotas."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Filter row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or App ID…"
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
          {archivedCount > 0 && (
            <Button
              variant={showArchived ? "secondary" : "ghost"}
              size="sm"
              className="text-muted-foreground"
              onClick={() => setShowArchived((v) => !v)}
            >
              <Archive className="h-3.5 w-3.5" />
              {showArchived ? "Hide" : "Show"} archived ({archivedCount})
            </Button>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "project" : "projects"}
          {hasFilters ? " match your filters" : ""}
        </p>

        {/* Project grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const archived = p.status === "archived"
              return (
                <Card
                  key={p.id}
                  className={`transition-colors ${
                    archived
                      ? "opacity-65 hover:opacity-100"
                      : "hover:border-foreground/30"
                  } ${p.current ? "ring-1 ring-primary/40" : ""}`}
                >
                  <CardContent className="p-4">
                    {/* Header: identity + actions */}
                    <div className="flex items-start justify-between gap-2">
                      <Link href="/agents" className="flex items-start gap-3 flex-1 min-w-0 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                          <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                              {p.name}
                            </p>
                            {p.current && (
                              <Badge variant="default" className="text-xs gap-1 shrink-0">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Current
                              </Badge>
                            )}
                            {archived && (
                              <Badge variant="outline" className="text-xs shrink-0">archived</Badge>
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
                          <DropdownMenuItem onSelect={() => copyAppId(p.appId)}>
                            <Copy className="h-3.5 w-3.5" /> Copy App ID
                          </DropdownMenuItem>
                          <DropdownMenuItem>Settings</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {archived ? (
                            <DropdownMenuItem>
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </DropdownMenuItem>
                          ) : (
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
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Single meta line: env · plan · agents · members — lastActive right */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span className={`h-1.5 w-1.5 rounded-full ${ENV_DOT[p.env] ?? "bg-muted-foreground"}`} />
                        {p.env}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="shrink-0">{p.plan}</span>
                      <span aria-hidden>·</span>
                      <span className="shrink-0">{p.agents} {p.agents === 1 ? "agent" : "agents"}</span>
                      <span className="ml-auto flex items-center gap-1 shrink-0">
                        <Users className="h-3 w-3" /> {p.members}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Add-new card — only when not filtering, so it doesn't masquerade as a result */}
            {!hasFilters && (
              <Card className="border-dashed flex items-center justify-center cursor-pointer hover:border-foreground/40 transition-colors min-h-[140px]">
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <Plus className="h-5 w-5" />
                  <span className="text-sm font-medium">New Project</span>
                  <span className="text-xs">Start fresh with new credentials</span>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Empty: no projects at all (first run) */}
        {PROJECTS.length === 0 && (
          <Card>
            <CardContent className="py-14 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted mx-auto">
                <FolderKanban className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mt-3">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                A project holds your agents, credentials, and usage. Create one to get started.
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty: filters matched nothing */}
        {PROJECTS.length > 0 && filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-7 w-7 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium mt-3">No projects match your filters</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search or environment{archivedCount > 0 && !showArchived ? ", or show archived projects" : ""}.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => { setQuery(""); setEnvFilter("all") }}
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
