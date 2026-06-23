"use client"

import * as React from "react"
import Link from "next/link"
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
  ArrowLeft,
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
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { GoLiveHome } from "@/components/go-live-home"
import { cn } from "@/lib/utils"
import { track, Events, markBuildStart } from "@/lib/analytics"
import { STACK_PRESETS, STACK_ESTIMATE, type StackPreset } from "@/lib/campaign-data"

// ─── data ────────────────────────────────────────────────────────────────────

type Template = {
  id: string
  name: string
  description: string
  llm: string
  asr: string
  tts: string
}

const TEMPLATES: Template[] = [
  // Blank goes first — most users won't use a template, they'll start from
  // scratch. Templates are sales-led; blank is product-led.
  { id: "blank",                name: "Blank agent",           description: "Start from scratch. Define your own prompt, voice, and tools.", llm: "Open AI",   asr: "DeepGram", tts: "ElevenLabs" },
  { id: "appointment-reminder", name: "Appointment Reminder", description: "Automatically call customers to remind them of upcoming appointments", llm: "Open AI", asr: "DeepGram", tts: "ElevenLabs" },
  { id: "nps-survey",           name: "NPS Survey",            description: "Gather customer feedback through voice surveys",                       llm: "Open AI",   asr: "DeepGram", tts: "ElevenLabs" },
  { id: "ivr",                  name: "Interactive Voice Response (IVR)", description: "Route callers to the right department automatically",       llm: "Anthropic", asr: "DeepGram", tts: "ElevenLabs" },
  { id: "payment-reminder",     name: "Payment Reminder",      description: "Follow up with customers about pending payments",                      llm: "Open AI",   asr: "DeepGram", tts: "ElevenLabs" },
  { id: "ecommerce",            name: "Customer service for e-commerce", description: "Triage support and refund requests for online retail",        llm: "Open AI",   asr: "DeepGram", tts: "ElevenLabs" },
]

// Each agent owns ONE channel (2026-06-23 model; duplicate to add another) and
// one stack preset (the cost-vs-speed dimension). channelType drives the filter.
type AgentChannel = "phone" | "whatsapp" | "web" | "batch" | "code" | "none"

const AGENTS: {
  id: string; name: string; description: string; status: string
  channelType: AgentChannel; channelLabel: string; stack: StackPreset; calls: number; lastModified: string
}[] = [
  { id: "agt_default", name: "Aria",            description: "Your auto-provisioned default — live and ready", status: "live",   channelType: "phone",    channelLabel: "+1 (628) 555-0188", stack: "balanced", calls: 42,    lastModified: "Provisioned for you" },
  { id: "agt_01", name: "Support Bot v2",       description: "Handles tier-1 support queries via phone",       status: "live",   channelType: "phone",    channelLabel: "+1 (415) 555-0101", stack: "fastest",  calls: 12430, lastModified: "2 hours ago" },
  { id: "agt_03", name: "Appointment Setter",   description: "Schedules appointments and sends confirmations", status: "live",   channelType: "whatsapp", channelLabel: "Acme WhatsApp",     stack: "balanced", calls: 3270,  lastModified: "5 min ago" },
  { id: "agt_05", name: "Survey Bot",           description: "Post-interaction CSAT surveys",                  status: "live",   channelType: "web",      channelLabel: "acme.com/help",     stack: "cheapest", calls: 5601,  lastModified: "1 day ago" },
  { id: "agt_02", name: "Sales Qualifier",      description: "Qualifies inbound leads before transfer",        status: "draft",  channelType: "none",     channelLabel: "Not deployed",      stack: "balanced", calls: 0,     lastModified: "Yesterday" },
  { id: "agt_04", name: "Collections Outreach", description: "Outbound debt collection",                       status: "paused", channelType: "batch",    channelLabel: "Q2 Collections",    stack: "cheapest", calls: 891,   lastModified: "3 days ago" },
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
    <button
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border bg-card px-4 py-4 text-left transition-all",
        isSelected
          ? "border-primary/60 shadow-sm ring-1 ring-primary/30"
          : "hover:border-foreground/20 hover:bg-accent/30",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{tpl.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
        </div>
        {isSelected && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onTest()
              }}
            >
              Test
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1" asChild>
              <Link
                href={`/agents/${tpl.id}/edit`}
                onClick={(e) => e.stopPropagation()}
              >
                Start from this
                <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </button>
  )
}

// ─── first-run gallery view ──────────────────────────────────────────────────

function FirstRunView() {
  // First-run IS the Aria believe-then-scale home (2026-06-23). The old
  // "Pre-built by Agora" template picker is gone; templates now live in the
  // Browse-templates sheet (header action). GoLiveHome owns its own state.
  return <GoLiveHome />
}

// ─── returning-user list view ────────────────────────────────────────────────

function ListView({ onBrowseTemplates }: { onBrowseTemplates: () => void }) {
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState<"all" | AgentStatus>("all")
  const [pageSize, setPageSize] = React.useState(10)
  const [page, setPage] = React.useState(1)

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return AGENTS.filter((a) => {
      if (status !== "all" && a.status !== status) return false
      if (q && !a.name.toLowerCase().includes(q) && !a.id.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, status])

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
          {STATUS_FILTERS.map((f) => {
            const active = status === f.id
            const count = f.id === "all" ? AGENTS.length : AGENTS.filter((a) => a.status === f.id).length
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatus(f.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label} <span className="tabular-nums opacity-60">{count}</span>
              </button>
            )
          })}
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
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{agent.id}</TableCell>
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
                            <Link href={`/agents/${agent.id}/edit#deployment`}>Deploy</Link>
                          </DropdownMenuItem>
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
          <SelectTrigger className="h-8 w-18"><SelectValue /></SelectTrigger>
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

export default function AgentsPage() {
  // The Agents home is the entry of the build→deploy journey — stamp the start so
  // the wizard can report time-to-live (the <3-min deploy spine).
  React.useEffect(() => { markBuildStart() }, [])

  // Wireframe toggle — in production this is "do we have agents in this project?"
  const [showFirstRun, setShowFirstRun] = React.useState(false)
  const [templatesOpen, setTemplatesOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState("appointment-reminder")
  const selected = TEMPLATES.find((t) => t.id === selectedId)!

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader
        // First-run renders GoLiveHome (its own "Deploy an AI agent in minutes"
        // headline), so suppress the page title here to avoid a double H1.
        title={showFirstRun ? undefined : "Agents"}
        description={showFirstRun ? undefined : "Create and manage your agents here."}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground"
              onClick={() => setShowFirstRun((v) => !v)}
              title="Demo toggle: switch between first-run and returning-user views"
            >
              {showFirstRun ? (
                <>
                  <ArrowLeft className="h-3 w-3" /> View list
                </>
              ) : (
                <>View first-run</>
              )}
            </Button>
            {showFirstRun && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setTemplatesOpen(true)}
              >
                <Library className="h-4 w-4" /> Browse templates
              </Button>
            )}
            <ImportAgentSheet>
              <Button variant="outline" className="gap-1.5">
                <Upload className="h-4 w-4" /> Import Agent
              </Button>
            </ImportAgentSheet>
            <Button asChild>
              <Link href="/agents/new/edit">
                <Plus className="h-4 w-4" /> Create New Agent
              </Link>
            </Button>
          </div>
        }
      />

      {showFirstRun ? (
        <FirstRunView />
      ) : (
        <ListView onBrowseTemplates={() => setTemplatesOpen(true)} />
      )}

      {/* Templates sheet — returning users browse without leaving the list */}
      <Sheet open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Browse Templates</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Pre-built agents you can deploy in minutes. Pick one to test or customize.
            </p>
          </SheetHeader>
          <div className="px-6 pb-6 space-y-2">
            {TEMPLATES.map((tpl) => (
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
