import { CreditCard, Download, ExternalLink, ArrowRight } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const INVOICES = [
  { id: "INV-2026-05", date: "May 1, 2026", amount: "$0.00", status: "free_tier" },
  { id: "INV-2026-04", date: "Apr 1, 2026", amount: "$0.00", status: "free_tier" },
  { id: "INV-2026-03", date: "Mar 1, 2026", amount: "$0.00", status: "free_tier" },
]

export default function BillingPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Billing" }]}
        title="Billing"
        description="Manage your plan, usage, and payment methods."
        actions={
          <Button variant="outline" className="gap-1.5">
            <ExternalLink className="h-4 w-4" /> Manage via Stripe
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Current plan */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Free Plan</CardTitle>
                <CardDescription>$0 / month</CardDescription>
              </div>
              <Button asChild>
                <Link href="/billing/plans">
                  Upgrade <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { label: "Minutes used", value: "124", limit: "200", unit: "min/mo" },
                { label: "Agents", value: "3", limit: "5", unit: "agents" },
                { label: "Phone Numbers", value: "0", limit: "1", unit: "numbers" },
                { label: "Storage", value: "0.8", limit: "1", unit: "GB" },
              ].map((q) => (
                <div key={q.label} className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">{q.label}</span>
                    <span className="font-medium tabular-nums">
                      {q.value} / {q.limit} {q.unit}
                    </span>
                  </div>
                  <Progress
                    value={(parseFloat(q.value) / parseFloat(q.limit)) * 100}
                    className="h-1.5"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payment">Payment Method</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "This month", value: "$0.00", sub: "Free tier" },
                { label: "Last month", value: "$0.00", sub: "Free tier" },
                { label: "Total credits", value: "$0", sub: "No promo credits" },
              ].map((m) => (
                <Card key={m.label}>
                  <CardHeader className="pb-1 pt-4 px-4">
                    <CardDescription className="text-xs">{m.label}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-2xl font-semibold tracking-tight">{m.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="pt-4">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">Invoice</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="w-[48px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {INVOICES.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="p-4 font-mono text-xs">{inv.id}</td>
                        <td className="p-4 text-muted-foreground">{inv.date}</td>
                        <td className="p-4 tabular-nums">{inv.amount}</td>
                        <td className="p-4">
                          <Badge variant="secondary">Free tier</Badge>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="pt-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">No payment method on file</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You're on the free tier — no payment required.
                  </p>
                </div>
                <Button variant="outline" size="sm">Add Payment Method</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
