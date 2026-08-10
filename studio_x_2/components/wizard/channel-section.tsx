"use client"

import * as React from "react"
import { X, ExternalLink, Info, Phone, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { RadioCard, RadioCardGroup, ToggleCard } from "@/components/wizard/radio-cards"
import { SectionRow } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import { CodeBlock } from "@/components/code-block"
import { AddPhoneNumberSheet } from "@/components/add-phone-number-sheet"
import { WidgetStyleConfig } from "@/components/widget-studio"
import { PHONE_NUMBERS } from "@/lib/campaign-data"
import {
  channelLabel, inboundSurfaces,
  type AgentDraft, type DeployChannel, type InboundSurface,
} from "@/lib/wizard-draft"
import { type StepProps } from "@/components/wizard/types"

/**
 * Section 2 — DEPLOYMENT (v6, owner 2026-07-29): the channel is ONE choice —
 * Inbound OR Batch calls OR Code/SDK (radio, not multi-select). Multi-select
 * lives INSIDE Inbound: an inbound agent can serve several surfaces at once —
 * phone number(s) · web widget · WhatsApp/Telegram (soon). Switching the
 * channel keeps the departing one's config — nothing is deleted.
 *
 * v9 (2026-08-03, Figma 2861-52041 parity pass):
 *  · AGENT HOSTING REGION leads the section — it applies to all three channel
 *    types, so it can't live inside one of them.
 *  · Every channel now has a SELECTED STATE. Batch and Code/SDK previously
 *    rendered a one-line pointer and a snippet block respectively against
 *    Inbound's full connection UI, so picking them read as "nothing happened".
 *    Batch gets a RUNS SUMMARY (the multi-campaign answer at the point of
 *    decision); Code/SDK gets a connection row framed like the other two.
 *    The owner lock holds: campaign EDITING still lives only in Go Live — this
 *    is a read-only roll-up with doors into it, not a second editor.
 */

/* Figma 2861-61462 order + copy: Batch Calls → Inbound → Code / SDK. */
const CHANNEL_CARDS: { id: DeployChannel; title: string; desc: string }[] = [
  { id: "batch", title: "Batch Calls", desc: "Calls through a contact list you upload." },
  { id: "inbound", title: "Inbound", desc: "Answers a phone number 24/7, or a web widget." },
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
        label="How will this agent handle calls?"
        hint="One deployment type per agent — duplicate the agent for the other direction."
      >
        {liveChannels && liveChannels.length > 0 && (
          <p className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-foreground">
            {draft.name || "This agent"} is live on {liveChannels.map(channelLabel).join(" · ")} — switching
            deployment types takes it offline there on your next redeploy. The setup is kept, and every switch has an Undo.
          </p>
        )}

        {/* Figma 2875-83511: bordered radio cards, stacked full width, with a
            designed selected state (ring + filled radio). */}
        <RadioCardGroup
          value={current ?? ""}
          onValueChange={(v) => v && setChannel(v as DeployChannel)}
          aria-label="Deployment type"
          className="gap-3"
        >
          {CHANNEL_CARDS.map((c) => (
            <RadioCard
              key={c.id}
              value={c.id}
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
        <SectionRow id="wz-2-web" label="Widget Settings" hint="How visitors talk to your agent — behaviour, branding, text, and the embed snippet.">
          <WidgetStyleConfig agentId={agentId} />
        </SectionRow>
      )}

      {/* BATCH (Figma 2875-83511) — the agent-level caller ID; runs and their
          schedules live in Go Live. */}
      {current === "batch" && (
        <BatchCallerIdBlock draft={draft} update={update} />
      )}

      {current === "code" && (
        <SectionRow
          id="wz-2-code"
          label="Connect your app"
          hint="No phone number and no campaign — your app joins a channel and the agent joins it too."
        >
          <CodeConfigure agentId={agentId} />
        </SectionRow>
      )}
    </>
  )
}

// ─── Batch — the agent-level caller ID (Figma 2875-83511) ─────────────────────

function BatchCallerIdBlock({ draft, update }: StepProps) {
  const callerId = draft.config.batch?.callerId
  const setCallerId = (id: string) =>
    update({ config: { ...draft.config, batch: { callerId: id } } })

  return (
    <SectionRow
      id="wz-2-batch"
      label="Choose how callers reach your agent"
      hint="The caller ID your contacts see — new runs start from it and can pick their own."
    >
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Phone number</Label>
        <PhoneNumberSelect
          value={callerId}
          onChange={setCallerId}
          placeholder="Choose a phone number"
        />
        <p className="text-xs text-muted-foreground">
          The agent will use this number to dial outbound calls.
        </p>
        {/* The card promised "a contact list you upload" — say where it lives
            (user-test 2026-08-10 S3). */}
        <p className="text-xs text-muted-foreground">
          Contact lists, schedules, and runs live in{" "}
          <a href="#wz-4-outputs" className="underline underline-offset-2 hover:text-foreground">Go Live · Batch</a>.
        </p>
      </div>
    </SectionRow>
  )
}

// ─── Phone-number dropdown (Figma 2994-93628: empty state + Add New inside) ───

const ADD_SENTINEL = "__add_number__"

function PhoneNumberSelect({
  value, onChange, placeholder, exclude = [], ariaLabel,
}: {
  value?: string
  onChange: (id: string) => void
  placeholder: string
  /** Ids hidden from the options (already linked elsewhere). */
  exclude?: string[]
  ariaLabel?: string
}) {
  const [addOpen, setAddOpen] = React.useState(false)
  const [session, setSession] = React.useState<{ id: string; number: string; label: string }[]>([])
  const all = [
    ...PHONE_NUMBERS.filter((n) => n.status === "unassigned").map((n) => ({ id: n.id, number: n.number, label: n.label })),
    ...session,
  ]
  const options = all.filter((n) => !exclude.includes(n.id) || n.id === value)

  return (
    <>
      <Select
        value={value ?? ""}
        onValueChange={(v) => {
          if (v === ADD_SENTINEL) setAddOpen(true)
          else if (v) onChange(v)
        }}
      >
        <SelectTrigger className="w-full text-sm" aria-label={ariaLabel ?? placeholder}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 && (
            <div className="flex flex-col items-center gap-1 px-3 py-5 text-center">
              <Phone className="h-4 w-4 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">No phone numbers found</p>
            </div>
          )}
          {options.map((n) => (
            <SelectItem key={n.id} value={n.id}>{n.number} – {n.label}</SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={ADD_SENTINEL}>
            <span className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" aria-hidden /> Add New Phone Number
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      <AddPhoneNumberSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={(n) => {
          const id = `pn_new_${Date.now().toString(36)}`
          setSession((s) => [...s, { id, ...n }])
          onChange(id)
        }}
      />
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

  // Figma 2994-93628 "Inbound Deployments Allow Multiple Lines": one labelled
  // select per linked line, plus "+ Add another inbound line" for the next.
  const [addingLine, setAddingLine] = React.useState(false)
  const multi = numberIds.length > 1 || (numberIds.length >= 1 && addingLine)

  const slotLabel = (i: number) =>
    multi ? `Phone number ${String(i + 1).padStart(2, "0")}` : "Phone number"

  return (
    <SectionRow
      id="wz-2-inbound"
      label="Choose how callers reach your agent"
      hint="Link one or several numbers — the agent answers them all."
    >
      <div className="space-y-4">
        {numberIds.map((id, i) => (
          <div key={id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{slotLabel(i)}</Label>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground"
                onClick={() => setNumberIds(numberIds.filter((x) => x !== id))}
                aria-label={`Unlink ${slotLabel(i)}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
            <PhoneNumberSelect
              value={id}
              exclude={numberIds}
              placeholder="Choose a phone number"
              ariaLabel={slotLabel(i)}
              onChange={(next) => setNumberIds(numberIds.map((x) => (x === id ? next : x)))}
            />
            <p className="text-xs text-muted-foreground">
              The agent will use this number to receive inbound calls.
            </p>
          </div>
        ))}

        {(numberIds.length === 0 || addingLine) && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{slotLabel(numberIds.length)}</Label>
            <PhoneNumberSelect
              exclude={numberIds}
              placeholder="Choose a phone number"
              ariaLabel={slotLabel(numberIds.length)}
              onChange={(id) => {
                setNumberIds([...numberIds, id])
                setAddingLine(false)
                toast.success("Number linked", {
                  description: `${draft.name || "This agent"} answers it once you deploy.`,
                })
              }}
            />
            <p className="text-xs text-muted-foreground">
              The agent will use this number to receive inbound calls.
            </p>
          </div>
        )}

        {numberIds.length > 0 && !addingLine && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddingLine(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add another inbound line
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Agora routes your own carrier number via SIP — manage numbers in{" "}
        <a href="/integrations?tab=channels" className="underline underline-offset-2">
          Resources › Deployment Channels
        </a>
        . How answered calls end is configured in{" "}
        <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => onGoToStep(5)}>
          Go Live › Advanced Settings
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
      {/* Figma 2917-85476: the ID-minting caveat is a first-class note box. */}
      {unpublished && (
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 text-sm">
            <p className="font-medium">Please Note</p>
            <p className="text-muted-foreground">
              This agent&apos;s ID is minted when you deploy — these snippets carry the
              placeholder &quot;new&quot; until then.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-sm font-medium">Add to your app</p>
        <p className="text-xs text-muted-foreground">
          Install the SDK, then drop the agent into any Agora channel. No phone number
          needed. It runs wherever your app does.
        </p>
      </div>
      <CodeBlock language="bash" filename="install">npm install @agora/agent-sdk</CodeBlock>
      <CodeBlock language="typescript" filename="join.ts">{connect}</CodeBlock>
      <InfoHint label="Secured-mode channels & tokens">
        The platform mints the agent&apos;s token from your App Certificate on join — your
        clients keep bringing their own tokens, and the agent needs nothing extra from you.
      </InfoHint>

      <div className="space-y-1 pt-2">
        <p className="text-sm font-medium">Stop the agent</p>
        <p className="text-xs text-muted-foreground">
          End the session when you&apos;re done. This releases the channel and stops billing for it.
        </p>
      </div>
      <CodeBlock language="typescript" filename="stop.ts">{stop}</CodeBlock>

      {/* Figma: a framed docs row with an explicit Go to Docs door. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Full SDK reference</p>
          <p className="text-xs text-muted-foreground">Channels, events, function calling, and more.</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" asChild>
          <a href="https://docs.agora.io/en/ai" target="_blank" rel="noopener noreferrer">
            Go to Docs <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </Button>
      </div>
    </div>
  )
}
