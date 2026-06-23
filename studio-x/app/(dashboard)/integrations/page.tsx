"use client"

import * as React from "react"
import { Search, ExternalLink, Plug, Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VendorCredentialsPanel } from "@/components/vendor-credentials-panel"
import { ChannelsPanel } from "@/components/channels-panel"
import { cn } from "@/lib/utils"

// ─── connector catalog (matches Figma node 90:15477) ─────────────────────────

type Connector = {
  id: string
  name: string
  description: string
  initials: string
  color: string
  status: "available" | "coming-soon" | "connected"
}

const CONNECTORS: Connector[] = [
  { id: "hubspot", name: "Hubspot",  description: "Service ticket management platform", initials: "H",  color: "bg-orange-500", status: "available"   },
  { id: "airtable", name: "Airtable", description: "Very short description here",        initials: "A", color: "bg-yellow-500", status: "available"   },
  { id: "jira",    name: "Jira",     description: "Very short description here",         initials: "J", color: "bg-blue-500",   status: "available"   },
  { id: "paypal",  name: "Paypal",   description: "Very short description here",         initials: "P", color: "bg-sky-500",    status: "coming-soon" },
  { id: "whatsapp",name: "Whatsapp", description: "Very short description here",         initials: "W", color: "bg-green-500",  status: "coming-soon" },
  { id: "zendesk", name: "Zendesk",  description: "Very short description here",         initials: "Z", color: "bg-emerald-600",status: "coming-soon" },
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

// ─── connector card ──────────────────────────────────────────────────────────

function ConnectorCard({ c }: { c: Connector }) {
  const isComingSoon = c.status === "coming-soon"
  return (
    <Card className="p-4 flex flex-col gap-3 hover:border-foreground/20 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg text-white font-semibold text-sm shrink-0",
            c.color,
          )}
        >
          {c.initials}
        </div>
        {isComingSoon ? (
          <Badge variant="outline" className="text-xs">
            Coming Soon
          </Badge>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            Connect
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold">{c.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
      </div>
    </Card>
  )
}

// ─── empty state ────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, subtitle }: { icon: typeof Plug; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium mt-4">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Integrations" />

      <main className="flex-1 p-6 space-y-5">
        <Tabs defaultValue="connectors">
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
              href="#"
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
            <div className="rounded-lg border bg-card p-6">
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
                <Card className="p-4 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-foreground/40 transition-colors">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add KB</span>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* MCP tab */}
          <TabsContent value="mcp" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search MCP servers…" className="pl-9" />
            </div>
            <div className="rounded-lg border bg-card p-6 space-y-2">
              {MCP_SERVERS.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-md border bg-background p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Plug className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{s.url}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{s.tools} tools</Badge>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              ))}
              <Button variant="outline" className="w-full gap-1.5">
                <Plus className="h-4 w-4" /> Add MCP Server
              </Button>
            </div>
          </TabsContent>

          {/* Connectors tab (Figma default) */}
          <TabsContent value="connectors" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-9" />
              </div>
            </div>

            {/* Empty state + grid (matches Figma) */}
            <div className="rounded-lg border bg-card p-6">
              <EmptyState
                icon={Plug}
                title="No connectors configured"
                subtitle="Add a connector from our library of integrations below."
              />
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CONNECTORS.map((c) => (
                  <ConnectorCard key={c.id} c={c} />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Vendor Credentials tab (moved out of Manage — 2026-06-23) */}
          <TabsContent value="credentials">
            <VendorCredentialsPanel showHeader />
          </TabsContent>

          {/* Channels tab (renamed from Deploy/Deployment — 2026-06-23) */}
          <TabsContent value="channels">
            <ChannelsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
