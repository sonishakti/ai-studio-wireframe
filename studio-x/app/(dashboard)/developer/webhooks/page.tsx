"use client"

import { Plus, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"

const WEBHOOKS = [
  { id: "wh_01", url: "https://api.acme.com/hooks/agora", events: ["call.completed", "call.failed", "agent.error"], status: "active", lastDelivery: "2 min ago" },
  { id: "wh_02", url: "https://crm.acme.com/agora-events", events: ["campaign.completed"], status: "active", lastDelivery: "1 day ago" },
]

const EVENTS = [
  "call.started", "call.completed", "call.failed", "call.transferred",
  "campaign.started", "campaign.completed", "campaign.paused",
  "agent.published", "agent.error",
]

export default function WebhooksPage() {
  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Receive real-time events via HTTP POST to your endpoints.
        </p>
        <Button size="sm"><Plus className="h-4 w-4" /> Add Endpoint</Button>
      </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Delivery</TableHead>
                  <TableHead className="w-[48px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {WEBHOOKS.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell className="font-mono text-xs">{wh.url}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{wh.events.join(", ")}</TableCell>
                    <TableCell><Badge variant="default">{wh.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{wh.lastDelivery}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
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
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Available Events</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {EVENTS.map((e) => <Badge key={e} variant="secondary" className="font-mono text-xs">{e}</Badge>)}
          </CardContent>
        </Card>
    </main>
  )
}
