import Link from "next/link"
import { ArrowRight, MoreHorizontal, Plus, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/page-header"
import { BillingFutureCards } from "@/components/billing-future-cards"

const PAYMENT_METHODS = [
  { kind: "visa",       last4: "4242", brand: "Visa",       primary: true  },
  { kind: "mastercard", last4: "8210", brand: "Mastercard", primary: false },
]

export default function BillingOverviewPage() {
  return (
    <>
      <PageHeader
        title="Billing"
        description="Balance, current-period usage, and payment methods for this project."
        actions={
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/billing/transactions">Transaction history</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/billing/payment-methods">Add Funds</Link>
            </Button>
          </>
        }
      />
      <main className="flex-1 p-6">
        <div className="space-y-5">
          {/* ─── Balance summary ─────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Account Balance</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-12">
              <div>
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums mt-1">$1,286</p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div>
                <p className="text-xs text-muted-foreground">Reserved Balance</p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums mt-1">$12</p>
              </div>
            </CardContent>
          </Card>

          {/* Future-scope gated: X1 Usage & spend + A6 Concurrent lines when
               on; the baseline Current Period card when off. */}
          <BillingFutureCards />

          {/* ─── Payment methods preview ────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Payment Methods</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/billing/payment-methods">Manage <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-0">
              {PAYMENT_METHODS.map((pm, i) => (
                <div
                  key={pm.last4}
                  className={`flex items-center gap-3 py-3 ${i < PAYMENT_METHODS.length - 1 ? "border-b" : ""}`}
                >
                  <div className="flex h-8 w-12 items-center justify-center rounded border bg-muted/50">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">•••• {pm.last4}</span>
                  {pm.primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                  <span className="text-xs text-muted-foreground ml-auto">{pm.brand}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Payment method options">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/billing/payment-methods">Manage on payment methods</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-3 gap-1.5" asChild>
                <Link href="/billing/payment-methods">
                  <Plus className="h-4 w-4" /> Add Payment Method
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
