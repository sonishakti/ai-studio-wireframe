"use client"

import * as React from "react"
import { X, ExternalLink, Radio, ArrowRight, Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleCard } from "@/components/wizard/radio-cards"
import { SectionRow } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import { CodeBlock } from "@/components/code-block"
import { ConfigCard } from "@/components/wizard/channel-configs"
import { AddPhoneNumberSheet } from "@/components/add-phone-number-sheet"
import { WidgetStyleConfig } from "@/components/widget-studio"
import { PHONE_NUMBERS } from "@/lib/campaign-data"
import {
  channelLabel, hasChannel, activeCampaigns, type AgentDraft, type DeployChannel,
} from "@/lib/wizard-draft"
import { type StepProps } from "@/components/wizard/types"

/**
 * Section 2 — CHANNEL (v4 IA, 2026-07-28): deployment channels are
 * MULTI-SELECT — one agent can answer inbound calls, run batch campaigns, and
 * live in a web widget at once (reverses the 06-11 one-agent-one-channel
 * lock, per owner). Per-channel connection config renders inline under the
 * grid; the deeper call-behavior settings live in Go Live (the deploy panel),
 * and batch campaign management lives there too. Deselecting keeps the
 * channel's config — nothing is deleted, re-selecting restores it.
 */

const CHANNEL_CARDS: { id: DeployChannel; title: string; desc: string; bestFor: string }[] = [
  {
    id: "inbound",
    title: "Inbound calls",
    desc: "Answers phone numbers 24/7 — link one or several.",
    bestFor: "Support lines, front desk, after-hours",
  },
  {
    id: "batch",
    title: "Batch calls",
    desc: "Calls through contact lists you upload, as campaigns.",
    bestFor: "Outreach, reminders, surveys",
  },
  {
    id: "web",
    title: "Web widget",
    desc: "A floating voice widget for your website.",
    bestFor: "In-product help, lead capture",
  },
  {
    id: "code",
    title: "Code / SDK",
    desc: "Runs inside your own app. No phone number.",
    bestFor: "In-app assistants, custom stacks",
  },
]

export function ChannelSection({
  draft,
  update,
  liveChannels,
  onGoToStep,
}: StepProps & {
  /** The DEPLOYED channels of a live agent — deselecting one warns. */
  liveChannels?: DeployChannel[]
  /** Jump to another section (batch/inbound settings live in Go Live). */
  onGoToStep: (n: number) => void
}) {
  const agentId = draft.agentId ?? "new"

  const toggleChannel = (c: DeployChannel, on: boolean) => {
    if (on) {
      // INBOUND XOR OUTBOUND (owner 2026-07-28): one agent cannot serve both
      // directions — a receptionist and an outreach caller need different
      // context and workflows. Picking one swaps out the other, said out loud.
      const conflicting: DeployChannel | null =
        c === "inbound" && draft.channels.includes("batch") ? "batch"
        : c === "batch" && draft.channels.includes("inbound") ? "inbound"
        : null
      const channels = [...draft.channels.filter((x) => x !== conflicting), c]
      const patch: Partial<AgentDraft> = { channels }
      // Seed the connection state the block below reads.
      if (c === "inbound" && !draft.config.inbound) {
        patch.config = { ...draft.config, inbound: { numberIds: [] } }
      }
      if (c === "code") patch.config = { ...draft.config, code: { added: true } }
      update(patch)
      if (conflicting) {
        const wasLive = liveChannels?.includes(conflicting)
        toast(`${channelLabel(conflicting)} swapped for ${channelLabel(c)}`, {
          description: wasLive
            ? `${channelLabel(conflicting)} goes offline on your next redeploy — its setup is kept. Duplicate the agent for the other direction.`
            : "One agent can't handle both inbound and outbound — the context and workflows differ. Duplicate the agent for the other direction; this setup is kept.",
          action: {
            // `draft.channels` here is the PRE-toggle snapshot — restoring it
            // undoes both the add and the swap in one write.
            label: "Undo",
            onClick: () => update({ channels: draft.channels }),
          },
        })
      }
      return
    }
    const channels = draft.channels.filter((x) => x !== c)
    update({ channels })
    // Deselect keeps the config (numbers, campaigns, widget styling) — say so.
    if (liveChannels?.includes(c)) {
      toast(`${channelLabel(c)} will go offline on your next redeploy`, {
        description: "Its setup is kept, not deleted — re-select the channel to restore it.",
        action: { label: "Undo", onClick: () => update({ channels: [...channels, c] }) },
      })
    } else if (
      (c === "inbound" && draft.config.inbound?.numberIds.length) ||
      (c === "batch" && draft.campaigns.length)
    ) {
      toast(`${channelLabel(c)} removed`, {
        description: "Its setup is kept — re-select the channel to restore it.",
        action: { label: "Undo", onClick: () => update({ channels: [...channels, c] }) },
      })
    }
  }

  return (
    <>
      <SectionRow
        id="wz-2-pick"
        label={`Where does ${draft.name || "your agent"} run?`}
        hint="Pick every channel it should serve. Inbound and Batch calls are exclusive — one agent can't work both directions."
      >
        {/* Pre-click consequence for a LIVE agent — BOTH directions warn:
            deselecting a live channel, AND adding the opposite calling
            direction (which swaps the live one out). User-test 2026-07-28:
            the earlier copy only covered de-selecting, so the swap fired on
            an add click against a live agent with no warning up front. */}
        {liveChannels && liveChannels.length > 0 && (
          <p className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-foreground">
            {draft.name || "This agent"} is live on {liveChannels.map(channelLabel).join(" · ")} — deselecting a
            live channel, or picking the opposite calling direction (which swaps it out), takes it offline there
            on your next redeploy. Its setup is kept, and every swap has an Undo.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2" role="group" aria-label="Deployment channels">
          {CHANNEL_CARDS.map((c) => (
            <ToggleCard
              key={c.id}
              pressed={hasChannel(draft, c.id)}
              onPressedChange={(on) => toggleChannel(c.id, on)}
              title={
                liveChannels?.includes(c.id) ? (
                  <>
                    {c.title}
                    <span className="flex items-center gap-1 text-xs font-medium text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden /> Live
                    </span>
                  </>
                ) : (
                  c.title
                )
              }
              description={
                <>
                  {c.desc}
                  <span className="mt-1 block text-xs text-muted-foreground/70">Best for: {c.bestFor}</span>
                </>
              }
            />
          ))}
          {/* WhatsApp — coming, visible, inert. */}
          <ToggleCard
            pressed={false}
            onPressedChange={() => {}}
            disabled
            title="WhatsApp"
            badge={<Badge variant="outline" className="h-5 px-1.5 text-xs uppercase tracking-wide">Soon</Badge>}
            description="Answer WhatsApp messages with the same agent."
          />
        </div>

        <InfoHint label="Phone channels are bring-your-own number">
          Agora doesn&apos;t sell numbers — connect your carrier&apos;s via SIP in{" "}
          <a href="/integrations?tab=channels" className="underline underline-offset-2">
            Resources › Deployment Channels
          </a>
          . Code / SDK and the web widget need no number.
        </InfoHint>
      </SectionRow>

      {hasChannel(draft, "inbound") && (
        <InboundNumbersBlock draft={draft} update={update} onGoToStep={onGoToStep} />
      )}

      {hasChannel(draft, "batch") && (
        <SectionRow
          id="wz-2-batch"
          label="Batch calls"
          hint="Campaign runs — contacts, caller ID, schedule, dialing — are managed in Go Live."
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <p className="min-w-0 text-sm text-muted-foreground">
              {activeCampaigns(draft).length > 0
                ? `${activeCampaigns(draft).length} run${activeCampaigns(draft).length > 1 ? "s" : ""} set up — manage them in Go Live.`
                : "No runs yet — create your first in Go Live."}
            </p>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => onGoToStep(5)}>
              Manage runs <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Each run dials from one caller-ID number — load-balancing across several numbers is coming.
          </p>
        </SectionRow>
      )}

      {hasChannel(draft, "web") && (
        <SectionRow id="wz-2-web" label="Web widget" hint="The essentials — grab the embed snippet; deeper styling lives in the Widget studio.">
          <WidgetStyleConfig agentId={agentId} lean />
        </SectionRow>
      )}

      {hasChannel(draft, "code") && (
        <SectionRow id="wz-2-code" label="Code / SDK" hint="Drop the agent into your own app.">
          <CodeConfigure agentId={agentId} />
        </SectionRow>
      )}
    </>
  )
}

// ─── Inbound — MULTIPLE numbers link to one agent (2026-07-28) ────────────────

function InboundNumbersBlock({
  draft, update, onGoToStep,
}: StepProps & { onGoToStep: (n: number) => void }) {
  const numberIds = draft.config.inbound?.numberIds ?? []
  const setNumberIds = (ids: string[]) =>
    update({ config: { ...draft.config, inbound: { numberIds: ids } } })

  // Numbers added THIS session via the + accelerator (PHONE_NUMBERS is a
  // static mock) — merged into every lookup so the just-added number actually
  // appears and links, instead of the success toast dead-ending (review
  // 2026-07-28).
  const [sessionNumbers, setSessionNumbers] = React.useState<{ id: string; number: string; label: string }[]>([])
  const addedNumber = (n: { number: string; label: string }) => {
    const id = `pn_new_${Date.now().toString(36)}`
    setSessionNumbers((s) => [...s, { id, ...n }])
    setNumberIds([...numberIds, id])
    toast.success(`${n.number} linked`, {
      description: `${draft.name || "This agent"} answers it once you deploy.`,
    })
  }
  const lookup = (id: string) =>
    PHONE_NUMBERS.find((n) => n.id === id) ?? sessionNumbers.find((n) => n.id === id)

  // Linkable = free numbers not already on this agent (linked ones render in
  // the list above, not the add-select).
  const linkable = [
    ...PHONE_NUMBERS.filter((n) => n.status === "unassigned" && !numberIds.includes(n.id)),
    ...sessionNumbers.filter((n) => !numberIds.includes(n.id)),
  ]
  const linked = numberIds
    .map((id) => lookup(id))
    .filter((n): n is NonNullable<ReturnType<typeof lookup>> => !!n)

  return (
    <SectionRow
      id="wz-2-inbound"
      label="Inbound numbers"
      hint="Link one or several numbers — the agent answers them all."
    >
      <ConfigCard>
        {linked.length > 0 && (
          <ul className="space-y-2">
            {linked.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
                <div className="min-w-0">
                  <p className="font-mono text-sm">{n.number}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.label}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground"
                  onClick={() => setNumberIds(numberIds.filter((id) => id !== n.id))}
                  aria-label={`Unlink ${n.number}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{linked.length ? "Link another number" : "Link phone number"}</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Select value="" onValueChange={(id) => id && setNumberIds([...numberIds, id])}>
              <SelectTrigger className="min-w-0 flex-1 basis-56 text-sm">
                <SelectValue placeholder={linkable.length ? "Choose an available number" : "No free numbers — connect one via SIP"} />
              </SelectTrigger>
              <SelectContent>
                {linkable.map((n) => (
                  <SelectItem key={n.id} value={n.id}>{n.number} · {n.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* The accelerator (owner 2026-07-28): a first-class + Add door.
                onAdded keeps the flow IN the builder — the new number lists
                and links here instead of the sheet routing to a fresh draft. */}
            <AddPhoneNumberSheet onAdded={addedNumber}>
              <Button variant="outline" size="sm" className="shrink-0 gap-1">
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add phone number
              </Button>
            </AddPhoneNumberSheet>
          </div>
          <InfoHint label="No number free?">
            Agora routes your own carrier number — connect one via SIP with{" "}
            <span className="font-medium text-foreground">Add phone number</span>, or manage them in{" "}
            <a href="/integrations?tab=channels" className="underline underline-offset-2">
              Resources › Deployment Channels
            </a>
            .
          </InfoHint>
        </div>
      </ConfigCard>
      <p className="text-xs text-muted-foreground">
        How answered calls end — max duration, silence hang-up, transfer — is configured in{" "}
        <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => onGoToStep(5)}>
          Go Live › Inbound call settings
        </button>
        .
      </p>
    </SectionRow>
  )
}

// ─── Code — SDK/API snippets + Docs Center (unchanged from the v3 builder) ────

export function CodeConfigure({ agentId }: { agentId: string }) {
  // Snippet-truth (user-test #6, D3): before deploy the agent id is a
  // placeholder — say so where the Copy button is.
  const unpublished = agentId === "new"
  const connect = `import { AgentClient } from "@agora/agent-sdk"

const client = new AgentClient({
  agentId: "${agentId}",
  appId: process.env.AGORA_APP_ID, // Project Settings › App ID
})

// Add the agent to a live Agora RTC channel
await client.joinChannel({ channel: "support-room" })`

  const stop = `// Stop the agent and leave the channel
await client.leaveChannel()
await client.stop()`

  return (
    <div className="space-y-4">
      {unpublished && (
        <p className="text-xs text-warning">
          This agent&apos;s ID is minted when you deploy — these snippets carry the
          placeholder <code className="font-mono">&quot;new&quot;</code> until then. Deploy
          first, then copy.
        </p>
      )}
      <ConfigCard title="Add to your app">
        <p className="text-sm text-muted-foreground">
          Install the SDK, then drop the agent into any Agora channel. No phone number needed. It runs wherever your app does.
        </p>
        <CodeBlock language="bash" filename="install">npm install @agora/agent-sdk</CodeBlock>
        <CodeBlock language="typescript" filename="join.ts">{connect}</CodeBlock>
        <InfoHint label="Secured-mode channels & tokens">
          The platform mints the agent&apos;s token from your App Certificate on join — your
          clients keep bringing their own tokens, and the agent needs nothing extra from you.
        </InfoHint>
      </ConfigCard>

      <ConfigCard title="Stop the agent">
        <p className="text-sm text-muted-foreground">
          End the session when you&apos;re done. This releases the channel and stops billing for it.
        </p>
        <CodeBlock language="typescript" filename="stop.ts">{stop}</CodeBlock>
      </ConfigCard>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Radio className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Full SDK reference</p>
            <p className="text-xs text-muted-foreground">Channels, events, function calling, and more.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <a href="https://docs.agora.io/en/ai" target="_blank" rel="noopener noreferrer">
            Docs Center <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  )
}
