"use client"

import * as React from "react"
import Link from "next/link"
import {
  Phone, MessageCircle, MessageSquare, Globe, PhoneOutgoing, Code2, MoreHorizontal, ArrowUpRight,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AddPhoneNumberSheet } from "@/components/add-phone-number-sheet"
import { ChannelSheet } from "@/components/channel-sheet"
import {
  channelBindings, ROW_KIND_LABEL, READINESS_LABEL, READINESS_TONE,
  type ChannelRowKind,
} from "@/lib/channels"
import { cn } from "@/lib/utils"

/**
 * ChannelsPanel — the Channels overview (2026-06-23: "Deployment" renamed to
 * "Channels"; lives as a tab in the Integrations modules hub). Every channel an
 * agent can run on — phone numbers, WhatsApp, web widget, batch
 * (outbound), code/SDK — in one filterable list. One channel backs one agent
 * (1 agent ↔ 1 channel); duplicate an agent to put it on another channel.
 *
 * The rows are DERIVED (18, 2026-09-17). The hand-written array they replace
 * was a second record of data PHONE_NUMBERS and DEPLOYMENTS already hold,
 * which is what put a live-looking WhatsApp channel, disagreeing with its own
 * deployment record, and a bare comma in the Agent column on this page. The
 * status enum they replace had three words and no word for any state this
 * page is made of: `lib/channels.ts` owns the four that have a producer.
 */

const TYPE_ICON: Record<ChannelRowKind, React.ComponentType<{ className?: string }>> = {
  telephony: Phone,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  web: Globe,
  batch: PhoneOutgoing,
  code: Code2,
}

/** The filter chips, in the order the rows arrive. Labels come from the one
 *  map, so a chip can never say a different word than the badge beside it. */
const FILTER_KINDS: ChannelRowKind[] = ["telephony", "whatsapp", "web", "sms", "batch", "code"]

const TONE_DOT: Record<"success" | "warning" | "muted", string> = {
  success: "bg-success",
  warning: "bg-warning",
  muted: "bg-muted-foreground/50",
}

export function ChannelsPanel() {
  const [filter, setFilter] = React.useState<"all" | ChannelRowKind>("all")
  // Reads PHONE_NUMBERS, DEPLOYMENTS and AGENTS once: module data, so the rows
  // are stable for the life of the panel.
  const channels = React.useMemo(() => channelBindings(), [])
  const rows = filter === "all" ? channels : channels.filter((c) => c.kind === filter)

  // The door for a row that has no page and never should have one.
  const [sheetFor, setSheetFor] = React.useState<ChannelRowKind | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Deployment Channels</h2>
          <p className="text-xs text-muted-foreground">
            Everywhere your agents answer: phone, WhatsApp, web, batch, and code. Filter by type.
          </p>
        </div>
        <AddPhoneNumberSheet>
          <Button size="sm" className="gap-1.5">
            <Phone className="h-4 w-4" /> Add phone number
          </Button>
        </AddPhoneNumberSheet>
      </div>

      {/* Type filter */}
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => { if (v) setFilter(v as "all" | ChannelRowKind) }}
        variant="outline"
        size="sm"
        className="flex-wrap"
        aria-label="Filter channels by type"
      >
        <ToggleGroupItem value="all" className="rounded-full text-xs">
          All <span className="tabular-nums opacity-60">{channels.length}</span>
        </ToggleGroupItem>
        {FILTER_KINDS.map((kind) => (
          <ToggleGroupItem key={kind} value={kind} className="rounded-full text-xs">
            {ROW_KIND_LABEL[kind]}{" "}
            <span className="tabular-nums opacity-60">
              {channels.filter((c) => c.kind === kind).length}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

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
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    <p className="text-sm font-medium">
                      {filter === "all"
                        ? "No channels yet"
                        : `No ${ROW_KIND_LABEL[filter].toLowerCase()} channels yet`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connect one to put an agent on this channel.
                    </p>
                  </TableCell>
                </TableRow>
              )}
              {rows.map((c) => {
                const Icon = TYPE_ICON[c.kind]
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          {/* Plain text: Manage is the row's one door, and a
                              name that linked to a redirect was half the loop. */}
                          <p className="text-sm font-medium">{c.label}</p>
                          {c.identifier ? (
                            <div className="font-mono text-xs text-muted-foreground">{c.identifier}</div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{ROW_KIND_LABEL[c.kind]}</Badge>
                    </TableCell>
                    {/* A cell with no value renders nothing. "No agent yet" is
                        for a channel you could still bind: on a row Agora
                        cannot serve, the word "yet" would be said twice and
                        one of them would be a promise. */}
                    <TableCell className="text-sm">
                      {c.agent ?? (c.readiness === "not_supported" ? "" : "No agent yet")}
                    </TableCell>
                    <TableCell>
                      {/* The heaviest ink in a table belongs to the action, not
                          to a state: every readiness word is an outline pill
                          with a tone dot, and none of the four is an error. */}
                      <Badge variant="outline" className="gap-1.5 text-xs">
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[READINESS_TONE[c.readiness]])}
                          aria-hidden
                        />
                        {READINESS_LABEL[c.readiness]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${c.label}`}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {c.href ? (
                            <DropdownMenuItem asChild>
                              <Link href={c.href}>Manage <ArrowUpRight className="ml-auto h-3.5 w-3.5" /></Link>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => setSheetFor(c.kind)}>
                              See what {ROW_KIND_LABEL[c.kind]} needs
                            </DropdownMenuItem>
                          )}
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

      <ChannelSheet
        open={sheetFor !== null}
        onOpenChange={(o) => { if (!o) setSheetFor(null) }}
        focus={sheetFor ?? undefined}
      />
    </div>
  )
}
