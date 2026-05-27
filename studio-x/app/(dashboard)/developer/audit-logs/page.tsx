import { Download, Search, Filter } from "lucide-react"
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
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Every API call, config change, and user action in your project.
        </p>
        <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>
      </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Filter by actor or action…" className="pl-8 h-8 text-sm" />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5"><Filter className="h-3.5 w-3.5" /> Filter</Button>
        </div>
        <Card>
          <CardContent className="p-0">
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
                {LOGS.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono">{log.actor}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-mono text-xs">{log.action}</Badge></TableCell>
                    <TableCell className="text-sm">{log.resource}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                    <TableCell><Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{log.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </main>
  )
}
