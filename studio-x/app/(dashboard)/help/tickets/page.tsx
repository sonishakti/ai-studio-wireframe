import { Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const TICKETS = [
  { id: "T-1042", subject: "Agent not connecting to OpenAI API", status: "open", priority: "high", updated: "2 hours ago" },
  { id: "T-1038", subject: "Campaign start time not respecting timezone", status: "pending", priority: "medium", updated: "1 day ago" },
  { id: "T-1031", subject: "Phone number import failing for .csv with BOM", status: "resolved", priority: "low", updated: "May 20, 2026" },
]

export default function TicketsPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Track the status of your open and closed support requests.
        </p>
        <Button size="sm" asChild><Link href="/help/contact">New Ticket</Link></Button>
      </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search tickets…" className="pl-8 h-8 text-sm" />
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TICKETS.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.id}</TableCell>
                    <TableCell className="font-medium text-sm">{t.subject}</TableCell>
                    <TableCell><Badge variant={t.priority === "high" ? "destructive" : t.priority === "medium" ? "outline" : "secondary"}>{t.priority}</Badge></TableCell>
                    <TableCell><Badge variant={t.status === "open" ? "default" : t.status === "pending" ? "outline" : "secondary"}>{t.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.updated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </main>
  )
}
