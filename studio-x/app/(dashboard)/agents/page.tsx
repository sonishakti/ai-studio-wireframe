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

const AGENTS = [
  { id: "agt_01", name: "Support Bot v2",      description: "Handles tier-1 support queries via phone", status: "live",   model: "gpt-4o",            calls: 12430, lastModified: "2 hours ago" },
  { id: "agt_03", name: "Appointment Setter",  description: "Schedules appointments and sends confirmations", status: "live",   model: "gpt-4o-mini",       calls: 3270,  lastModified: "5 min ago" },
  { id: "agt_05", name: "Survey Bot",          description: "Post-interaction CSAT surveys",          status: "live",   model: "gpt-4o-mini",       calls: 5601,  lastModified: "1 day ago" },
  { id: "agt_02", name: "Sales Qualifier",     description: "Qualifies inbound leads before transfer", status: "draft",  model: "claude-3-5-sonnet", calls: 0,     lastModified: "Yesterday" },
  { id: "agt_04", name: "Collections Outreach",description: "Outbound debt collection",               status: "paused", model: "gpt-4o",            calls: 891,   lastModified: "3 days ago" },
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
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search agents…" className="pl-8 h-8 text-sm" />
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Filter className="h-3.5 w-3.5" /> Filter
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 ml-auto"
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
                <TableHead className="w-[280px]">Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Total Calls</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="w-[48px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {AGENTS.map((agent) => (
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
                    <Badge variant={STATUS_VARIANT[agent.status] ?? "secondary"}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {agent.model}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {agent.calls.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {agent.lastModified}
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
              ))}
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
          showFirstRun ? "Deploy your first AI agent in minutes" : "Agents"
        }
        description={
          showFirstRun
            ? "Import your agent or start with a pre-built template."
            : "5 agents · click any row to edit."
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
