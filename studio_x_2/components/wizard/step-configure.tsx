"use client"

import * as React from "react"
import {
  Upload, Check, AlertTriangle, Plug, PhoneIncoming, Globe, ExternalLink, Radio, Download,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CodeBlock } from "@/components/code-block"
import { ConfigCard } from "@/components/wizard/channel-configs"
import { WidgetStudioEmbedded } from "@/components/widget-studio"
import { PHONE_NUMBERS, extractVars, CONCURRENCY, concurrencyStats } from "@/lib/campaign-data"
import { AddLinesSheet } from "@/components/concurrency-card"
import { useFutureScope } from "@/lib/future-scope"
import {
  MOCK_CSV_COLUMNS,
  MOCK_CSV_ROWS,
  outboundMissingVars,
  typeLabel,
  type AgentType,
  type InboundMode,
} from "@/lib/wizard-draft"
import { type StepProps } from "@/components/wizard/types"

/**
 * Step 4 — Configure. Branches on `draft.type`:
 *   • inbound  → phone number (telephony) OR web widget (embed)
 *   • outbound → caller-ID number + contacts CSV (with {{var}} validation)
 *   • code     → SDK/API snippets + Docs Center
 *
 * The prompt + greeting were set in Step 3 and are NOT re-asked here — this step
 * is purely about WHERE/HOW the agent runs. The agent id (for snippets) is the
 * draft's agentId or "new" until published.
 */
export function StepConfigure({ draft, update }: StepProps) {
  const agentId = draft.agentId ?? "new"

  return (
    <div className="space-y-5">
      {/* No inner h2: the section header above already carries stepTitle(4). */}
      <p className="text-sm text-muted-foreground">
        {draft.type === "inbound" && "Choose how callers reach your agent."}
        {draft.type === "outbound" && "Attach a caller-ID phone number and your contacts."}
        {draft.type === "code" && "Drop the agent into your own app."}
        {!draft.type && "Pick how your agent runs first, then finish its setup."}
      </p>

      {/* No type yet → never an empty drawer: choose it right here. */}
      {!draft.type && (
        <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/20 p-4">
          <p className="text-sm font-medium">How will your agent run?</p>
          <div className="flex flex-wrap gap-2">
            {(["outbound", "inbound", "code"] as AgentType[]).map((t) => (
              <Button key={t} variant="outline" size="sm" onClick={() => update({ type: t })}>
                {typeLabel(t)}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Batch calls dial a contact list · Inbound answers a number or web widget · Code / SDK runs inside your app.
          </p>
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

// ─── Inbound — phone number OR web widget ─────────────────────────────────────

function InboundConfigure({
  draft, update, agentId,
}: StepProps & { agentId: string }) {
  const mode: InboundMode = draft.config.inbound?.mode ?? "phone"
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
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => v && setMode(v as InboundMode)}
        className="grid max-w-3xl grid-cols-2 gap-2"
      >
        <ToggleGroupItem value="phone" className="h-auto flex-col items-start gap-1 rounded-lg border border-border p-3 data-[state=on]:border-primary data-[state=on]:bg-primary/5">
          <span className="flex items-center gap-2 text-sm font-medium"><PhoneIncoming className="h-4 w-4" /> Phone number</span>
          <span className="text-xs font-normal text-muted-foreground">Answer calls 24/7</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="web" className="h-auto flex-col items-start gap-1 rounded-lg border border-border p-3 data-[state=on]:border-primary data-[state=on]:bg-primary/5">
          <span className="flex items-center gap-2 text-sm font-medium"><Globe className="h-4 w-4" /> Web widget</span>
          <span className="text-xs font-normal text-muted-foreground">Embed on your site</span>
        </ToggleGroupItem>
      </ToggleGroup>

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
                Resources › Channels
              </a>
              .
            </p>
          </div>
        </ConfigCard>
        </div>
      ) : (
        /* The widget studio lives HERE, inline — style + preview + embed code
           without leaving the build (owner 2026-07-13: the link-out to
           /deploy/web-widget broke first-timers' flow). That page remains the
           post-build manage surface, reading the same per-agent store. */
        <WidgetStudioEmbedded agentId={agentId} />
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
              </SelectContent>
            </Select>
            {/* The no-number path must have a door on the batch side too —
                inbound already hints SIP/BYO; a dropdown alone is a dead end
                for an empty account (user-test 2026-07-09 S3). */}
            <p className="text-xs text-muted-foreground">
              No number of your own yet? Connect your carrier&apos;s via SIP in{" "}
              <a href="/integrations?tab=channels" className="underline underline-offset-2 hover:text-foreground">
                Resources › Channels
              </a>
              . Agora doesn&apos;t sell numbers — telephony is bring-your-own.
            </p>
          </div>
          <OutboundSettings draft={draft} update={update} />
        </ConfigCard>
        <OutboundCapacityNote draft={draft} />

        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5">
          <Plug className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {draft.mcp.length > 0
              ? `${draft.mcp.length} connector${draft.mcp.length > 1 ? "s" : ""} from the prompt step will run during calls.`
              : "Attach CRM/calendar connectors in the System prompt step to act during calls."}
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
const PREVIEW_ROWS = PREVIEW_NAMES.map((name, i) => ({
  phone: `+1 (415) 555-${String(1204 + i * 7).slice(-4)}`,
  name,
  account: `AC-${2400 + i * 13}`,
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PREVIEW_ROWS.map((r) => (
                    <TableRow key={r.phone}>
                      <TableCell className="font-mono text-xs">{r.phone}</TableCell>
                      <TableCell className="text-sm">{r.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.account}</TableCell>
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

// Other outbound settings — call window, concurrency, retries. Stored on the
// DRAFT (not drawer-local state) so they survive close/reopen and appear in
// the row summary, review, and config JSON (heuristic-eval finding #7).
/** At-the-wall purchase moment (A6, graft from the judge round's variant C):
 *  picking a max-concurrent above the project's line capacity is where the
 *  limit is FELT — so the unlock lives here, inline, not on a billing page
 *  the operator would have to go find. One component owns ALL capacity
 *  communication in this step (a split select-suffix + note drifted). */
function OutboundCapacityNote({ draft }: { draft: StepProps["draft"] }) {
  const [purchasedBoost, setPurchasedBoost] = React.useState(0)
  const [linesOpen, setLinesOpen] = React.useState(false)
  const [future] = useFutureScope()
  const stats = concurrencyStats({ ...CONCURRENCY, purchased: CONCURRENCY.purchased + purchasedBoost })
  const chosen = draft.config.outbound?.maxConcurrent ?? 10
  const overBy = Math.max(0, chosen - stats.totalLines)

  // A6 (self-serve concurrency) is future-scope-gated.
  if (!future) return null
  if (overBy === 0 && purchasedBoost === 0) return null

  return (
    <>
      {overBy > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/[0.04] px-3 py-2.5">
          <p className="flex-1 min-w-0 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {chosen} at once is above your {stats.totalLines} concurrent lines.
            </span>{" "}
            Calls beyond {stats.totalLines} queue until a line frees — nothing drops. +{overBy}{" "}
            lines (${overBy * stats.pricePerLineMo}/mo, prorated today) removes the queue.
          </p>
          <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => setLinesOpen(true)}>
            Add lines
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-2.5">
          <Check className="h-4 w-4 shrink-0 text-success" />
          <p className="text-xs text-muted-foreground">
            {stats.totalLines} concurrent lines — your max of {chosen} runs without queuing.
          </p>
        </div>
      )}
      <AddLinesSheet
        open={linesOpen}
        onOpenChange={setLinesOpen}
        purchased={CONCURRENCY.purchased + purchasedBoost}
        queued={0}
        totalLines={stats.totalLines}
        capHeadroomUsd={null}
        onCommit={(qty) => { setPurchasedBoost((b) => Math.max(0, b + qty)); setLinesOpen(false) }}
      />
    </>
  )
}

function OutboundSettings({ draft, update }: StepProps) {
  const out = draft.config.outbound
  const patch = (p: Partial<NonNullable<typeof out>>) =>
    update({ config: { ...draft.config, outbound: { ...out, ...p } } })
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Other settings</Label>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Call window</Label>
          <Select
            value={out?.callWindow ?? "business"}
            onValueChange={(v) => patch({ callWindow: v as "business" | "extended" | "anytime" })}
          >
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {/* Whose 9–5 matters on a call campaign — say it (user-test S3). */}
              <SelectItem value="business">Business hours (9–5, contact&apos;s local time)</SelectItem>
              <SelectItem value="extended">Extended (8–8, contact&apos;s local time)</SelectItem>
              <SelectItem value="anytime">Anytime</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Max concurrent</Label>
          <Select
            value={String(out?.maxConcurrent ?? 10)}
            onValueChange={(v) => patch({ maxConcurrent: Number(v) })}
          >
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["5", "10", "25", "50"].map((c) => <SelectItem key={c} value={c}>{c} calls</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Retry unanswered</Label>
          <Select
            value={String(out?.retries ?? 1)}
            onValueChange={(v) => patch({ retries: Number(v) })}
          >
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Don&apos;t retry</SelectItem>
              <SelectItem value="1">Once</SelectItem>
              <SelectItem value="2">Twice</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// ─── Code — SDK/API snippets + Docs Center ────────────────────────────────────

function CodeConfigure({ agentId }: { agentId: string }) {
  const connect = `import { AgentClient } from "@agora/agent-sdk"

const client = new AgentClient({
  agentId: "${agentId}",
  apiKey: process.env.AGORA_API_KEY,
})

// Add the agent to a live Agora RTC channel
await client.joinChannel({ channel: "support-room" })`

  const stop = `// Stop the agent and leave the channel
await client.leaveChannel()
await client.stop()`

  return (
    <div className="space-y-4">
      <ConfigCard title="Add to your app">
        <p className="text-sm text-muted-foreground">
          Install the SDK, then drop the agent into any Agora channel. No phone number needed. It runs wherever your app does.
        </p>
        <CodeBlock language="bash" filename="install">npm install @agora/agent-sdk</CodeBlock>
        <CodeBlock language="typescript" filename="join.ts">{connect}</CodeBlock>
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
          <a href="https://docs.agora.io/en/" target="_blank" rel="noopener noreferrer">
            Docs Center <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  )
}
