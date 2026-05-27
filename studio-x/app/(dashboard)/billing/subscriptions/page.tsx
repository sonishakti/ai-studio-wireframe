"use client"

import { MoreHorizontal, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"

const SUBS = [
  { id: "sub_01", product: "Conversational AI Engine", plan: "Pay-as-you-go",  status: "active",   started: "Feb 12, 2026", renews: "Monthly", spend: "$0.00" },
  { id: "sub_02", product: "Cloud Recording",          plan: "Pay-as-you-go",  status: "active",   started: "Mar 04, 2026", renews: "Monthly", spend: "$0.00" },
  { id: "sub_03", product: "Real-Time STT",            plan: "Free trial",     status: "trialing", started: "May 15, 2026", renews: "Jun 14, 2026", spend: "$0.00" },
  { id: "sub_04", product: "Spatial Audio",            plan: "Add-on (Pro)",   status: "cancelled",started: "Jan 10, 2026", renews: "—",       spend: "$0.00" },
]

export default function SubscriptionsPage() {
  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Subscriptions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            All product subscriptions and add-ons active on this account.
          </p>
        </div>
        <Button variant="outline" className="gap-1.5" asChild>
          <a href="#" target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Manage via Stripe
          </a>
        </Button>
      </div>
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Active subscriptions", value: SUBS.filter((s) => s.status === "active").length, sub: "across all products" },
            { label: "Monthly recurring spend", value: "$0.00", sub: "current period" },
            { label: "Add-ons enabled", value: "0", sub: "of 5 available" },
          ].map((m) => (
            <Card key={m.label}>
              <CardHeader className="pb-2"><CardDescription className="text-xs">{m.label}</CardDescription></CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">All Subscriptions</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="w-[48px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {SUBS.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.product}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.plan}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === "active" ? "default"
                          : s.status === "trialing" ? "secondary"
                          : "outline"
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.started}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.renews}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.spend}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuItem>Change plan</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DestructiveActionDialog
                            action="Cancel"
                            resource="subscription"
                            resourceId={s.id}
                            resourceName={s.product}
                            description="Cancellation takes effect at the end of the current billing period. You'll keep access until then."
                          >
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              Cancel subscription
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
    </main>
  )
}
