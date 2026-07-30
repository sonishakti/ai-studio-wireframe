"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Bot,
  Plus,
  Upload,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Search,
  Filter,
  Library,
  Phone,
  MessageCircle,
  Globe,
  PhoneOutgoing,
  Code2,
  CircleDashed,
  Gauge,
  Mic,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { AgentWizard } from "@/components/wizard/agent-wizard"
import { InfoHint } from "@/components/wizard/info-hint"
import { ProvisioningCeremony } from "@/components/provisioning-ceremony"
import { isProvisioned, markProvisioned, resetProvisioned } from "@/lib/journey-progress"
import { useFutureScope, readFutureScope } from "@/lib/future-scope"
import { cn } from "@/lib/utils"
import { track, Events, markBuildStart } from "@/lib/analytics"
import { STACK_PRESETS, STACK_ESTIMATE, AGENT_TEMPLATES, getAgent, stackLine, stackFor, type StackPreset, type ImportedAgentConfig } from "@/lib/campaign-data"
import { importedConfigToArtifact, importedAgentToDraft, stashImportNotice } from "@/lib/import-agent"
import { restoreDraft, saveDraft, templateToDraft, EMPTY_DRAFT } from "@/lib/wizard-draft"
import {
  readSessionAgents, readStatusOverrides, setAgentStatus, subscribeAgentStore, type SessionRun,
} from "@/lib/agent-store"
import { CreateAgentDialog, TEMPLATE_ICONS, type CreateAgentValue } from "@/components/wizard/create-agent-dialog"
import { AgentSphere } from "@/components/agent-test-panel"
import { toast } from "sonner"

// ─── data ────────────────────────────────────────────────────────────────────

// Templates now live in lib/campaign-data (AGENT_TEMPLATES) — shared with the
// wizard's ?template= seeding so "Start from this" actually carries them.
type Template = (typeof AGENT_TEMPLATES)[number]

// ⚠ channelType/channelLabel MUST mirror lib/campaign-data.ts Agent.channel —
// the builder hydrates from THAT record; a list cell claiming a channel the
// builder can't show is heuristic-eval #2 all over again (re-eval #5).
// Each agent owns ONE channel (2026-06-23 model; duplicate to add another) and
// one stack preset (the cost-vs-speed dimension). channelType drives the filter.
type AgentChannel = "phone" | "whatsapp" | "web" | "batch" | "code" | "none"

type AgentRow = {
  id: string; name: string; description: string; status: string
  channelType: AgentChannel; channelLabel: string; stack: StackPreset; calls: number; lastModified: string
  /** Session-created agents carry their runs; mock rows read getAgent(). */
  runs?: SessionRun[]
}

const AGENTS: AgentRow[] = [
  { id: "agt_default", name: "Aria",            description: "Your auto-provisioned default — live and ready", status: "live",   channelType: "phone",    channelLabel: "+1 (628) 555-0188", stack: "balanced", calls: 42,    lastModified: "Provisioned for you" },
  { id: "agt_support_v2", name: "Support Bot v2",       description: "Handles tier-1 support queries via phone",       status: "live",   channelType: "phone",    channelLabel: "+1 (415) 555-0101", stack: "fastest",  calls: 12430, lastModified: "2 hours ago" },
  { id: "agt_appointment_setter", name: "Appointment Setter",   description: "Schedules appointments and sends confirmations", status: "live",   channelType: "web",      channelLabel: "acme.com/booking",  stack: "balanced", calls: 3270,  lastModified: "5 min ago" },
  { id: "agt_survey", name: "Survey Bot",           description: "Post-interaction CSAT surveys",                  status: "live",   channelType: "web",      channelLabel: "acme.com/help",     stack: "cheapest", calls: 5601,  lastModified: "1 day ago" },
  { id: "agt_sales_qualifier", name: "Sales Qualifier",      description: "Qualifies inbound leads before transfer",        status: "draft",  channelType: "none",     channelLabel: "Not deployed",      stack: "balanced", calls: 0,     lastModified: "Yesterday" },
  { id: "agt_collections", name: "Collections Outreach", description: "Outbound debt collection",                       status: "paused", channelType: "batch",    channelLabel: "Q2 Collections",    stack: "cheapest", calls: 891,   lastModified: "3 days ago" },
]

const CHANNEL_META: Record<AgentChannel, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  phone:    { label: "Phone",       icon: Phone },
  whatsapp: { label: "WhatsApp",    icon: MessageCircle },
  web:      { label: "Web widget",  icon: Globe },
  batch:    { label: "Batch calls", icon: PhoneOutgoing },
  code:     { label: "Code / SDK",  icon: Code2 },
  none:     { label: "Not deployed", icon: CircleDashed },
}

type AgentStatus = "live" | "draft" | "paused"

const STATUS_FILTERS: { id: "all" | AgentStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "draft", label: "Draft" },
  { id: "paused", label: "Paused" },
]

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  live: "default", draft: "secondary", paused: "outline",
}

// ─── template row ────────────────────────────────────────────────────────────

function TemplateRow({
  tpl,
  isSelected,
  onSelect,
  onTest,
}: {
  tpl: Template
  isSelected: boolean
  onSelect: () => void
  onTest: () => void
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-4 py-4 transition-all",
        isSelected
          ? "border-primary/60 shadow-sm ring-1 ring-primary/30"
          : "hover:border-foreground/20 hover:bg-accent/30",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* The title is the select control — a real button, not a wrapper. */}
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={isSelected}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-sm font-semibold">
            {tpl.name}
            {/* Quality signals (A1): sell the template instead of underselling
                it — the most-picked starter gets a quiet badge. */}
            {tpl.id === "appointment-reminder" && (
              <Badge variant="secondary" className="ml-2 text-xs align-middle">Popular</Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
          {/* The stack is a feature, not fine print — name what it runs on.
              Derived from the template's preset so the card can't advertise a
              stack the template doesn't actually apply. */}
          {tpl.id !== "blank" && (
            <p className="text-xs text-muted-foreground/80 mt-1 font-mono">
              {stackLine(stackFor(tpl.preset), { full: true })}
            </p>
          )}
          {tpl.extract.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Extracts: {tpl.extract.slice(0, 3).join(" · ")}
              {tpl.extract.length > 3 ? ` +${tpl.extract.length - 3}` : ""}
            </p>
          )}
        </button>
        {isSelected && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={onTest}
            >
              Test
            </Button>
            {/* ?template= actually seeds the wizard — the old /agents/{tpl.id}/edit
                link silently missed getAgent() and discarded the template (#5). */}
            <Button size="sm" className="h-8 text-xs gap-1" asChild>
              <Link href={`/agents/new/edit?template=${tpl.id}`}>
                Start from this
                <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── returning-user list view ────────────────────────────────────────────────

function ListView({ onBrowseTemplates }: { onBrowseTemplates: () => void }) {
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState<"all" | AgentStatus>("all")
  const [pageSize, setPageSize] = React.useState(10)
  const [page, setPage] = React.useState(1)
  // Rows in state so Pause/Resume actually flips status — the user-test found
  // the list filters by "Paused" while offering no way to PRODUCE that state:
  // Delete was the only off-switch for a live agent (S2).
  const [agents, setAgents] = React.useState<AgentRow[]>(AGENTS)

  // Merge agents deployed THIS session (sessionStorage — read after mount to
  // keep hydration clean) ABOVE the mock rows, then apply live/paused
  // overrides written from either surface (this list or the builder header) —
  // user-test 2026-07-28 P0: a just-deployed agent must EXIST here.
  const refresh = React.useCallback(() => {
    const overrides = readStatusOverrides()
    const merged: AgentRow[] = [...readSessionAgents(), ...AGENTS]
    setAgents(merged.map((a) => (overrides[a.id] ? { ...a, status: overrides[a.id] } : a)))
  }, [])
  React.useEffect(() => {
    refresh()
    return subscribeAgentStore(refresh)
  }, [refresh])

  const togglePause = (id: string) => {
    const a = agents.find((r) => r.id === id)
    if (!a) return
    const paused = a.status === "live"
    // Shared store write — the builder header's Pause/Resume reads the same
    // slot; the subscription above flips this row.
    setAgentStatus(id, paused ? "paused" : "live")
    toast(paused ? `${a.name} paused` : `${a.name} is live again`, {
      description: paused
        ? "It stops taking new calls until you resume it. Calls in progress finish normally."
        : `Answering on ${a.channelLabel} again.`,
    })
  }

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return agents.filter((a) => {
      if (status !== "all" && a.status !== status) return false
      if (q && !a.name.toLowerCase().includes(q) && !a.id.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, status, agents])

  React.useEffect(() => { setPage(1) }, [query, status, pageSize])

  // Zero-results telemetry — fire only when an actual search returned nothing.
  React.useEffect(() => {
    const q = query.trim()
    if (q && rows.length === 0) track(Events.search_zero_results, { surface: "agents", query: q })
  }, [query, rows.length])

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or agent ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        {/* Status filter — All / Live / Draft / Paused */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <ToggleGroup
            type="single"
            value={status}
            onValueChange={(v) => { if (v) setStatus(v as "all" | AgentStatus) }}
            variant="outline"
            size="sm"
            aria-label="Filter agents by status"
          >
            {STATUS_FILTERS.map((f) => {
              const count = f.id === "all" ? agents.length : agents.filter((a) => a.status === f.id).length
              return (
                <ToggleGroupItem key={f.id} value={f.id} className="text-xs">
                  {f.label} <span className="tabular-nums text-muted-foreground">{count}</span>
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 ml-auto"
          onClick={onBrowseTemplates}
        >
          <Library className="h-3.5 w-3.5" /> Browse templates
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-64">Agent</TableHead>
                <TableHead>Agent ID</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Stack</TableHead>
                <TableHead>Last edited</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total calls</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((agent) => {
                const ch = CHANNEL_META[agent.channelType]
                const est = STACK_ESTIMATE[agent.stack]
                // Runs model (owner 2026-07-28): no separate campaigns page —
                // the agent row nests its runs (active · scheduled · completed).
                // Session-created agents carry their own runs from the deploy.
                const runs = agent.runs ?? getAgent(agent.id)?.campaigns ?? []
                return (
                  <React.Fragment key={agent.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="inline-flex items-center gap-1.5">
                            <Link
                              href={`/agents/${agent.id}/edit`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {agent.name}
                            </Link>
                            {agent.status === "live" && (
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse"
                                title="Live"
                                aria-label="Live"
                              />
                            )}
                          </span>
                          <p className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground/80" title={agent.id}>{agent.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <ch.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm">{ch.label}</span>
                        {agent.channelType !== "none" && (
                          <span className="font-mono text-xs text-muted-foreground">{agent.channelLabel}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-xs font-normal">
                        <Gauge className="h-3 w-3" />
                        {STACK_PRESETS[agent.stack].label} · <span className="tabular-nums">${est.costPerMin.toFixed(2)}/min</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {agent.lastModified}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <Badge variant={STATUS_VARIANT[agent.status] ?? "secondary"} className="capitalize">
                          {agent.status}
                        </Badge>
                        {/* Aria's Live badge must be explicable WHERE SHE IS
                            VISIBLE — the old explanation was gated on a landing
                            state the new-agent default removed (user-test
                            2026-07-24 P0). */}
                        {agent.id === "agt_default" && (
                          <InfoHint label="sandbox line">
                            Auto-provisioned sample agent, live on an Agora sandbox line — its call
                            history is sample data, and it costs nothing until it takes real traffic.
                            Shared sandbox number for testing — production telephony is
                            bring-your-own SIP.
                          </InfoHint>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {agent.calls.toLocaleString()}
                      {/* Sample-data mark at a glance (user-test 2026-07-29):
                          the count itself must say it — the InfoHint keeps the
                          full story. */}
                      {agent.id === "agt_default" && (
                        <span className="ml-1 text-xs text-muted-foreground">sample calls</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/agents/${agent.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            {/* ?step=5 lands on Go Live (v5 order). */}
                            <Link href={`/agents/${agent.id}/edit?step=5`}>Deploy</Link>
                          </DropdownMenuItem>
                          {/* A reversible off-switch — Delete must never be the
                              only way to stop a live agent (user-test S2). */}
                          {(agent.status === "live" || agent.status === "paused") && (
                            <DropdownMenuItem onClick={() => togglePause(agent.id)}>
                              {agent.status === "live" ? "Pause — take offline" : "Resume"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DestructiveActionDialog
                            action="Delete"
                            resource="agent"
                            resourceId={agent.id}
                            resourceName={agent.name}
                            description="Calls in flight will complete; future calls will fail. This cannot be undone."
                          >
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DestructiveActionDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {runs.map((r) => (
                    <TableRow key={r.id} className="bg-muted/20 hover:bg-muted/30">
                      <TableCell colSpan={5} className="py-2">
                        <Link
                          href={`/agents/${agent.id}/edit?step=5`}
                          className="flex items-center gap-2.5 pl-11 text-sm"
                        >
                          <span className="h-4 w-px bg-border" aria-hidden />
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                              r.status === "running" ? "bg-success/10 text-success"
                              : r.status === "scheduled" ? "border border-border text-foreground"
                              : r.status === "completed" ? "bg-muted text-muted-foreground"
                              : "bg-secondary text-secondary-foreground",
                            )}
                          >
                            {r.status === "running" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden />}
                            {r.status}
                          </span>
                          <span className="min-w-0 truncate font-medium">{r.name}</span>
                          {r.language && <span className="shrink-0 text-xs text-muted-foreground">{r.language}</span>}
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {r.contacts ? `${r.contacts} contacts` : "no contacts yet"}
                            {r.status === "scheduled" && r.startDate ? ` · starts ${r.startDate} ${r.startTime ?? ""}` : ""}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell colSpan={3} className="py-2 text-right">
                        <span className="pr-1 text-xs text-muted-foreground">run</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  </React.Fragment>
                )
              })}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">
                    <Bot className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    No agents match {query.trim() ? `“${query.trim()}”` : "this filter"}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination — same pattern as Sessions */}
      <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
          <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="tabular-nums">Page {safePage} of {pageCount}</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setPage(1)} title="First page"><ChevronsLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} title="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} title="Next page"><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= pageCount} onClick={() => setPage(pageCount)} title="Last page"><ChevronsRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </main>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

/** Syncs URL params → page state from inside its own Suspense boundary, so
 *  useSearchParams' CSR bail-out de-opts only this empty node — the page
 *  itself still fully SSRs with the builder default. */
function ParamsSync({ onParams }: { onParams: (p: URLSearchParams) => void }) {
  const params = useSearchParams()
  React.useEffect(() => {
    onParams(new URLSearchParams(params.toString()))
  }, [params, onParams])
  return null
}

export default function AgentsPage() {
  // The Agents home is the entry of the build→deploy journey — stamp the start so
  // the wizard can report time-to-live (the <3-min deploy spine).
  React.useEffect(() => { markBuildStart() }, [])

  // First-run provisioning ceremony (A1) — once per browser, before the
  // landing. "ready" is the SSR/hydration default; the effect downgrades to
  // ceremony for unprovisioned browsers (one-frame flash beats a hydration
  // mismatch). ?provision=1 replays; ?provision=stall demos the error state.
  const [phase, setPhase] = React.useState<"ceremony" | "warming" | "ready">("ready")
  const [stallDemo, setStallDemo] = React.useState(false)
  // A1 is future-scope-gated: with the flag off, the ceremony never runs and
  // /agents opens straight on today's landing.
  const [future] = useFutureScope()

  // The view FOLLOWS the URL (?view=list) via real navigation — Back works and
  // the segmented control below always shows which surface you're on (#8).
  // "Create new agent" opens a BLANK builder inline; editing an existing agent
  // from the list is the only route jump (→ /agents/[id]/edit).
  const router = useRouter()
  // Owner design set 22–23 Jul: /agents DEFAULTS to the "start" landing
  // (template gallery + Import + Create-dialog); the builder is entered by
  // creating/editing, the list via ?view=list.
  const [view, setView] = React.useState<"start" | "builder" | "list">("start")
  const [createOpen, setCreateOpen] = React.useState(false)
  // Owner 2026-07-22: /agents lands on the NEW AGENT flow by default — the
  // edit view is only entered when the user edits an agent (list → Edit →
  // /agents/[id]/edit). "new" WITHOUT the blank flag restores an in-progress
  // draft, so returning mid-build never loses work.
  const [builderId, setBuilderId] = React.useState("new")
  // Explicit start-over intent ONLY (kebab "New agent") — never implied by
  // landing, or every visit would wipe the draft. The nonce remounts the
  // wizard even when builderId is already "new".
  const [blankIntent, setBlankIntent] = React.useState(false)
  const [blankNonce, setBlankNonce] = React.useState(0)
  // CONSUME-ONCE (user-test 2026-07-24 S1): the flag must die right after the
  // remount it triggered reads it — left armed, EVERY later wizard remount in
  // this page mount (Builder↔All agents round-trip, import-as-new landing)
  // wiped visible work to a blank builder.
  React.useEffect(() => {
    if (blankIntent) setBlankIntent(false)
  }, [blankIntent])
  const [templatesOpen, setTemplatesOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState("appointment-reminder")

  const onParams = React.useCallback((p: URLSearchParams) => {
    // Default = "start" landing; builder for its explicit param AND for every
    // legacy builder deep link (?step/?dc/?template/?artifact from ⌘K, deploy
    // redirects, and the playground round-trip must still land in the wizard).
    const v = p.get("view")
    setView(
      v === "list"
        ? "list"
        : v === "builder" || p.get("step") || p.get("dc") || p.get("template") || p.get("artifact") || p.get("blank")
          ? "builder"
          : "start",
    )
    // ⌘K / deep links can open the templates sheet directly (?templates=1).
    if (p.get("templates") === "1") setTemplatesOpen(true)
    const prov = p.get("provision")
    if ((prov === "1" || prov === "stall") && readFutureScope()) {
      resetProvisioned()
      setStallDemo(prov === "stall")
      setPhase("ceremony")
    }
  }, [])

  React.useEffect(() => {
    if (future && !isProvisioned()) setPhase("ceremony")
    else if (!future) setPhase("ready")
  }, [future])

  // The warming beat: the user broke the wall early, so the landing renders
  // while the remaining stages "finish" — then the Talk button flips on.
  React.useEffect(() => {
    if (phase !== "warming") return
    const t = window.setTimeout(() => setPhase("ready"), 3200)
    return () => window.clearTimeout(t)
  }, [phase])

  const [autoTalk, setAutoTalk] = React.useState(false)
  // The landing's promise must match the account state (user-test 2026-07-29):
  // Aria is live from signup, so the start headline talks to HER — not "your
  // first agent". Mock default = live; the effect folds in pause overrides.
  const [ariaLive, setAriaLive] = React.useState(getAgent("agt_default")?.status === "live")
  React.useEffect(() => {
    const sync = () =>
      setAriaLive((readStatusOverrides()["agt_default"] ?? getAgent("agt_default")?.status) === "live")
    sync()
    return subscribeAgentStore(sync)
  }, [])
  // "Talk to Aria" delivers the headline's promise in ONE click — same landing
  // as the ceremony's "Say hello": her builder, Test section auto-opened.
  const talkToAria = () => {
    setBuilderId("agt_default")
    setAutoTalk(true)
    setView("builder")
    router.push("/agents?view=builder")
  }
  const finishCeremony = (skipped: boolean) => {
    markProvisioned()
    setPhase(skipped ? "warming" : "ready")
    // "Say hello to Aria" must DELIVER the hello — the ceremony hands you
    // ARIA, so it must open HER builder (the default landing is the start
    // gallery since 22–23 Jul; without this the autoTalk promise landed on a
    // blank surface — user-test 2026-07-24 orphan).
    setBuilderId("agt_default")
    setView("builder")
    if (!skipped) setAutoTalk(true)
  }

  // BOTH import entry points land in the same INLINE builder flow (user-test
  // #6 P1: the list button page-hopped to the playground while the builder
  // banner stayed inline). Landing = write the new-agent draft slot, remount
  // the builder on it. "imported" is a non-edit, non-blank id: getAgent misses
  // (fresh draft) and the blank prop stays off (the restore path must FIND the
  // seeded draft instead of wiping to empty).
  const landImportedDraft = React.useCallback(() => {
    // Clean the URL SYNCHRONOUSLY before the key-change remount: the wizard's
    // mount effect reads window.location, and a lingering ?step/?dc from the
    // previous builder session would deep-link the fresh import (same race as
    // startBlank, 2026-07-07).
    window.history.replaceState({}, "", "/agents")
    setBuilderId("imported")
    router.push("/agents")
  }, [router])

  // List-view import: no draft is open here, so it always lands as a NEW agent
  // draft — seeded from the import, with the landing toast (and Undo when it
  // replaced unsaved work) shown by the builder it remounts into.
  const onListImported = (config: ImportedAgentConfig) => {
    const artifact = importedConfigToArtifact(config)
    const seeded = importedAgentToDraft(config, artifact)
    const prev = restoreDraft()
    const prevHasWork = !!(prev && (prev.name.trim() || prev.systemPrompt.trim() || prev.voice))
    saveDraft(seeded)
    stashImportNotice({
      name: config.name,
      hadPrompt: !!config.systemPrompt?.trim(),
      prev: prevHasWork ? prev! : undefined,
    })
    landImportedDraft()
  }

  // "Builder" must OPEN THE BUILDER (user-test 2026-07-24 S2: it resolved to
  // the start landing — a no-op that stranded mid-build drafts). It restores
  // whatever draft is in progress; the start landing has its own segment.
  const showList = (toList: boolean) => router.push(toList ? "/agents?view=list" : "/agents?view=builder")
  // v4 (2026-07-28): "New agent" opens the AI-FIRST create dialog — describe
  // what you want (mock inference picks template + channels) or pick a
  // template from the radio list.
  const startBlank = () => setCreateOpen(true)
  // "Use template" SKIPS the describe dialog — the template IS the description
  // (user-test 2026-07-28 P0: routing a picked template through "describe what
  // you want" was a redundant wall). It lands straight in a builder seeded via
  // the existing ?template= mount path (draft-protection + toast included);
  // the dialog stays for Create New Agent only.
  const useTemplate = (id: string) => {
    setBuilderId("new")
    router.push(`/agents?view=builder&template=${id}`)
  }
  // Dialog → seed the new-agent draft slot and remount the builder on it —
  // same landing idiom as import-as-new (write the slot, remount, restore).
  const createAgent = (v: CreateAgentValue) => {
    const tpl = AGENT_TEMPLATES.find((t) => t.id === v.templateId)
    const base = v.templateId === "blank" || !tpl ? { ...EMPTY_DRAFT } : templateToDraft(tpl)
    const name = v.name || base.name || "New agent"
    const seeded = { ...base, name, channels: v.channels.length ? v.channels : base.channels }
    // The describe-box text is the user's words — fold it into the prompt
    // rather than dropping it (blank template: it BECOMES the seed prompt).
    if (v.description) {
      seeded.systemPrompt = base.systemPrompt
        ? `${base.systemPrompt}\n\nWhat the builder asked for: ${v.description}`
        : `You are a voice agent. ${v.description}\n\nBe concise and helpful. Greet the caller, do your job, and escalate to a human if asked.`
    }
    saveDraft(seeded)
    // One-shot landing notice: the builder toasts "created" (not "restored"),
    // says what the inference picked, and opens at the TOP of the journey.
    stashImportNotice({ name, hadPrompt: !!seeded.systemPrompt, kind: "create", inferred: v.inferred })
    setCreateOpen(false)
    setBuilderId("new")
    setBlankNonce((n) => n + 1) // remount even if already on "new"
    router.push("/agents?view=builder")
  }
  const isBuilder = view === "builder"

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <React.Suspense fallback={null}>
        <ParamsSync onParams={onParams} />
      </React.Suspense>
      {/* Persistent mode switch — you can always SEE which of the THREE
          /agents surfaces you're on, and get back (#8; the two-segment
          version left the default landing unrepresented — user-test
          2026-07-24 S3). */}
      <div className="flex items-center justify-between border-b border-border px-6 py-2">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => {
            if (!v) return
            router.push(v === "list" ? "/agents?view=list" : v === "builder" ? "/agents?view=builder" : "/agents")
          }}
          variant="outline"
          size="sm"
          aria-label="Agents view"
        >
          <ToggleGroupItem value="start" className="text-xs">Start</ToggleGroupItem>
          <ToggleGroupItem value="builder" className="text-xs">Builder</ToggleGroupItem>
          <ToggleGroupItem value="list" className="text-xs">All agents</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <PageHeader
        // The builder is a self-contained widget (own heading + view-all/create
        // chrome), so suppress the PageHeader in builder view — it only carries
        // the title + actions for the start landing and the managed list.
        title={
          isBuilder
            ? undefined
            : view === "start"
              ? phase !== "ceremony" && ariaLive
                ? "Aria is live — talk to it, then make it yours"
                : "Deploy your first voice agent"
              : "Agents"
        }
        description={isBuilder ? undefined : view === "start" ? "Start from a template, import one from another platform, or create from scratch." : "Create and manage your agents here."}
        actions={
          isBuilder ? undefined : (
            <div className="flex items-center gap-2">
              {/* Lands in the same INLINE builder flow as the banner import —
                  one landing for both entry points (user-test #6 P1); a success
                  toast with no visible artifact was the original trust break. */}
              <ImportAgentSheet onImported={onListImported}>
                <Button variant="outline" className="gap-1.5 max-sm:hidden">
                  <Upload className="h-4 w-4" /> Import Agent
                </Button>
              </ImportAgentSheet>
              <Button className="gap-1.5" onClick={startBlank}>
                <Plus className="h-4 w-4" /> Create New Agent
              </Button>
            </div>
          )
        }
      />

      {phase === "ceremony" && view !== "list" ? (
        <ProvisioningCeremony
          stallDemo={stallDemo}
          onSkip={() => finishCeremony(true)}
          onDone={() => finishCeremony(false)}
        />
      ) : isBuilder ? (
        <AgentWizard
          key={`${builderId}:${blankNonce}`}
          id={builderId}
          landing={builderId === "agt_default"}
          warming={phase === "warming" && builderId === "agt_default"}
          autoTalk={autoTalk && builderId === "agt_default"}
          // Prop, not URL: startBlank remounts this in the same tick as its
          // router.push, so the mount effect can't rely on reading ?blank=1.
          // blank = EXPLICIT start-over only (owner 2026-07-22): the default
          // new-agent landing must restore an in-progress draft, not wipe it.
          blank={blankIntent}
          onCreateNew={startBlank}
          onImportAsNew={landImportedDraft}
        />
      ) : view === "list" ? (
        <ListView onBrowseTemplates={() => setTemplatesOpen(true)} />
      ) : (
        /* "Start" landing (owner design set 22–23 Jul): template gallery with
           a live-ish preview panel; Import + Create ride the PageHeader. */
        <StartView onUseTemplate={useTemplate} onTalkToAria={talkToAria} />
      )}

      {/* Create new agent — the describe-it dialog. Create New Agent ONLY:
          "Use template" bypasses it and seeds the builder directly. */}
      <CreateAgentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={createAgent}
      />

      {/* Templates sheet — returning users browse without leaving the list */}
      <Sheet open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <SheetContent className="w-full overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Browse Templates</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Pre-built agents you can deploy in minutes. Pick one to test or customize.
            </p>
          </SheetHeader>
          <div className="px-6 pb-6 space-y-2">
            {AGENT_TEMPLATES.map((tpl) => (
              <TemplateRow
                key={tpl.id}
                tpl={tpl}
                isSelected={selectedId === tpl.id}
                onSelect={() => {
                  setSelectedId(tpl.id)
                  track(Events.agent_template_selected, { template_id: tpl.id })
                }}
                onTest={() =>
                  track(Events.agent_test_started, {
                    template_id: tpl.id,
                    agent_id: "preview",
                  })
                }
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Start landing (owner design set 22–23 Jul, Figma 2698-108992) ────────────
// The default /agents surface: template rows on the left, a preview panel on
// the right (selected template · Agent Ready · orb · Talk · stats). Import +
// Create New Agent live in the PageHeader above; a row's "Use template" opens
// the create dialog pre-seeded.

function StartView({
  onUseTemplate,
  onTalkToAria,
}: {
  onUseTemplate: (templateId: string) => void
  /** One-click delivery of the promised live agent (user-test 2026-07-29):
   *  opens Aria's builder with the Test section auto-started. */
  onTalkToAria: () => void
}) {
  const templates = AGENT_TEMPLATES.filter((t) => t.id !== "blank")
  const [selected, setSelected] = React.useState(templates[0].id)
  const tpl = templates.find((t) => t.id === selected) ?? templates[0]
  const est = STACK_ESTIMATE["balanced"]
  // In-progress draft (localStorage — read after mount to keep hydration
  // clean): the landing must offer the way BACK, not only ways to start over
  // (user-test 2026-07-24 S2: a stranded draft's only visible exits destroyed
  // it).
  const [draftName, setDraftName] = React.useState<string | null>(null)
  React.useEffect(() => {
    const d = restoreDraft()
    if (d && (d.name.trim() || d.systemPrompt.trim() || d.channels.length)) setDraftName(d.name.trim() || "Untitled agent")
  }, [])

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        {/* The account isn't empty — Aria is live, and a mid-build draft has a
            door back (2026-07-24 S2: the landing claimed "first agent" while
            hiding both). */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            {/* "42 sample calls" marks the data as seeded at a glance
                (user-test 2026-07-29); the InfoHint keeps the full story. */}
            Aria, your sample agent, is live on +1 (628) 555-0188 · 42 sample calls
          </span>
          <InfoHint label="sandbox line">
            Auto-provisioned for you on an Agora sandbox line — its call history is sample data,
            and it costs nothing until it takes real traffic. Shared sandbox number for testing —
            production telephony is bring-your-own SIP.
          </InfoHint>
          {/* The promised live agent is ONE click, not an Edit-link detour
              behind the template-preview mic (user-test 2026-07-29 P0). */}
          <Button variant="outline" size="sm" className="h-6 gap-1 px-2 text-xs" onClick={onTalkToAria}>
            <Mic className="h-3 w-3" aria-hidden /> Talk to Aria
          </Button>
          <Link href="/agents/agt_default/edit" className="underline underline-offset-2 hover:text-foreground">Edit Aria</Link>
          <Link href="/agents?view=list" className="underline underline-offset-2 hover:text-foreground">All agents</Link>
          {draftName && (
            <span className="ml-auto flex items-center gap-2">
              <span className="text-foreground">Draft in progress: {draftName}</span>
              <Button asChild variant="outline" size="sm" className="h-6 px-2 text-xs">
                <Link href="/agents?view=builder">Resume draft</Link>
              </Button>
            </span>
          )}
        </div>

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
        {/* Template rows — click previews on the right; Use opens the dialog. */}
        <div className="min-w-0 flex-1 space-y-2">
          {templates.map((t) => {
            const Icon = TEMPLATE_ICONS[t.id] ?? Bot
            const on = t.id === selected
            return (
              <div
                key={t.id}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                  on ? "border-foreground/50 bg-accent/30" : "border-border hover:bg-accent/20",
                )}
              >
                <button type="button" onClick={() => setSelected(t.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4 text-foreground" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{t.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{t.description}</span>
                  </span>
                </button>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => onUseTemplate(t.id)}>
                  Use template
                </Button>
              </div>
            )
          })}
          {/* Code/SDK scent (user-test 2026-07-29): the templates all read
              telephony — the embed-in-my-app path needs one visible line.
              Points at the builder's Deployment section, where Code / SDK is a
              first-class radio. Text pointer only — the landing stays
              single-purpose, no nav grid. */}
          <p className="px-1 pt-1 text-xs text-muted-foreground">
            Adding the agent to your own app?{" "}
            <Link
              href="/agents?view=builder&step=2"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Code / SDK lives in the builder › Deployment →
            </Link>
          </p>
        </div>

        {/* Preview panel — 320 (design): selected template · ready badge · orb
            · simulated Talk · session statistics. */}
        <aside className="w-full shrink-0 rounded-lg border border-border lg:w-[320px]" aria-label="Template preview">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Test Agent</p>
          </div>
          <div className="flex flex-col items-center gap-6 px-4 py-6">
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="max-w-[170px] truncate">{tpl.name}</Badge>
              {/* "Template preview", never "Agent Ready" — nothing exists yet
                  (user-test 2026-07-24: status vocabulary asserting a live
                  thing that doesn't exist). */}
              <Badge variant="outline" className="text-muted-foreground">Template preview</Badge>
            </span>
            <AgentSphere size={120} />
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => toast("Simulated preview", { description: `No live audio in this wireframe — ${tpl.name} would answer here.` })}
              >
                <Mic className="h-3.5 w-3.5" aria-hidden /> Talk to agent
              </Button>
              {/* Pre-click honesty — the disclosure must precede the click. */}
              <p className="text-xs text-muted-foreground/70">Simulated preview</p>
            </div>
          </div>
          <div className="space-y-1.5 border-t border-border px-4 py-4">
            <p className="pb-1 font-mono text-xs uppercase tracking-wider text-muted-foreground opacity-50">Estimated statistics · Balanced stack</p>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs uppercase text-muted-foreground opacity-50">Avg. E2E latency</span>
              <span className="font-mono text-xs tabular-nums">{est.latencyMs} ms</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs uppercase text-muted-foreground opacity-50">Avg. cost</span>
              <span className="font-mono text-xs tabular-nums">${est.costPerMin.toFixed(2)} / min</span>
            </div>
          </div>
        </aside>
      </div>
      </div>
    </main>
  )
}
