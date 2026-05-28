"use client"

import { Plus, CreditCard, MoreHorizontal, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"

const CARDS = [
  { id: "pm_01", brand: "Visa",       last4: "4242", expires: "12 / 28", primary: true,  type: "Personal"  },
  { id: "pm_02", brand: "Mastercard", last4: "8210", expires: "06 / 27", primary: false, type: "Corporate" },
]

export default function PaymentMethodsPage() {
  return (
    <main className="flex-1 p-6">
      <div className="space-y-5">
        {/* ─── Balance summary ─────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Account Balance</CardTitle>
            <Button size="sm">Add Funds</Button>
          </CardHeader>
          <CardContent className="flex gap-12">
            <div>
              <p className="text-xs text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-semibold tracking-tight tabular-nums mt-1">$1,286</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reserved Balance</p>
              <p className="text-2xl font-semibold tracking-tight tabular-nums mt-1">$12</p>
            </div>
          </CardContent>
        </Card>

        {/* ─── Saved payment methods ───────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Saved Payment Methods</CardTitle>
            <CardDescription className="text-xs">
              Add up to 5 payment methods. The primary card is charged first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {CARDS.map((c) => (
              <div key={c.id} className="flex items-center gap-4 rounded-lg border bg-background p-4">
                <div className="flex h-9 w-14 items-center justify-center rounded-md border bg-muted/50">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{c.brand} •••• {c.last4}</p>
                    {c.primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                    <Badge variant="outline" className="text-xs">{c.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">Expires {c.expires}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!c.primary && <DropdownMenuItem>Set as primary</DropdownMenuItem>}
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DestructiveActionDialog
                      action="Remove"
                      resource="card"
                      resourceId={c.id}
                      resourceName={`${c.brand} ending in ${c.last4}`}
                    >
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DestructiveActionDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            <Button variant="outline" className="w-full gap-1.5">
              <Plus className="h-4 w-4" /> Add Payment Method
            </Button>
          </CardContent>
        </Card>

        {/* ─── Billing address ─────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" /> Billing Address
            </CardTitle>
            <Button variant="ghost" size="sm">Edit</Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Name</Label><Input defaultValue="Shakti Soni" readOnly /></div>
            <div className="space-y-1.5"><Label>Company</Label><Input defaultValue="Acme Inc." readOnly /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Street Address</Label><Input defaultValue="123 Market Street, Suite 400" readOnly /></div>
            <div className="space-y-1.5"><Label>City</Label><Input defaultValue="San Francisco" readOnly /></div>
            <div className="space-y-1.5"><Label>State</Label><Input defaultValue="CA" readOnly /></div>
            <div className="space-y-1.5"><Label>ZIP</Label><Input defaultValue="94103" readOnly /></div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Select defaultValue="US">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="JP">Japan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
