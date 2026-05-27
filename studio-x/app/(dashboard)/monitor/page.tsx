import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { InsightsCrossLinks } from "@/components/insights-cross-links"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const METRICS = [
  { label: "Total Calls", value: "24,831", delta: "+12%", trend: "up", sub: "vs. last 30 days" },
  { label: "Avg Handle Time", value: "2m 08s", delta: "-6s", trend: "up", sub: "lower is better" },
  { label: "Completion Rate", value: "87.4%", delta: "+3.1pp", trend: "up", sub: "vs. last 30 days" },
  { label: "Transfer Rate", value: "14.2%", delta: "+0.8pp", trend: "down", sub: "vs. last 30 days" },
  { label: "No Answer Rate", value: "8.9%", delta: "-1.2pp", trend: "up", sub: "vs. last 30 days" },
  { label: "Active Agents", value: "3", delta: "+1", trend: "up", sub: "vs. last 30 days" },
]

const TOP_AGENTS = [
  { name: "Support Bot v2", calls: 12430, completionRate: 91, avgDuration: "2m 05s" },
  { name: "Appointment Setter", calls: 5601, completionRate: 88, avgDuration: "3m 12s" },
  { name: "Survey Bot", calls: 4920, completionRate: 94, avgDuration: "1m 18s" },
  { name: "Sales Qualifier", calls: 1880, completionRate: 76, avgDuration: "2m 44s" },
]

export default function MonitorPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Monitor"
        description="How well it's running — completion rate, latency, errors across all agents."
        actions={
          <div className="flex items-center gap-2">
            <Select defaultValue="30d">
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {METRICS.map((m) => (
            <Card key={m.label}>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs">{m.label}</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xl font-semibold tracking-tight">{m.value}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {m.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : m.trend === "down" ? (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  ) : (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  )}
                  <p className="text-xs text-muted-foreground">{m.delta}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts placeholder + table */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">By Agent</TabsTrigger>
            <TabsTrigger value="campaigns">By Campaign</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-2">
            {/* Chart placeholder */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Calls Over Time</CardTitle>
                <CardDescription>Daily call volume for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Chart visualization</p>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              {["Completion Rate", "Avg Handle Time"].map((title) => (
                <Card key={title}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 flex items-center justify-center rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Chart</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="agents" className="pt-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Agent Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {TOP_AGENTS.map((a, i) => (
                  <div
                    key={a.name}
                    className={`flex items-center gap-4 py-3 text-sm ${i < TOP_AGENTS.length - 1 ? "border-b" : ""}`}
                  >
                    <span className="w-5 text-xs text-muted-foreground tabular-nums font-medium">{i + 1}</span>
                    <p className="flex-1 font-medium">{a.name}</p>
                    <div className="text-right">
                      <p className="tabular-nums font-medium">{a.calls.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">calls</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums font-medium">{a.completionRate}%</p>
                      <p className="text-xs text-muted-foreground">completion</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums font-medium">{a.avgDuration}</p>
                      <p className="text-xs text-muted-foreground">avg</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="pt-2">
            <Card>
              <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Campaign breakdown chart
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="pt-2">
            <Card>
              <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Platform usage metrics
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <InsightsCrossLinks source="monitor" />
      </main>
    </div>
  )
}
