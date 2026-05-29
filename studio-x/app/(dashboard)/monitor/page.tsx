"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CAMPAIGNS, STATUS_BADGE, formatDuration } from "@/lib/campaign-data"

// ─── cross-product KPIs ─────────────────────────────────────────────────────

const TOTAL_CALLS = CAMPAIGNS.reduce((sum, c) => sum + c.metrics.calls, 0)
const ACTIVE_CAMPAIGNS = CAMPAIGNS.filter((c) => c.status === "active" || c.status === "in_progress").length
const AVG_HANDLE_TIME = Math.round(
  CAMPAIGNS.reduce((sum, c) => sum + c.metrics.avgHandleTimeSec * c.metrics.calls, 0) /
    Math.max(1, TOTAL_CALLS),
)
const WEIGHTED_SUCCESS = Math.round(
  CAMPAIGNS.reduce((sum, c) => sum + c.metrics.successRate * c.metrics.calls, 0) /
    Math.max(1, TOTAL_CALLS),
)

const KPIS = [
  { label: "Active campaigns", value: String(ACTIVE_CAMPAIGNS), sub: `${CAMPAIGNS.length} total`, icon: Activity, trend: null },
  { label: "Calls this week", value: TOTAL_CALLS.toLocaleString(), sub: "across all campaigns", icon: CheckCircle2, trend: "+12%" },
  { label: "Avg handle time", value: formatDuration(AVG_HANDLE_TIME), sub: "all channels", icon: Clock, trend: "-3s" },
  { label: "Success rate", value: `${WEIGHTED_SUCCESS}%`, sub: "weighted by volume", icon: TrendingUp, trend: "+2%" },
  { label: "Avg latency", value: "412 ms", sub: "first-token, voice", icon: Activity, trend: null },
  { label: "Errors", value: "0.4%", sub: "of completed calls", icon: AlertCircle, trend: "-0.1%" },
]

const TOP_CAMPAIGNS = [...CAMPAIGNS]
  .sort((a, b) => b.metrics.calls - a.metrics.calls)
  .slice(0, 6)

export default function MonitorPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Monitor"
        description="Real-time performance across every agent and campaign in this project."
        actions={
          <div className="flex items-center gap-2">
            <Select defaultValue="24h">
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last hour</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-5">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {KPIS.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </p>
                  <k.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-2xl font-semibold tabular-nums">{k.value}</p>
                <div className="flex items-center gap-1.5 text-xs">
                  {k.trend && (
                    <span
                      className={
                        k.trend.startsWith("+")
                          ? "text-emerald-600 flex items-center gap-0.5"
                          : "text-rose-600 flex items-center gap-0.5"
                      }
                    >
                      {k.trend.startsWith("+") ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {k.trend}
                    </span>
                  )}
                  <span className="text-muted-foreground">{k.sub}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="by-campaign">By campaign</TabsTrigger>
            <TabsTrigger value="by-agent">By agent</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Real-time latency, throughput, and transfer-rate charts will appear here.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cross-campaign rollups stream from the inference and telephony layers.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-campaign" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {TOP_CAMPAIGNS.map((c) => {
                    const max = Math.max(...TOP_CAMPAIGNS.map((x) => x.metrics.calls), 1)
                    const pct = Math.round((c.metrics.calls / max) * 100)
                    const s = STATUS_BADGE[c.status]
                    return (
                      <div key={c.id} className="flex items-center gap-3 p-4">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/campaigns/${c.id}`}
                              className="text-sm font-medium truncate hover:text-primary transition-colors"
                            >
                              {c.name}
                            </Link>
                            <Badge variant={s.variant} className="text-xs">
                              {s.label}
                            </Badge>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="text-right space-y-0.5 shrink-0">
                          <p className="text-sm font-semibold tabular-nums">
                            {c.metrics.calls.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.metrics.successRate}% success
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/campaigns/${c.id}`}>
                            Open <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-agent" className="mt-4">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Per-agent performance breakdown — calls handled, success rate, latency budgets.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
