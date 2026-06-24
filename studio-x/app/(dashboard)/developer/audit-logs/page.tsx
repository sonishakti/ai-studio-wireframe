"use client"

import * as React from "react"
import { Download, Search, ScrollText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const LOGS = [
  { id: "al_001", actor: "soni28shakti@gmail.com", action: "agent.update", resource: "Support Bot v2", ip: "203.0.113.42", time: "Today, 10:44 AM", status: "success" },
  { id: "al_002", actor: "soni28shakti@gmail.com", action: "credential.create", resource: "OpenAI Production Key", ip: "203.0.113.42", time: "Today, 10:32 AM", status: "success" },
  { id: "al_003", actor: "api-key:prod", action: "call.start", resource: "agt_01", ip: "198.51.100.7", time: "Today, 10:22 AM", status: "success" },
  { id: "al_004", actor: "soni28shakti@gmail.com", action: "campaign.create", resource: "Q2 Win-Back", ip: "203.0.113.42", time: "May 20, 2:15 PM", status: "success" },
  { id: "al_005", actor: "api-key:prod", action: "agent.publish", resource: "Survey Bot", ip: "198.51.100.7", time: "May 19, 11:08 AM", status: "failed" },
]

export default function AuditLogsPage() {
  const [query, setQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return LOGS
    return LOGS.filter(
      (log) =>
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q),
    )
  }, [query])

  const hasLogs = LOGS.length > 0

  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Every API call, config change, and user action in your project.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={!hasLogs}
          onClick={() => toast.info("Mock: exporting audit logs as CSV")}
        >
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>
        {hasLogs && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by actor, action, or resource…"
                className="pl-8 h-8 text-sm"
                aria-label="Filter audit logs"
              />
            </div>
          </div>
        )}
        <Card>
          <CardContent className="p-0">
            {!hasLogs ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <ScrollText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    API calls, config changes, and user actions will appear here once your project starts generating traffic.
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                        No logs match “{query}”.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs font-mono">{log.actor}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-mono text-xs">{log.action}</Badge></TableCell>
                        <TableCell className="text-sm">{log.resource}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                        <TableCell><Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{log.time}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
    </main>
  )
}
