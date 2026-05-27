"use client"

import * as React from "react"
import Link from "next/link"
import {
  Plus, Search, Filter, MoreHorizontal, Phone, Megaphone, ArrowRight,
  PhoneIncoming, PhoneOutgoing, BarChart3, Hash,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"

// Inbound campaigns — users call in, agent answers
const INBOUND_CAMPAIGNS = [
  { id: "ib_01", name: "Support Hotline",     agent: "Support Bot v2",      numbers: ["+1 (415) 555-0101"], status: "active",  ringsPerWeek: 1240, avgDuration: "3m 24s" },
  { id: "ib_02", name: "Sales Front Desk",    agent: "Sales Qualifier",     numbers: ["+1 (628) 555-0188"], status: "active",  ringsPerWeek:  340, avgDuration: "1m 52s" },
  { id: "ib_03", name: "UK Support",          agent: "Support Bot v2",      numbers: ["+44 20 7946 0958"],  status: "paused",  ringsPerWeek:    0, avgDuration: "—" },
]

// Outbound campaigns — dialed-out
const OUTBOUND_CAMPAIGNS = [
  { id: "ob_01", name: "Q2 Win-Back",         agent: "Sales Qualifier",     status: "in_progress", total: 5000, completed: 3421, successRate: 24, startDate: "May 20, 2026" },
  { id: "ob_02", name: "Product Launch",      agent: "Support Bot v2",      status: "scheduled",   total:12000, completed:    0, successRate:  0, startDate: "Jun 1, 2026" },
  { id: "ob_03", name: "Renewal Reminder",    agent: "Appointment Setter",  status: "completed",   total: 2800, completed: 2800, successRate: 31, startDate: "May 10, 2026" },
  { id: "ob_04", name: "Collections May",     agent: "Collections Outreach",status: "paused",      total: 1500, completed:  742, successRate: 18, startDate: "May 15, 2026" },
  { id: "ob_05", name: "NPS Survey",          agent: "Survey Bot",          status: "draft",       total: 8000, completed:    0, successRate:  0, startDate: "—" },
]

const NUMBERS = [
  { id: "pn_01", number: "+1 (415) 555-0101", label: "Support Line",  vendor: "Twilio",    assignedTo: "Support Hotline" },
  { id: "pn_02", number: "+1 (628) 555-0188", label: "Sales Inbound", vendor: "Twilio",    assignedTo: "Sales Front Desk" },
  { id: "pn_03", number: "+44 20 7946 0958",  label: "UK Support",    vendor: "Vonage",    assignedTo: "UK Support (paused)" },
  { id: "pn_04", number: "+1 (800) 555-0199", label: "Toll-Free",     vendor: "Bandwidth", assignedTo: "—" },
]

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
  active:      { variant: "default",   label: "Active" },
  paused:      { variant: "outline",   label: "Paused" },
  in_progress: { variant: "default",   label: "In progress" },
  scheduled:   { variant: "secondary", label: "Scheduled" },
  completed:   { variant: "outline",   label: "Completed" },
  draft:       { variant: "secondary", label: "Draft" },
}

export default function CampaignsPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Campaigns" dense />

      <main className="flex-1 p-6 pt-4">
        <Tabs defaultValue="inbound">
          {/* Dense sub-header row: tabs + search + filter + action — all inline */}
          <div className="flex items-center gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="inbound"  className="gap-1.5"><PhoneIncoming className="h-3.5 w-3.5" /> Inbound</TabsTrigger>
              <TabsTrigger value="outbound" className="gap-1.5"><PhoneOutgoing className="h-3.5 w-3.5" /> Outbound</TabsTrigger>
              <TabsTrigger value="numbers"  className="gap-1.5"><Hash className="h-3.5 w-3.5" /> Phone numbers</TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
            </TabsList>
            <div className="relative flex-1 max-w-xs ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-8 h-9 text-sm" />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5"><Filter className="h-3.5 w-3.5" /> Filter</Button>
            <Button size="sm" className="gap-1.5" asChild>
              <Link href="/campaigns/new"><Plus className="h-4 w-4" /> New campaign</Link>
            </Button>
          </div>

          {/* ── Inbound ─────────────────────────────────────────────── */}
          <TabsContent value="inbound" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Rings / week</TableHead>
                      <TableHead>Avg duration</TableHead>
                      <TableHead className="w-[48px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {INBOUND_CAMPAIGNS.map((c) => {
                      const s = STATUS_BADGE[c.status]
                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <Link href={`/campaigns/${c.id}/edit`} className="font-medium hover:text-primary transition-colors">{c.name}</Link>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.agent}</TableCell>
                          <TableCell className="font-mono text-xs">{c.numbers.join(", ")}</TableCell>
                          <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                          <TableCell className="text-right tabular-nums">{c.ringsPerWeek.toLocaleString()}</TableCell>
                          <TableCell className="tabular-nums text-sm">{c.avgDuration}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Configure</DropdownMenuItem>
                                <DropdownMenuItem>{c.status === "active" ? "Pause" : "Activate"}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DestructiveActionDialog action="Delete" resource="campaign" resourceId={c.id} resourceName={c.name}>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                </DestructiveActionDialog>
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
          </TabsContent>

          {/* ── Outbound ────────────────────────────────────────────── */}
          <TabsContent value="outbound" className="mt-0">
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
                      <TableHead>Start</TableHead>
                      <TableHead className="w-[48px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {OUTBOUND_CAMPAIGNS.map((c) => {
                      const pct = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0
                      const s = STATUS_BADGE[c.status]
                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <Link href={`/campaigns/${c.id}/edit`} className="font-medium hover:text-primary transition-colors">{c.name}</Link>
                          </TableCell>
                          <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.agent}</TableCell>
                          <TableCell className="min-w-[140px]">
                            <Progress value={pct} className="h-1.5 w-28" />
                            <p className="text-xs text-muted-foreground tabular-nums mt-1">{c.completed.toLocaleString()} / {c.total.toLocaleString()}</p>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">{c.successRate > 0 ? `${c.successRate}%` : "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.startDate}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Configure</DropdownMenuItem>
                                {c.status === "in_progress" && <DropdownMenuItem>Pause</DropdownMenuItem>}
                                {c.status === "paused" && <DropdownMenuItem>Resume</DropdownMenuItem>}
                                <DropdownMenuSeparator />
                                <DestructiveActionDialog action="Delete" resource="campaign" resourceId={c.id} resourceName={c.name}>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                </DestructiveActionDialog>
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
          </TabsContent>

          {/* ── Phone numbers ──────────────────────────────────────── */}
          <TabsContent value="numbers" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Assigned to</TableHead>
                      <TableHead className="w-[48px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {NUMBERS.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-mono text-sm">{n.number}</TableCell>
                        <TableCell className="text-sm">{n.label}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{n.vendor}</TableCell>
                        <TableCell className="text-sm">{n.assignedTo}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Reassign</DropdownMenuItem>
                              <DropdownMenuItem>Edit label</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DestructiveActionDialog action="Release" resource="phone number" resourceId={n.id} resourceName={n.number} description="Releasing this number returns it to the vendor pool. You cannot reclaim this exact number.">
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>Release</DropdownMenuItem>
                              </DestructiveActionDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Analytics ──────────────────────────────────────────── */}
          <TabsContent value="analytics" className="mt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Active campaigns", value: "5", sub: "3 inbound · 2 outbound" },
                { label: "Calls this week",  value: "1,580", sub: "+12% vs last week" },
                { label: "Avg duration",     value: "2m 41s", sub: "across all campaigns" },
                { label: "Cost",             value: "$0.00", sub: "Free tier" },
              ].map((m) => (
                <Card key={m.label}>
                  <CardContent className="p-4">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
                    <p className="text-2xl font-semibold tabular-nums mt-1">{m.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="mt-4">
              <CardContent className="p-6 flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Detailed performance</p>
                  <p className="text-xs text-muted-foreground">Drill into per-call analytics, latency, completion rate, and per-agent breakdowns.</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/monitor">Open Monitor <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
