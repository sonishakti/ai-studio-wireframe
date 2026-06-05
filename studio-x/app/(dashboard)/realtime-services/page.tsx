"use client"

import * as React from "react"
import Link from "next/link"
import { Info, ExternalLink, Package, ArrowRight } from "lucide-react"
import { RealtimeNav } from "@/components/realtime-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── service catalog ────────────────────────────────────────────────────────
//
// Taxonomy comes from Figma sidebar (CORE RTC / MEDIA SERVICES /
// SECURITY & INFRASTRUCTURE / VERTICAL SOLUTIONS) — these match how Agora's
// docs and SKU pages group their primitives, so the same model carries over
// to the wireframe.
//
// Status semantics:
//   active   — service is provisioned and currently emitting usage
//   enabled  — toggled on but no usage yet (default-off services that the
//              user has just flipped on)
//   default  — available but not provisioned
//   disabled — admin/feature-flag locked at the account level
// ─────────────────────────────────────────────────────────────────────────────

type Group = "CORE RTC" | "MEDIA SERVICES" | "SECURITY & INFRASTRUCTURE" | "VERTICAL SOLUTIONS"

type Service = {
  id: string
  name: string
  group: Group
  description: string
  status: "active" | "default" | "disabled"
  configure?: { id: string; label: string; defaultOn?: boolean }[]
  quota?: string
  docs?: { label: string; href: string }[]
  /** Marketplace extensions that augment this service. Surfaced inline so
   *  users don't have to dig into Account → Extensions Marketplace to find
   *  the toggle. */
  extensions?: { id: string; name: string; vendor: string; installed: boolean; price?: string }[]
}

const SERVICES: Service[] = [
  // ── CORE RTC ──────────────────────────────────────────────────────────────
  {
    id: "chat",
    name: "Chat",
    group: "CORE RTC",
    description: "In-app messaging with rich media, threads and reactions.",
    status: "active",
    configure: [
      { id: "chat-history", label: "Message history retention" },
      { id: "chat-moderation", label: "Server-side moderation" },
    ],
    quota: "Maximum concurrent users is 10,000. For higher quotas, please contact support.",
    docs: [
      { label: "Chat SDK reference", href: "#" },
      { label: "Chat pricing", href: "#" },
    ],
  },
  { id: "signaling", name: "Signaling", group: "CORE RTC", status: "active", description: "Pub/sub messaging for real-time presence and state." },
  { id: "whiteboard", name: "Interactive Whiteboard", group: "CORE RTC", status: "active", description: "Collaborative canvas for multimodal agent workflows.", configure: [{ id: "wb-replay", label: "Session replay" }], quota: "Maximum concurrent channels is 50. For higher quotas, please contact support.", docs: [{ label: "How to use Whiteboard?", href: "#" }, { label: "Whiteboard Pricing", href: "#" }] },
  { id: "conv-ai", name: "Conversational AI Engine", group: "CORE RTC", status: "active", description: "Voice AI agent runtime with low-latency LLM orchestration." },
  { id: "voice", name: "Voice Calling", group: "CORE RTC", status: "default", description: "Real-time voice calls with HD audio over Agora SD-RTN.",
    extensions: [
      { id: "noise-cancel",  name: "AI Noise Cancellation", vendor: "Agora",      installed: false, price: "Pay-per-use" },
      { id: "transcription", name: "Real-Time Transcription", vendor: "Agora",    installed: true,  price: "Pay-per-use" },
    ],
  },
  { id: "video", name: "Video Calling", group: "CORE RTC", status: "default", description: "Real-time video calls with adaptive bitrate.",
    extensions: [
      { id: "face-ar",    name: "Face AR Effects",       vendor: "Deepar.ai",     installed: false, price: "Free trial" },
      { id: "background", name: "Virtual Background",    vendor: "Agora",         installed: false, price: "Free" },
    ],
  },
  { id: "ils", name: "Interactive Live Streaming", group: "CORE RTC", status: "default", description: "Broadcast live with sub-second latency to massive audiences." },

  // ── MEDIA SERVICES ────────────────────────────────────────────────────────
  { id: "recording", name: "Cloud Recording", group: "MEDIA SERVICES", status: "active", description: "Record channels to cloud storage in real-time.",
    extensions: [
      { id: "moderation", name: "ActiveFence Moderation", vendor: "ActiveFence", installed: false, price: "Free tier" },
    ],
  },
  { id: "player", name: "Cloud Player", group: "MEDIA SERVICES", status: "default", description: "Push pre-recorded content into a live channel." },
  { id: "media-push", name: "Media Push", group: "MEDIA SERVICES", status: "default", description: "Push Agora streams to RTMP destinations." },
  { id: "media-pull", name: "Media Pull", group: "MEDIA SERVICES", status: "default", description: "Pull external RTMP streams into an Agora channel." },
  { id: "gateway", name: "Media Gateway", group: "MEDIA SERVICES", status: "active", description: "Bridge Agora to SIP, WebRTC, or other protocols." },
  { id: "stt", name: "Real-Time STT", group: "MEDIA SERVICES", status: "default", description: "Live speech-to-text transcription." },
  { id: "screenshot", name: "Video Screenshot Upload", group: "MEDIA SERVICES", status: "default", description: "Capture frames and upload to cloud storage." },

  // ── SECURITY & INFRASTRUCTURE ─────────────────────────────────────────────
  { id: "proxy", name: "Cloud Proxy", group: "SECURITY & INFRASTRUCTURE", status: "default", description: "Route traffic through a fixed allow-list of IPs for restrictive networks." },
  { id: "cohost-auth", name: "Co-Host Authentication", group: "SECURITY & INFRASTRUCTURE", status: "default", description: "Token-based co-host privilege escalation for live streams." },

  // ── VERTICAL SOLUTIONS ────────────────────────────────────────────────────
  { id: "classroom", name: "Flexible Classroom", group: "VERTICAL SOLUTIONS", status: "default", description: "Pre-built classroom UI with whiteboard, breakouts and recording." },
]

const GROUP_ORDER: Group[] = ["CORE RTC", "MEDIA SERVICES", "SECURITY & INFRASTRUCTURE", "VERTICAL SOLUTIONS"]

// ─── component ───────────────────────────────────────────────────────────────

export default function RealtimeServicesPage() {
  const [selectedId, setSelectedId] = React.useState("chat")
  const [subToggles, setSubToggles] = React.useState<Record<string, boolean>>({})
  const selected = SERVICES.find((s) => s.id === selectedId)!
  const enabledState = selected.status !== "default" && selected.status !== "disabled"

  return (
    <div className="flex flex-col flex-1">
      <RealtimeNav />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 p-6 min-h-0">
        {/* ─── LEFT: grouped service list ──────────────────────────── */}
        <aside className="flex flex-col gap-6 overflow-auto">
          {GROUP_ORDER.map((group) => {
            const items = SERVICES.filter((s) => s.group === group)
            if (items.length === 0) return null
            return (
              <div key={group}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground px-2 mb-2">
                  {group}
                </p>
                <nav className="space-y-0.5">
                  {items.map((svc) => {
                    const isSelected = selectedId === svc.id
                    return (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedId(svc.id)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-left transition-colors",
                          isSelected
                            ? "bg-accent text-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                        )}
                      >
                        {/* Status dot */}
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            svc.status === "active" ? "bg-primary" : "bg-muted-foreground/40",
                          )}
                        />
                        <span className="flex-1 truncate leading-tight">{svc.name}</span>
                        {svc.status === "active" && (
                          <Badge
                            variant="outline"
                            className="shrink-0 h-5 px-1.5 text-xs border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          >
                            Active
                          </Badge>
                        )}
                        {svc.status === "disabled" && (
                          <Badge
                            variant="outline"
                            className="shrink-0 h-5 px-1.5 text-xs border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          >
                            Disabled
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>
            )
          })}
        </aside>

        {/* ─── RIGHT: detail panel ─────────────────────────────────── */}
        <section className="rounded-lg border bg-card flex flex-col min-h-0">
          <div className="flex items-start justify-between gap-4 p-5 border-b">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">{selected.name}</h2>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {selected.group}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{selected.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {enabledState && (
                <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs">
                  <Link href="/billing/usage">View usage <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              )}
              {selected.status === "disabled" ? (
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Disabled by admin
                </Badge>
              ) : (
                <Switch checked={enabledState} />
              )}
            </div>
          </div>

          {selected.configure && enabledState && (
            <div className="p-5 border-b">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
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

          {selected.quota && (
            <div className="px-5 py-4 border-b flex items-start gap-2.5">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Quota</p>
                <p className="text-sm text-muted-foreground mt-0.5">{selected.quota}</p>
              </div>
            </div>
          )}

          {/* Inline extensions — surface marketplace add-ons right here so
              users don't have to dig through Account → Extensions Marketplace */}
          {selected.extensions && selected.extensions.length > 0 && (
            <div className="px-5 py-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Extensions for {selected.name}
                </p>
                <a href="/extensions" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Browse all <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="space-y-2">
                {selected.extensions.map((ext) => (
                  <div key={ext.id} className="flex items-center gap-3 rounded-md border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{ext.name}</p>
                        {ext.installed && (
                          <Badge variant="default" className="text-xs h-4 px-1.5">Installed</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        by {ext.vendor}{ext.price && ` · ${ext.price}`}
                      </p>
                    </div>
                    <Button variant={ext.installed ? "outline" : "default"} size="sm" className="text-xs h-7" asChild>
                      <a href={`/extensions/${ext.id}`}>
                        {ext.installed ? "Manage" : "Install"}
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-6 px-5 py-4 border-t text-sm flex-wrap">
            {selected.docs?.map((link) => (
              <a key={link.label} href={link.href} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
            <a href="#" className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
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
