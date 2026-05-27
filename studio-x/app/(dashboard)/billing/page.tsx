import Link from "next/link"
import { ArrowRight, MoreHorizontal, Plus, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

const PAYMENT_METHODS = [
  { kind: "visa",       last4: "4242", brand: "Visa",       primary: true  },
  { kind: "mastercard", last4: "8210", brand: "Mastercard", primary: false },
]

export default function BillingOverviewPage() {
  return (
    <main className="flex-1 p-6">
      <div className="space-y-5">
        {/* ─── Balance summary ─────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Account Balance</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">Transaction history</Button>
              <Button size="sm">Add Funds</Button>
            </div>
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
                <Link href="/usage">View details <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-[10px]">Free tier</Badge>
              <span className="text-sm font-semibold tabular-nums">64% Used</span>
            </div>
            <Progress value={64} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 tabular-nums">
              <span>176K mins used</span>
              <span>224K of 400K mins left</span>
            </div>
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
                {pm.primary && <Badge variant="secondary" className="text-[10px]">Primary</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">{pm.brand}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
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
  )
}
