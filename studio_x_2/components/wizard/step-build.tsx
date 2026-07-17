"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HistoryField } from "@/components/wizard/step-advanced"
import {
  BookOpen, Plug, Boxes, Plus, X, Check, ChevronLeft, KeyRound,
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
  MCP_TRANSPORT_LABEL, type McpTransport, type McpTool,
  effectiveConnectorStatus,
} from "@/lib/agent-resources"
import type { StepProps } from "@/components/wizard/types"

/**
 * Section 5 — Knowledge & Tools (v3 IA, 2026-07-17: Customize — only if
 * needed). The prompt + greeting moved to the Prompt section; this holds what
 * the agent KNOWS and can ACT with: knowledge bases, conversation history
 * (working memory), MCP servers, connectors — attached inline via Sheets
 * ("manage in Resources" without navigating away) — plus the BYOK
 * vendor-credentials cross-link (Execution Runtime reduced to one row).
 */
export function SectionKnowledgeTools({ draft, update }: StepProps) {
  const router = useRouter()

  // Created KBs / MCP servers live in localStorage — seed with the canonical
  // catalog (matches SSR), then load the user's customs after mount. `refresh`
  // reloads both after a create/delete. Same idiom as step-voice's allVoices().
  const [kbs, setKbs] = React.useState<KnowledgeBase[]>(KNOWLEDGE_BASES)
  const [mcps, setMcps] = React.useState<McpServer[]>(MCP_SERVERS)
  const refresh = React.useCallback(() => {
    setKbs(allKnowledgeBases())
    setMcps(allMcpServers())
  }, [])
  React.useEffect(() => { refresh() }, [refresh])
  // Which user MCP server's tools are being configured (F3).
  const [configMcp, setConfigMcp] = React.useState<string | null>(null)

  return (
    <div className="space-y-5">
      {/* No inner h2: the section header above already names this step. */}
      <p className="text-sm text-muted-foreground">
        Give {draft.name || "your agent"} docs to answer from, memory, and tools to act with.
      </p>

      <div className="max-w-3xl space-y-4">
        <div id="wz-5-kb" className="scroll-mt-28">
          <ResourceField
            icon={BookOpen}
            title="Knowledge base"
            description="Ground answers in your docs."
            items={kbs.map((k) => ({ id: k.id, name: k.name, meta: k.status === "ready" ? `${k.chunks} chunks` : "Indexing…" }))}
            selectedIds={draft.knowledge}
            onChange={(knowledge) => update({ knowledge })}
            manageLabel="Add knowledge base"
            create={{
              label: "Create knowledge base",
              render: (onCreated) => <KnowledgeCreateForm onCreated={onCreated} />,
              onCreated: refresh,
            }}
          />
        </div>

        {/* Working memory sits with knowledge (v3: Memory + Tools merged). */}
        <HistoryField
          id="wz-5-history"
          value={draft.advanced}
          onChange={(advanced) => update({ advanced })}
        />

        <div id="wz-5-mcp" className="scroll-mt-28">
          <ResourceField
            icon={Plug}
            title="MCP server"
            description="Give it tools: CRM, calendar, APIs."
            items={mcps.map((m) => ({ id: m.id, name: m.name, meta: `${m.tools} tools`, config: !!getUserMcpServer(m.id) }))}
            selectedIds={draft.mcp}
            onChange={(mcp) => update({ mcp })}
            manageLabel="Add MCP server"
            create={{
              label: "Create MCP server",
              render: (onCreated) => <McpCreateForm onCreated={onCreated} />,
              onCreated: refresh,
            }}
            onConfigure={(id) => setConfigMcp(id)}
            onDelete={(id) => { deleteMcpServer(id); update({ mcp: draft.mcp.filter((x) => x !== id) }); refresh() }}
          />
        </div>

        <div id="wz-5-connectors" className="scroll-mt-28">
          <ResourceField
            icon={Boxes}
            title="Connectors"
            description="Connect apps like HubSpot and Google Calendar."
            items={CONNECTORS.map((c) => {
              const s = effectiveConnectorStatus(c)
              return {
                id: c.id, name: c.name,
                meta: c.category,
                disabled: s !== "connected",
                note: s === "coming-soon" ? "Coming soon" : s === "available" ? "Connect in Resources" : undefined,
              }
            })}
            selectedIds={draft.connectors}
            onChange={(connectors) => update({ connectors })}
            manageLabel="Add connector"
            footer={
              <button
                type="button"
                onClick={() => router.push("/integrations?tab=connectors")}
                className="inline-flex items-center gap-1 rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Connect more in Resources <ArrowUpRight className="h-3 w-3" aria-hidden />
              </button>
            }
          />
        </div>

        {/* Runtime & credentials reduced to a cross-link (v3 rule 5): BYOK
            vendor keys are project-scoped and edited in Manage, not here. */}
        <div className="flex items-center gap-2.5 rounded-md border border-border bg-muted/30 px-3.5 py-2.5">
          <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-xs text-muted-foreground">
            Bring-your-own vendor keys (LLM · TTS · STT · telephony) live in{" "}
            <a href="/project/vendor-credentials" className="underline underline-offset-2 hover:text-foreground">
              Manage › Vendor Credentials
            </a>
            . The model stack uses them automatically.
          </p>
        </div>
      </div>

      {/* Configure-tools sheet for a created MCP server (F3). */}
      <McpToolsSheet id={configMcp} onClose={() => setConfigMcp(null)} onSaved={refresh} />
    </div>
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
}

interface CreateSlot {
  label: string
  render: (onCreated: (id: string) => void) => React.ReactNode
  onCreated?: () => void
}

function ResourceField({
  icon: Icon,
  title,
  description,
  items,
  selectedIds,
  onChange,
  manageLabel,
  create,
  onConfigure,
  onDelete,
  footer,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  items: AttachItem[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  manageLabel: string
  create?: CreateSlot
  onConfigure?: (id: string) => void
  onDelete?: (id: string) => void
  footer?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<"list" | "create">("list")
  const selected = items.filter((i) => selectedIds.includes(i.id))
  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])

  // Reset to the list whenever the sheet closes, so it never reopens mid-form.
  const setSheet = (o: boolean) => { setOpen(o); if (!o) setView("list") }
  const handleCreated = (id: string) => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id])
    create?.onCreated?.()
    setView("list")
    toast.success("Added and attached", { description: `Created and attached to ${title.toLowerCase()}.` })
  }

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((i) => (
            // An attached item that's since become unavailable (e.g. a connector
            // disconnected in Resources) is flagged, not shown as healthy — so it
            // can't silently ship in the deployed config (audit 2026-07-07).
            <Badge
              key={i.id}
              variant={i.disabled ? "outline" : "secondary"}
              className={cn("gap-1 pr-1 font-normal", i.disabled && "border-destructive/40 text-destructive")}
              title={i.disabled ? "No longer connected — reconnect in Resources or remove it" : undefined}
            >
              {i.disabled && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
              {i.name}
              <button
                type="button"
                onClick={() => toggle(i.id)}
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
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <Plus className="h-3.5 w-3.5" /> {manageLabel}
          </Button>
        </SheetTrigger>
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
                <SheetDescription>Attach to this agent, or create a new one.</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
                {create && (
                  <button
                    type="button"
                    onClick={() => setView("create")}
                    className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3.5 py-3 text-left text-sm font-medium transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus className="h-4 w-4 text-muted-foreground" aria-hidden /> {create.label}
                  </button>
                )}
                {items.map((i) => {
                  const on = selectedIds.includes(i.id)
                  if (i.disabled) {
                    return (
                      <div
                        key={i.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3 opacity-70"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{i.name}</p>
                          <p className="text-xs text-muted-foreground">{i.meta}</p>
                        </div>
                        {i.note && <span className="shrink-0 text-xs text-muted-foreground">{i.note}</span>}
                      </div>
                    )
                  }
                  return (
                    <div
                      key={i.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-1.5 transition-colors",
                        on ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(i.id)}
                        aria-pressed={on}
                        className="flex min-w-0 flex-1 items-center justify-between gap-3 px-2 py-3 text-left"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{i.name}</span>
                          <span className="block text-xs text-muted-foreground">{i.meta}</span>
                        </span>
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                          )}
                        >
                          {on && <Check className="h-3 w-3" />}
                        </span>
                      </button>
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
                    </div>
                  )
                })}
                {items.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>
                )}
              </div>
              {footer && <div className="shrink-0 border-t border-border px-5 py-3">{footer}</div>}
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}

// ─── Create forms (rendered inside the ResourceField sheet) ────────────────────

export function KnowledgeCreateForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = React.useState("")
  const [ingest, setIngest] = React.useState<KbIngest>("pdf")
  const [fileName, setFileName] = React.useState("")
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="kb-name" className="text-sm font-medium">Name</Label>
        <Input id="kb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Product docs" />
      </div>
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
              className="justify-start rounded-lg border border-border px-3 py-2.5 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary/5"
            >
              {KB_INGEST_LABEL[k]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
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
  const [transport, setTransport] = React.useState<McpTransport>("sse")
  const [headers, setHeaders] = React.useState<{ key: string; value: string }[]>([{ key: "", value: "" }])
  const setHeader = (idx: number, patch: Partial<{ key: string; value: string }>) =>
    setHeaders((hs) => hs.map((h, i) => (i === idx ? { ...h, ...patch } : h)))
  const validUrl = /^https?:\/\/.+/.test(url.trim())
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
        <Label className="text-sm font-medium">Transport</Label>
        <ToggleGroup
          type="single"
          value={transport}
          onValueChange={(v) => v && setTransport(v as McpTransport)}
          variant="outline"
          size="sm"
          className="grid grid-cols-2"
          aria-label="Transport protocol"
        >
          {(Object.keys(MCP_TRANSPORT_LABEL) as McpTransport[]).map((t) => (
            <ToggleGroupItem key={t} value={t} className="text-xs">{MCP_TRANSPORT_LABEL[t]}</ToggleGroupItem>
          ))}
        </ToggleGroup>
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
      <Button
        className="w-full"
        disabled={!name.trim() || !validUrl}
        onClick={() => onCreated(createMcpServer({ name, url, transport }).id)}
      >
        Create and discover tools
      </Button>
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
