"use client"

import Link from "next/link"
import { ArrowRight, Gift } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { UsageSpendCard } from "@/components/usage-spend-card"
import { ConcurrencyCard } from "@/components/concurrency-card"
import { useFutureScope } from "@/lib/future-scope"
import { freeMinutesStats } from "@/lib/campaign-data"

/**
 * Gates the roadmap Billing surfaces (X1 Usage & spend + A6 Concurrent lines)
 * behind the Future-scope flag. OFF → the pre-roadmap "Current period" card so
 * /billing reads as today's product; ON → the two new cards.
 */
export function BillingFutureCards() {
  const [future] = useFutureScope()
  if (future) {
    return (
      <>
        <UsageSpendCard />
        <ConcurrencyCard />
      </>
    )
  }
  return <CurrentPeriodCard />
}

/** The baseline card shown when future scope is off (mirrors the original). */
function CurrentPeriodCard() {
  const { plan, included, used, pctUsed, remaining } = freeMinutesStats()
  const hasUsage = used > 0
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm">Current Period</CardTitle>
            <CardDescription className="text-xs mt-0.5">Jul 1 – Jul 31, 2026</CardDescription>
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
  )
}
