"use client"

import * as React from "react"
import { Plus, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SectionRow, SectionRows } from "@/components/wizard/section-row"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"

/** The NCS event catalogue, by the id the payload carries. */
const EVENTS: { id: number; name: string }[] = [
  { id: 101, name: "Agent joined" },
  { id: 102, name: "Agent left" },
  { id: 103, name: "Agent history" },
  { id: 110, name: "Agent error" },
  { id: 111, name: "Agent metrics" },
  { id: 201, name: "Inbound call state" },
  { id: 202, name: "Outbound call state" },
]

const eventLabel = (id: number) => {
  const e = EVENTS.find((x) => x.id === id)
  return e ? `${e.name} (${e.id})` : String(id)
}

// No lastDelivery: nothing reports whether a message arrived, so the table
// cannot carry a column for it.
const WEBHOOKS = [
  { id: "wh_01", url: "https://api.acme.com/hooks/agora", events: [110, 201, 202], status: "active" },
  { id: "wh_02", url: "https://crm.acme.com/agora-events", events: [202], status: "active" },
]

export default function WebhooksPage() {
  const [format, setFormat] = React.useState("json")

  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Receive real-time events via HTTP POST to your endpoints.
        </p>
        <Button size="sm"><Plus className="h-4 w-4" /> Add Endpoint</Button>
      </div>
        {WEBHOOKS.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No endpoints yet</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Add an endpoint to receive HTTP POST callbacks for call, campaign, and agent events as they happen.
                </p>
              </div>
              <Button size="sm"><Plus className="h-4 w-4" /> Add Endpoint</Button>
            </CardContent>
          </Card>
        ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[48px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {WEBHOOKS.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell className="font-mono text-xs">{wh.url}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {wh.events.map(eventLabel).join(", ")}
                    </TableCell>
                    <TableCell><Badge variant="default">{wh.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                            <span className="sr-only">Webhook actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View deliveries</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DestructiveActionDialog
                            action="Delete"
                            resource="webhook endpoint"
                            resourceId={wh.id}
                            resourceName={wh.url}
                            description="Future events will no longer be delivered to this URL. In-flight deliveries will complete."
                          >
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              Delete
                            </DropdownMenuItem>
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
        )}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Available events</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {EVENTS.map((e) => (
                <Badge key={e.id} variant="secondary" className="font-mono text-xs">
                  {e.name} ({e.id})
                </Badge>
              ))}
            </div>
            <SectionRows>
              <SectionRow
                label="Turns finished (112)"
                hint="This event is documented and cannot be subscribed to yet."
                className="pt-5 pb-5 first:pt-0 last:pb-0"
              >
                <p className="text-sm text-muted-foreground">Requires Engine</p>
              </SectionRow>
              <SectionRow label="Payload format" className="pt-5 pb-5 first:pt-0 last:pb-0">
                <ToggleGroup
                  type="single"
                  value={format}
                  onValueChange={(v) => { if (v) setFormat(v) }}
                  variant="outline"
                  aria-label="Payload format"
                >
                  <ToggleGroupItem
                    value="json"
                    className="h-7 px-3 text-xs font-medium data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                  >
                    JSON
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="otel"
                    disabled
                    className="h-7 px-3 text-xs font-medium data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                  >
                    OpenTelemetry · Requires Engine
                  </ToggleGroupItem>
                </ToggleGroup>
              </SectionRow>
            </SectionRows>
          </CardContent>
        </Card>
    </main>
  )
}
