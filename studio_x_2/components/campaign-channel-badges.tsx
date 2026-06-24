"use client"

import * as React from "react"
import { Phone, MessageCircle, MessageSquare, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChannelKind, Channel } from "@/lib/campaign-data"
import { CHANNEL_LABEL } from "@/lib/campaign-data"

const CHANNEL_ICON: Record<ChannelKind, React.ComponentType<{ className?: string }>> = {
  telephony: Phone,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  web: Globe,
}

interface Props {
  /** One deployment = one channel (2026-06-11); kept as a single badge. */
  channel: Channel
  /** Show the text label next to the icon (default false — icon-only). */
  withLabel?: boolean
  /** Compact mode — used inside table rows. */
  size?: "sm" | "md"
}

export function ChannelBadge({ channel, withLabel = false, size = "sm" }: Props) {
  const Icon = CHANNEL_ICON[channel.kind]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-muted-foreground",
        size === "sm" ? "text-xs" : "text-sm",
      )}
      title={CHANNEL_LABEL[channel.kind]}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {withLabel && <span>{CHANNEL_LABEL[channel.kind]}</span>}
    </span>
  )
}
