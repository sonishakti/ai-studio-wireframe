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
import { ProvisioningCeremony } from "@/components/provisioning-ceremony"
import { isProvisioned, markProvisioned, resetProvisioned } from "@/lib/journey-progress"
import { cn } from "@/lib/utils"
import { track, Events, markBuildStart } from "@/lib/analytics"
import { STACK_PRESETS, STACK_ESTIMATE, AGENT_TEMPLATES, type StackPreset, type ImportedAgentConfig } from "@/lib/campaign-data"
import { newVoiceId, saveVoiceArtifact } from "@/lib/voice-artifacts"
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

const AGENTS: {
  id: string; name: string; description: string; status: string
  channelType: AgentChannel; channelLabel: string; stack: StackPreset; calls: number; lastModified: string
}[] = [
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
          {/* The stack is a feature, not fine print — name what it runs on. */}
          {tpl.id !== "blank" && (
            <p className="text-xs text-muted-foreground/80 mt-1 font-mono">
              {tpl.llm} · {tpl.asr} · {tpl.tts}
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
  const [agents, setAgents] = React.useState(AGENTS)

  const togglePause = (id: string) => {
    setAgents((rows) =>
      rows.map((a) => {
        if (a.id !== id) return a
        const paused = a.status === "live"
        toast(paused ? `${a.name} paused` : `${a.name} is live again`, {
          description: paused
            ? "It stops taking new calls until you resume it. Calls in progress finish normally."
            : `Answering on ${a.channelLabel} again.`,
        })
        return { ...a, status: paused ? "paused" : "live" }
      }),
    )
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
              const count = f.id === "all" ? AGENTS.length : AGENTS.filter((a) => a.status === f.id).length
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
                return (
                  <TableRow key={agent.id}>
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
                      <Badge variant={STATUS_VARIANT[agent.status] ?? "secondary"} className="capitalize">
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {agent.calls.toLocaleString()}
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
                            {/* ?step=5 opens the Deploy drawer — the old #deployment
                                anchor was consumed by nothing (#14). */}
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

  // The view FOLLOWS the URL (?view=list) via real navigation — Back works and
  // the segmented control below always shows which surface you're on (#8).
  // "Create new agent" opens a BLANK builder inline; editing an existing agent
  // from the list is the only route jump (→ /agents/[id]/edit).
  const router = useRouter()
  const [view, setView] = React.useState<"builder" | "list">("builder")
  const [builderId, setBuilderId] = React.useState("agt_default")
  const [templatesOpen, setTemplatesOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState("appointment-reminder")

  const onParams = React.useCallback((p: URLSearchParams) => {
    setView(p.get("view") === "list" ? "list" : "builder")
    // ⌘K / deep links can open the templates sheet directly (?templates=1).
    if (p.get("templates") === "1") setTemplatesOpen(true)
    const prov = p.get("provision")
    if (prov === "1" || prov === "stall") {
      resetProvisioned()
      setStallDemo(prov === "stall")
      setPhase("ceremony")
    }
  }, [])

  React.useEffect(() => {
    if (!isProvisioned()) setPhase("ceremony")
  }, [])

  // The warming beat: the user broke the wall early, so the landing renders
  // while the remaining stages "finish" — then the Talk button flips on.
  React.useEffect(() => {
    if (phase !== "warming") return
    const t = window.setTimeout(() => setPhase("ready"), 3200)
    return () => window.clearTimeout(t)
  }, [phase])

  const finishCeremony = (skipped: boolean) => {
    markProvisioned()
    setPhase(skipped ? "warming" : "ready")
  }

  // List-view import lands somewhere VISIBLE: the same playground handoff the
  // builder banner uses (import → custom voice artifact → round-trip). The
  // user-test's top S1 was "Import as draft" toasting success while the list
  // stayed unchanged — an import must never produce nothing.
  const onListImported = (config: ImportedAgentConfig) => {
    const vid = newVoiceId()
    saveVoiceArtifact({
      id: vid, name: config.name, kind: "custom",
      tagline: config.source ? `Imported from ${config.source}` : "Imported agent",
      personality: config.systemPrompt ? config.systemPrompt.slice(0, 140) : "Imported behavior",
      tone: "Professional", language: config.language ?? "en-US",
      ttsVoice: config.voice ?? "rachel", firstMessage: config.firstMessage ?? "Hi, how can I help you today?",
      systemPrompt: config.systemPrompt, source: config.source ?? "Import",
    })
    router.push(`/agents/playground?artifact=${vid}&agent=new`)
  }

  const showList = (toList: boolean) => router.push(toList ? "/agents?view=list" : "/agents")
  const startBlank = () => {
    setBuilderId("new")
    // Blank intent travels as the `blank` PROP (the wizard remounts before the
    // push commits, so it can't read the URL). Push a CLEAN /agents: a lingering
    // ?blank=1 confused refreshes, which reset builderId to the default agent
    // (audit 2026-07-07).
    router.push("/agents")
  }
  const isBuilder = view === "builder"

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <React.Suspense fallback={null}>
        <ParamsSync onParams={onParams} />
      </React.Suspense>
      {/* Persistent mode switch — you can always SEE which of the two /agents
          surfaces you're on, and get back (#8). */}
      <div className="flex items-center justify-between border-b border-border px-6 py-2">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && showList(v === "list")}
          variant="outline"
          size="sm"
          aria-label="Agents view"
        >
          <ToggleGroupItem value="builder" className="text-xs">Builder</ToggleGroupItem>
          <ToggleGroupItem value="list" className="text-xs">All agents</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <PageHeader
        // The builder is a self-contained widget (own heading + view-all/create
        // chrome), so suppress the PageHeader in builder view — it only carries
        // the title + actions for the managed list.
        title={isBuilder ? undefined : "Agents"}
        description={isBuilder ? undefined : "Create and manage your agents here."}
        actions={
          isBuilder ? undefined : (
            <div className="flex items-center gap-2">
              {/* Same handoff as the builder banner — a success toast with no
                  visible artifact was the user-test's #1 trust break. */}
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

      {isBuilder ? (
        phase === "ceremony" ? (
          <ProvisioningCeremony
            stallDemo={stallDemo}
            onSkip={() => finishCeremony(true)}
            onDone={() => finishCeremony(false)}
          />
        ) : (
          <AgentWizard
            key={builderId}
            id={builderId}
            landing={builderId === "agt_default"}
            warming={phase === "warming" && builderId === "agt_default"}
            // Prop, not URL: startBlank remounts this in the same tick as its
            // router.push, so the mount effect can't rely on reading ?blank=1.
            blank={builderId === "new"}
            onCreateNew={builderId === "agt_default" ? startBlank : undefined}
            onBrowseTemplates={() => setTemplatesOpen(true)}
          />
        )
      ) : (
        <ListView onBrowseTemplates={() => setTemplatesOpen(true)} />
      )}

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
