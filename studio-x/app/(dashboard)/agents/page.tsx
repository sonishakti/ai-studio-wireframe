import { Plus, Bot, MoreHorizontal, Search, Filter } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"

const AGENTS = [
  {
    id: "agt_01",
    name: "Support Bot v2",
    description: "Handles tier-1 support queries via phone",
    status: "live",
    model: "gpt-4o",
    calls: 12430,
    lastModified: "2 hours ago",
  },
  {
    id: "agt_02",
    name: "Sales Qualifier",
    description: "Qualifies inbound leads before transfer",
    status: "draft",
    model: "claude-3-5-sonnet",
    calls: 0,
    lastModified: "Yesterday",
  },
  {
    id: "agt_03",
    name: "Appointment Setter",
    description: "Schedules appointments and sends confirmations",
    status: "live",
    model: "gpt-4o-mini",
    calls: 3270,
    lastModified: "5 min ago",
  },
  {
    id: "agt_04",
    name: "Collections Outreach",
    description: "Outbound debt collection compliance-aware flow",
    status: "paused",
    model: "gpt-4o",
    calls: 891,
    lastModified: "3 days ago",
  },
  {
    id: "agt_05",
    name: "Survey Bot",
    description: "Post-interaction CSAT surveys",
    status: "live",
    model: "gpt-4o-mini",
    calls: 5601,
    lastModified: "1 day ago",
  },
]

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  live: "default",
  draft: "secondary",
  paused: "outline",
}

export default function AgentsPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Agents" }]}
        title="Agents"
        description="Design and publish voice AI agents."
        actions={
          <Button asChild>
            <Link href="/agents/new/edit">
              <Plus className="h-4 w-4" /> New Agent
            </Link>
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search agents…" className="pl-8 h-8 text-sm" />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="w-[48px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {AGENTS.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <Link
                            href={`/agents/${agent.id}/edit`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {agent.name}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[agent.status] ?? "secondary"}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {agent.model}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {agent.calls.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {agent.lastModified}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                            <span className="sr-only">More</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/agents/${agent.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Publish</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
