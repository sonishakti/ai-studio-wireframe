"use client"

import * as React from "react"
import { X, ExternalLink, Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { RadioCard, RadioCardGroup, ToggleCard } from "@/components/wizard/radio-cards"
import { SectionRow } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import { CodeBlock } from "@/components/code-block"
import { AddPhoneNumberSheet } from "@/components/add-phone-number-sheet"
import { WidgetStyleConfig } from "@/components/widget-studio"
import { PHONE_NUMBERS } from "@/lib/campaign-data"
import {
  channelLabel, hasChannel, inboundSurfaces,
  type AgentDraft, type DeployChannel, type InboundSurface,
} from "@/lib/wizard-draft"
import { type StepProps } from "@/components/wizard/types"

/**
 * Section 2 — CHANNEL (v6, owner 2026-07-29): the channel is ONE choice —
 * Inbound OR Batch calls OR Code/SDK (radio, not multi-select). Multi-select
 * lives INSIDE Inbound: an inbound agent can serve several surfaces at once —
 * phone number(s) · web widget · WhatsApp/Telegram (soon). Batch shows
 * nothing here (runs, contacts, and dialing all live in Go Live). Switching
 * the channel keeps the departing one's config — nothing is deleted.
 */

const CHANNEL_CARDS: { id: DeployChannel; title: string; desc: string }[] = [
  { id: "inbound", title: "Inbound", desc: "Answers callers — phone numbers, web widget, more soon." },
  { id: "batch", title: "Batch calls", desc: "Calls through contact lists you upload, as campaign runs." },
  { id: "code", title: "Code / SDK", desc: "Runs inside your own app. No phone number." },
]

const SURFACE_CARDS: { id: InboundSurface; title: string; desc: string }[] = [
  { id: "phone", title: "Phone number", desc: "Answer calls 24/7 — link one or several numbers." },
  { id: "web", title: "Web widget", desc: "A floating voice widget for your website." },
]

export function ChannelSection({
  draft,
  update,
  liveChannels,
  onGoToStep,
}: StepProps & {
  /** The DEPLOYED channel of a live agent — switching away from it warns. */
  liveChannels?: DeployChannel[]
  /** Jump to another section (inbound call settings live in Go Live). */
  onGoToStep: (n: number) => void
}) {
  const agentId = draft.agentId ?? "new"
  const current = draft.channels[0] ?? null
  const surfaces = inboundSurfaces(draft)

  const setChannel = (c: DeployChannel) => {
    if (c === current) return
    const patch: Partial<AgentDraft> = { channels: [c] }
    if (c === "inbound" && !draft.config.inbound) {
      patch.config = { ...draft.config, inbound: { numberIds: [], surfaces: ["phone"] } }
    }
    if (c === "code") patch.config = { ...draft.config, code: { added: true } }
    update(patch)
    // Switching away from a configured/live channel: say the setup is KEPT.
    if (current && (liveChannels?.includes(current) ||
        (current === "inbound" && draft.config.inbound?.numberIds.length) ||
        (current === "batch" && draft.campaigns.length))) {
      const wasLive = liveChannels?.includes(current)
      toast(`Switched to ${channelLabel(c)}`, {
        description: wasLive
          ? `${channelLabel(current)} goes offline on your next redeploy — its setup is kept and undoable.`
          : `Your ${channelLabel(current)} setup is kept, not deleted. Switch back any time.`,
        action: { label: "Undo", onClick: () => update({ channels: [current] }) },
      })
    }
  }

  const toggleSurface = (sf: InboundSurface, on: boolean) => {
    const next = on ? [...surfaces, sf] : surfaces.filter((x) => x !== sf)
    update({
      config: {
        ...draft.config,
        inbound: { numberIds: draft.config.inbound?.numberIds ?? [], surfaces: next },
      },
    })
  }

  return (
    <>
      <SectionRow
        id="wz-2-pick"
        label={`How does ${draft.name || "your agent"} take calls?`}
        hint="One deployment type per agent — duplicate the agent for the other direction."
      >
        {liveChannels && liveChannels.length > 0 && (
          <p className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-foreground">
            {draft.name || "This agent"} is live on {liveChannels.map(channelLabel).join(" · ")} — switching
            deployment types takes it offline there on your next redeploy. The setup is kept, and every switch has an Undo.
          </p>
        )}

        {/* Plain Form: full-width radio rows over hairlines — no card grid. */}
        <RadioCardGroup
          value={current ?? ""}
          onValueChange={(v) => v && setChannel(v as DeployChannel)}
          aria-label="Deployment type"
          className="gap-0 divide-y divide-border"
        >
          {CHANNEL_CARDS.map((c) => (
            <RadioCard
              key={c.id}
              value={c.id}
              className="rounded-none border-0 bg-transparent px-1 py-3 shadow-none"
              title={
                liveChannels?.includes(c.id) ? (
                  <span className="flex items-center gap-2">
                    {c.title}
                    <span className="flex items-center gap-1 text-xs font-medium text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden /> Live
                    </span>
                  </span>
                ) : (
                  c.title
                )
              }
              description={c.desc}
            />
          ))}
        </RadioCardGroup>

        {/* Batch acknowledges the click (user-test 2026-07-29 S2: nothing
            rendering under the radio read as "did my click register?") —
            parity with the inbound block's Go Live pointer (2026-07-30). */}
        {current === "batch" && (
          <p className="text-xs text-muted-foreground">
            Contacts, caller ID &amp; schedule live in{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={() => onGoToStep(5)}
            >
              Go Live ↓
            </button>
          </p>
        )}

        <InfoHint label="Phone channels are bring-your-own number">
          Agora doesn&apos;t sell numbers — connect your carrier&apos;s via SIP with{" "}
          <span className="font-medium text-foreground">Add phone number</span> below, or manage them in{" "}
          <a href="/integrations?tab=channels" className="underline underline-offset-2">
            Resources › Deployment Channels
          </a>
          . Code / SDK and the web widget need no number.
        </InfoHint>
      </SectionRow>

      {/* INBOUND — the multi-select lives HERE: several surfaces at once. */}
      {current === "inbound" && (
        <SectionRow
          id="wz-2-surfaces"
          label="Inbound channels"
          hint="Pick every way callers reach this agent — it can serve several at once."
        >
          <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2" role="group" aria-label="Inbound channels">
            {SURFACE_CARDS.map((sf) => (
              <ToggleCard
                key={sf.id}
                pressed={surfaces.includes(sf.id)}
                onPressedChange={(on) => toggleSurface(sf.id, on)}
                title={sf.title}
                description={sf.desc}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">WhatsApp · Telegram — soon</p>
        </SectionRow>
      )}

      {current === "inbound" && surfaces.includes("phone") && (
        <InboundNumbersBlock draft={draft} update={update} onGoToStep={onGoToStep} />
      )}

      {current === "inbound" && surfaces.includes("web") && (
        <SectionRow id="wz-2-web" label="Web widget" hint="The essentials — grab the embed snippet; deeper styling lives in the Widget studio.">
          <WidgetStyleConfig agentId={agentId} lean />
        </SectionRow>
      )}

      {/* BATCH — no config here on purpose (owner 2026-07-29): contacts,
          caller ID, schedule, and dialing ALL live in Go Live. The picker row
          above carries the one-line cross-link saying so. */}

      {current === "code" && (
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
    update({
      config: {
        ...draft.config,
        inbound: { numberIds: ids, surfaces: draft.config.inbound?.surfaces ?? ["phone"] },
      },
    })

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
      label="Phone numbers"
      hint="Link one or several numbers — the agent answers them all."
    >
      <div className="space-y-3">
        {linked.length > 0 && (
          <ul className="divide-y divide-border">
            {linked.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 py-2">
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
        </div>
      </div>
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
  agentId: "${agentId}",${unpublished ? " // placeholder — deploy to mint the real ID" : ""}
  appId: process.env.AGORA_APP_ID, // Project Settings › App ID
})

// Add the agent to a live Agora RTC channel
// token minted from your App Certificate on join — clients keep their own
await client.joinChannel({ channel: "support-room" })`

  const stop = `// Stop the agent — releases the channel and stops billing
await client.leaveChannel()
await client.stop()`

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Add to your app</p>
      <CodeBlock language="bash" filename="install">npm install @agora/agent-sdk</CodeBlock>
      <CodeBlock language="typescript" filename="join.ts">{connect}</CodeBlock>
      <InfoHint label="Secured-mode channels & tokens">
        The platform mints the agent&apos;s token from your App Certificate on join — your
        clients keep bringing their own tokens, and the agent needs nothing extra from you.
      </InfoHint>

      <p className="pt-2 text-sm font-medium">Stop the agent</p>
      <CodeBlock language="typescript" filename="stop.ts">{stop}</CodeBlock>

      <a
        href="https://docs.agora.io/en/ai"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm underline underline-offset-2 hover:text-foreground"
      >
        Full SDK reference <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  )
}
