import Link from "next/link"
import { ArrowRight, MoreHorizontal, Plus, CreditCard, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/page-header"
import { freeMinutesStats } from "@/lib/campaign-data"

const PAYMENT_METHODS = [
  { kind: "visa",       last4: "4242", brand: "Visa",       primary: true  },
  { kind: "mastercard", last4: "8210", brand: "Mastercard", primary: false },
]

export default function BillingOverviewPage() {
  const { plan, included, used, pctUsed, remaining } = freeMinutesStats()
  // A fresh account that has never consumed a minute shouldn't see a fabricated
  // current-period meter — branch on real usage from the single source of truth.
  const hasUsage = used > 0

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

          {/* ─── Current period usage ────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">Current Period</CardTitle>
                  <CardDescription className="text-xs mt-0.5">May 1 – May 31, 2026</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/billing/usage">View details <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hasUsage ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">{plan} tier</Badge>
                    <span className="text-sm font-semibold tabular-nums">{pctUsed}% Used</span>
                  </div>
                  <Progress value={pctUsed} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 tabular-nums">
                    <span>{used.toLocaleString()} mins used</span>
                    <span>{remaining.toLocaleString()} of {included.toLocaleString()} mins left</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-3">
                  <Gift className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">No usage yet this period</p>
                    <p className="text-xs text-muted-foreground">
                      Your {included.toLocaleString()} free minutes are ready. Put your agent live to start the meter.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/deploy">Go live <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
