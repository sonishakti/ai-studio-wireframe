import { Plus, Radio, MoreHorizontal, Search } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const SERVICES = [
  {
    id: "svc_rtc_01",
    name: "US Voice Gateway",
    type: "Voice Call",
    region: "us-east-1",
    status: "active",
    sessions: 14,
  },
  {
    id: "svc_rtc_02",
    name: "EU Video Room",
    type: "Video Room",
    region: "eu-west-1",
    status: "active",
    sessions: 3,
  },
  {
    id: "svc_rtc_03",
    name: "Broadcast Stream A",
    type: "Broadcast",
    region: "us-west-2",
    status: "idle",
    sessions: 0,
  },
  {
    id: "svc_rtc_04",
    name: "Chat Signaling",
    type: "Signaling",
    region: "ap-southeast-1",
    status: "active",
    sessions: 7,
  },
]

const TYPE_COLORS: Record<string, string> = {
  "Voice Call": "bg-blue-500/10 text-blue-600 border-blue-200",
  "Video Room": "bg-purple-500/10 text-purple-600 border-purple-200",
  Broadcast: "bg-orange-500/10 text-orange-600 border-orange-200",
  Signaling: "bg-green-500/10 text-green-600 border-green-200",
}

export default function RealtimeServicesPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Realtime Services" }]}
        title="Realtime Services"
        description="Manage voice, video, broadcast, and signaling infrastructure."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> New Service
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search services…" className="pl-8 h-8 text-sm" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((svc) => (
            <Card key={svc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Radio className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Badge variant={svc.status === "active" ? "default" : "secondary"} className="text-xs">
                    {svc.status}
                  </Badge>
                </div>
                <CardTitle className="text-sm mt-2">{svc.name}</CardTitle>
                <CardDescription className="text-xs">{svc.region}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                      TYPE_COLORS[svc.type] ?? ""
                    }`}
                  >
                    {svc.type}
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {svc.sessions}{" "}
                    <span className="text-xs text-muted-foreground font-normal">sessions</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
