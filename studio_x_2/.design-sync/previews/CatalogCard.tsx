import { CatalogCard } from 'studio-x'
import { Phone, BookOpen, ShieldCheck } from 'lucide-react'

// Three CatalogCards side by side — the shared shape across Channels,
// Integrations connectors, and the Extensions Marketplace. Shows the
// connected / available / coming-soon status spread with realistic
// voice-AI surfaces.
export const Grid = () => (
  <div className="grid w-[760px] grid-cols-3 gap-4">
    <CatalogCard
      name="Phone (SIP)"
      description="Inbound + outbound calls over your own SIP trunk."
      icon={Phone}
      status="connected"
      statusLabel="2 live"
      meta="Pay-per-minute"
      actionLabel="Manage"
      href="#"
    />
    <CatalogCard
      name="Knowledge Base"
      description="Ground answers in your docs, FAQs, and help center."
      icon={BookOpen}
      status="available"
      meta="Setup: 10 min"
      actionLabel="Connect"
      href="#"
    />
    <CatalogCard
      name="ActiveFence Moderation"
      description="Real-time safety + content moderation for live agents."
      icon={ShieldCheck}
      status="coming-soon"
      meta="Trust & Safety"
      href="#"
    />
  </div>
)

// Brand-initial variant + a Beta badge — the alternate icon style used for
// vendor connectors that ship a brand letter rather than a lucide glyph.
export const Connectors = () => (
  <div className="grid w-[500px] grid-cols-2 gap-4">
    <CatalogCard
      name="Salesforce CRM"
      description="Sync contacts and log every call as an activity."
      initials="SF"
      iconColor="bg-sky-600"
      status="connected"
      meta="Last sync 4m ago"
      actionLabel="Configure"
      href="#"
    />
    <CatalogCard
      name="HubSpot"
      description="Push transcripts and outcomes into your pipeline."
      initials="HS"
      iconColor="bg-orange-500"
      status="beta"
      meta="Pay-per-use"
      actionLabel="Connect"
      href="#"
    />
  </div>
)
