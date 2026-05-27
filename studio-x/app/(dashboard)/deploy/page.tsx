import Link from "next/link"
import {
  Phone, Globe, MessageCircle, MessageSquare, Hash, Code2,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CatalogCard, type CatalogCardStatus } from "@/components/catalog-card"

// ─── deployment channels — catalog entries ──────────────────────────────────
// Same shape as Integrations Connectors + Extensions for visual consistency.

type Channel = {
  id: string
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  status: CatalogCardStatus
  /** "2 live" / "Connected" / etc. — appears as a small status pill */
  statusLabel?: string
  meta?: string
  group: "popular" | "messaging" | "developer"
}

const CHANNELS: Channel[] = [
  // Popular
  { id: "telephony", group: "popular", name: "Telephony", href: "/deploy/telephony",
    icon: Phone, status: "connected", statusLabel: "2 live",
    description: "Inbound + outbound PSTN calls. Bring your own carrier or buy a number from Agora.",
    meta: "Setup: ~10 min" },
  { id: "widget", group: "popular", name: "Web Widget", href: "/deploy/widget",
    icon: Globe, status: "available",
    description: "Drop a chat / voice button on your website with one script tag.",
    meta: "Setup: ~5 min" },

  // Messaging
  { id: "whatsapp", group: "messaging", name: "WhatsApp", href: "/deploy/whatsapp",
    icon: MessageCircle, status: "available",
    description: "Take voice + text on WhatsApp Business. Verified sender required.",
    meta: "Approval: ~1 business day" },
  { id: "sms", group: "messaging", name: "SMS", href: "/deploy/sms",
    icon: MessageSquare, status: "available",
    description: "Two-way text conversations using your existing phone numbers.",
    meta: "Setup: ~10 min" },
  { id: "slack", group: "messaging", name: "Slack", href: "/deploy/slack",
    icon: Hash, status: "coming-soon",
    description: "Add the agent as a Slack bot — mentions, DMs, channels.",
    meta: "Join the waitlist" },

  // Developer
  { id: "api", group: "developer", name: "Direct API", href: "/deploy/api",
    icon: Code2, status: "connected", statusLabel: "1 live",
    description: "Embed the agent in your own app via the Agora SDK. Full UI control.",
    meta: "Setup: ~30 min" },
]

const GROUPS: { id: Channel["group"]; title: string }[] = [
  { id: "popular",   title: "Most popular" },
  { id: "messaging", title: "Messaging" },
  { id: "developer", title: "Build your own" },
]

// ─── page ───────────────────────────────────────────────────────────────────

export default function DeployHubPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Channels"
        description="Where your agent answers. One agent can deploy to multiple channels in parallel."
      />

      <main className="flex-1 p-6 space-y-8">
        {GROUPS.map((g) => {
          const items = CHANNELS.filter((c) => c.group === g.id)
          if (items.length === 0) return null
          return (
            <section key={g.id}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {g.title}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <CatalogCard
                    key={c.id}
                    name={c.name}
                    description={c.description}
                    href={c.href}
                    icon={c.icon}
                    status={c.status}
                    statusLabel={c.statusLabel}
                    meta={c.meta}
                    actionLabel={c.status === "connected" ? "Manage" : "Set up"}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {/* Help footer — request a channel */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Need a channel that isn't here?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Microsoft Teams, Discord, custom IVRs, in-game voice — tell us what you need.
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
