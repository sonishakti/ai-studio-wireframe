"use client"

import * as React from "react"
import Link from "next/link"
import {
  Bot,
  Plus,
  Upload,
  ChevronRight,
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
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { AgentTestPanel } from "@/components/agent-test-panel"
import { cn } from "@/lib/utils"
import { track, Events } from "@/lib/analytics"
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

const CHANNEL_FILTERS: { id: "all" | AgentChannel; label: string }[] = [
  { id: "all", label: "All" },
  { id: "phone", label: "Phone" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "web", label: "Web" },
  { id: "batch", label: "Batch" },
  { id: "code", label: "Code" },
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
  const [selectedId, setSelectedId] = React.useState("ivr")
  const selected = TEMPLATES.find((t) => t.id === selectedId)!

  React.useEffect(() => {
    track(Events.agent_template_browsed)
  }, [])

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left: section header + template list */}
      <main className="flex-1 p-6 overflow-y-auto min-w-0">
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Pre-built by Agora</span>
          <span className="text-xs text-muted-foreground ml-1">— a starting point, never a lock-in. Change persona and stack anytime.</span>
        </div>
        <div className="space-y-2 max-w-3xl">
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
      </main>

      {/* Right: agent test panel (matches editor) */}
      <AgentTestPanel
        title={selected.name}
        state="Agent Disconnected"
        spec={{
          llm: selected.llm,
          asr: selected.asr,
          tts: selected.tts,
          latencyMs: null,
          ttftMs: null,
        }}
        onTest={() =>
          track(Events.agent_test_started, {
            template_id: selected.id,
            agent_id: "preview",
          })
        }
      />
    </div>
  )
}

// ─── returning-user list view ────────────────────────────────────────────────

function ListView({ onBrowseTemplates }: { onBrowseTemplates: () => void }) {
  const [channel, setChannel] = React.useState<"all" | AgentChannel>("all")
  const rows = channel === "all" ? AGENTS : AGENTS.filter((a) => a.channelType === channel)

  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search agents…" className="pl-8 h-8 text-sm" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 ml-auto"
          onClick={onBrowseTemplates}
        >
          <Library className="h-3.5 w-3.5" /> Browse templates
        </Button>
      </div>

      {/* Channel filter — same behavior as Integrations › Channels */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {CHANNEL_FILTERS.map((f) => {
          const active = channel === f.id
          const count = f.id === "all" ? AGENTS.length : AGENTS.filter((a) => a.channelType === f.id).length
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setChannel(f.id)}
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[260px]">Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Stack</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Calls</TableHead>
                <TableHead className="w-[48px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((agent) => {
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
                          <Link
                            href={`/agents/${agent.id}/edit`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {agent.name}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
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
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[agent.status] ?? "secondary"}>
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
                          <DropdownMenuItem>Deploy</DropdownMenuItem>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  // Wireframe toggle — in production this is "do we have agents in this project?"
  const [showFirstRun, setShowFirstRun] = React.useState(false)
  const [templatesOpen, setTemplatesOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState("appointment-reminder")
  const selected = TEMPLATES.find((t) => t.id === selectedId)!

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader
        title={
          showFirstRun ? "Deploy an AI agent in minutes" : "My Agents"
        }
        description={
          showFirstRun
            ? "Import your agent or start with a pre-built template."
            : "Your agents — click any row to edit."
        }
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
            <ImportAgentSheet>
              <Button variant="outline" className="gap-1.5">
                <Upload className="h-4 w-4" /> Import Agent
              </Button>
            </ImportAgentSheet>
            <Button asChild>
              <Link href="/agents/new/edit">
                <Plus className="h-4 w-4" /> Create Blank Agent
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
