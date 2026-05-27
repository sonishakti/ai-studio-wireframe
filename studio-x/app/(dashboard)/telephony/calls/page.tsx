import { PhoneCall, Search, Filter, Download } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const CALLS = [
  {
    id: "call_001",
    direction: "outbound",
    from: "+1 (415) 555-0101",
    to: "+1 (555) 123-4567",
    agent: "Support Bot v2",
    duration: "3m 14s",
    outcome: "completed",
    timestamp: "Today, 10:42 AM",
    type: "telephony",
  },
  {
    id: "call_002",
    direction: "inbound",
    from: "+1 (555) 987-6543",
    to: "+1 (628) 555-0188",
    agent: "Sales Qualifier",
    duration: "1m 52s",
    outcome: "transferred",
    timestamp: "Today, 10:35 AM",
    type: "telephony",
  },
  {
    id: "call_003",
    direction: "outbound",
    from: "+1 (800) 555-0199",
    to: "+1 (555) 246-8135",
    agent: "Collections Outreach",
    duration: "0m 34s",
    outcome: "no_answer",
    timestamp: "Today, 10:28 AM",
    type: "telephony",
  },
  {
    id: "sess_001",
    direction: "inbound",
    from: "web-sdk",
    to: "support-channel",
    agent: "Support Bot v2",
    duration: "8m 05s",
    outcome: "completed",
    timestamp: "Today, 10:20 AM",
    type: "realtime",
  },
  {
    id: "sess_002",
    direction: "inbound",
    from: "ios-sdk",
    to: "sales-channel",
    agent: "Sales Qualifier",
    duration: "4m 11s",
    outcome: "completed",
    timestamp: "Today, 10:15 AM",
    type: "realtime",
  },
]

const OUTCOME_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  completed: "default",
  transferred: "secondary",
  no_answer: "outline",
  failed: "destructive",
}

function CallTable({ calls }: { calls: typeof CALLS }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Direction</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Outcome</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calls.map((c) => (
          <TableRow key={c.id} className="cursor-pointer hover:bg-muted/40">
            <TableCell className="font-mono text-xs text-muted-foreground">{c.id}</TableCell>
            <TableCell>
              <Badge variant={c.direction === "inbound" ? "secondary" : "outline"} className="text-xs">
                {c.direction}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-sm">{c.from}</TableCell>
            <TableCell className="font-mono text-sm">{c.to}</TableCell>
            <TableCell className="text-sm">{c.agent}</TableCell>
            <TableCell className="tabular-nums text-sm">{c.duration}</TableCell>
            <TableCell>
              <Badge variant={OUTCOME_VARIANT[c.outcome] ?? "secondary"}>
                {c.outcome.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{c.timestamp}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function CallsPage() {
  const telephony = CALLS.filter((c) => c.type === "telephony")
  const realtime = CALLS.filter((c) => c.type === "realtime")

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[
          { label: "Telephony" },
          { label: "Calls" },
        ]}
        title="Calls"
        description="Unified view of telephony call history and realtime sessions."
        actions={
          <Button variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search calls…" className="pl-8 h-8 text-sm" />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({CALLS.length})</TabsTrigger>
            <TabsTrigger value="telephony">Telephony ({telephony.length})</TabsTrigger>
            <TabsTrigger value="realtime">Realtime ({realtime.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <Card><CardContent className="p-0"><CallTable calls={CALLS} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="telephony">
            <Card><CardContent className="p-0"><CallTable calls={telephony} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="realtime">
            <Card><CardContent className="p-0"><CallTable calls={realtime} /></CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
