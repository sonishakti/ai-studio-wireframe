"use client"

import * as React from "react"
import { Info, ExternalLink, Package } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── service catalog (matches Figma node 90:15778) ───────────────────────────

type Service = {
  id: string
  name: string
  category: "BUILD" | "REAL-TIME SERVICES" | "ADD-ON"
  description: string
  disabled?: boolean
  configure?: { id: string; label: string }[]
  quota?: string
  docs?: { label: string; href: string }[]
}

const SERVICES: Service[] = [
  { id: "conv-ai", name: "Conversational AI Engine", category: "REAL-TIME SERVICES", description: "Voice AI agent runtime with low-latency LLM orchestration." },
  { id: "voice", name: "Voice Calling", category: "REAL-TIME SERVICES", description: "Real-time voice calls with HD audio over Agora SD-RTN." },
  { id: "video", name: "Video Calling", category: "REAL-TIME SERVICES", description: "Real-time video calls with adaptive bitrate.", disabled: true },
  { id: "ils", name: "Interactive Live Streaming", category: "REAL-TIME SERVICES", description: "Broadcast live with sub-second latency to massive audiences." },
  { id: "signaling", name: "Signaling", category: "REAL-TIME SERVICES", description: "Pub/sub messaging for real-time presence and state.", disabled: true },
  { id: "chat", name: "Chat", category: "REAL-TIME SERVICES", description: "In-app messaging with rich media and reactions." },
  {
    id: "whiteboard",
    name: "Interactive Whiteboard",
    category: "REAL-TIME SERVICES",
    description: "Collaborative canvas for multimodal agent workflows.",
    configure: [{ id: "item-01", label: "Item 01" }, { id: "item-02", label: "Item 02" }],
    quota: "Maximum concurrent channels is 50. For a higher quota, please contact support.",
    docs: [
      { label: "How to use Whiteboard?", href: "#" },
      { label: "Whiteboard Pricing", href: "#" },
    ],
  },
  { id: "recording", name: "Cloud Recording", category: "ADD-ON", description: "Record channels to cloud storage in real-time." },
  { id: "player", name: "Cloud Player", category: "ADD-ON", description: "Push pre-recorded content into a live channel." },
  { id: "stt", name: "Real-Time STT", category: "ADD-ON", description: "Live speech-to-text transcription." },
  { id: "media-push", name: "Media Push", category: "ADD-ON", description: "Push Agora streams to RTMP destinations." },
  { id: "media-pull", name: "Media Pull", category: "ADD-ON", description: "Pull external RTMP streams into an Agora channel." },
  { id: "gateway", name: "Media Gateway", category: "ADD-ON", description: "Bridge Agora to SIP, WebRTC, or other protocols.", disabled: true },
  { id: "screenshot", name: "Video Screenshot Upload", category: "ADD-ON", description: "Capture frames and upload to cloud storage." },
]

export default function RealtimeServicesPage() {
  const [selectedId, setSelectedId] = React.useState("whiteboard")
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({ whiteboard: true })
  const [subToggles, setSubToggles] = React.useState<Record<string, boolean>>({})

  const selected = SERVICES.find((s) => s.id === selectedId)!
  const isEnabled = !!enabled[selectedId]

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Realtime Services" />

      <main className="flex-1 grid grid-cols-[240px_1fr] gap-6 p-6 min-h-0">
        {/* ─── LEFT: service list ───────────────────────────────────── */}
        <aside className="flex flex-col">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3 px-2">
            Real-Time Services
          </p>
          <nav className="space-y-0.5">
            {SERVICES.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setSelectedId(svc.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm text-left transition-colors",
                  selectedId === svc.id
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                )}
              >
                <span className="truncate">{svc.name}</span>
                {svc.disabled && (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] px-1.5 h-4"
                  >
                    Disabled
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ─── RIGHT: service detail ───────────────────────────────── */}
        <section className="rounded-lg border bg-card flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-5 border-b">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold">{selected.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selected.description}</p>
              </div>
            </div>
            {selected.disabled ? (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                Disabled by admin
              </Badge>
            ) : (
              <Switch
                checked={isEnabled}
                onCheckedChange={(v) => setEnabled((prev) => ({ ...prev, [selectedId]: v }))}
              />
            )}
          </div>

          {/* Configure section */}
          {selected.configure && (
            <div className="p-5 border-b">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Configure
              </p>
              <div className="space-y-0">
                {selected.configure.map((cfg, i) => (
                  <React.Fragment key={cfg.id}>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-sm">{cfg.label}</span>
                      <Switch
                        checked={!!subToggles[cfg.id]}
                        onCheckedChange={(v) => setSubToggles((prev) => ({ ...prev, [cfg.id]: v }))}
                      />
                    </div>
                    {i < selected.configure!.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Quota info */}
          {selected.quota && (
            <div className="px-5 py-4 border-b flex items-start gap-2.5">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Quota</p>
                <p className="text-sm text-muted-foreground mt-0.5">{selected.quota}</p>
              </div>
            </div>
          )}

          <div className="flex-1" />

          {/* Footer links */}
          <div className="flex items-center gap-6 px-5 py-4 border-t text-sm flex-wrap">
            {selected.docs?.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
            <a
              href="#"
              className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Package className="h-3.5 w-3.5" />
              Looking for noise suppression or other add-ons?
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
