"use client"

import * as React from "react"
import Link from "next/link"
import {
  Phone, Globe, MessageCircle, MessageSquare, Hash, Code2,
  ArrowRight, CheckCircle2, Clock, Zap,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ─── deployment channels — one source of truth ───────────────────────────────
//
// Each channel is a way for a real user to reach an Agora agent. The merge
// of Console + Studio adds these to Studio's previously-telephony-only
// deployment story. New channels can drop in here without touching the hub.

type ChannelStatus = "available" | "connected" | "coming-soon" | "beta"

type DeploymentChannel = {
  id: string
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  brandColor: string  // hex / tailwind bg
  description: string
  bestFor: string
  setupTime: string
  status: ChannelStatus
  /** Number of agents currently deployed on this channel */
  deployedCount?: number
}

const CHANNELS: DeploymentChannel[] = [
  {
    id: "telephony",
    name: "Telephony",
    href: "/deploy/telephony",
    icon: Phone,
    brandColor: "bg-blue-500",
    description: "Inbound + outbound calls over PSTN. Bring your own carrier or buy a number.",
    bestFor: "Support lines, outbound campaigns, IVR replacement",
    setupTime: "10 min",
    status: "available",
    deployedCount: 2,
  },
  {
    id: "widget",
    name: "Web Widget",
    href: "/deploy/widget",
    icon: Globe,
    brandColor: "bg-violet-500",
    description: "Drop a chat/voice button on your website. Embed snippet, full theming.",
    bestFor: "SaaS support, in-product help, public sites",
    setupTime: "5 min",
    status: "available",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    href: "/deploy/whatsapp",
    icon: MessageCircle,
    brandColor: "bg-green-500",
    description: "Take voice + text on WhatsApp Business. Verified number required.",
    bestFor: "International support, consumer apps",
    setupTime: "1 business day",
    status: "available",
  },
  {
    id: "sms",
    name: "SMS",
    href: "/deploy/sms",
    icon: MessageSquare,
    brandColor: "bg-emerald-500",
    description: "Text conversations with your agent. Two-way, with media support.",
    bestFor: "Notifications, simple Q&A, appointment confirmations",
    setupTime: "10 min",
    status: "available",
  },
  {
    id: "api",
    name: "Direct API",
    href: "/deploy/api",
    icon: Code2,
    brandColor: "bg-zinc-500",
    description: "Embed the agent in your own app via the Agora SDK. Full control.",
    bestFor: "Mobile apps, custom UIs, voice-in-game",
    setupTime: "30 min",
    status: "available",
  },
  {
    id: "slack",
    name: "Slack",
    href: "/deploy/slack",
    icon: Hash,
    brandColor: "bg-pink-500",
    description: "Add the agent to a Slack workspace as a bot. Mentions, DMs, channels.",
    bestFor: "Internal helpdesks, ops chatbots",
    setupTime: "15 min",
    status: "coming-soon",
  },
]

// ─── component ───────────────────────────────────────────────────────────────

function ChannelCard({ ch }: { ch: DeploymentChannel }) {
  const isUnavailable = ch.status === "coming-soon"
  return (
    <Card
      className={`transition-all ${
        isUnavailable
          ? "opacity-60"
          : "hover:border-foreground/30 hover:shadow-md cursor-pointer"
      }`}
    >
      <Link href={isUnavailable ? "#" : ch.href} className={isUnavailable ? "pointer-events-none" : ""}>
        <CardContent className="p-5 space-y-3">
          {/* Icon + status row */}
          <div className="flex items-start justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${ch.brandColor}`}>
              <ch.icon className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              {ch.deployedCount && ch.deployedCount > 0 ? (
                <Badge variant="default" className="text-[10px] gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" /> {ch.deployedCount} live
                </Badge>
              ) : null}
              {ch.status === "coming-soon" && <Badge variant="outline" className="text-[10px]">Coming soon</Badge>}
              {ch.status === "beta" && <Badge variant="secondary" className="text-[10px]">Beta</Badge>}
            </div>
          </div>

          {/* Title + description */}
          <div>
            <p className="text-base font-semibold">{ch.name}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {ch.description}
            </p>
          </div>

          {/* Best-for tag */}
          <div className="border-t pt-3 space-y-1.5">
            <div className="flex items-start gap-1.5">
              <Zap className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-snug">
                <span className="font-medium text-foreground">Best for:</span> {ch.bestFor}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground">
                Typical setup: <span className="font-medium tabular-nums">{ch.setupTime}</span>
              </p>
            </div>
          </div>

          {/* CTA — only on available */}
          {!isUnavailable && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-primary inline-flex items-center gap-0.5">
                Set up
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}

export default function DeployHubPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Deploy"
        description="Pick where your agent answers. Each channel works independently — deploy to as many as you need."
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Featured: telephony + widget = 80% of usage */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Most popular
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CHANNELS.filter((c) => ["telephony", "widget"].includes(c.id)).map((ch) => (
              <ChannelCard key={ch.id} ch={ch} />
            ))}
          </div>
        </section>

        {/* Messaging channels */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Messaging
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHANNELS.filter((c) => ["whatsapp", "sms", "slack"].includes(c.id)).map((ch) => (
              <ChannelCard key={ch.id} ch={ch} />
            ))}
          </div>
        </section>

        {/* Developer */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Build your own
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHANNELS.filter((c) => ["api"].includes(c.id)).map((ch) => (
              <ChannelCard key={ch.id} ch={ch} />
            ))}
          </div>
        </section>

        {/* Help footer */}
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Need a channel that isn't listed?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Discord, Microsoft Teams, custom IVRs, in-game voice — tell us what you need.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/help/contact">Request channel</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
