"use client"

import * as React from "react"
import Link from "next/link"
import {
  Phone, MessageCircle, Globe, PhoneOutgoing, Code2, MoreHorizontal, ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddPhoneNumberSheet } from "@/components/add-phone-number-sheet"
import { cn } from "@/lib/utils"

/**
 * ChannelsPanel — the Channels overview (2026-06-23: "Deployment" renamed to
 * "Channels"; lives as a tab in the Integrations modules hub). Every channel an
 * agent can run on — phone numbers (BYO via SIP), WhatsApp, web widget, batch
 * (outbound), code/SDK — in one filterable list. One channel backs one agent
 * (1 agent ↔ 1 channel); duplicate an agent to put it on another channel.
 */

type ChannelType = "phone" | "whatsapp" | "web" | "batch" | "code"

const TYPE_META: Record<ChannelType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  phone:    { label: "Phone number", icon: Phone },
  whatsapp: { label: "WhatsApp",     icon: MessageCircle },
  web:      { label: "Web widget",   icon: Globe },
  batch:    { label: "Batch calls",  icon: PhoneOutgoing },
  code:     { label: "Code / SDK",   icon: Code2 },
}

type ChannelRow = {
  id: string
  type: ChannelType
  label: string
  identifier: string
  backs: string
  status: "active" | "scheduled" | "unassigned"
  href: string
}

const CHANNELS: ChannelRow[] = [
  { id: "ch_01", type: "phone",    label: "Support Line",    identifier: "+1 (415) 555-0101", backs: "Support Bot v2",      status: "active",     href: "/deploy/phone-numbers" },
  { id: "ch_02", type: "phone",    label: "Sales Inbound",   identifier: "+1 (628) 555-0188", backs: "Aria",               status: "active",     href: "/deploy/phone-numbers" },
  { id: "ch_03", type: "whatsapp", label: "Acme WhatsApp",   identifier: "+1 (415) 555-0142", backs: "Survey Bot",         status: "active",     href: "/deploy/whatsapp" },
  { id: "ch_04", type: "web",      label: "Help widget",     identifier: "acme.com/help",     backs: "Support Bot v2",     status: "active",     href: "/deploy/web-widget" },
  { id: "ch_05", type: "batch",    label: "Q2 Collections",  identifier: "4,210 contacts",    backs: "Collections Outreach", status: "scheduled", href: "/deploy/batch-calls" },
  { id: "ch_06", type: "code",     label: "SDK embed",       identifier: "token auth",        backs: "Aria",               status: "active",     href: "/deploy/code" },
  { id: "ch_07", type: "phone",    label: "Toll-Free",       identifier: "+1 (800) 555-0199", backs: "—",                  status: "unassigned", href: "/deploy/phone-numbers" },
]

const FILTERS: { id: "all" | ChannelType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "phone", label: "Phone numbers" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "web", label: "Web" },
  { id: "batch", label: "Batch" },
  { id: "code", label: "Code" },
]

export function ChannelsPanel() {
  const [filter, setFilter] = React.useState<"all" | ChannelType>("all")
  const rows = filter === "all" ? CHANNELS : CHANNELS.filter((c) => c.type === filter)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Deployment Channels</h2>
          <p className="text-xs text-muted-foreground">
            Everywhere your agents answer — phone, WhatsApp, web, batch, and code. Filter by type.
          </p>
        </div>
        <AddPhoneNumberSheet>
          <Button size="sm" className="gap-1.5">
            <Phone className="h-4 w-4" /> Connect a number (SIP)
          </Button>
        </AddPhoneNumberSheet>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id
          const count = f.id === "all" ? CHANNELS.length : CHANNELS.filter((c) => c.type === f.id).length
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label} <span className="tabular-nums opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[48px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => {
                const meta = TYPE_META[c.type]
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                          <meta.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{c.label}</div>
                          <div className="font-mono text-xs text-muted-foreground">{c.identifier}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.backs}</TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === "active" ? "default" : c.status === "scheduled" ? "secondary" : "outline"}
                        className="text-xs capitalize"
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={c.href}>Manage <ArrowUpRight className="ml-auto h-3.5 w-3.5" /></Link>
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
    </div>
  )
}
