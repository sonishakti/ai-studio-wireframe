"use client"

import * as React from "react"
import Link from "next/link"
import { Download, ArrowRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { track, Events } from "@/lib/analytics"

// ─── metrics ────────────────────────────────────────────────────────────────
// Migrated from the former /usage page. Lives under Billing now because it's
// a commercial concern, not a "what just happened?" observability surface.

type Metric = {
  id: string
  label: string
  value: number
  unit: string
  color: string
  dotColor: string
  series: number[]
}

type Workload = "agent" | "rte"

const METRICS: (Metric & { workload: Workload })[] = [
  { id: "agent",     label: "Agent Minutes", value: 18420, unit: "MIN",      color: "bg-sky-500",     dotColor: "bg-sky-500",     workload: "agent",
    series: [120, 240, 380, 510, 820, 1290, 2150, 3480, 5200, 8810, 13200, 18420] },
  { id: "video-sd",  label: "Video SD",      value: 72215, unit: "MIN",      color: "bg-violet-500",  dotColor: "bg-violet-500",  workload: "rte",
    series: [1200, 1800, 2400, 5800, 11000, 17000, 23000, 32000, 41000, 52000, 63000, 72215] },
  { id: "video-hd",  label: "Video HD",      value: 90112, unit: "MIN",      color: "bg-pink-500",    dotColor: "bg-pink-500",    workload: "rte",
    series: [800, 1100, 1900, 4200, 9800, 16500, 24000, 38000, 52000, 68000, 81000, 90112] },
  { id: "video-fhd", label: "Video Full HD", value: 60018, unit: "MIN",      color: "bg-amber-500",   dotColor: "bg-amber-500",   workload: "rte",
    series: [400, 600, 1000, 2200, 5500, 10000, 16500, 26000, 38000, 48000, 55000, 60018] },
  { id: "audio",     label: "Audio",         value: 42190, unit: "MIN",      color: "bg-emerald-500", dotColor: "bg-emerald-500", workload: "rte",
    series: [2100, 2800, 3900, 6100, 9500, 14000, 19000, 24500, 30000, 35000, 39000, 42190] },
  { id: "recording", label: "Cloud Recording", value: 1.42, unit: "GB-HRS", color: "bg-fuchsia-500", dotColor: "bg-fuchsia-500", workload: "rte",
    series: [0.02, 0.04, 0.08, 0.12, 0.22, 0.35, 0.5, 0.7, 0.92, 1.12, 1.3, 1.42] },
]

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"]

function UsageChart({ metrics, visible }: { metrics: Metric[]; visible: Record<string, boolean> }) {
  const padding = { top: 20, right: 24, bottom: 32, left: 56 }
  const width = 1000
  const height = 320
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const visMetrics = metrics.filter((m) => visible[m.id])
  const allValues = visMetrics.flatMap((m) => m.series).filter((v) => v > 0)
  const minVal = Math.max(1, Math.min(...allValues, 1))
  const maxVal = Math.max(...allValues, 100_000)
  const logMin = Math.log10(minVal)
  const logMax = Math.log10(maxVal)

  const yScale = (v: number) => {
    if (v <= 0) return innerH
    const t = (Math.log10(v) - logMin) / (logMax - logMin)
    return innerH - t * innerH
  }
  const xScale = (i: number) => (i / (MONTHS.length - 1)) * innerW

  const gridLines: number[] = []
  for (let p = Math.ceil(logMin); p <= Math.floor(logMax); p++) {
    gridLines.push(Math.pow(10, p))
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Usage trend chart">
      <g transform={`translate(${padding.left} ${padding.top})`}>
        {gridLines.map((g) => (
          <g key={g}>
            <line
              x1={0} x2={innerW} y1={yScale(g)} y2={yScale(g)}
              stroke="currentColor" strokeOpacity={0.08} strokeDasharray="3 3"
              className="text-foreground"
            />
            <text
              x={-8} y={yScale(g)}
              textAnchor="end" dominantBaseline="middle"
              className="fill-muted-foreground text-xs font-mono"
            >
              {g >= 1000 ? `${g / 1000}k` : g}
            </text>
          </g>
        ))}

        {MONTHS.map((m, i) => (
          <text
            key={m}
            x={xScale(i)} y={innerH + 18}
            textAnchor="middle"
            className="fill-muted-foreground text-xs font-mono"
          >
            {m}
          </text>
        ))}

        {visMetrics.map((metric) => {
          const points = metric.series
            .map((v, i) => `${xScale(i)},${yScale(v)}`)
            .join(" ")
          const colorClass = metric.color.replace("bg-", "stroke-")
          return (
            <g key={metric.id}>
              <polyline
                points={points}
                fill="none"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                className={colorClass}
              />
              <circle
                cx={xScale(metric.series.length - 1)}
                cy={yScale(metric.series[metric.series.length - 1])}
                r={4}
                className={`${metric.color.replace("bg-", "fill-")} stroke-card`}
                strokeWidth={2}
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

const QUOTA_METERS = [
  { label: "Conversational AI minutes", used: 18420, limit: 50000, unit: "min" },
  { label: "Voice minutes",             used: 4218,  limit: 10000, unit: "min" },
  { label: "Cloud Recording",           used: 1.42,  limit: 5,     unit: "GB-hrs" },
  { label: "Real-Time STT",             used: 312,   limit: 1000,  unit: "min" },
  { label: "Concurrent channels",       used: 12,    limit: 50,    unit: "ch" },
  { label: "Storage",                   used: 0.8,   limit: 5,     unit: "GB" },
]

const TOP_SERVICES = [
  { service: "Conversational AI Engine", usage: "18,420 min", share: 32.4, cost: "$0.00" },
  { service: "Video HD",                 usage: "90,112 min", share: 26.1, cost: "$0.00" },
  { service: "Video SD",                 usage: "72,215 min", share: 17.8, cost: "$0.00" },
  { service: "Video Full HD",            usage: "60,018 min", share: 12.2, cost: "$0.00" },
  { service: "Audio",                    usage: "42,190 min", share:  7.4, cost: "$0.00" },
  { service: "Cloud Recording",          usage: "1.42 GB-hr", share:  4.1, cost: "$0.00" },
]

type Perspective = "all" | "agent" | "rte"

export default function BillingUsagePage() {
  const [perspective, setPerspective] = React.useState<Perspective>("all")

  const [visible, setVisible] = React.useState<Record<string, boolean>>(
    Object.fromEntries(METRICS.map((m) => [m.id, true])),
  )

  React.useEffect(() => {
    setVisible(
      Object.fromEntries(
        METRICS.map((m) => [
          m.id,
          perspective === "all" || m.workload === perspective,
        ]),
      ),
    )
  }, [perspective])

  const shownMetrics = React.useMemo(
    () => (perspective === "all" ? METRICS : METRICS.filter((m) => m.workload === perspective)),
    [perspective],
  )

  return (
    <main className="flex-1 p-6 space-y-5">
      {/* Toolbar — perspective + period + export */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold">Usage</h2>
          <p className="text-sm text-muted-foreground">
            Minutes, GB, and quotas consumed by this project.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border bg-background p-0.5">
            {([
              { id: "all",   label: "All" },
              { id: "agent", label: "Agents" },
              { id: "rte",   label: "RTE" },
            ] as const).map((p) => (
              <button
                key={p.id}
                onClick={() => setPerspective(p.id)}
                className={cn(
                  "h-7 px-2.5 text-xs rounded transition-colors",
                  perspective === p.id
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Select defaultValue="12m">
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current period</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Top metric cards + chart */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex gap-6 overflow-x-auto pb-1">
            {shownMetrics.map((m) => {
              const isOn = visible[m.id]
              return (
                <button
                  key={m.id}
                  onClick={() => setVisible((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                  className={cn(
                    "shrink-0 text-left min-w-[140px] transition-opacity",
                    isOn ? "opacity-100" : "opacity-40 hover:opacity-70",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", m.dotColor)} />
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {m.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">
                      {m.unit}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="border-t -mx-6 px-6 pt-6">
            <UsageChart metrics={METRICS} visible={visible} />
            <p className="text-xs text-muted-foreground text-center mt-2">
              Click a metric card above to toggle its line on the chart.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Secondary tabs */}
      <Tabs defaultValue="quotas">
        <TabsList>
          <TabsTrigger value="quotas">Quotas</TabsTrigger>
          <TabsTrigger value="by-service">By Service</TabsTrigger>
        </TabsList>

        <TabsContent value="quotas" className="pt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUOTA_METERS.map((m) => {
              const pct = (m.used / m.limit) * 100
              const isNearLimit = pct >= 75
              return (
                <Card key={m.label} className={isNearLimit ? "border-amber-500/40" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      {isNearLimit && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-xl font-semibold tracking-tight tabular-nums">
                        {m.used.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        / {m.limit.toLocaleString()} {m.unit}
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5 mt-3" />
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {pct.toFixed(0)}% used
                      </p>
                      {isNearLimit && (
                        <Link
                          href="/billing/plans"
                          onClick={() => track(Events.quota_warning_clicked, { meter: m.label, pct_used: pct })}
                          className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          View plans
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="bg-muted/40 border-dashed">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border shrink-0">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Need more capacity?</p>
                <p className="text-xs text-muted-foreground">
                  Higher tiers unlock 50× minutes, unlimited agents, and priority routing.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/billing/plans">View plans</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-service" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-6 font-medium text-muted-foreground text-xs uppercase tracking-wider">Service</th>
                    <th className="py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Usage</th>
                    <th className="py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Share</th>
                    <th className="py-3 pr-6 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_SERVICES.map((s, i) => (
                    <tr key={s.service} className={i < TOP_SERVICES.length - 1 ? "border-b" : ""}>
                      <td className="py-3 px-6 font-medium">{s.service}</td>
                      <td className="py-3 tabular-nums">{s.usage}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <Progress value={s.share} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                            {s.share}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-6 text-right tabular-nums text-muted-foreground">{s.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
