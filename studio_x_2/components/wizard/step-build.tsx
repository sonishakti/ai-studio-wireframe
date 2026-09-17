"use client"

import * as React from "react"
import {
  BookOpen, Plug, Boxes, Plus, X, Check, ChevronLeft, Search, Wrench,
  Upload, Settings2, MoreVertical, Trash2, ArrowUpRight, AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CONNECTORS, KNOWLEDGE_BASES, MCP_SERVERS,
  type KnowledgeBase, type McpServer,
} from "@/lib/campaign-data"
import {
  allKnowledgeBases, createKnowledgeBase, KB_INGEST_LABEL, type KbIngest,
  allMcpServers, createMcpServer, getUserMcpServer, saveMcpTools, deleteMcpServer,
  type McpTool,
  effectiveConnectorStatus,
} from "@/lib/agent-resources"
import {
  allTools, getTool, getToolCheck, saveToolCheck, runCheck, deleteTool, checkLabel,
  toolCount, usedByAgents, hasConnectorAttached, TOOL_CEILING, TOOL_SEEDS,
  type AgentTool, type ToolCheck,
} from "@/lib/agent-tools"
import { ToolCreateForm, ToolCheckResult, ToolStateChip } from "@/components/wizard/tool-create-form"
import { ExternalRetrievalForm } from "@/components/external-retrieval-form"
import type { StepProps } from "@/components/wizard/types"
import { SectionRow } from "@/components/wizard/section-row"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

/**
 * Section 5 — Knowledge & Tools (v3 IA, 2026-07-17: Customize — only if
 * needed). The prompt + greeting moved to the Prompt section; this holds what
 * the agent KNOWS and can ACT with: knowledge bases, conversation history
 * (working memory), MCP servers, connectors — attached inline via Sheets
 * ("manage in Resources" without navigating away) — plus the BYOK
 * vendor-credentials cross-link (Execution Runtime reduced to one row).
 */
export function SectionKnowledgeTools({ draft, update }: StepProps) {
  // Created KBs / MCP servers / tools live in localStorage — seed with the
  // canonical catalog (matches SSR), then load the user's customs after mount.
  // `refresh` reloads all of them after a create/delete/test. Same idiom as
  // step-voice's allVoices().
  const [kbs, setKbs] = React.useState<KnowledgeBase[]>(KNOWLEDGE_BASES)
  const [mcps, setMcps] = React.useState<McpServer[]>(MCP_SERVERS)
  const [tools, setTools] = React.useState<AgentTool[]>(TOOL_SEEDS)
  // Test results, read once after mount rather than per row in render: a
  // localStorage read during render answers differently on the server and on
  // the first client pass, which is a hydration mismatch.
  const [checks, setChecks] = React.useState<Record<string, ToolCheck>>({})
  const refresh = React.useCallback(() => {
    const mcpList = allMcpServers()
    const toolList = allTools()
    setKbs(allKnowledgeBases())
    setMcps(mcpList)
    setTools(toolList)
    const next: Record<string, ToolCheck> = {}
    for (const id of [...toolList.map((t) => t.id), ...mcpList.map((m) => m.id)]) {
      const c = getToolCheck(id)
      if (c) next[id] = c
    }
    setChecks(next)
  }, [])
  // Connected-connector state is localStorage too, so it is read after mount
  // for the same reason the checks are.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { refresh(); setMounted(true) }, [refresh])
  // Which user MCP server's tools are being configured (F3).
  const [configMcp, setConfigMcp] = React.useState<string | null>(null)

  // One test the user ran, against the record the row already holds.
  const testTool = (id: string) => {
    const t = getTool(id)
    if (!t) return
    saveToolCheck(id, runCheck({ url: t.url, method: t.method, body: t.bodyTemplate }))
    refresh()
  }
  const testMcp = (id: string) => {
    const s = mcps.find((x) => x.id === id)
    if (!s) return
    saveToolCheck(id, runCheck({ url: s.url }))
    refresh()
  }

  // A realtime agent runs a single multimodal model: the Engine gives it MCP
  // servers and neither custom tools nor connectors, so the row says so rather
  // than offering a door that ships nothing (ng-console agent-detail-page).
  const realtime = draft.stack.pipeline === "mllm"

  // Three kinds in one roster, each carrying only fields its record holds: an
  // HTTP tool shows its method and host, a connector its category and whether
  // the project connected it, and hosted code its refusal.
  const toolItems: AttachItem[] = [
    ...tools.map((t) => ({
      id: t.id,
      name: t.fn.name || t.name,
      meta: [
        `${t.method} ${hostOf(t.url)}`,
        usedByAgents(t.id) > 1 ? `Used by ${usedByAgents(t.id)} agents` : null,
      ].filter(Boolean).join(" · "),
      disabled: t.status === "unavailable",
      note: t.status === "unavailable" ? "Unavailable" : undefined,
      // Seeds belong to the catalog; only what this browser made can be deleted.
      config: !TOOL_SEEDS.some((s) => s.id === t.id),
      check: checks[t.id],
      testable: true,
    })),
    ...CONNECTORS.map((c) => {
      const s = mounted ? effectiveConnectorStatus(c) : "available"
      return {
        id: c.id,
        name: c.name,
        meta: c.category,
        status: s === "connected" ? ("active" as const) : undefined,
        disabled: s !== "connected",
        note: s === "connected" ? undefined : "Connect in Resources",
      }
    }),
    // A real state with a real reason: `function.execution.mode` has the single
    // value "sync" with `server` required, so there is nothing to run customer
    // code on yet.
    { id: "tool_code", name: "Hosted code", meta: "JavaScript we run for you", disabled: true, note: "Not available yet" },
  ]

  return (
    // [label | content] rows (owner 2026-07-21): each resource names itself on
    // the LHS; the host's <SectionRows> owns the container.
    <>
        <SectionRow id="wz-5-kb" label="Knowledge base">
          <ResourceField
            hideHeader
            icon={BookOpen}
            title="Add Knowledge Base"
            description="Ground answers in your docs."
            emptyTitle="No knowledge base added"
            emptyDesc="Create new or add an existing one"
            items={kbs.map((k) => ({
              id: k.id,
              name: k.name,
              meta: k.size ?? (k.status === "ready" ? `${k.chunks} chunks` : "Indexing…"),
              status: k.status === "ready" ? ("active" as const) : ("processing" as const),
            }))}
            selectedIds={draft.knowledge}
            onChange={(knowledge) => update({ knowledge })}
            manageLabel="Add Knowledge base"
            create={{
              label: "Create New Knowledge Base",
              render: (onCreated) => <KnowledgeCreateForm onCreated={onCreated} />,
              onCreated: refresh,
            }}
          />
        </SectionRow>

        <SectionRow id="wz-5-mcp" label="MCP servers">
          <ResourceField
            hideHeader
            icon={Plug}
            title="Add MCP Servers"
            description="Give it tools: CRM, calendar, APIs."
            emptyTitle="No MCP servers added"
            emptyDesc="Create new or add an existing one"
            items={mcps.map((m) => ({
              id: m.id,
              name: m.name,
              meta: `${m.tools} tools`,
              config: mounted && !!getUserMcpServer(m.id),
              // The MCP row is the one that keeps a last-checked line:
              // GET /mcp/{id}/status returns lastDetectedAt, and the
              // custom-tool envelope has no equivalent.
              check: checks[m.id],
              checkedAt: checks[m.id]?.at,
              testable: true,
            }))}
            selectedIds={draft.mcp}
            onChange={(mcp) => update({ mcp })}
            manageLabel="Add MCP server"
            create={{
              label: "Create New MCP Server",
              render: (onCreated) => <McpCreateForm onCreated={onCreated} />,
              onCreated: refresh,
            }}
            onTest={testMcp}
            onConfigure={(id) => setConfigMcp(id)}
            onDelete={(id) => { deleteMcpServer(id); update({ mcp: draft.mcp.filter((x) => x !== id) }); refresh() }}
          />
        </SectionRow>

        {/* Tools — the fourth ResourceField (19). Chips, a sheet with search,
            a staged switch per row and a Save footer, exactly like the two rows
            above it, holding HTTP tools, the connectors the project connected
            and a hosted-code row that states why it is not available. */}
        <SectionRow id="wz-5-tools" focusId="tools" label="Tools">
          {realtime ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Realtime agents can use MCP servers only.</p>
                <p className="text-xs text-muted-foreground">Add one in the row above.</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5" disabled>
                <Plus className="h-3.5 w-3.5" /> Add tool
              </Button>
            </div>
          ) : (
            <ResourceField
              hideHeader
              icon={Wrench}
              title="Add tools"
              description="Let the agent act on your systems."
              emptyTitle="No tools added"
              emptyDesc="Create new or add an existing one"
              manageLabel="Add tool"
              items={toolItems}
              selectedIds={draft.tools}
              onChange={(tools) => update({ tools })}
              onTest={testTool}
              onDelete={(id) => { deleteTool(id); update({ tools: draft.tools.filter((x) => x !== id) }); refresh() }}
              create={{
                label: "Create new tool",
                render: (onCreated) => <ToolCreateForm onCreated={onCreated} />,
                onCreated: refresh,
                // The raw body IS the diagnosis: swapping back to the roster on
                // create would throw away the only thing that says why.
                stayAfterCreate: true,
              }}
              footer={<ToolCeiling draft={draft} servers={mcps} />}
            />
          )}
        </SectionRow>

      {/* Configure-tools sheet for a created MCP server (F3). */}
      <McpToolsSheet id={configMcp} onClose={() => setConfigMcp(null)} onSaved={refresh} />
    </>
  )
}


/** The host, without throwing on a URL that carries a placeholder in its path. */
function hostOf(url: string): string {
  try { return new URL(url).host } catch { return url }
}

/**
 * What the agent can call, against what the Engine accepts. An HTTP tool is
 * one; an MCP server is however many it exposes. A connector adds nothing to
 * the number, because no connector record holds a tool count, and the second
 * sentence says so rather than letting the reader assume the number is whole.
 */
function ToolCeiling({ draft, servers }: { draft: { tools: string[]; mcp: string[] }; servers: McpServer[] }) {
  const n = toolCount(draft, servers)
  if (n > TOOL_CEILING) {
    return (
      <p className="text-xs text-destructive">
        The agent can use {TOOL_CEILING} tools. Remove {n - TOOL_CEILING}.
      </p>
    )
  }
  return (
    <p className="text-xs text-muted-foreground">
      {n} of {TOOL_CEILING} tools attached{hasConnectorAttached(draft) ? ". Connector tools are not counted yet." : ""}
    </p>
  )
}

// ─── Resource field — chips + a Sheet that ATTACHES existing and CREATES new ───

interface AttachItem {
  id: string
  name: string
  meta: string
  /** Not attachable yet (e.g. a connector that isn't connected). */
  disabled?: boolean
  /** Short reason shown when disabled ("Coming soon" / "Connect in Resources"). */
  note?: string
  /** User-created item that carries a per-row menu (configure / delete). */
  config?: boolean
  /** Figma 2932-86261: Active vs Processing badge in the attach sheet. */
  status?: "active" | "processing"
  /** The last test the user ran on this row, if any (19). */
  check?: ToolCheck
  /** Rendered as "Checked 2 days ago" — only where the contract carries a
   *  last-checked time, which today is the MCP status endpoint alone. */
  checkedAt?: number
  /** This row can be probed, so it carries a state and a Test door. Keeps both
   *  off connectors and off the code row, where nothing probes. */
  testable?: boolean
}

interface CreateSlot {
  label: string
  render: (onCreated: (id: string) => void) => React.ReactNode
  onCreated?: () => void
  /** Hold the create body open after the first create, so the result the form
   *  just produced is still on screen (19). */
  stayAfterCreate?: boolean
}

function ResourceField({
  icon: Icon,
  title,
  description,
  emptyTitle,
  emptyDesc,
  items,
  selectedIds,
  onChange,
  manageLabel,
  create,
  onConfigure,
  onDelete,
  onTest,
  footer,
  hideHeader,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  /** [label | content] hosting (2026-07-21): the row label carries the
   *  title/description — skip the in-card header. */
  hideHeader?: boolean
  /** Figma empty-state card copy ("No knowledge base added" / "Create new or
   *  add an existing one"). */
  emptyTitle?: string
  emptyDesc?: string
  items: AttachItem[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  manageLabel: string
  create?: CreateSlot
  onConfigure?: (id: string) => void
  onDelete?: (id: string) => void
  /** Run this row's test. Looked up by id at the call site, so ResourceField
   *  never has to know what a tool or an MCP server is (19). */
  onTest?: (id: string) => void
  footer?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<"list" | "create">("list")
  const [query, setQuery] = React.useState("")
  // Staged selection (Figma: toggles + a Save footer) — applied on Save, so
  // half-flipped switches don't ship if the sheet is dismissed.
  const [pending, setPending] = React.useState<string[]>(selectedIds)
  const selected = items.filter((i) => selectedIds.includes(i.id))
  const togglePending = (id: string, on: boolean) =>
    setPending((p) => (on ? [...new Set([...p, id])] : p.filter((x) => x !== id)))

  // Reset to the list whenever the sheet opens/closes.
  const setSheet = (o: boolean) => {
    setOpen(o)
    if (o) { setPending(selectedIds); setQuery("") }
    if (!o) setView("list")
  }
  const save = () => {
    onChange(pending)
    setOpen(false)
  }
  const handleCreated = (id: string) => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id])
    setPending((p) => [...new Set([...p, id])])
    create?.onCreated?.()
    if (!create?.stayAfterCreate) setView("list")
    toast.success("Added and attached", { description: `Created and attached.` })
  }

  const visible = items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <section className={cn("space-y-3", !hideHeader && "rounded-lg border border-border bg-card p-4")}>
      {!hideHeader && (
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((i) => (
            // An attached item that's since become unavailable (e.g. a connector
            // disconnected in Resources) is flagged, not shown as healthy — so it
            // can't silently ship in the deployed config (audit 2026-07-07).
            <Badge
              key={i.id}
              variant={i.disabled || (i.check && !i.check.ok) ? "outline" : "secondary"}
              className={cn(
                "gap-1 pr-1 font-normal",
                i.disabled && "border-destructive/40 text-destructive",
                // An attached tool that has never answered must not look
                // identical to one that has (19).
                !i.disabled && i.check && !i.check.ok && "border-destructive/40 text-destructive",
                !i.disabled && i.testable && !i.check && "bg-warning/15 text-warning",
              )}
              title={i.disabled ? "No longer connected · reconnect in Resources or remove it" : undefined}
            >
              {(i.disabled || (i.check && !i.check.ok)) && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
              {i.testable ? `${i.name} · ${checkLabel(i.check)}` : i.name}
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter((x) => x !== i.id))}
                aria-label={`Remove ${i.name}`}
                className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setSheet}>
        {selected.length === 0 && emptyTitle ? (
          /* Figma 2867-53592: the empty state IS the row — copy card + door. */
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{emptyTitle}</p>
              <p className="text-xs text-muted-foreground">{emptyDesc}</p>
            </div>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> {manageLabel}
              </Button>
            </SheetTrigger>
          </div>
        ) : (
          <SheetTrigger asChild>
            <Button
              variant={hideHeader ? "ghost" : "outline"}
              size="sm"
              className={cn("gap-1.5", hideHeader ? "text-muted-foreground" : "w-full")}
            >
              <Plus className="h-3.5 w-3.5" /> {manageLabel}
            </Button>
          </SheetTrigger>
        )}
        <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
          {view === "create" && create ? (
            <>
              <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="mb-1 inline-flex items-center gap-1 rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Back
                </button>
                <SheetTitle>{create.label}</SheetTitle>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                {create.render(handleCreated)}
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
                <SheetTitle>{title}</SheetTitle>
                <SheetDescription className="sr-only">Attach to this agent, or create a new one.</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {/* Figma 2932-86261: search first, then the roster. */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name…"
                    className="pl-8 text-sm"
                    aria-label={`Search ${title}`}
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="flex items-baseline justify-between border-b border-border bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground">
                    <span>Name</span>
                    <span className="pr-11">Status</span>
                  </div>
                  <ul className="divide-y divide-border">
                    {visible.map((i) => {
                      const on = pending.includes(i.id)
                      return (
                        <li key={i.id} className={cn("flex items-center gap-3 px-3.5 py-2.5", i.disabled && "opacity-70")}>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{i.name}</p>
                            <p className="text-xs text-muted-foreground">{i.meta}</p>
                          </div>
                          {i.status && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "shrink-0 text-xs",
                                i.status === "active" ? "bg-success/15 text-success" : "text-muted-foreground",
                              )}
                            >
                              {i.status === "active" ? "Active" : "Processing"}
                            </Badge>
                          )}
                          {/* The state the user produced, on the row it belongs
                              to rather than behind an overflow menu (19). */}
                          {(i.check || i.testable) && <ToolStateChip check={i.check} checkedAt={i.checkedAt} />}
                          {onTest && i.testable && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              onClick={() => onTest(i.id)}
                            >
                              {i.check ? "Test again" : "Run test"}
                            </Button>
                          )}
                          {i.note && <span className="shrink-0 text-xs text-muted-foreground">{i.note}</span>}
                          {!i.disabled && (
                            <Switch
                              checked={on}
                              disabled={i.status === "processing" && !on}
                              onCheckedChange={(v) => togglePending(i.id, v)}
                              aria-label={`Attach ${i.name}`}
                            />
                          )}
                          {i.config && (onConfigure || onDelete) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" aria-label={`${i.name} options`}>
                                  <MoreVertical className="h-4 w-4" aria-hidden />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {onConfigure && (
                                  <DropdownMenuItem onSelect={() => { onConfigure(i.id); setSheet(false) }}>
                                    <Settings2 className="h-4 w-4" aria-hidden /> Configure tools
                                  </DropdownMenuItem>
                                )}
                                {onDelete && (
                                  <DropdownMenuItem variant="destructive" onSelect={() => onDelete(i.id)}>
                                    <Trash2 className="h-4 w-4" aria-hidden /> Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  {visible.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {query ? "No matches." : "Nothing here yet."}
                    </p>
                  )}
                </div>

                {/* Create-new sits UNDER the roster (Figma). */}
                {create && (
                  <button
                    type="button"
                    onClick={() => setView("create")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3.5 py-3 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus className="h-4 w-4 text-muted-foreground" aria-hidden /> {create.label}
                  </button>
                )}
              </div>
              {footer && <div className="shrink-0 border-t border-border px-5 py-3">{footer}</div>}
              <div className="shrink-0 border-t border-border px-5 py-3">
                <Button className="w-full" onClick={save}>Save</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}

// ─── Create forms (rendered inside the ResourceField sheet) ────────────────────

/** The source picker, shared by both bodies so switching to (or away from) the
 *  external-index flow is one click rather than a dead end. */
function IngestPicker({
  ingest, setIngest,
}: {
  ingest: KbIngest
  setIngest: (k: KbIngest) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">Source</Label>
      <ToggleGroup
        type="single"
        value={ingest}
        onValueChange={(v) => v && setIngest(v as KbIngest)}
        className="grid grid-cols-1 gap-2"
        aria-label="Ingest type"
      >
        {(Object.keys(KB_INGEST_LABEL) as KbIngest[]).map((k) => (
          <ToggleGroupItem
            key={k}
            value={k}
            className="justify-start rounded-lg border border-border px-3 py-2.5 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-foreground"
          >
            {KB_INGEST_LABEL[k]}
            {k === "external" && (
              <span className="ml-auto text-xs text-muted-foreground">Advanced</span>
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

export function KnowledgeCreateForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = React.useState("")
  const [ingest, setIngest] = React.useState<KbIngest>("pdf")
  const [fileName, setFileName] = React.useState("")

  // "Connect an existing vector index" is a different job with a different
  // shape (credentials → resource path → test retrieval), so it swaps the body
  // rather than bolting eight more fields onto the upload form. It is also
  // NOT a peer tile beside "Upload PDF" — a first-time builder who doesn't
  // know what a vector store is should never feel behind for skipping it.
  if (ingest === "external") {
    return (
      <div className="space-y-5">
        <IngestPicker ingest={ingest} setIngest={setIngest} />
        <ExternalRetrievalForm
          onCreated={({ name: n, externalSource }) =>
            onCreated(createKnowledgeBase({ name: n, ingest: "external", externalSource }).id)
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="kb-name" className="text-sm font-medium">Name</Label>
        <Input id="kb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Product docs" />
      </div>
      <IngestPicker ingest={ingest} setIngest={setIngest} />
      {/* Mock file drop — no real upload (wireframe). Typing a name stands in. */}
      <div className="space-y-1.5">
        <Label htmlFor="kb-file" className="text-sm font-medium">File or URL</Label>
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          <Upload className="h-4 w-4 shrink-0" aria-hidden />
          <Input
            id="kb-file"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder={ingest === "website" ? "https://docs.example.com" : "docs.pdf"}
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
      <Button
        className="w-full"
        disabled={!name.trim()}
        onClick={() => onCreated(createKnowledgeBase({ name, ingest, fileName }).id)}
      >
        Create knowledge base
      </Button>
    </div>
  )
}

export function McpCreateForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [headers, setHeaders] = React.useState<{ key: string; value: string }[]>([{ key: "", value: "" }])
  const setHeader = (idx: number, patch: Partial<{ key: string; value: string }>) =>
    setHeaders((hs) => hs.map((h, i) => (i === idx ? { ...h, ...patch } : h)))
  // Enforces the rule the error line beneath it has always stated.
  const validUrl = /^https:\/\/.+/.test(url.trim())
  const [createdId, setCreatedId] = React.useState<string | null>(null)
  const [check, setCheck] = React.useState<ToolCheck | undefined>(undefined)
  const createAndTest = () => {
    // `llm.mcp_servers[].transport` takes streamable_http only, so there is
    // nothing here for the user to pick: a single-option picker would be a
    // control for what Agora does by default.
    const id = createdId ?? createMcpServer({ name, url, transport: "http", headers }).id
    const result = runCheck({ url })
    saveToolCheck(id, result)
    setCheck(result)
    if (!createdId) {
      setCreatedId(id)
      onCreated(id)
    }
  }
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="mcp-name" className="text-sm font-medium">Name</Label>
        <Input id="mcp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme CRM" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mcp-url" className="text-sm font-medium">Server URL</Label>
        <Input id="mcp-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://mcp.example.com" />
        {url.trim() && !validUrl && <p className="text-xs text-destructive">Enter a valid https URL.</p>}
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">HTTP headers</Label>
        <div className="space-y-2">
          {headers.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={h.key} onChange={(e) => setHeader(i, { key: e.target.value })} placeholder="Authorization" className="text-sm" />
              <Input value={h.value} onChange={(e) => setHeader(i, { value: e.target.value })} placeholder="Bearer …" className="text-sm" />
              <Button
                variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground"
                aria-label="Remove header"
                onClick={() => setHeaders((hs) => hs.filter((_, x) => x !== i))}
                disabled={headers.length === 1}
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setHeaders((hs) => [...hs, { key: "", value: "" }])}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add header
          </Button>
        </div>
      </div>
      <Button className="w-full" disabled={!name.trim() || !validUrl} onClick={createAndTest}>
        {createdId ? "Test again" : "Create and test"}
      </Button>
      <ToolCheckResult check={check} />
    </div>
  )
}

// ─── Configure-tools sheet for a created MCP server ────────────────────────────

export function McpToolsSheet({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const server = id ? getUserMcpServer(id) : undefined
  const [tools, setTools] = React.useState<McpTool[]>([])
  React.useEffect(() => { setTools(server?.toolList ?? []) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const flip = (toolId: string) => setTools((ts) => ts.map((t) => (t.id === toolId ? { ...t, enabled: !t.enabled } : t)))
  const save = () => {
    if (id) saveMcpTools(id, tools)
    onSaved()
    onClose()
    toast.success("Tools updated")
  }
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle>Configure tools</SheetTitle>
          <SheetDescription>{server?.name ?? "MCP server"}. Turn each tool on or off.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
          {tools.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <Switch checked={t.enabled} onCheckedChange={() => flip(t.id)} aria-label={`Enable ${t.name}`} />
            </div>
          ))}
          {tools.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No tools discovered.</p>}
        </div>
        <div className="shrink-0 border-t border-border px-5 py-3">
          <Button className="w-full" onClick={save}>Save tools</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
