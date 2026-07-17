"use client"

import * as React from "react"
import {
  Upload, Check, AlertTriangle, Plug, ExternalLink, Radio, Download,
} from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { RadioCard, RadioCardGroup } from "@/components/wizard/radio-cards"
import { CodeBlock } from "@/components/code-block"
import { ConfigCard } from "@/components/wizard/channel-configs"
import { WidgetStyleConfig } from "@/components/widget-studio"
import { PHONE_NUMBERS, extractVars } from "@/lib/campaign-data"
import {
  MOCK_CSV_COLUMNS,
  MOCK_CSV_ROWS,
  outboundMissingVars,
  type InboundMode,
} from "@/lib/wizard-draft"
import { type StepProps } from "@/components/wizard/types"

/**
 * The Deploy step's CHANNEL BLOCK (owner 2026-07-13: "Connect a phone number
 * should not be a step at all" — channel connection lives inside Deploy, above
 * the review + go-live). Branches on `draft.type`:
 *   • inbound  → Phone number · Web widget (embed) · Widget UI (the studio)
 *   • outbound → caller-ID number + contacts CSV (with {{var}} validation);
 *                window/concurrency/retries live in the optional Call settings
 *   • code     → SDK/API snippets + Docs Center
 *
 * The prompt + greeting were set in Step 3 and are NOT re-asked here — this
 * block is purely about WHERE/HOW the agent runs. The agent id (for snippets)
 * is the draft's agentId or "new" until published.
 */
export function StepConfigure({
  draft,
  update,
  onChooseType,
}: StepProps & {
  /** Jump to Step 2 (Select agent type) — Deploy does NOT re-offer the type
   *  chooser (owner 2026-07-15: the run-mode tabs here duplicated Step 2). */
  onChooseType?: () => void
}) {
  const agentId = draft.agentId ?? "new"

  return (
    <div className="space-y-5">
      {/* No inner h2: the section header above already carries "Deploy". The
          agent TYPE is chosen in Step 2 only — this step just configures it. */}
      <p className="text-sm text-muted-foreground">
        {draft.type === "inbound" && "Choose how callers reach your agent."}
        {draft.type === "outbound" && "Attach a caller-ID phone number and your contacts."}
        {draft.type === "code" && "Drop the agent into your own app."}
      </p>

      {!draft.type && (
        /* Never an empty step: without a type there is nothing to configure —
           point at the step that owns the choice instead of duplicating it. */
        <div className="flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Pick how your agent runs in <span className="font-medium text-foreground">Select agent type</span> first — then finish its setup here.
          </p>
          <Button variant="outline" size="sm" onClick={onChooseType}>
            Choose agent type
          </Button>
        </div>
      )}

      {/* Code is a single-column form → capped for readability. Batch calls
          and the inbound web-widget studio run two-pane splits (settings |
          reference) and manage their own width. */}
      {draft.type === "inbound" && <InboundConfigure draft={draft} update={update} agentId={agentId} />}
      {draft.type === "outbound" && <OutboundConfigure draft={draft} update={update} />}
      {draft.type === "code" && <div className="max-w-3xl"><CodeConfigure agentId={agentId} /></div>}
    </div>
  )
}

// ─── Inbound — Phone number · Web widget · Widget UI ──────────────────────────

function InboundConfigure({
  draft, update, agentId,
}: StepProps & { agentId: string }) {
  const mode: InboundMode = draft.config.inbound?.mode ?? "phone"
  // Web widget and "Widget UI" are ONE thing (owner 2026-07-15): a single "Web
  // widget" channel. Styling lives in WidgetStyleConfig here; the live PREVIEW
  // moved to the right agent panel (toggle it to "Widget"). Channel truth is
  // binary (phone | web).
  // The agent's CURRENT number must always be listable/selectable — a live
  // agent's number is status "active" and a pure unassigned filter renders the
  // Select as an empty placeholder under summaries that name it (re-eval #1).
  const currentId = draft.config.inbound?.numberId
  const available = PHONE_NUMBERS.filter((n) => n.status === "unassigned" || n.id === currentId)
  const setMode = (m: InboundMode) => {
    update({ config: { ...draft.config, inbound: { ...draft.config.inbound, mode: m } } })
    if (m === "web" && currentId) {
      toast("Switched to Web widget", { description: "Your phone number stays attached. Switch back any time." })
    }
  }
  const setNumber = (numberId: string) =>
    update({ config: { ...draft.config, inbound: { mode, numberId } } })

  return (
    <div className="space-y-4">
      <RadioCardGroup
        value={mode}
        onValueChange={(v) => v && setMode(v as InboundMode)}
        aria-label="How callers reach this agent"
        className="max-w-3xl sm:grid-cols-2"
      >
        <RadioCard value="phone" title="Phone number" description="Answer calls 24/7" />
        <RadioCard value="web" title="Web widget" description="Embed & style a floating widget" />
      </RadioCardGroup>

      {mode === "phone" ? (
        <div className="max-w-3xl">
        <ConfigCard title="Answer a phone number">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Phone number</Label>
            <Select value={draft.config.inbound?.numberId ?? ""} onValueChange={setNumber}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Choose an available number" />
              </SelectTrigger>
              <SelectContent>
                {available.map((n) => (
                  <SelectItem key={n.id} value={n.id}>{n.number} · {n.label}{n.id === currentId ? " · current" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* ONE name + ONE link for the BYO-SIP door, same as the batch
                side — "Numbers" vs "Channels" read as two doors (user-test S3). */}
            <p className="text-xs text-muted-foreground">
              No number free? Agora routes your own carrier number — connect one via SIP in{" "}
              <a href="/integrations?tab=channels" className="underline underline-offset-2 hover:text-foreground">
                Resources › Deployment Channels
              </a>
              .
            </p>
          </div>
        </ConfigCard>
        </div>
      ) : (
        /* Web widget — style + embed here; the live preview is the right panel
           (owner 2026-07-15: no half-widget crammed in the config). */
        <WidgetStyleConfig agentId={agentId} />
      )}
    </div>
  )
}

// ─── Outbound — settings LEFT, contact list RIGHT (Figma "Create Campaign",
//     node 360-71898): the list is reference material you check WHILE you
//     configure, so it earns a parallel pane, not a step below. Its rows scroll
//     INSIDE the panel — a 500-contact upload must never grow the page between
//     you and Deploy (owner 2026-07-09). ─────────────────────────────────────

function OutboundConfigure({ draft, update }: StepProps) {
  const out = draft.config.outbound
  // Caller-ID candidates: unassigned numbers, the current pick, AND numbers
  // already carrying outbound traffic (a shared outbound pool can take more
  // batches; inbound-dedicated lines can't dial out for you) — user-test #5
  // found only "SMS Sender" offered while the obvious pool was hidden.
  const available = PHONE_NUMBERS.filter(
    (n) =>
      n.status === "unassigned" ||
      n.id === out?.numberId ||
      n.assignedTo.some((d) => d.startsWith("dp_ob")),
  )
  // Busy inbound lines SHOW, disabled, with the one-agent-one-channel reason —
  // silently omitting the number the status line just named ("Live on +1 …")
  // read as the product hiding something (user-tests #9 + #10, S2 both).
  const answering = PHONE_NUMBERS.filter(
    // assignedAgent too: pn_09-style numbers (agent-assigned, no dp_*
    // deployment) fell through BOTH filters and vanished (user-test #12).
    (n) => !available.includes(n) && (n.assignedTo.length > 0 || n.assignedAgent),
  )
  const setNumber = (numberId: string) =>
    update({ config: { ...draft.config, outbound: { ...out, numberId } } })

  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      {/* LHS — how the calls run */}
      <div className="min-w-0 space-y-4">
        <ConfigCard title="Call setup">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Caller-ID number</Label>
            <Select value={out?.numberId ?? ""} onValueChange={setNumber}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Choose the number to dial from" />
              </SelectTrigger>
              <SelectContent>
                {available.map((n) => (
                  <SelectItem key={n.id} value={n.id}>{n.number} · {n.label}{n.id === out?.numberId ? " · current" : ""}</SelectItem>
                ))}
                {answering.map((n) => (
                  <SelectItem key={n.id} value={n.id} disabled>
                    {n.number} · {n.assignedTo.length > 0
                      ? `answering ${n.label}`
                      : `assigned to ${n.assignedAgent?.name ?? n.label}`} — a line can&apos;t answer and dial at once
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* The no-number path must have a door on the batch side too —
                inbound already hints SIP/BYO; a dropdown alone is a dead end
                for an empty account (user-test 2026-07-09 S3). */}
            <p className="text-xs text-muted-foreground">
              No number of your own yet? Connect your carrier&apos;s via SIP in{" "}
              <a href="/integrations?tab=channels" className="underline underline-offset-2 hover:text-foreground">
                Resources › Deployment Channels
              </a>
              . Agora doesn&apos;t sell numbers — telephony is bring-your-own.
            </p>
          </div>
          {/* Call window · concurrency · retries live in the optional CALL
              SETTINGS section now (owner 2026-07-13: four steps, three in
              advanced) — this card is just the connection. */}
        </ConfigCard>

        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5">
          <Plug className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {draft.mcp.length > 0
              ? `${draft.mcp.length} connector${draft.mcp.length > 1 ? "s" : ""} from Knowledge & Tools will run during calls.`
              : "Attach CRM/calendar connectors in Knowledge & Tools to act during calls."}
          </p>
        </div>
      </div>

      {/* RHS — who gets called */}
      <ContactsPanel draft={draft} update={update} />
    </div>
  )
}

// Deterministic preview rows (wireframe): enough to show real shape + internal
// scrolling without ever growing the page.
const PREVIEW_NAMES = [
  "Ava Chen", "Liam Patel", "Maya Ortiz", "Noah Kim", "Zoe Ahmed", "Eli Novak",
  "Ivy Santos", "Owen Brooks", "Lea Fischer", "Max Rivera", "Nia Kowalski", "Theo Lang",
  "Ana Costa", "Ben Haddad", "Mia Johansson", "Raj Mehta", "Sara Lind", "Tom Baker",
  "Uma Rao", "Vik Sharma", "Wes Cole", "Ines Duarte", "Yara Aziz", "Zack Moore",
]
// Every claimed MOCK_CSV_COLUMN renders — the green "all covered" check must
// be inspectable against visible evidence, not 3 of 5 columns (user-test #7).
const PREVIEW_ROWS = PREVIEW_NAMES.map((name, i) => ({
  phone: `+1 (415) 555-${String(1204 + i * 7).slice(-4)}`,
  name,
  account: `AC-${2400 + i * 13}`,
  balance: `$${(140 + i * 37) % 900}.${String(20 + (i * 7) % 80).padStart(2, "0")}`,
  dueDate: `2026-08-${String(1 + (i % 28)).padStart(2, "0")}`,
}))
const CSV_TOTAL = MOCK_CSV_ROWS

function ContactsPanel({ draft, update }: StepProps) {
  const out = draft.config.outbound
  const hasCsv = !!out?.csvName
  const missing = outboundMissingVars(draft)
  const attachCsv = () => {
    update({ config: { ...draft.config, outbound: { ...out, csvName: "contacts.csv" } } })
    toast.success("contacts.csv attached", {
      description: `${CSV_TOTAL} contacts · columns: ${MOCK_CSV_COLUMNS.join(", ")}`,
    })
  }

  return (
    <section className="min-w-0 rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <p className="text-sm font-semibold">Contact list</p>
        <button
          type="button"
          onClick={() => toast("Template downloaded", { description: `Columns: ${MOCK_CSV_COLUMNS.join(", ")}` })}
          className="inline-flex items-center gap-1.5 rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-3.5 w-3.5" aria-hidden /> Download template
        </button>
      </header>

      {!hasCsv ? (
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Upload className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium">Upload your contacts</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              A CSV with one row per person. Each <code className="font-mono">{"{{variable}}"}</code> in your prompt is filled from a matching column.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={attachCsv}>
            <Upload className="h-3.5 w-3.5" aria-hidden /> Upload contacts CSV
          </Button>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {/* Upload summary — swap the file without hunting for the control. */}
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium">{CSV_TOTAL} contacts uploaded</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{out!.csvName}</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={attachCsv}>Replace file</Button>
          </div>

          {/* Prompt-variable coverage — it's about THIS data, so it lives here.
              A green check may only assert what exists: with zero {{vars}} in
              the prompt there is nothing "covered" (user-test 2026-07-09 S3). */}
          {missing.length === 0 ? (
            <div className="flex items-start gap-2.5 rounded-md border border-success/40 bg-success/5 p-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <p className="text-xs leading-relaxed text-foreground">
                {extractVars(`${draft.systemPrompt} ${draft.greeting}`).length > 0
                  ? "All prompt variables are covered by your CSV columns. Ready to deploy."
                  : "Contacts ready. Your prompt uses no {{variables}} yet — add some to personalize each call from these columns."}
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground">
                  This CSV is missing {missing.length} prompt variable{missing.length > 1 ? "s" : ""}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map((v) => (
                    <Badge key={v} variant="outline" className="h-6 border-destructive/40 px-2 font-mono text-xs font-medium text-destructive">{`{{${v}}}`}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Add these columns, or remove them from the system prompt. Deploy stays blocked until they match.
                </p>
              </div>
            </div>
          )}

          {/* Preview scrolls INSIDE the panel: the page length never depends on
              how many contacts were uploaded. */}
          <div>
            <p className="pb-2 text-xs text-muted-foreground">
              Preview · first {PREVIEW_ROWS.length} of {CSV_TOTAL} rows
            </p>
            <div className="max-h-[340px] overflow-y-auto rounded-md border border-border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Phone number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Due date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PREVIEW_ROWS.map((r) => (
                    <TableRow key={r.phone}>
                      <TableCell className="font-mono text-xs">{r.phone}</TableCell>
                      <TableCell className="text-sm">{r.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.account}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.balance}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.dueDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// Call window · concurrency · retries + the capacity note moved to the optional
// CALL SETTINGS section — components/wizard/step-call-settings.tsx (owner
// 2026-07-13: four steps, three in advanced).

// ─── Code — SDK/API snippets + Docs Center ────────────────────────────────────

function CodeConfigure({ agentId }: { agentId: string }) {
  // Snippet-truth (user-test #6, D3): before deploy the agent id is a
  // placeholder — say so where the Copy button is, the way the widget studio's
  // embed-truth line does. And speak Agora vocabulary: projects carry an App ID
  // + App Certificate (Project Settings), not an "API key" that exists nowhere.
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
          below first, then copy.
        </p>
      )}
      <ConfigCard title="Add to your app">
        <p className="text-sm text-muted-foreground">
          Install the SDK, then drop the agent into any Agora channel. No phone number needed. It runs wherever your app does.
        </p>
        <CodeBlock language="bash" filename="install">npm install @agora/agent-sdk</CodeBlock>
        <CodeBlock language="typescript" filename="join.ts">{connect}</CodeBlock>
        <p className="text-xs text-muted-foreground">
          Secured-mode channels: the platform mints the agent&apos;s token from your
          App Certificate on join — your clients keep bringing their own tokens,
          and the agent needs nothing extra from you.
        </p>
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
          {/* Deep-link the Voice Agent docs section, not the docs homepage
              (user-test #6 D3; URL verified 2026-07-13: "Voice Agent overview"). */}
          <a href="https://docs.agora.io/en/ai" target="_blank" rel="noopener noreferrer">
            Docs Center <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  )
}
