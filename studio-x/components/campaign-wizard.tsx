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
  CalendarClock,
  PhoneForwarded,
  Upload,
  Download,
  FileText,
  Mic,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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

/** Outbound-only call program settings (telephony dialing campaigns). */
interface OutboundConfig {
  launchMode: "now" | "schedule"
  startDate: string
  timezone: string
  callWindowStart: string
  callWindowEnd: string
  callWindowDays: string
  // call settings
  endCall: boolean
  endOfConversation: boolean
  voicemailDetection: boolean
  silenceHangup: boolean
  silenceTimeout: number
  maxCallDuration: number
  ringDuration: number
  transferToHuman: boolean
  transferNumber: string
  transferCriteria: string
  minInterval: number
  // transcripts & recording
  storeTranscripts: boolean
  storeRecording: boolean
  // contacts
  contactsFileName: string | null
  contactsCount: number
}

const DEFAULT_OUTBOUND: OutboundConfig = {
  launchMode: "schedule",
  startDate: "",
  timezone: "",
  callWindowStart: "09:00",
  callWindowEnd: "18:00",
  callWindowDays: "Mon–Sun",
  endCall: true,
  endOfConversation: false,
  voicemailDetection: true,
  silenceHangup: false,
  silenceTimeout: 120,
  maxCallDuration: 300,
  ringDuration: 30,
  transferToHuman: true,
  transferNumber: "",
  transferCriteria: "",
  minInterval: 1000,
  storeTranscripts: false,
  storeRecording: false,
  contactsFileName: null,
  contactsCount: 0,
}

/** Inbound call-handling settings (telephony receive campaigns). */
interface InboundConfig {
  greeting: string
  transferToHuman: boolean
  transferNumber: string
  transferCriteria: string
  endOfConversation: boolean
  silenceHangup: boolean
  silenceTimeout: number
  maxCallDuration: number
  storeTranscripts: boolean
  storeRecording: boolean
}

const DEFAULT_INBOUND: InboundConfig = {
  greeting: "",
  transferToHuman: true,
  transferNumber: "",
  transferCriteria: "",
  endOfConversation: true,
  silenceHangup: true,
  silenceTimeout: 120,
  maxCallDuration: 600,
  storeTranscripts: true,
  storeRecording: true,
}

interface Draft {
  type: CampaignType | null
  name: string
  agentId: string | null
  selectedChannels: ChannelKind[]
  channelConfig: Partial<Record<ChannelKind, ChannelConfig>>
  outbound: OutboundConfig
  inbound: InboundConfig
}

const EMPTY_DRAFT: Draft = {
  type: null,
  name: "",
  agentId: null,
  selectedChannels: [],
  channelConfig: {},
  outbound: DEFAULT_OUTBOUND,
  inbound: DEFAULT_INBOUND,
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
      const parsed = stored ? (JSON.parse(stored) as Partial<Draft>) : EMPTY_DRAFT
      return {
        ...EMPTY_DRAFT,
        ...parsed,
        // Defend against drafts saved before `outbound`/`inbound` existed.
        outbound: { ...DEFAULT_OUTBOUND, ...(parsed.outbound ?? {}) },
        inbound: { ...DEFAULT_INBOUND, ...(parsed.inbound ?? {}) },
        type: initialType ?? parsed.type ?? null,
        agentId: initialAgentId ?? parsed.agentId ?? null,
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
  const out = draft.outbound
  const setOut = (patch: Partial<OutboundConfig>) =>
    onChange((d) => ({ ...d, outbound: { ...d.outbound, ...patch } }))
  const inb = draft.inbound
  const setInb = (patch: Partial<InboundConfig>) =>
    onChange((d) => ({ ...d, inbound: { ...d.inbound, ...patch } }))
  const isOutbound = draft.type === "outbound"
  const isInbound = draft.type === "inbound"
  const hasTelephony = draft.selectedChannels.includes("telephony")

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Configure</h2>
        <p className="text-sm text-muted-foreground">
          {isOutbound
            ? "Set up the dialing program — schedule, call behaviour, contacts."
            : "Set up the agent, greeting, and how incoming calls are handled."}
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

      {/* Outbound dialing program — the deep call-centre config */}
      {isOutbound && <LaunchTimingCard out={out} setOut={setOut} />}
      {isOutbound && hasTelephony && <CallSettingsCard out={out} setOut={setOut} />}
      {isOutbound && hasTelephony && <ContactsCard out={out} setOut={setOut} />}

      {/* Inbound call handling — parity with the outbound program */}
      {isInbound && hasTelephony && <InboundGreetingCard inb={inb} setInb={setInb} />}
      {isInbound && hasTelephony && <InboundCallBehaviorCard inb={inb} setInb={setInb} />}

      {/* Shared — transcripts & recording */}
      {isOutbound && <TranscriptsRecordingCard storeTranscripts={out.storeTranscripts} storeRecording={out.storeRecording} onPatch={(p) => setOut(p)} />}
      {isInbound && hasTelephony && <TranscriptsRecordingCard storeTranscripts={inb.storeTranscripts} storeRecording={inb.storeRecording} onPatch={(p) => setInb(p)} />}

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

// ─── Outbound section cards ──────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
    </div>
  )
}

function NumberField({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="font-mono text-sm" />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function LaunchTimingCard({ out, setOut }: { out: OutboundConfig; setOut: (p: Partial<OutboundConfig>) => void }) {
  return (
    <SectionCard icon={CalendarClock} title="Launch Timing">
      <div className="space-y-2">
        <LaunchOption active={out.launchMode === "now"} onClick={() => setOut({ launchMode: "now" })} title="Launch Campaign Now" desc="Start calling contacts immediately" />
        <LaunchOption active={out.launchMode === "schedule"} onClick={() => setOut({ launchMode: "schedule" })} title="Schedule for later" desc="Set a specific start time" />
      </div>
      {out.launchMode === "schedule" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <Label>Campaign Start Time</Label>
            <Input placeholder="DD/MMM/YYYY" value={out.startDate} onChange={(e) => setOut({ startDate: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={out.timezone} onValueChange={(v) => setOut({ timezone: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
        <span className="text-sm">Call Window</span>
        <span className="text-sm tabular-nums text-muted-foreground">{out.callWindowStart} – {out.callWindowEnd}, {out.callWindowDays}</span>
      </div>
    </SectionCard>
  )
}

function LaunchOption({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors", active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border shrink-0", active ? "border-primary" : "border-muted-foreground/40")}>
        {active && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  )
}

function CallSettingsCard({ out, setOut }: { out: OutboundConfig; setOut: (p: Partial<OutboundConfig>) => void }) {
  return (
    <SectionCard icon={PhoneForwarded} title="Call Settings">
      <ToggleRow label="End Call" description="Give the agent the ability to end the call with the user." checked={out.endCall} onChange={(v) => setOut({ endCall: v })} />
      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hang-up configuration</p>
        <ToggleRow label="End of conversation" description="Hang up when the conversation naturally ends." checked={out.endOfConversation} onChange={(v) => setOut({ endOfConversation: v })} />
        <ToggleRow label="Voicemail detection" description="Detect voicemail systems and hang up." checked={out.voicemailDetection} onChange={(v) => setOut({ voicemailDetection: v })} />
        <ToggleRow label="Silence hangup" description="End the call after a period of silence." checked={out.silenceHangup} onChange={(v) => setOut({ silenceHangup: v })} />
        {out.silenceHangup && (
          <NumberField label="Silence Timeout (seconds)" value={out.silenceTimeout} onChange={(v) => setOut({ silenceTimeout: v })} hint={`Call ends after ${out.silenceTimeout}s of no response.`} />
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-3">
        <NumberField label="Max Call Duration (seconds)" value={out.maxCallDuration} onChange={(v) => setOut({ maxCallDuration: v })} hint="Maximum length for a conversation." />
        <NumberField label="Ring Duration (seconds)" value={out.ringDuration} onChange={(v) => setOut({ ringDuration: v })} hint="Stop ringing if not connected within this time." />
      </div>
      <div className="space-y-3 border-t border-border pt-3">
        <ToggleRow label="Transfer Call to Human" description="Transfer to a human agent when needed or asked for." checked={out.transferToHuman} onChange={(v) => setOut({ transferToHuman: v })} />
        {out.transferToHuman && (
          <>
            <div className="space-y-1.5">
              <Label>Transfer Phone Number</Label>
              <Input placeholder="+1 (555) 000-0000" value={out.transferNumber} onChange={(e) => setOut({ transferNumber: e.target.value })} className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Transfer Criteria</Label>
              <Textarea placeholder="Describe when calls should be transferred to a human…" value={out.transferCriteria} onChange={(e) => setOut({ transferCriteria: e.target.value })} rows={2} />
            </div>
          </>
        )}
      </div>
      <div className="border-t border-border pt-3">
        <NumberField label="Minimum interval between calls (ms)" value={out.minInterval} onChange={(v) => setOut({ minInterval: v })} hint={`Dialing one call every ${out.minInterval} ms — ${(1000 / Math.max(1, out.minInterval)).toFixed(2)} call(s)/sec.`} />
      </div>
    </SectionCard>
  )
}

function ContactsCard({ out, setOut }: { out: OutboundConfig; setOut: (p: Partial<OutboundConfig>) => void }) {
  const loaded = out.contactsFileName !== null
  return (
    <SectionCard icon={FileText} title="Contacts List">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Upload a CSV of contacts to dial.</p>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => toast.success("Mock: template downloaded")}>
          <Download className="h-3.5 w-3.5" /> Download Template
        </Button>
      </div>
      {loaded ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{out.contactsFileName}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{out.contactsCount.toLocaleString()} contacts uploaded</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOut({ contactsFileName: null, contactsCount: 0 })}>Change File</Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOut({ contactsFileName: "contacts.csv", contactsCount: 1500 })}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-6 hover:border-primary/40 transition-colors"
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Upload contacts CSV</span>
          <span className="text-xs text-muted-foreground">Phone Number · Name · Dynamic fields</span>
        </button>
      )}
    </SectionCard>
  )
}

function TranscriptsRecordingCard({ storeTranscripts, storeRecording, onPatch }: { storeTranscripts: boolean; storeRecording: boolean; onPatch: (p: { storeTranscripts?: boolean; storeRecording?: boolean }) => void }) {
  return (
    <SectionCard icon={Mic} title="Transcripts & Recording">
      <ToggleRow label="Store Transcripts" description="Automatically save the conversation text for review." checked={storeTranscripts} onChange={(v) => onPatch({ storeTranscripts: v })} />
      <ToggleRow label="Store Call Recording" description="Automatically save the call audio recording for review." checked={storeRecording} onChange={(v) => onPatch({ storeRecording: v })} />
    </SectionCard>
  )
}

function InboundGreetingCard({ inb, setInb }: { inb: InboundConfig; setInb: (p: Partial<InboundConfig>) => void }) {
  return (
    <SectionCard icon={PhoneIncoming} title="Greeting & Routing">
      <div className="space-y-1.5">
        <Label>Greeting message</Label>
        <Textarea placeholder="Thanks for calling Acme Support — how can I help today?" value={inb.greeting} onChange={(e) => setInb({ greeting: e.target.value })} rows={2} />
        <p className="text-xs text-muted-foreground">What the agent says when it answers an incoming call.</p>
      </div>
      <div className="space-y-3 border-t border-border pt-3">
        <ToggleRow label="Transfer Call to Human" description="Hand off to a human agent when needed or asked for." checked={inb.transferToHuman} onChange={(v) => setInb({ transferToHuman: v })} />
        {inb.transferToHuman && (
          <>
            <div className="space-y-1.5">
              <Label>Transfer Phone Number</Label>
              <Input placeholder="+1 (555) 000-0000" value={inb.transferNumber} onChange={(e) => setInb({ transferNumber: e.target.value })} className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Transfer Criteria</Label>
              <Textarea placeholder="Describe when calls should be transferred to a human…" value={inb.transferCriteria} onChange={(e) => setInb({ transferCriteria: e.target.value })} rows={2} />
            </div>
          </>
        )}
      </div>
    </SectionCard>
  )
}

function InboundCallBehaviorCard({ inb, setInb }: { inb: InboundConfig; setInb: (p: Partial<InboundConfig>) => void }) {
  return (
    <SectionCard icon={PhoneForwarded} title="Call Behavior">
      <ToggleRow label="End of conversation" description="Hang up when the conversation concludes naturally." checked={inb.endOfConversation} onChange={(v) => setInb({ endOfConversation: v })} />
      <ToggleRow label="Silence hangup" description="End the call after a period of caller silence." checked={inb.silenceHangup} onChange={(v) => setInb({ silenceHangup: v })} />
      {inb.silenceHangup && (
        <NumberField label="Silence Timeout (seconds)" value={inb.silenceTimeout} onChange={(v) => setInb({ silenceTimeout: v })} hint={`Call ends after ${inb.silenceTimeout}s of no response.`} />
      )}
      <NumberField label="Max Call Duration (seconds)" value={inb.maxCallDuration} onChange={(v) => setInb({ maxCallDuration: v })} hint="Maximum length for a conversation." />
    </SectionCard>
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
