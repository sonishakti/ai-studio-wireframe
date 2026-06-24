"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, ExternalLink, Plug, Plus } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CatalogCard, type CatalogCardStatus } from "@/components/catalog-card"
import { VendorCredentialsPanel } from "@/components/vendor-credentials-panel"
import { ChannelsPanel } from "@/components/channels-panel"

// ─── connector catalog (matches Figma node 90:15477) ─────────────────────────

type Connector = {
  id: string
  name: string
  description: string
  initials: string
  // Brand chip color — deliberate per-vendor brand palette (not app chrome), the
  // same contract CatalogCard's `iconColor` documents for initials chips.
  color: string
  status: CatalogCardStatus
}

const CONNECTORS: Connector[] = [
  { id: "hubspot", name: "Hubspot",  description: "Sync contacts and log deals in your CRM",        initials: "H",  color: "bg-orange-500", status: "available"   },
  { id: "airtable", name: "Airtable", description: "Read and update records in your base",           initials: "A", color: "bg-yellow-500", status: "available"   },
  { id: "jira",    name: "Jira",     description: "File and update issues from a conversation",      initials: "J", color: "bg-blue-500",   status: "available"   },
  { id: "paypal",  name: "Paypal",   description: "Take payments and check order status",            initials: "P", color: "bg-sky-500",    status: "coming-soon" },
  { id: "whatsapp",name: "Whatsapp", description: "Reply to customers on WhatsApp Business",         initials: "W", color: "bg-green-500",  status: "coming-soon" },
  { id: "zendesk", name: "Zendesk",  description: "Open and track support tickets automatically",    initials: "Z", color: "bg-emerald-600",status: "coming-soon" },
]

const KNOWLEDGE_BASES = [
  { id: "kb_01", name: "Product Docs", source: "Upload", chunks: 1240, status: "ready" },
  { id: "kb_02", name: "FAQs v3", source: "Upload", chunks: 320, status: "ready" },
  { id: "kb_03", name: "Policy Handbook", source: "URL Crawl", chunks: 0, status: "indexing" },
]

const MCP_SERVERS = [
  { id: "mcp_01", name: "CRM Connector", url: "https://mcp.acme.com/crm", tools: 8 },
  { id: "mcp_02", name: "Calendar API", url: "https://mcp.acme.com/calendar", tools: 5 },
]

// Resources is tab-routed (?tab=…), so deep links and the header breadcrumb stay
// in sync. Order matches the tab list left-to-right.
const TABS = ["knowledge", "mcp", "connectors", "credentials", "channels"] as const
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

  return (
    <ResourcesShell>
      <Tabs value={tab} onValueChange={setTab}>
        {/* Tab pills aligned with search row */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <TabsList>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search knowledge bases…" className="pl-9" />
          </div>
          {KNOWLEDGE_BASES.length === 0 ? (
            <div className="rounded-lg border bg-card">
              <EmptyState
                icon={Plus}
                title="No knowledge bases yet"
                subtitle="Add a knowledge base so your agent can answer from your docs, FAQs, or a crawled site."
              />
              <div className="flex justify-center pb-8">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => toast.info("Mock: Add knowledge base")}
                >
                  <Plus className="h-4 w-4" /> Add knowledge base
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {KNOWLEDGE_BASES.map((kb) => (
                <Card key={kb.id} className="p-4">
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
                onClick={() => toast.info("Mock: Add knowledge base")}
                aria-label="Add knowledge base"
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed bg-card p-4 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">Add KB</span>
              </button>
            </div>
          )}
        </TabsContent>

        {/* MCP tab */}
        <TabsContent value="mcp" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search MCP servers…" className="pl-9" />
          </div>
          {MCP_SERVERS.length === 0 ? (
            <div className="rounded-lg border bg-card">
              <EmptyState
                icon={Plug}
                title="No MCP servers yet"
                subtitle="Connect an MCP server to give your agent extra tools — CRM lookups, calendar access, custom APIs."
              />
              <div className="flex justify-center pb-8">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => toast.info("Mock: Add MCP server")}
                >
                  <Plus className="h-4 w-4" /> Add MCP server
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {MCP_SERVERS.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-md border bg-card p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Plug className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{s.url}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{s.tools} tools</Badge>
                  <Button variant="outline" size="sm" onClick={() => toast.info(`Mock: Configure ${s.name}`)}>
                    Configure
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full gap-1.5" onClick={() => toast.info("Mock: Add MCP server")}>
                <Plus className="h-4 w-4" /> Add MCP Server
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Connectors tab (Figma default) */}
        <TabsContent value="connectors" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-9" />
            </div>
          </div>

          {CONNECTORS.length === 0 ? (
            <div className="rounded-lg border bg-card">
              <EmptyState
                icon={Plug}
                title="No connectors yet"
                subtitle="Connect a tool so your agent can take real actions — look up an order, file a ticket, take a payment."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CONNECTORS.map((c) => (
                <CatalogCard
                  key={c.id}
                  name={c.name}
                  description={c.description}
                  initials={c.initials}
                  iconColor={c.color}
                  status={c.status}
                  actionLabel="Connect"
                  onAction={
                    c.status === "available"
                      ? () => toast.info(`Mock: Connect ${c.name}`)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
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
    </ResourcesShell>
  )
}
