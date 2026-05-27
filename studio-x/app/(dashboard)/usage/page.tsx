import { Download, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const USAGE_METERS = [
  { label: "Conversational AI minutes", used: 124, limit: 200, unit: "min" },
  { label: "Voice minutes",             used: 4218, limit: 10000, unit: "min" },
  { label: "Cloud Recording",           used: 0.8, limit: 1, unit: "GB" },
  { label: "Real-Time STT",             used: 312, limit: 1000, unit: "min" },
  { label: "Concurrent channels",       used: 12, limit: 50, unit: "ch" },
  { label: "Storage",                   used: 0.8, limit: 5, unit: "GB" },
]

const TOP_SERVICES = [
  { service: "Conversational AI Engine", minutes: 4218, cost: "$0.00" },
  { service: "Voice Calling", minutes: 2104, cost: "$0.00" },
  { service: "Real-Time STT", minutes: 312, cost: "$0.00" },
  { service: "Cloud Recording", minutes: 88, cost: "$0.00" },
]

export default function UsagePage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Usage"
        description="Track consumption across all Agora services for this project."
        actions={
          <div className="flex items-center gap-2">
            <Select defaultValue="current">
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current period</SelectItem>
                <SelectItem value="last">Last period</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        <Tabs defaultValue="meters">
          <TabsList>
            <TabsTrigger value="meters">Meters</TabsTrigger>
            <TabsTrigger value="by-service">By Service</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Meters */}
          <TabsContent value="meters" className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {USAGE_METERS.map((m) => {
                const pct = (m.used / m.limit) * 100
                return (
                  <Card key={m.label}>
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs">{m.label}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-semibold tracking-tight tabular-nums">{m.used.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          / {m.limit.toLocaleString()} {m.unit}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5 mt-3" />
                      <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
                        {pct.toFixed(0)}% used
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* By service */}
          <TabsContent value="by-service" className="pt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Top services this period</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {TOP_SERVICES.map((s, i) => (
                  <div
                    key={s.service}
                    className={`flex items-center gap-4 py-3 text-sm ${
                      i < TOP_SERVICES.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                    <p className="flex-1 font-medium">{s.service}</p>
                    <span className="tabular-nums">{s.minutes.toLocaleString()} min</span>
                    <span className="tabular-nums text-muted-foreground w-20 text-right">{s.cost}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="pt-4">
            <Card>
              <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                <TrendingUp className="h-4 w-4 mr-2" /> Daily usage chart
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
