"use client"

import { Download, Filter, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"

const INVOICES = [
  { id: "INV-2026-05", period: "May 2026", amount: "$0.00",    status: "paid",    issued: "Jun 01, 2026" },
  { id: "INV-2026-04", period: "Apr 2026", amount: "$0.00",    status: "paid",    issued: "May 01, 2026" },
  { id: "INV-2026-03", period: "Mar 2026", amount: "$0.00",    status: "paid",    issued: "Apr 01, 2026" },
  { id: "INV-2026-02", period: "Feb 2026", amount: "$248.20",  status: "paid",    issued: "Mar 01, 2026" },
  { id: "INV-2026-01", period: "Jan 2026", amount: "$152.66",  status: "paid",    issued: "Feb 01, 2026" },
  { id: "INV-2025-12", period: "Dec 2025", amount: "$96.42",   status: "refunded",issued: "Jan 01, 2026" },
]

export default function InvoicesPage() {
  const hasInvoices = INVOICES.length > 0

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Monthly Agora bills for this project, available on the 1st of each month."
      />
      <main className="flex-1 p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All invoices</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => toast.info("Mock: pick a date range")}
            >
              <Filter className="h-3.5 w-3.5" /> Date range
            </Button>
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                disabled={!hasInvoices}
                onClick={() => toast.info("Mock: exporting invoices")}
              >
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[48px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hasInvoices ? (
                    INVOICES.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                        <TableCell className="text-sm">{inv.period}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{inv.issued}</TableCell>
                        <TableCell className="text-right tabular-nums">{inv.amount}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === "refunded" ? "outline" : "default"}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={`Download ${inv.id}`}
                            onClick={() => toast.info(`Mock: downloading ${inv.id}`)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
                        <p className="mt-3 text-sm font-medium">No invoices yet</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Your first bill arrives on the 1st of the month after your account starts billing.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed">
            <CardContent className="py-4 text-xs text-muted-foreground leading-relaxed">
              <p className="flex items-start gap-2">
                <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Monthly Agora bills are available on the 1st of each month. Amounts are deducted from your balance on the 6th. If your balance remains negative for more than 30 days, your account will be suspended per the terms of your contract. Once paid, the account is resumed immediately.
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
