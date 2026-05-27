import Link from "next/link"
import { ExternalLink, Copy, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

// Stub catalog — in production fetch via slug
const EXTENSION_INFO = {
  name: "Face AR Effects",
  vendor: "Deepar.ai",
  description: "Add 3D face masks, filters, background removal and other AR experiences to your app via Agora's Video SDK.",
  initials: "AR",
  color: "bg-red-700",
  version: "1.0.4",
  updated: "2025-10-14",
  platforms: ["Web", "macOS", "iOS"],
  features: [
    "Real-time 3D face mask and filter overlays",
    "Background removal and virtual background replacement",
    "Face beautification (smoothing, tone correction)",
    "Emotion detection and pose estimation",
    "Low-latency GPU pipeline — <2 ms processing overhead",
  ],
  changelog: [
    { version: "1.0.4", date: "2025-10-14", text: "Performance improvements; reduced GPU memory footprint by 30%." },
    { version: "1.0.3", date: "2025-08-01", text: "Added virtual background replacement. Fixed crash on Safari 17." },
    { version: "1.0.0", date: "2025-04-12", text: "Initial release." },
  ],
}

const PLANS = [
  { name: "Free Trial", price: "$0",   period: "/ project",         desc: "30 days · up to 10 concurrent users",     active: true  },
  { name: "Basic",      price: "$49",  period: "/ project / month", desc: "Unlimited users · standard support",       active: false },
  { name: "Pro",        price: "$149", period: "/ project / month", desc: "Unlimited users · priority support + SLA", active: false },
]

const ASSIGNED_PROJECTS = [
  { name: "Default Project", enabled: true },
  { name: "Staging",         enabled: true },
  { name: "Dev Sandbox",     enabled: false },
]

interface Props {
  params: Promise<{ name: string }>
}

export default async function ExtensionDetailPage({ params }: Props) {
  const { name } = await params
  const ext = EXTENSION_INFO

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title={ext.name}
        description={`by ${ext.vendor}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline">Documentation <ExternalLink className="h-3.5 w-3.5 ml-1" /></Button>
            <Button>Install</Button>
          </div>
        }
      />

      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* ─── MAIN ────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Overview */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-white font-semibold ${ext.color}`}>
                    {ext.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{ext.name}</CardTitle>
                    <CardDescription className="mt-1">{ext.description}</CardDescription>
                  </div>
                  <Badge variant="outline">v{ext.version}</Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4 py-4">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Company</p>
                  <p className="text-sm font-medium mt-1">{ext.vendor}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Version</p>
                  <p className="text-sm font-medium mt-1 tabular-nums">{ext.version}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Updated</p>
                  <p className="text-sm font-medium mt-1 tabular-nums">{ext.updated}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Platform</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ext.platforms.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <Separator />
              <CardContent className="py-4">
                <p className="text-sm font-medium mb-2">Core Features</p>
                <ul className="text-sm space-y-1.5 pl-5 list-disc text-muted-foreground">
                  {ext.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </CardContent>
            </Card>

            {/* Tabbed docs */}
            <Card>
              <CardContent className="p-4">
                <Tabs defaultValue="docs">
                  <TabsList>
                    <TabsTrigger value="docs">Documentation</TabsTrigger>
                    <TabsTrigger value="api">API Reference</TabsTrigger>
                    <TabsTrigger value="changelog">Changelog</TabsTrigger>
                  </TabsList>

                  <TabsContent value="docs" className="pt-4 space-y-3">
                    <h3 className="text-sm font-semibold">Quick Start</h3>
                    <p className="text-sm text-muted-foreground">
                      Install the extension from the marketplace and enable it for your project. Then initialise the SDK in your application:
                    </p>
                    <div className="relative rounded-lg border bg-muted/50 p-3 font-mono text-xs">
                      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <code>npm install agora-extension-face-ar@1.0.4</code>
                    </div>
                    <div className="relative rounded-lg border bg-muted/50 p-3 font-mono text-xs whitespace-pre">
                      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <code>{`import FaceARExtension from 'agora-extension-face-ar';
AgoraRTC.registerExtensions([new FaceARExtension()]);`}</code>
                    </div>
                  </TabsContent>

                  <TabsContent value="api" className="pt-4">
                    <p className="text-sm text-muted-foreground">Full API reference at the vendor's documentation.</p>
                  </TabsContent>

                  <TabsContent value="changelog" className="pt-4 space-y-3">
                    {ext.changelog.map((c) => (
                      <div key={c.version} className="text-sm">
                        <p className="font-medium">v{c.version} <span className="text-muted-foreground font-normal">· {c.date}</span></p>
                        <p className="text-muted-foreground mt-0.5">{c.text}</p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* ─── SIDEBAR ────────────────────────────────────────── */}
          <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <Card className="p-4">
              <Tabs defaultValue="plans">
                <TabsList className="w-full">
                  <TabsTrigger value="plans" className="flex-1">Plans</TabsTrigger>
                  <TabsTrigger value="projects" className="flex-1">Projects</TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="pt-3 space-y-2">
                  {PLANS.map((p) => (
                    <div
                      key={p.name}
                      className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                        p.active ? "border-primary ring-1 ring-primary/40" : "hover:border-foreground/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{p.name}</p>
                        {p.active && <Badge>Active</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                      <p className="text-base font-bold mt-2">
                        {p.price}<span className="text-xs text-muted-foreground font-normal">{p.period}</span>
                      </p>
                    </div>
                  ))}
                  <Button className="w-full mt-2">Upgrade Plan</Button>
                </TabsContent>

                <TabsContent value="projects" className="pt-3 space-y-1">
                  <p className="text-xs text-muted-foreground mb-2">
                    Enable this extension for specific projects.
                  </p>
                  {ASSIGNED_PROJECTS.map((p, i) => (
                    <div
                      key={p.name}
                      className={`flex items-center justify-between py-2 ${
                        i < ASSIGNED_PROJECTS.length - 1 ? "border-b" : ""
                      }`}
                    >
                      <span className="text-sm">{p.name}</span>
                      <Badge variant={p.enabled ? "default" : "secondary"} className="text-[10px]">
                        {p.enabled ? "Enabled" : "Off"}
                      </Badge>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
