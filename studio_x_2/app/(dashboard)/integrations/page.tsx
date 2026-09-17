"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, ExternalLink, Plug, Plus } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CatalogCard } from "@/components/catalog-card"
import { VendorCredentialsPanel } from "@/components/vendor-credentials-panel"
import { ChannelsPanel } from "@/components/channels-panel"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
// Reuse the builder's create/config surfaces so Resources and the agent's Prompt
// & tools step create the SAME persisted resources — no mock/real drift.
import { KnowledgeCreateForm, McpCreateForm, McpToolsSheet } from "@/components/wizard/step-build"
import { KnowledgeSourceSheet } from "@/components/knowledge-source-sheet"
// The builder's own tool form and its two display parts, so a tool made here
// and a tool made in an agent are one record with one state.
import { ToolCreateForm, ToolCheckResult, ToolStateChip } from "@/components/wizard/tool-create-form"
// Canonical catalogs — shared with the agent builder's Actions hub so the two
// never drift (2026-07-07 canonicalization).
import { CONNECTORS, KNOWLEDGE_BASES, MCP_SERVERS, type Connector, type KnowledgeBase, type McpServer } from "@/lib/campaign-data"
import {
  effectiveConnectorStatus, setConnectorConnected,
  allKnowledgeBases, allMcpServers, getUserMcpServer,
} from "@/lib/agent-resources"
import {
  allTools, getTool, getToolCheck, saveToolCheck, runCheck,
  TOOL_SEEDS, type AgentTool, type ToolCheck,
} from "@/lib/agent-tools"

// Resources is tab-routed (?tab=…), so deep links and the header breadcrumb stay
// in sync. Order matches the tab list left-to-right.
const TABS = ["knowledge", "mcp", "tools", "connectors", "credentials", "channels"] as const
type ResourceTab = (typeof TABS)[number]
const DEFAULT_TAB: ResourceTab = "connectors"

// ─── empty state ────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, subtitle }: { icon: typeof Plug; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium mt-4">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{subtitle}</p>
    </div>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  // useSearchParams must sit under Suspense so static prerender doesn't bail.
  return (
    <React.Suspense fallback={<ResourcesShell />}>
      <ResourcesInner />
    </React.Suspense>
  )
}

function ResourcesShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Resources" />
      <main className="flex-1 p-6 space-y-5">{children}</main>
    </div>
  )
}

function ResourcesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const raw = searchParams.get("tab")
  const tab: ResourceTab = (TABS as readonly string[]).includes(raw ?? "")
    ? (raw as ResourceTab)
    : DEFAULT_TAB

  const setTab = (value: string) => {
    router.replace(`/integrations?tab=${value}`, { scroll: false })
  }

  // Connected-connector state lives in localStorage. Read only after mount
  // (avoids a hydration mismatch); `rev` re-derives statuses after connect.
  const [mounted, setMounted] = React.useState(false)
  const [rev, setRev] = React.useState(0)
  React.useEffect(() => { setMounted(true) }, [])
  const [connecting, setConnecting] = React.useState<Connector | null>(null)
  const statusOf = (c: Connector): Connector["status"] =>
    mounted ? effectiveConnectorStatus(c) : c.status
  const authorize = (c: Connector) => {
    setConnectorConnected(c.id, true)
    setConnecting(null)
    setRev((r) => r + 1)
    toast.success(`${c.name} connected`, { description: "Attach it to an agent from its Tools row." })
  }
  const disconnect = (c: Connector) => {
    setConnectorConnected(c.id, false)
    setRev((r) => r + 1)
    toast(`${c.name} disconnected`)
  }

  // KB / MCP lists come from the same store the builder writes to, so a base or
  // server created in an agent shows up here too. Seed-only until mount (SSR
  // parity), then the user's created items merge in.
  const kbs: KnowledgeBase[] = mounted ? allKnowledgeBases() : KNOWLEDGE_BASES
  const mcps: McpServer[] = mounted ? allMcpServers() : MCP_SERVERS
  const [kbCreateOpen, setKbCreateOpen] = React.useState(false)
  // The search had no value and no handler, so typing into it did not move the
  // grid (Before defect 13). The Console's equivalent search is wired.
  const [kbQuery, setKbQuery] = React.useState("")
  const visibleKbs = kbs.filter((k) => k.name.toLowerCase().includes(kbQuery.trim().toLowerCase()))
  /** Which base's sources are open (20). */
  const [sourcesKbId, setSourcesKbId] = React.useState<string | null>(null)
  const [mcpCreateOpen, setMcpCreateOpen] = React.useState(false)
  const [configMcpId, setConfigMcpId] = React.useState<string | null>(null)
  const bump = () => setRev((r) => r + 1)
  void rev

  // Tools live in the same store the builder writes to (19), so a tool made in
  // an agent is the same record here, carrying the same test result.
  const tools: AgentTool[] = mounted ? allTools() : TOOL_SEEDS
  const [toolCreateOpen, setToolCreateOpen] = React.useState(false)
  const checks: Record<string, ToolCheck> = {}
  if (mounted) {
    for (const id of [...tools.map((t) => t.id), ...mcps.map((m) => m.id)]) {
      const c = getToolCheck(id)
      if (c) checks[id] = c
    }
  }
  const testTool = (id: string) => {
    const t = getTool(id)
    if (!t) return
    saveToolCheck(id, runCheck({ url: t.url, method: t.method, body: t.bodyTemplate }))
    bump()
  }
  const testMcp = (id: string) => {
    const server = mcps.find((x) => x.id === id)
    if (!server) return
    saveToolCheck(id, runCheck({ url: server.url }))
    bump()
  }

  return (
    <ResourcesShell>
      <Tabs value={tab} onValueChange={setTab}>
        {/* Tab pills aligned with search row */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <TabsList>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="connectors">Connectors</TabsTrigger>
            <TabsTrigger value="credentials">Vendor Credentials</TabsTrigger>
            <TabsTrigger value="channels">Deployment Channels</TabsTrigger>
          </TabsList>
          <a
            href="mailto:product@agora.io?subject=Integration%20request"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          >
            Need an integration? Let us know
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Knowledge Base tab */}
        <TabsContent value="knowledge" className="space-y-4">
          {/* Reciprocity with the builder: attaching happens in an agent's
              Knowledge base row — say so HERE, where users land hunting for it
              (heuristic-eval walkthrough T3 / re-eval #8). The link used to
              point at /agents?step=3, which is the agents LIST and ignores
              `step`; the builder is /agents/[id]/edit?step=N, as the list's own
              Deploy link shows. */}
          <p className="text-sm text-muted-foreground">
            Attach these to an agent from its{" "}
            <Link
              href="/agents/agt_default/edit?step=3&focus=knowledge-sources"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Knowledge base row
            </Link>
            .
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={kbQuery}
              onChange={(e) => setKbQuery(e.target.value)}
              placeholder="Search knowledge bases…"
              aria-label="Search knowledge bases"
              className="pl-9"
            />
          </div>
          {kbs.length === 0 ? (
            <div className="rounded-lg border bg-card">
              <EmptyState
                icon={Plus}
                title="No knowledge bases yet"
                subtitle="Add a knowledge base so your agent can answer from your docs, FAQs, or a crawled site."
              />
              <div className="flex justify-center pb-8">
                <Button size="sm" className="gap-1.5" onClick={() => setKbCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> Add knowledge base
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* The card is the base's own home, so the crawl, the ledger, the
                  refresh switch and the delete guard are reachable here and not
                  only through a kebab inside the builder's attach sheet. Its
                  own three lines are unchanged. */}
              {visibleKbs.map((kb) => (
                <Card
                  key={kb.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSourcesKbId(kb.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSourcesKbId(kb.id) } }}
                  className="cursor-pointer p-4 text-left transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <p className="text-sm font-semibold">{kb.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Source: {kb.source}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant={kb.status === "ready" ? "default" : "secondary"} className="text-xs">
                      {kb.status}
                    </Badge>
                    <span className="text-xs tabular-nums">
                      {kb.chunks.toLocaleString()} chunks
                    </span>
                  </div>
                </Card>
              ))}
              <button
                type="button"
                onClick={() => setKbCreateOpen(true)}
                aria-label="Add knowledge base"
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed bg-card p-4 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">Add KB</span>
              </button>
            </div>
          )}
          {kbs.length > 0 && visibleKbs.length === 0 && (
            <p className="text-sm text-muted-foreground">No matches.</p>
          )}

          {/* Create — the same form the builder uses, so both write one store. */}
          <Sheet open={kbCreateOpen} onOpenChange={setKbCreateOpen}>
            <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
              <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
                <SheetTitle>Create knowledge base</SheetTitle>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                <KnowledgeCreateForm
                  onCreated={() => { setKbCreateOpen(false); bump(); toast.success("Knowledge base created") }}
                />
              </div>
            </SheetContent>
          </Sheet>
          {/* One door per action: the same sheet the builder's row opens. */}
          <KnowledgeSourceSheet
            kbId={sourcesKbId}
            onClose={() => setSourcesKbId(null)}
            onSaved={bump}
          />
        </TabsContent>

        {/* MCP tab */}
        <TabsContent value="mcp" className="space-y-4">
          {/* Reciprocity with the builder: attaching happens in an agent's
              Prompt & knowledge section — say so HERE, where users land hunting for
              it (heuristic-eval walkthrough T3 / re-eval #8). */}
          <p className="text-sm text-muted-foreground">
            Attach these to an agent from its{" "}
            <Link href="/agents?step=3" className="font-medium text-foreground underline-offset-4 hover:underline">
              Prompt &amp; knowledge section
            </Link>
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search MCP servers…" className="pl-9" />
          </div>
          {mcps.length === 0 ? (
            <div className="rounded-lg border bg-card">
              <EmptyState
                icon={Plug}
                title="No MCP servers yet"
                subtitle="Connect an MCP server to give your agent extra tools: CRM lookups, calendar access, custom APIs."
              />
              <div className="flex justify-center pb-8">
                <Button size="sm" className="gap-1.5" onClick={() => setMcpCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> Add MCP server
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {mcps.map((s) => {
                // Only user-created servers carry an editable tool list; the seed
                // samples don't, so their Configure is disabled with a hint.
                const editable = mounted && !!getUserMcpServer(s.id)
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-md border bg-card p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Plug className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{s.url}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{s.tools} tools</Badge>
                    <ToolStateChip check={checks[s.id]} checkedAt={checks[s.id]?.at} />
                    <Button variant="outline" size="sm" onClick={() => testMcp(s.id)}>
                      {checks[s.id] ? "Test again" : "Run test"}
                    </Button>
                    {/* Only a server whose tool list exists can have one shown.
                        The seed rows used to print a count beside a button that
                        refused to open, on one line (19). */}
                    {editable && (
                      <Button variant="outline" size="sm" onClick={() => setConfigMcpId(s.id)}>
                        Configure tools
                      </Button>
                    )}
                  </div>
                )
              })}
              <Button variant="outline" className="w-full gap-1.5" onClick={() => setMcpCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Add MCP Server
              </Button>
            </div>
          )}

          <McpToolsSheet id={configMcpId} onClose={() => setConfigMcpId(null)} onSaved={bump} />
        </TabsContent>

        {/* Tools tab — an HTTP tool belongs to the workspace, not to one agent,
            so it has a home outside the builder (19). Same shape as the three
            tabs beside it: a reciprocity line, the roster, one create door. */}
        <TabsContent value="tools" className="space-y-4">
          <p className="text-sm text-muted-foreground">Attach these to an agent from its Tools row.</p>
          {tools.length === 0 ? (
            <div className="rounded-lg border bg-card">
              <EmptyState
                icon={Plug}
                title="No tools yet"
                subtitle="Create a tool so your agent can act on your systems: look up an order, start a refund, file a ticket."
              />
              <div className="flex justify-center pb-8">
                <Button size="sm" className="gap-1.5" onClick={() => setToolCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> Create new tool
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {tools.map((t) => (
                <div key={t.id} className="rounded-md border bg-card">
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Plug className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{t.fn.name || t.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{t.method} {t.url}</p>
                    </div>
                    {t.status === "unavailable" && (
                      <span className="shrink-0 text-xs text-muted-foreground">Unavailable</span>
                    )}
                    <ToolStateChip check={checks[t.id]} />
                    <Button variant="outline" size="sm" onClick={() => testTool(t.id)}>
                      {checks[t.id] ? "Test again" : "Run test"}
                    </Button>
                  </div>
                  {/* The raw body IS the diagnosis, so it stays under the row
                      the test was run from rather than in a dialog. */}
                  {checks[t.id] && (
                    <div className="border-t px-3 py-3">
                      <ToolCheckResult check={checks[t.id]} />
                    </div>
                  )}
                </div>
              ))}
              <Button variant="outline" className="w-full gap-1.5" onClick={() => setToolCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Create new tool
              </Button>
            </div>
          )}

        </TabsContent>

        {/* Connectors tab (Figma default) */}
        <TabsContent value="connectors" className="space-y-6">
          {/* The catalog is one row long, because the Studio server accepts one
              provider. What a customer reaches for instead leads the fold (19). */}
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Add your own</h2>
              <p className="text-xs text-muted-foreground">Point the agent at any endpoint you already run.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
              <Button variant="outline" className="w-full gap-1.5" onClick={() => setToolCreateOpen(true)}>
                <Plus className="h-4 w-4" /> HTTP tool
              </Button>
              <Button variant="outline" className="w-full gap-1.5" onClick={() => setMcpCreateOpen(true)}>
                <Plus className="h-4 w-4" /> MCP server
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Ready to connect</h2>
            {CONNECTORS.length === 0 ? (
              <div className="rounded-lg border bg-card">
                <EmptyState
                  icon={Plug}
                  title="No connectors yet"
                  subtitle="Connect a tool so your agent can take real actions: look up an order, file a ticket, or take a payment."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CONNECTORS.map((c) => {
                  const status = statusOf(c)
                  return (
                    <CatalogCard
                      key={c.id}
                      name={c.name}
                      description={c.description}
                      initials={c.initials}
                      status={status}
                      actionLabel={status === "connected" ? "Disconnect" : "Connect"}
                      onAction={
                        status === "connected" ? () => disconnect(c)
                        : status === "available" ? () => setConnecting(c)
                        : undefined
                      }
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Mock OAuth — no real sign-in (wireframe). */}
          <Dialog open={!!connecting} onOpenChange={(o) => !o && setConnecting(null)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Connect {connecting?.name}</DialogTitle>
                <DialogDescription>
                  You&apos;ll be sent to {connecting?.name} to authorize access, then returned here.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConnecting(null)}>Cancel</Button>
                <Button onClick={() => connecting && authorize(connecting)}>
                  Authorize {connecting?.name}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Vendor Credentials tab */}
        <TabsContent value="credentials">
          <VendorCredentialsPanel showHeader />
        </TabsContent>

        {/* Deployment Channels tab */}
        <TabsContent value="channels">
          <ChannelsPanel />
        </TabsContent>
      </Tabs>

      {/* One door per create, mounted OUTSIDE the tabs: the Connectors fold and
          the Tools tab both open these, and an inactive TabsContent unmounts. */}
      <Sheet open={toolCreateOpen} onOpenChange={setToolCreateOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <SheetTitle>Create new tool</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <ToolCreateForm onCreated={bump} />
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={mcpCreateOpen} onOpenChange={setMcpCreateOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <SheetTitle>Create MCP server</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <McpCreateForm
              onCreated={() => { setMcpCreateOpen(false); bump(); toast.success("MCP server created") }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </ResourcesShell>
  )
}
