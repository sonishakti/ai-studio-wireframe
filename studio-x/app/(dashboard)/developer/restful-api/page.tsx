import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeBlock } from "@/components/code-block"
import { Separator } from "@/components/ui/separator"

const ENDPOINTS = [
  { method: "GET", path: "/v2/agents", description: "List all agents", category: "Agents" },
  { method: "POST", path: "/v2/agents", description: "Create an agent", category: "Agents" },
  { method: "GET", path: "/v2/agents/:id", description: "Get agent by ID", category: "Agents" },
  { method: "PATCH", path: "/v2/agents/:id", description: "Update an agent", category: "Agents" },
  { method: "DELETE", path: "/v2/agents/:id", description: "Delete an agent", category: "Agents" },
  { method: "POST", path: "/v2/agents/:id/calls", description: "Start a call with agent", category: "Calls" },
  { method: "GET", path: "/v2/campaigns", description: "List campaigns", category: "Campaigns" },
  { method: "POST", path: "/v2/campaigns", description: "Create campaign", category: "Campaigns" },
  { method: "GET", path: "/v2/phone-numbers", description: "List phone numbers", category: "Telephony" },
]

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-primary/10 text-primary",
  POST: "bg-success/10 text-success",
  PATCH: "bg-warning/10 text-warning",
  DELETE: "bg-destructive/10 text-destructive",
}

export default function RestfulApiPage() {
  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Base URL: <code className="font-mono">https://api.agora.io/studio</code>
        </p>
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <a href="https://docs.agora.io" target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> Full Docs
          </a>
        </Button>
      </div>
        {/* Auth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Authentication</CardTitle>
            <CardDescription>All requests require a Bearer token in the Authorization header.</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock variant="inline">{"Authorization: Bearer <YOUR_API_KEY>"}</CodeBlock>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {ENDPOINTS.map((ep, i) => (
              <div key={`${ep.method}-${ep.path}`}>
                <div className="flex items-center gap-3 py-2.5 text-sm">
                  <span
                    className={`w-14 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-bold ${
                      METHOD_COLOR[ep.method]
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs flex-1">{ep.path}</span>
                  <span className="text-muted-foreground text-xs">{ep.description}</span>
                  <Badge variant="outline" className="text-xs shrink-0">{ep.category}</Badge>
                </div>
                {i < ENDPOINTS.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
    </main>
  )
}
