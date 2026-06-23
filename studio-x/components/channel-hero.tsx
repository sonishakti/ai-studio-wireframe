"use client"

import * as React from "react"
import Link from "next/link"
import { PhoneIncoming, PhoneOutgoing, Code2, Globe, Phone } from "lucide-react"
import { AddPhoneNumberSheet } from "@/components/add-phone-number-sheet"
import { track, Events } from "@/lib/analytics"

// Minimal shape so this works for both a full Agent (home) and an in-progress
// draft agent (the editor's Deployment section) that may not be saved yet.
type HeroAgent = { id: string; name: string; status: string }

/**
 * ChannelHero — the "where do you deploy this agent" cards (extracted from
 * go-live-home so the agent editor's Deployment section reuses the exact same
 * surface). Telephony = connect your own number via SIP (Agora doesn't sell or
 * port numbers); web/code are card-free. Cards carry ?agent={id}.
 */

export function ChannelHero({ agent, showNote = true }: { agent: HeroAgent; showNote?: boolean }) {
  const p = `?agent=${agent.id}`
  return (
    <section id="channels" className="scroll-mt-6 space-y-3">
      {showNote && agent.status !== "live" && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{agent.name}</span> isn&apos;t live yet —
          deploying it to a channel will publish it. Going live is free.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChannelCard
          href={`/deploy/inbound/new${p}`}
          channel="inbound"
          agentId={agent.id}
          icon={PhoneIncoming}
          title="Answer a phone number"
          desc="Your agent picks up every inbound call, 24/7."
          footer={<SipConnect />}
        />
        <ChannelCard
          href={`/deploy/batch-calls/new${p}`}
          channel="campaign"
          agentId={agent.id}
          icon={PhoneOutgoing}
          title="Launch batch calls"
          desc="Upload a list of contacts and your agent dials each one."
          footer={<SipConnect />}
        />
        <ChannelCard
          href="/deploy/code"
          channel="code"
          agentId={agent.id}
          icon={Code2}
          title="Embed in your app"
          desc="Drop in the web widget or call the API — no number needed."
          footer={
            <Link
              href="/deploy/web-widget"
              className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
            >
              <Globe className="h-4 w-4 text-muted-foreground" /> Web widget
            </Link>
          }
        />
      </div>
    </section>
  )
}

// Bring-your-own number via SIP — Agora doesn't sell or port numbers, so the
// realistic telephony step is connecting a carrier number (Twilio/Telnyx/…).
export function SipConnect() {
  return (
    <AddPhoneNumberSheet>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
      >
        <Phone className="h-4 w-4 text-muted-foreground" /> Connect your number (SIP)
      </button>
    </AddPhoneNumberSheet>
  )
}

function ChannelCard({
  href,
  channel,
  agentId,
  icon: Icon,
  title,
  desc,
  footer,
}: {
  href: string
  channel: "campaign" | "inbound" | "code"
  agentId: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  footer: React.ReactNode
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm">
        {footer}
      </div>
      <Link
        href={href}
        onClick={() => track(Events.put_to_work_selected, { channel, agent_id: agentId })}
        aria-label={title}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}
