"use client"

import * as React from "react"
import { Phone, MessageCircle, MessageSquare, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChannelKind, CampaignChannel } from "@/lib/campaign-data"
import { CHANNEL_LABEL } from "@/lib/campaign-data"

const CHANNEL_ICON: Record<ChannelKind, React.ComponentType<{ className?: string }>> = {
  telephony: Phone,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  web: Globe,
}

interface Props {
  channels: CampaignChannel[]
  /** Show text labels next to icons (default false — icon-only). */
  withLabels?: boolean
  /** Compact mode — used inside table rows. */
  size?: "sm" | "md"
}

export function CampaignChannelBadges({ channels, withLabels = false, size = "sm" }: Props) {
  if (channels.length === 0) {
    return <span className="text-xs text-muted-foreground">No channels</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {channels.map((ch, i) => {
        const Icon = CHANNEL_ICON[ch.kind]
        return (
          <span
            key={`${ch.kind}-${i}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-muted-foreground",
              size === "sm" ? "text-xs" : "text-sm",
            )}
            title={CHANNEL_LABEL[ch.kind]}
          >
            <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {withLabels && <span>{CHANNEL_LABEL[ch.kind]}</span>}
          </span>
        )
      })}
    </div>
  )
}
