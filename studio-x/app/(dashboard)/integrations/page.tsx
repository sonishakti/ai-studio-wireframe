import { Plus, Puzzle, ExternalLink, Search } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const KNOWLEDGE_BASES = [
  { id: "kb_01", name: "Product Docs", source: "Upload", chunks: 1240, status: "ready" },
  { id: "kb_02", name: "FAQs v3", source: "Upload", chunks: 320, status: "ready" },
  { id: "kb_03", name: "Policy Handbook", source: "URL Crawl", chunks: 0, status: "indexing" },
]

const MCP_SERVERS = [
  { id: "mcp_01", name: "CRM Connector", url: "https://mcp.acme.com/crm", tools: 8, status: "connected" },
  { id: "mcp_02", name: "Calendar API", url: "https://mcp.acme.com/calendar", tools: 5, status: "connected" },
  { id: "mcp_03", name: "Order System", url: "https://mcp.acme.com/orders", tools: 12, status: "error" },
]

const CRM_INTEGRATIONS = [
  { id: "crm_01", name: "Salesforce", type: "CRM", status: "connected", lastSync: "2 min ago" },
  { id: "crm_02", name: "HubSpot", type: "CRM", status: "not connected", lastSync: "—" },
  { id: "crm_03", name: "Zendesk", type: "Helpdesk", status: "connected", lastSync: "12 min ago" },
]

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Integrations" }]}
        title="Integrations"
        description="Connect knowledge bases, MCP servers, and CRM systems to your agents."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Add Integration
          </Button>
        }
      />

      <main className="flex-1 p-6">
        <Tabs defaultValue="knowledge" className="space-y-4">
          <TabsList>
            <TabsTrigger value="knowledge">Knowledge Bases</TabsTrigger>
            <TabsTrigger value="mcp">MCP Servers</TabsTrigger>
            <TabsTrigger value="crm">CRM / Helpdesk</TabsTrigger>
          </TabsList>

          {/* Knowledge Bases */}
          <TabsContent value="knowledge" className="space-y-4">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search knowledge bases…" className="pl-8 h-8 text-sm" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {KNOWLEDGE_BASES.map((kb) => (
                <Card key={kb.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <Puzzle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <Badge variant={kb.status === "ready" ? "default" : "secondary"}>
                        {kb.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm mt-2">{kb.name}</CardTitle>
                    <CardDescription className="text-xs">Source: {kb.source}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm font-medium tabular-nums">
                      {kb.chunks.toLocaleString()}{" "}
                      <span className="text-xs text-muted-foreground font-normal">chunks</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
              <Card className="border-dashed flex flex-col items-center justify-center gap-2 py-8 cursor-pointer hover:border-primary/50 transition-colors">
                <Plus className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Add knowledge base</p>
              </Card>
            </div>
          </TabsContent>

          {/* MCP Servers */}
          <TabsContent value="mcp" className="space-y-3">
            {MCP_SERVERS.map((srv) => (
              <Card key={srv.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{srv.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{srv.url}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm tabular-nums font-medium">{srv.tools} tools</p>
                  </div>
                  <Badge variant={srv.status === "connected" ? "default" : "destructive"}>
                    {srv.status}
                  </Badge>
                  <Button variant="outline" size="sm">Configure</Button>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="w-full gap-1.5">
              <Plus className="h-4 w-4" /> Add MCP Server
            </Button>
          </TabsContent>

          {/* CRM */}
          <TabsContent value="crm" className="space-y-3">
            {CRM_INTEGRATIONS.map((crm) => (
              <Card key={crm.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Puzzle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{crm.name}</p>
                    <p className="text-xs text-muted-foreground">{crm.type} · Last sync {crm.lastSync}</p>
                  </div>
                  <Badge variant={crm.status === "connected" ? "default" : "secondary"}>
                    {crm.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    {crm.status === "connected" ? "Manage" : "Connect"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
