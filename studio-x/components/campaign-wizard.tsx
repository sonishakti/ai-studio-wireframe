"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  PhoneIncoming,
  PhoneOutgoing,
  Phone,
  MessageCircle,
  MessageSquare,
  Globe,
  Check,
  ArrowRight,
  ArrowLeft,
  Info,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"
import {
  AGENTS,
  CHANNEL_LABEL,
  isChannelAllowedForType,
  type CampaignType,
  type ChannelKind,
} from "@/lib/campaign-data"

const STORAGE_KEY = "sx:campaign-wizard-draft"
const ALL_CHANNELS: ChannelKind[] = ["telephony", "whatsapp", "sms", "web"]

const CHANNEL_ICON: Record<ChannelKind, React.ComponentType<{ className?: string }>> = {
  telephony: Phone,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  web: Globe,
}

interface ChannelConfig {
  // telephony
  numbers?: string[]
  // whatsapp
  whatsappSender?: string
  // sms
  smsNumber?: string
  // web
  domains?: string[]
}

interface Draft {
  type: CampaignType | null
  name: string
  agentId: string | null
  selectedChannels: ChannelKind[]
  channelConfig: Partial<Record<ChannelKind, ChannelConfig>>
}

const EMPTY_DRAFT: Draft = {
  type: null,
  name: "",
  agentId: null,
  selectedChannels: [],
  channelConfig: {},
}

// ─── Main wizard ─────────────────────────────────────────────────────────────

export function CampaignWizard({
  initialType,
  initialAgentId,
}: {
  initialType?: CampaignType
  initialAgentId?: string
}) {
  const router = useRouter()
  const [step, setStep] = React.useState<1 | 2 | 3>(initialType ? 2 : 1)
  const [draft, setDraft] = React.useState<Draft>(() => {
    if (typeof window === "undefined") {
      return { ...EMPTY_DRAFT, type: initialType ?? null, agentId: initialAgentId ?? null }
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      const parsed = stored ? (JSON.parse(stored) as Draft) : EMPTY_DRAFT
      return {
        ...parsed,
        type: initialType ?? parsed.type,
        agentId: initialAgentId ?? parsed.agentId,
      }
    } catch {
      return { ...EMPTY_DRAFT, type: initialType ?? null, agentId: initialAgentId ?? null }
    }
  })

  // Persist draft
  React.useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [draft])

  const advance = (to: 1 | 2 | 3) => {
    track(Events.campaign_wizard_step_completed, {
      step,
      type: draft.type,
      channels: draft.selectedChannels,
    })
    setStep(to)
  }

  const handleCreate = () => {
    track(Events.agent_published, {
      agent_id: draft.agentId ?? "dynamic",
    })
    window.localStorage.removeItem(STORAGE_KEY)
    toast.success("Campaign created", {
      description: `${draft.name || "Untitled campaign"} is now ${draft.type === "inbound" ? "ready to receive" : "ready to dial out"}.`,
    })
    router.push("/campaigns")
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <StepIndicator step={step} />

      {step === 1 && (
        <TypeStep
          selected={draft.type}
          onSelect={(t) => {
            setDraft((d) => ({
              ...d,
              type: t,
              // If switching to outbound, drop web channel (inbound-only).
              selectedChannels: d.selectedChannels.filter((c) => isChannelAllowedForType(c, t)),
            }))
            advance(2)
          }}
        />
      )}

      {step === 2 && draft.type && (
        <ChannelStep
          type={draft.type}
          selected={draft.selectedChannels}
          onToggle={(channel) => {
            setDraft((d) => ({
              ...d,
              selectedChannels: d.selectedChannels.includes(channel)
                ? d.selectedChannels.filter((c) => c !== channel)
                : [...d.selectedChannels, channel],
            }))
            // fire add/remove event
            if (draft.selectedChannels.includes(channel)) {
              track(Events.campaign_channel_removed, { channel })
            } else {
              track(Events.campaign_channel_added, { channel })
            }
          }}
          onBack={() => setStep(1)}
          onContinue={() => advance(3)}
        />
      )}

      {step === 3 && draft.type && (
        <ConfigStep
          draft={draft}
          onChange={(updater) => setDraft(updater)}
          onBack={() => setStep(2)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Type", "Channels", "Configure"]
  return (
    <div className="flex items-center gap-3">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const isActive = n === step
        const isDone = n < step
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                  isActive && "bg-primary text-primary-foreground",
                  isDone && "bg-primary/15 text-primary",
                  !isActive && !isDone && "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className="h-px flex-1 bg-border max-w-12" />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Step 1: Type ────────────────────────────────────────────────────────────

function TypeStep({
  selected,
  onSelect,
}: {
  selected: CampaignType | null
  onSelect: (type: CampaignType) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Pick a campaign type</h2>
        <p className="text-sm text-muted-foreground">
          Inbound and outbound have different constraints. We&apos;ll guide you through each.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TypeCard
          icon={PhoneIncoming}
          title="Inbound"
          tagline="Users come to your agent."
          constraint="One agent per inbound number. Web widgets are inbound-only."
          isSelected={selected === "inbound"}
          onClick={() => onSelect("inbound")}
        />
        <TypeCard
          icon={PhoneOutgoing}
          title="Outbound"
          tagline="Your agent reaches out."
          constraint="Multiple campaigns can share numbers. Agent is picked per batch."
          isSelected={selected === "outbound"}
          onClick={() => onSelect("outbound")}
        />
      </div>
    </div>
  )
}

function TypeCard({
  icon: Icon,
  title,
  tagline,
  constraint,
  isSelected,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  tagline: string
  constraint: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border bg-card p-6 text-left transition-all hover:border-primary/40 hover:shadow-sm",
        isSelected ? "border-primary shadow-sm" : "border-border",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{tagline}</p>
      </div>
      <div className="flex items-start gap-1.5 rounded-md bg-muted/50 p-2.5">
        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{constraint}</p>
      </div>
    </button>
  )
}

// ─── Step 2: Channels ────────────────────────────────────────────────────────

function ChannelStep({
  type,
  selected,
  onToggle,
  onBack,
  onContinue,
}: {
  type: CampaignType
  selected: ChannelKind[]
  onToggle: (channel: ChannelKind) => void
  onBack: () => void
  onContinue: () => void
}) {
  const canContinue = selected.length > 0

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Pick channels for this {type} campaign</h2>
        <p className="text-sm text-muted-foreground">
          You can configure them all together in the next step.
        </p>
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ALL_CHANNELS.map((kind) => {
            const allowed = isChannelAllowedForType(kind, type)
            const isSelected = selected.includes(kind)
            const Icon = CHANNEL_ICON[kind]

            const cardInner = (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                  isSelected && "border-primary bg-primary/5",
                  !isSelected && allowed && "border-border bg-card hover:border-primary/40",
                  !allowed && "border-border bg-muted/30 opacity-60 cursor-not-allowed",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md shrink-0",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {allowed ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-medium">{CHANNEL_LABEL[kind]}</p>
                  <p className="text-xs text-muted-foreground">{channelTagline(kind, type)}</p>
                </div>
                <Checkbox
                  checked={isSelected}
                  disabled={!allowed}
                  onCheckedChange={() => allowed && onToggle(kind)}
                  className="mt-1"
                />
              </div>
            )

            if (!allowed) {
              return (
                <Tooltip key={kind}>
                  <TooltipTrigger asChild>
                    <div>{cardInner}</div>
                  </TooltipTrigger>
                  <TooltipContent>Users come to a web widget, not the other way around.</TooltipContent>
                </Tooltip>
              )
            }

            return (
              <button
                key={kind}
                type="button"
                onClick={() => onToggle(kind)}
                className="text-left"
              >
                {cardInner}
              </button>
            )
          })}
        </div>
      </TooltipProvider>

      <WizardFooter
        onBack={onBack}
        onContinue={onContinue}
        canContinue={canContinue}
        continueLabel="Continue"
        continueDisabledHint="Select at least one channel."
      />
    </div>
  )
}

function channelTagline(kind: ChannelKind, type: CampaignType): string {
  switch (kind) {
    case "telephony":
      return type === "inbound" ? "Receive calls on a phone number." : "Dial out to a contact list."
    case "whatsapp":
      return type === "inbound" ? "Reply to WhatsApp messages." : "Broadcast WhatsApp messages."
    case "sms":
      return type === "inbound" ? "Reply to SMS." : "Send SMS broadcasts."
    case "web":
      return "Embed a chat widget on your site."
  }
}

// ─── Step 3: Configure ───────────────────────────────────────────────────────

function ConfigStep({
  draft,
  onChange,
  onBack,
  onCreate,
}: {
  draft: Draft
  onChange: (updater: (d: Draft) => Draft) => void
  onBack: () => void
  onCreate: () => void
}) {
  const canCreate = Boolean(draft.name.trim() && (draft.type === "outbound" || draft.agentId))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Configure</h2>
        <p className="text-sm text-muted-foreground">
          Fill in the basics, then channel-specific settings.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-name">Campaign name</Label>
            <Input
              id="campaign-name"
              value={draft.name}
              onChange={(e) => onChange((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Q3 Support Hotline"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agent-picker">
              Agent {draft.type === "inbound" ? "(required)" : "(optional)"}
            </Label>
            <Select
              value={draft.agentId ?? ""}
              onValueChange={(v) => onChange((d) => ({ ...d, agentId: v || null }))}
            >
              <SelectTrigger id="agent-picker">
                <SelectValue placeholder={draft.type === "inbound" ? "Pick one agent" : "Pick one or leave dynamic"} />
              </SelectTrigger>
              <SelectContent>
                {AGENTS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {draft.type === "inbound"
                ? "Inbound is 1:1 — one agent answers all calls on this campaign."
                : "Outbound can use a dynamic agent picked per batch. Leave blank for that."}
            </p>
          </div>
        </CardContent>
      </Card>

      {draft.selectedChannels.map((kind) => (
        <ChannelConfigSection
          key={kind}
          kind={kind}
          type={draft.type!}
          config={draft.channelConfig[kind] ?? {}}
          onChange={(next) =>
            onChange((d) => ({
              ...d,
              channelConfig: { ...d.channelConfig, [kind]: next },
            }))
          }
        />
      ))}

      <WizardFooter
        onBack={onBack}
        onContinue={onCreate}
        canContinue={canCreate}
        continueLabel="Create campaign"
        continueDisabledHint={
          draft.type === "inbound" && !draft.agentId
            ? "Pick an agent for the inbound campaign."
            : "Give the campaign a name."
        }
      />
    </div>
  )
}

function ChannelConfigSection({
  kind,
  type,
  config,
  onChange,
}: {
  kind: ChannelKind
  type: CampaignType
  config: ChannelConfig
  onChange: (next: ChannelConfig) => void
}) {
  const Icon = CHANNEL_ICON[kind]

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{CHANNEL_LABEL[kind]}</h3>
            <p className="text-xs text-muted-foreground">
              {type === "inbound" ? "Inbound configuration" : "Outbound configuration"}
            </p>
          </div>
        </div>

        {kind === "telephony" && (
          <div className="space-y-1.5">
            <Label>
              {type === "inbound" ? "Inbound number" : "Outbound number pool"}
            </Label>
            <Input
              placeholder={type === "inbound" ? "+1 (415) 555-0101" : "Pick from pool…"}
              value={(config.numbers ?? []).join(", ")}
              onChange={(e) =>
                onChange({ ...config, numbers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
              }
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {type === "inbound"
                ? "Exactly one number for inbound (1:1 with the agent above)."
                : "Comma-separated. Outbound numbers can be shared across campaigns."}
            </p>
          </div>
        )}

        {kind === "whatsapp" && (
          <div className="space-y-1.5">
            <Label>WhatsApp Business sender</Label>
            <Input
              placeholder="+1 (628) 555-0220"
              value={config.whatsappSender ?? ""}
              onChange={(e) => onChange({ ...config, whatsappSender: e.target.value })}
              className="font-mono text-sm"
            />
          </div>
        )}

        {kind === "sms" && (
          <div className="space-y-1.5">
            <Label>SMS sender</Label>
            <Input
              placeholder="+1 (628) 555-0260"
              value={config.smsNumber ?? ""}
              onChange={(e) => onChange({ ...config, smsNumber: e.target.value })}
              className="font-mono text-sm"
            />
          </div>
        )}

        {kind === "web" && (
          <div className="space-y-1.5">
            <Label>Allowed domains</Label>
            <Input
              placeholder="acme.com, help.acme.com"
              value={(config.domains ?? []).join(", ")}
              onChange={(e) =>
                onChange({ ...config, domains: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated. The widget will only mount on these hosts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Shared footer ───────────────────────────────────────────────────────────

function WizardFooter({
  onBack,
  onContinue,
  canContinue,
  continueLabel,
  continueDisabledHint,
}: {
  onBack: () => void
  onContinue: () => void
  canContinue: boolean
  continueLabel: string
  continueDisabledHint: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Button>
      <div className="flex items-center gap-3">
        {!canContinue && (
          <p className="text-xs text-muted-foreground">{continueDisabledHint}</p>
        )}
        <Button size="sm" onClick={onContinue} disabled={!canContinue} className="gap-1.5">
          {continueLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
