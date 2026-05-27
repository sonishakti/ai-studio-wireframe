import { Plus, Megaphone, MoreHorizontal, Search, Filter, Play, Pause } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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

const CAMPAIGNS = [
  {
    id: "cmp_01",
    name: "Q2 Win-Back",
    agent: "Sales Qualifier",
    status: "in_progress",
    total: 5000,
    completed: 3421,
    successRate: 24,
    startDate: "May 20, 2026",
  },
  {
    id: "cmp_02",
    name: "Product Launch Outreach",
    agent: "Support Bot v2",
    status: "scheduled",
    total: 12000,
    completed: 0,
    successRate: 0,
    startDate: "Jun 1, 2026",
  },
  {
    id: "cmp_03",
    name: "Renewal Reminder",
    agent: "Appointment Setter",
    status: "completed",
    total: 2800,
    completed: 2800,
    successRate: 31,
    startDate: "May 10, 2026",
  },
  {
    id: "cmp_04",
    name: "Collections May",
    agent: "Collections Outreach",
    status: "paused",
    total: 1500,
    completed: 742,
    successRate: 18,
    startDate: "May 15, 2026",
  },
  {
    id: "cmp_05",
    name: "NPS Survey",
    agent: "Survey Bot",
    status: "draft",
    total: 8000,
    completed: 0,
    successRate: 0,
    startDate: "—",
  },
]

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
  in_progress: { variant: "default", label: "In Progress" },
  scheduled: { variant: "secondary", label: "Scheduled" },
  completed: { variant: "outline", label: "Completed" },
  paused: { variant: "outline", label: "Paused" },
  draft: { variant: "secondary", label: "Draft" },
}

export default function CampaignsPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[
          { label: "Telephony" },
          { label: "Campaigns" },
        ]}
        title="Campaigns"
        description="Manage outbound dialing campaigns."
        actions={
          <Button asChild>
            <Link href="/telephony/campaigns/create">
              <Plus className="h-4 w-4" /> New Campaign
            </Link>
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search campaigns…" className="pl-8 h-8 text-sm" />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="w-[48px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {CAMPAIGNS.map((c) => {
                  const pct = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0
                  const { variant, label } = STATUS_BADGE[c.status]
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Link
                            href={`/telephony/campaigns/${c.id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {c.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={variant}>{label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.agent}</TableCell>
                      <TableCell className="min-w-[140px]">
                        <div className="space-y-1">
                          <Progress value={pct} className="h-1.5 w-28" />
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {c.completed.toLocaleString()} / {c.total.toLocaleString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {c.successRate > 0 ? `${c.successRate}%` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.startDate}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            {c.status === "in_progress" && (
                              <DropdownMenuItem>Pause</DropdownMenuItem>
                            )}
                            {c.status === "paused" && (
                              <DropdownMenuItem>Resume</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
