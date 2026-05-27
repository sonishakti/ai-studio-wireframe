import { Download, Filter, FileText, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

const TRANSACTIONS = [
  { id: "txn_8j2n",  date: "May 26, 2026", type: "charge",       description: "Conversational AI Engine — May usage", method: "Visa •• 4242",       amount: "-$48.20",  status: "succeeded" },
  { id: "txn_6h1m",  date: "May 18, 2026", type: "recharge",     description: "Manual recharge",                       method: "Visa •• 4242",       amount: "+$500.00", status: "succeeded" },
  { id: "txn_4f9l",  date: "May 06, 2026", type: "charge",       description: "April invoice settlement",              method: "Mastercard •• 8210", amount: "-$152.66", status: "succeeded" },
  { id: "txn_2d7k",  date: "May 02, 2026", type: "credit",       description: "Promotional credit",                    method: "—",                   amount: "+$25.00",  status: "succeeded" },
  { id: "txn_9b3j",  date: "Apr 20, 2026", type: "refund",       description: "Partial refund — recording overage",    method: "Visa •• 4242",       amount: "+$12.10",  status: "succeeded" },
  { id: "txn_7a1h",  date: "Apr 06, 2026", type: "charge",       description: "March invoice settlement",              method: "Visa •• 4242",       amount: "-$248.20", status: "failed"    },
]

const TYPE_ICON: Record<string, typeof ArrowDownLeft> = {
  charge: ArrowUpRight,
  recharge: ArrowDownLeft,
  credit: ArrowDownLeft,
  refund: ArrowDownLeft,
}

export default function TransactionsPage() {
  return (
    <main className="flex-1 p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="charge">Charges</SelectItem>
              <SelectItem value="recharge">Recharges</SelectItem>
              <SelectItem value="credit">Credits</SelectItem>
              <SelectItem value="refund">Refunds</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="90d">
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TRANSACTIONS.map((t) => {
                  const Icon = TYPE_ICON[t.type] ?? ArrowDownLeft
                  const isDebit = t.type === "charge"
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{t.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Icon className={`h-3.5 w-3.5 ${isDebit ? "text-destructive" : "text-emerald-500"}`} />
                          <span className="text-sm capitalize">{t.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{t.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.method}</TableCell>
                      <TableCell className={`text-right tabular-nums font-medium ${isDebit ? "" : "text-emerald-600"}`}>
                        {t.amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.status === "succeeded" ? "default" : "destructive"}>
                          {t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4 text-xs text-muted-foreground leading-relaxed">
            <p className="flex items-start gap-2">
              <FileText className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Payments apply chronologically — oldest bills are settled first. Refunds reverse the most recent payment first and may change the status of recent invoices.
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
