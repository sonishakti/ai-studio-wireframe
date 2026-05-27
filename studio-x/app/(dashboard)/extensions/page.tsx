import { Store, Search, ExternalLink, Check } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const EXTENSIONS = [
  {
    id: "ext_cloud_recording",
    name: "Cloud Recording",
    vendor: "Agora",
    description: "Record all channels to cloud storage in real-time. Supports composite and individual recording modes.",
    category: "Recording",
    installed: true,
    price: "Pay-per-use",
  },
  {
    id: "ext_active_fence",
    name: "ActiveFence Content Moderation",
    vendor: "ActiveFence",
    description: "AI-powered content moderation for real-time audio and video streams.",
    category: "Safety",
    installed: false,
    price: "Free tier available",
  },
  {
    id: "ext_spatial_audio",
    name: "Spatial Audio",
    vendor: "Agora",
    description: "3D positional audio for immersive voice experiences in virtual environments.",
    category: "Audio",
    installed: false,
    price: "Contact sales",
  },
  {
    id: "ext_transcription",
    name: "Real-Time Transcription",
    vendor: "Agora",
    description: "Live speech-to-text transcription for calls and conferences.",
    category: "AI",
    installed: true,
    price: "Pay-per-use",
  },
  {
    id: "ext_noise_cancel",
    name: "AI Noise Cancellation",
    vendor: "Agora",
    description: "Remove background noise and echo from voice calls using deep learning.",
    category: "Audio",
    installed: false,
    price: "Pay-per-use",
  },
  {
    id: "ext_sentiment",
    name: "Sentiment Analysis",
    vendor: "DeepAffects",
    description: "Real-time sentiment and emotion detection for customer service calls.",
    category: "AI",
    installed: false,
    price: "Free trial",
  },
]

const installed = EXTENSIONS.filter((e) => e.installed)
const available = EXTENSIONS.filter((e) => !e.installed)

function ExtensionCard({ ext }: { ext: typeof EXTENSIONS[0] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
          <Store className="h-5 w-5 text-muted-foreground" />
        </div>
        {ext.installed && (
          <Badge variant="default" className="shrink-0">
            <Check className="h-3 w-3 mr-1" /> Installed
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-3">
        <div>
          <CardTitle className="text-sm">{ext.name}</CardTitle>
          <CardDescription className="text-xs mt-0.5">by {ext.vendor}</CardDescription>
        </div>
        <p className="text-xs text-muted-foreground flex-1">{ext.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{ext.price}</span>
          <Badge variant="outline" className="text-xs">{ext.category}</Badge>
        </div>
        <Button
          variant={ext.installed ? "outline" : "default"}
          size="sm"
          className="w-full gap-1.5"
        >
          {ext.installed ? "Manage" : "Install"}
          {!ext.installed && <ExternalLink className="h-3.5 w-3.5" />}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ExtensionsPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        crumbs={[{ label: "Extensions Marketplace" }]}
        title="Extensions Marketplace"
        description="Add capabilities to your project — recording, AI, safety, and more."
      />

      <main className="flex-1 p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search extensions…" className="pl-8 h-8 text-sm" />
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({EXTENSIONS.length})</TabsTrigger>
            <TabsTrigger value="installed">Installed ({installed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {EXTENSIONS.map((ext) => (
                <ExtensionCard key={ext.id} ext={ext} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="installed" className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {installed.map((ext) => (
                <ExtensionCard key={ext.id} ext={ext} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
